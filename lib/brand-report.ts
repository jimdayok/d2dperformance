import { brandDiscoverySections } from "@/lib/brand-discovery-data";
import type {
  DiscoveryAnswer,
  DiscoveryFormValues,
  DiscoverySection,
  DiscoveryUploadMetadata,
  ReportBlock,
} from "@/types/brand-discovery";

function asString(value: DiscoveryAnswer | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function asUploads(value: DiscoveryAnswer | undefined) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is DiscoveryUploadMetadata =>
          typeof item === "object" && item !== null && "name" in item,
      )
    : [];
}

function splitKeywords(value: string) {
  return value
    .split(/,|\n|\/| and /i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function archiveAnswerText(value: DiscoveryAnswer | undefined) {
  if (typeof value === "string") {
    return value.trim() || "No response provided.";
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "No response provided.";
    }

    if (typeof value[0] === "string") {
      return (value as string[]).join(", ");
    }

    return (value as DiscoveryUploadMetadata[]).map((file) => file.name).join(", ");
  }

  return "No response provided.";
}

export function isQuestionAnswered(value: DiscoveryAnswer | undefined) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return false;
}

export function isSectionComplete(
  section: DiscoverySection,
  answers: DiscoveryFormValues,
) {
  return section.questions.every((question) => isQuestionAnswered(answers[question.id]));
}

export function summarizeSection(
  section: DiscoverySection,
  answers: DiscoveryFormValues,
) {
  const bullets = section.questions
    .map((question) => {
      const value = answers[question.id];
      const text = archiveAnswerText(value);

      if (text === "No response provided.") {
        return "";
      }

      return `${question.label}: ${text}`;
    })
    .filter(Boolean)
    .slice(0, 4)
    .map((item) => item.length > 160 ? `${item.slice(0, 157)}...` : item);

  return bullets.length > 0 ? bullets : ["Still collecting insight for this section."];
}

export function estimateRemainingMinutes(
  currentSectionIndex: number,
  answers: DiscoveryFormValues,
) {
  return brandDiscoverySections
    .slice(currentSectionIndex + 1)
    .filter((section) => !isSectionComplete(section, answers))
    .reduce((total, section) => total + section.estimatedMinutes, 0);
}

function buildSourceData(...items: string[]) {
  return Array.from(new Set(items));
}

function choosePriority(score: number): "High" | "Medium" | "Low" {
  if (score >= 75) {
    return "Low";
  }

  if (score >= 45) {
    return "Medium";
  }

  return "High";
}

function scoreFromTextLengths(values: string[]) {
  const totalLength = values.reduce((sum, value) => sum + value.length, 0);
  return Math.max(20, Math.min(95, Math.round(totalLength / 18)));
}

function makeRecommendationSources(extra: string[] = []) {
  return buildSourceData(
    "Customer discovery responses",
    "Industry best practices",
    "AI reasoning",
    ...extra,
  );
}

function interpretationObservation(label: string, content: string) {
  return `${label}: ${content}`;
}

function buildInterpretationBlock(section: DiscoverySection, answers: DiscoveryFormValues): ReportBlock {
  const answered = section.questions.filter((question) => isQuestionAnswered(answers[question.id]));
  const missing = section.questions.filter((question) => !isQuestionAnswered(answers[question.id]));
  const longAnswers = answered.filter((question) => archiveAnswerText(answers[question.id]).length > 120);
  const observations: string[] = [];

  observations.push(
    interpretationObservation(
      "What the answers reveal",
      answered.length > 0
        ? `The client is giving the clearest signal around ${answered
            .slice(0, 2)
            .map((question) => question.label.toLowerCase())
            .join(" and ")}. That usually indicates where they already have language, conviction, or lived experience.`
        : "This section is still largely unfilled, which suggests the topic may need guided discussion rather than self-serve answers.",
    ),
  );

  observations.push(
    interpretationObservation(
      "Where they seem confident",
      longAnswers.length > 0
        ? `The most confidence appears in ${longAnswers
            .slice(0, 2)
            .map((question) => question.label.toLowerCase())
            .join(" and ")}, where the response includes more detail and fewer generic phrases.`
        : "Confidence appears moderate; the responses are present but not yet highly specific.",
    ),
  );

  observations.push(
    interpretationObservation(
      "Where things appear unclear",
      missing.length > 0
        ? `The open questions around ${missing
            .slice(0, 2)
            .map((question) => question.label.toLowerCase())
            .join(" and ")} are worth revisiting live because they likely affect downstream strategy choices.`
        : "The section is reasonably complete, but some answers may still need sharper examples or proof.",
    ),
  );

  observations.push(
    interpretationObservation(
      "Missed opportunities",
      "There is usually room to translate these answers into stronger proof points, more customer-facing language, and clearer commercial differentiation.",
    ),
  );

  observations.push(
    interpretationObservation(
      "Questions worth discussing",
      `A strategy session should pressure-test how this section connects to positioning, trust signals, and what the market will actually notice first.`,
    ),
  );

  observations.push(
    interpretationObservation(
      "Hidden strengths",
      answered.length > 0
        ? "Even when the language is rough, the responses often contain raw positioning assets that can become sharper brand claims."
        : "The absence of detail may reveal that the business has been operating more intuitively than strategically, which is a fixable opportunity."
        ,
    ),
  );

  return {
    title: `AI Interpretation: ${section.title}`,
    body: `Consultant observations based on the customer's ${section.title.toLowerCase()} responses.`,
    bullets: observations,
    collapsible: true,
    sourceData: buildSourceData("Customer discovery responses", "AI reasoning"),
  };
}

function formatQuestionnaireSection(section: DiscoverySection, answers: DiscoveryFormValues): ReportBlock {
  return {
    title: `Questionnaire Archive: ${section.title}`,
    body: section.description,
    collapsible: true,
    questionResponses: section.questions.map((question) => ({
      question: question.label,
      response: archiveAnswerText(answers[question.id]),
    })),
    sourceData: ["Customer discovery responses"],
  };
}

export function buildBrandReport(answers: DiscoveryFormValues): ReportBlock[] {
  const company = asString(answers.company) || "This company";
  const contactName = asString(answers.name) || "the client";
  const role = asString(answers.role) || "leadership";
  const businessDo = asString(answers.business_do);
  const productsServices = asString(answers.products_services);
  const specialtyFocus = asString(answers.specialty_focus);
  const idealCustomer = asString(answers.ideal_customer);
  const problemSolve = asString(answers.problem_solve);
  const bestCustomersValue = asString(answers.best_customers_value);
  const competitors = asString(answers.top_competitors);
  const competitorsDoWell = asString(answers.competitors_do_well);
  const setsApart = asString(answers.sets_apart);
  const chooseYou = asString(answers.customer_choose_you);
  const oneSentence = asString(answers.one_sentence_description);
  const threeWords = splitKeywords(asString(answers.three_brand_words)).map(titleCase);
  const tonePersonality = splitKeywords(asString(answers.tone_personality)).map(titleCase);
  const brandsAdmire = asString(answers.brands_admire);
  const customersFindOut = asString(answers.customers_find_out);
  const platformsTools = asString(answers.platforms_tools);
  const marketingWorked = asString(answers.advertising_marketing_worked);
  const strengths = asString(answers.biggest_strengths);
  const improvements = asString(answers.room_for_improvement);
  const opportunities = asString(answers.new_opportunities);
  const challenges = asString(answers.external_challenges);
  const whyStart = asString(answers.why_start_business);
  const wayBusiness = asString(answers.people_know_way_business);
  const values = splitKeywords(asString(answers.values_principles)).map(titleCase);
  const personalStory = asString(answers.personal_story);
  const brandPersonality = asString(answers.brand_person_personality);
  const customerFeeling = asString(answers.customer_feeling);
  const logoMessagingTone = asString(answers.logo_messaging_tone);
  const brandBalance = asString(answers.professional_vs_approachable);
  const colorsLike = splitKeywords(asString(answers.colors_like_best)).map(titleCase);
  const marketingDone = asString(answers.marketing_done_so_far);
  const currentPresence = asString(answers.how_finding_and_seeing);
  const newCustomerLookUp = asString(answers.new_customer_look_up);
  const goals = asString(answers.main_goals_6_12_months);
  const expansion = asString(answers.expand_offerings_space_reach);
  const pushFirst = asString(answers.services_push_first);
  const successYear = asString(answers.success_one_year);
  const uploadedFiles = asUploads(answers.supporting_files).map((file) => file.name);

  const overallAssessmentScore = scoreFromTextLengths([
    businessDo,
    setsApart,
    idealCustomer,
    goals,
    strengths,
  ]);
  const marketingMaturityScore = scoreFromTextLengths([
    customersFindOut,
    platformsTools,
    marketingWorked,
    currentPresence,
  ]);
  const competitiveDifferentiationScore = scoreFromTextLengths([
    setsApart,
    chooseYou,
    competitors,
    competitorsDoWell,
  ]);
  const maturityScore = Math.round(
    (overallAssessmentScore + marketingMaturityScore + competitiveDifferentiationScore) / 3,
  );

  const preferredTone = tonePersonality[0] || "Trusted";
  const preferredColor = colorsLike[0] || "Deep navy";
  const industrySignal =
    specialtyFocus || productsServices || businessDo || "a service-driven small business";

  const marketingTableRows = [
    [
      "Google Search + Local",
      "High",
      "High",
      "Medium",
      "Capture in-market buyers already searching for this type of solution.",
    ],
    [
      "Website + SEO",
      "High",
      "Medium / High",
      "Medium",
      "Build an owned trust layer that supports referrals, comparisons, and long-tail search.",
    ],
    [
      "Referral Program",
      "High",
      "High",
      "Low",
      "Systematize the client advocacy that likely already drives your best-fit opportunities.",
    ],
    [
      "Social Content",
      "Medium",
      "Medium",
      "Medium",
      "Use selectively for proof, education, and familiarity rather than volume for its own sake.",
    ],
    [
      "Community Partnerships / Events",
      "Medium",
      "Medium",
      "Medium",
      "Useful when local trust and physical-market presence matter to the buying decision.",
    ],
  ];

  const reportBlocks: ReportBlock[] = [
    {
      title: "Executive Summary",
      body:
        `${company} appears to be strongest when the conversation stays close to real work, real outcomes, and practical customer value. ` +
        `The brand opportunity is to convert that operational substance into sharper positioning, more visible proof, and a more premium public presence without drifting into empty agency language.`,
      bullets: [
        `Overall assessment: ${businessDo || "The business model is clear enough to be marketable, but its message still needs stronger precision."}`,
        `Biggest opportunities: ${opportunities || "Clarify positioning, sharpen proof, and build a more intentional first impression across website, identity, and sales messaging."}`,
        `Biggest risks: ${challenges || "Remaining too generic in the market and relying on reputation without enough structured differentiation."}`,
        `Leadership lens: This report assumes ${contactName} is shaping the brand from a ${role.toLowerCase()} point of view, which means strategy needs to be both market-facing and operationally realistic.`,
        `Immediate priorities: tighten the value proposition, clarify the ideal customer, and align the visible brand with the actual quality of the business.`,
        `Overall brand maturity score: ${maturityScore}/100`,
        `Marketing maturity score: ${marketingMaturityScore}/100`,
        `Competitive differentiation score: ${competitiveDifferentiationScore}/100`,
      ],
      priority: choosePriority(maturityScore),
      quickWins: [
        "Refine the homepage headline and one-sentence company description into sharper, customer-facing language.",
        "Audit current proof assets: testimonials, before-and-after examples, project photos, case studies, and reviews.",
        "Standardize the top three differentiators so they appear consistently in sales, web, and referral conversations.",
      ],
      longTermOpportunities: [
        "Build a formal brand messaging system that scales across website copy, proposals, email nurturing, and team training.",
        "Create a repeatable proof engine that turns completed work into trust-building content and referrals.",
      ],
      sourceData: makeRecommendationSources(["Current marketing trends"]),
    },
    {
      title: "Brand Positioning",
      body:
        `${company} is not just selling ${productsServices || "services"}; it is really in the business of delivering ${problemSolve || "clarity, confidence, and dependable outcomes"} ` +
        `for customers who want ${bestCustomersValue || "a provider they can trust without second-guessing the decision"}.`,
      bullets: [
        `What business are they really in: ${problemSolve || "Reducing buyer uncertainty and making the desired outcome feel safer, clearer, and more worthwhile."}`,
        `Emotional value being sold: ${customerFeeling || "Confidence, reassurance, and pride in choosing the right provider."}`,
        `Suggested positioning statement: ${company} is the ${preferredTone.toLowerCase()} choice for buyers who need ${industrySignal.toLowerCase()} delivered with more clarity, substance, and trust.`,
        `Suggested USP: ${setsApart || "A more dependable, better-communicated, and more strategically presented customer experience than the typical competitor."}`,
        `Value proposition: ${chooseYou || "Customers should feel they are buying less risk, better communication, and a more credible end result."}`,
        `Brand associations to reinforce: ${threeWords.length ? threeWords.join(", ") : "Trusted, capable, and clearly differentiated."}`,
        `Competitive advantages: ${strengths || "Operational competence, founder conviction, customer trust, and the ability to look more premium with the right positioning discipline."}`,
        `Weak positioning areas: ${improvements || "The current message likely leaves too much of the real difference implied instead of clearly stated."}`,
      ],
      priority: "High",
      quickWins: [
        "Turn the current differentiators into three plain-language claims with proof behind each one.",
        "Write a concise positioning paragraph for the homepage, proposals, and referral introductions.",
      ],
      longTermOpportunities: [
        "Own a tighter niche or flagship promise instead of trying to sound broadly capable.",
        "Develop category language that frames the company as the better strategic choice, not just another vendor.",
      ],
      sourceData: makeRecommendationSources(["Competitive analysis"]),
    },
    {
      title: "Brand Story",
      body:
        `${company} should sound like a business that was built for a reason, not one that simply exists to offer a service. ` +
        `${whyStart || personalStory || `${contactName} needs a stronger origin story that links conviction, market frustration, and customer value in one believable narrative.`}`,
      bullets: [
        `Mission: Help customers achieve ${problemSolve || "better outcomes"} with a process that feels more ${preferredTone.toLowerCase()}, more thoughtful, and more dependable.`,
        `Vision: Become the most clearly trusted name in ${industrySignal.toLowerCase()} for customers who value quality and confidence over noise.`,
        `Purpose: ${wayBusiness || "Do the work in a way that reflects stronger principles, better communication, and more durable results."}`,
        `Values to codify: ${values.length ? values.join(", ") : "Trust, quality, responsiveness, and follow-through should likely be named more explicitly."}`,
        `Elevator pitch: ${oneSentence || `${company} helps the right customers get better results through a more credible, better-guided experience.`}`,
        `One-sentence company description: ${oneSentence || `${company} is a ${preferredTone.toLowerCase()} ${industrySignal.toLowerCase()} brand built to deliver a higher-confidence customer experience.`}`,
      ],
      priority: "High",
      quickWins: [
        "Draft a founder story paragraph that connects why the business started to why customers should care now.",
        "Create an about-page narrative that sounds human, credible, and commercially mature.",
      ],
      longTermOpportunities: [
        "Build a full story system across website, video, proposals, and team intros.",
        "Use the origin story as a differentiator in recruiting, partnerships, and media opportunities.",
      ],
      sourceData: makeRecommendationSources(),
    },
    {
      title: "Logo & Identity Recommendations",
      body:
        `The identity should feel ${preferredTone.toLowerCase()}, durable, and commercially credible in ${industrySignal.toLowerCase()}. ` +
        `A combination mark is the safest recommendation because it gives the brand a clear wordmark plus a usable shorthand for signage, avatars, apparel, and favicons.`,
      bullets: [
        "Recommended logo direction: combination mark with a disciplined wordmark and a simple icon or monogram.",
        "Simplicity: avoid busy symbolism, excessive detail, or decorative flourishes that collapse at small sizes.",
        "Scalability: the mark should hold up on embroidery, vehicle graphics, building signage, invoices, social icons, and website favicons.",
        "Black/white reproduction: build the identity to work in one color before introducing any palette complexity.",
        `Style preference from discovery: ${logoMessagingTone || "The brand should likely lean toward a clean, confident, low-noise visual tone."}`,
        `Brand balance: ${brandBalance || "A middle ground between professional authority and human approachability is likely the most commercially useful direction."}`,
        `Useful inspiration references: ${brandsAdmire || "Still worth collecting during strategy or creative direction review."}`,
        `What is trending in this industry: cleaner marks, quieter premium cues, restrained typography, and less clip-art literalism.`,
        "What should be avoided: fake luxury clichés, generic shield/badge tropes unless they are meaningfully tied to the business, and overbuilt iconography that looks dated within two years.",
      ],
      priority: "Medium",
      quickWins: [
        "Create a short identity brief that lists required use cases before exploring design directions.",
        "Collect 8-12 reference marks from adjacent industries that feel premium without becoming trendy.",
      ],
      longTermOpportunities: [
        "Build a complete identity system with horizontal, stacked, icon-only, and single-color variants.",
        "Extend the system to templates, signage rules, apparel application, and photography art direction.",
      ],
      sourceData: makeRecommendationSources(["Current marketing trends", "Competitive analysis"]),
    },
    {
      title: "Color Palette Recommendations",
      body:
        `The palette should signal trust first, then distinction. Starting with ${preferredColor.toLowerCase()} as the anchor gives the brand more authority, while warm neutrals and one confident accent prevent it from feeling cold or interchangeable.`,
      bullets: [
        "Primary colors: Deep Navy `#1F3A5F`, Warm Ivory `#F3EEE6`",
        "Secondary colors: Slate `#546474`, Sandstone `#C8B7A6`",
        "Accent colors: Burnished Copper `#A8653A`, Sage Gray `#8E9A8A`",
        "Color psychology: navy builds trust and authority, warm neutrals feel grounded and human, and copper introduces premium energy without becoming flashy.",
        `Industry expectations: buyers in ${industrySignal.toLowerCase()} often respond better to stable, credible palettes than loud trend colors.`,
      ],
      priority: "Medium",
      quickWins: [
        "Test the palette against logo lockups, web buttons, quote sheets, and apparel embroidery.",
        "Define accessibility-safe text/background pairings before finalizing the system.",
      ],
      longTermOpportunities: [
        "Create a full color usage hierarchy for digital, print, signage, and social graphics.",
      ],
      sourceData: makeRecommendationSources(["Current marketing trends"]),
    },
    {
      title: "Typography Recommendations",
      body:
        "Typography should create authority without friction. The brand needs a display voice with character plus a body font that remains highly readable across web, print, and mobile.",
      bullets: [
        "Headline fonts: Fraunces, Canela, or a comparable editorial serif with restrained personality.",
        "Body fonts: IBM Plex Sans, Source Sans 3, or Inter for clean readability.",
        "Website fonts: use a high-contrast serif for headlines and a practical sans for body copy.",
        "Print fonts: keep the same family pairing for proposals, one-pagers, and presentations to preserve consistency.",
        `Brand personality signal: ${brandPersonality || "Typography should help communicate a grounded, confident personality rather than generic professionalism."}`,
        `Industry appropriateness: the pairing should feel more professional than trendy, and more premium than generic.`,
      ],
      priority: "Medium",
      quickWins: [
        "Standardize one heading stack and one body stack across the whole brand ecosystem.",
        "Audit line length, paragraph rhythm, and call-to-action emphasis on the website.",
      ],
      longTermOpportunities: [
        "Develop a full typographic scale for landing pages, proposals, PDFs, and social templates.",
      ],
      sourceData: makeRecommendationSources(["Industry best practices"]),
    },
    {
      title: "Tagline / Slogan Ideas",
      body: "The strongest tagline directions should sound specific, commercially useful, and believable for the category.",
      bullets: [
        "Professional: Clarity That Carries the Work Forward",
        "Professional: Built on Trust. Backed by Execution.",
        "Professional: Where Better Process Meets Better Results.",
        "Professional: Serious Standards. Stronger Outcomes.",
        "Luxury: Quiet Confidence. Exceptional Delivery.",
        "Luxury: Crafted for Buyers Who Expect More.",
        "Luxury: Premium by Discipline, Not by Hype.",
        "Luxury: Elevated Standards. Lasting Value.",
        "Friendly: Good People. Clear Process. Better Results.",
        "Friendly: Straight Answers. Solid Work. No Drama.",
        "Friendly: A Better Experience From Start to Finish.",
        "Friendly: Easy to Work With. Hard to Replace.",
        "Bold: Outperform the Usual.",
        "Bold: Raise the Standard.",
        "Bold: Built to Be Chosen.",
        "Bold: What Better Looks Like.",
        "Premium: Confidence You Can See.",
        "Premium: Credibility in Every Detail.",
        "Modern: Precision for the Next Stage of Growth.",
        "Modern: Smarter Brand. Stronger Market Presence.",
      ],
      priority: "Low",
      sourceData: makeRecommendationSources(["Current marketing trends"]),
    },
    {
      title: "Ideal Customer Analysis",
      body:
        `${company} should focus on customers who care about quality, confidence, communication, and a lower-risk buying experience. ` +
        `${idealCustomer || "The current ideal-customer language is present, but it still needs sharper commercial definition and buying-context detail."}`,
      bullets: [
        `Primary customer: ${idealCustomer || "Best-fit buyer still needs clearer definition."}`,
        "Secondary customer: adjacent buyers who value the same outcomes but may enter at a different price point or urgency level.",
        `Buying motivations: ${bestCustomersValue || "Trust, competence, responsiveness, and a result worth paying for."}`,
        `Pain points: ${problemSolve || "Confusion, poor communication, low confidence, and difficulty knowing who to trust."}`,
        "Objections: price sensitivity, fear of choosing wrong, uncertainty about process, and competitor familiarity.",
        "Decision-making process: compare options, look for proof, gauge professionalism, then reduce risk before committing.",
      ],
      priority: "High",
      quickWins: [
        "Build one primary persona and one secondary persona with emotional triggers, objections, and proof needs.",
      ],
      longTermOpportunities: [
        "Segment messaging by buyer type, urgency, and value expectation instead of using one generic pitch for everyone.",
      ],
      sourceData: makeRecommendationSources(["Competitive analysis"]),
    },
    {
      title: "Competitor Analysis",
      body:
        `The submitted answers suggest that the market likely has recognizable operators who may do some things well but still leave space for stronger messaging, better proof, and a more intentional customer experience. ` +
        `${competitors || "Competitors still need to be named explicitly and audited in detail."}`,
      bullets: [
        `What competitors do well: ${competitorsDoWell || "They are likely more visible, more established-looking, or easier to understand at first glance."}`,
        `Where they are weak: ${setsApart || "Their customer experience, communication, or strategic presentation may still feel generic."}`,
        `How this business should differentiate: ${chooseYou || "Lead with clearer proof, better trust signals, and more confident message discipline."}`,
        "Industry gaps: many competitors underinvest in strategic language, coherent identity systems, and conversion-ready proof.",
        "Missed opportunities: most local or mid-market brands fail to package their credibility as intentionally as they should.",
      ],
      priority: "High",
      quickWins: [
        "Audit the top 5 competitors for homepage message, trust signals, reviews, social proof, and visual tone.",
      ],
      longTermOpportunities: [
        "Develop a formal competitor matrix that becomes part of quarterly strategic review.",
      ],
      sourceData: makeRecommendationSources(["Competitive analysis"]),
    },
    {
      title: "Marketing Strategy",
      body:
        `${company} should prioritize channels that convert intent and trust rather than channels that only create noise. The marketing stack needs to support how buyers actually research, compare, and decide in this category.`,
      priority: "High",
      bullets: [
        `Current reality: ${marketingDone || customersFindOut || "The company already has some market activity, but it likely needs more structure and stronger conversion discipline."}`,
        `Public first impression today: ${newCustomerLookUp || currentPresence || "The current public impression still needs a more intentional trust and quality signal."}`,
        `Offers to push first: ${pushFirst || "Lead with the highest-trust, clearest-value offer before broadening the message."}`,
        `Growth direction: ${expansion || goals || "Expansion decisions should be sequenced after positioning and proof are more disciplined."}`,
        `One-year success marker: ${successYear || "Success should look like stronger lead quality, clearer market perception, and easier conversion."}`,
      ],
      table: {
        columns: ["Channel", "Priority", "Expected ROI", "Difficulty", "Recommendation"],
        rows: marketingTableRows,
      },
      quickWins: [
        "Tighten Google Business Profile, service pages, and review-generation process first.",
        "Create a referral follow-up sequence so satisfied customers are asked at the right moment, not randomly.",
        "Use social selectively for proof, not as the center of the strategy.",
      ],
      longTermOpportunities: [
        "Build content around FAQs, buying guides, and high-trust comparison topics.",
        "Invest in search + conversion improvements before broad awareness spend.",
      ],
      sourceData: makeRecommendationSources(["Current marketing trends", "Competitive analysis"]),
    },
    {
      title: "Source Data",
      body:
        "Recommendations in this report were informed by a blend of submitted facts, consultant interpretation, and broader market reasoning. This section clarifies the difference so future decisions stay grounded.",
      bullets: [
        "Customer discovery responses: direct statements, priorities, concerns, and business context submitted by the customer.",
        "Industry best practices: broadly reliable brand, positioning, conversion, and customer-experience principles.",
        "Competitive analysis: inferences about where comparable brands typically win or lose in the market.",
        "AI reasoning: synthesized observations, implications, and prioritization logic based on the submitted material.",
        "Current marketing trends: modern expectations around identity systems, trust signals, channel behavior, and digital presentation.",
      ],
      sourceData: ["Customer discovery responses", "Industry best practices", "Competitive analysis", "AI reasoning", "Current marketing trends"],
    },
    {
      title: "AI Interpretation",
      body:
        "The observations below are meant to prepare a stronger strategy conversation. They highlight where the client appears clear, where ambiguity remains, and where the answers suggest hidden leverage.",
      sourceData: buildSourceData("Customer discovery responses", "AI reasoning"),
    },
    ...brandDiscoverySections.map((section) => buildInterpretationBlock(section, answers)),
    {
      title: "Discovery Questionnaire Archive",
      body:
        "This appendix preserves the customer's complete submitted questionnaire as the permanent discovery record. Responses remain unedited except for presentation formatting.",
      sourceData: ["Customer discovery responses"],
    },
    ...brandDiscoverySections.map((section) => formatQuestionnaireSection(section, answers)),
    {
      title: "Supporting Files Archive",
      body: uploadedFiles.length
        ? `Files submitted with this discovery: ${uploadedFiles.join(", ")}`
        : "No supporting files were submitted with this discovery.",
      sourceData: ["Customer discovery responses"],
    },
  ];

  return reportBlocks;
}

export function reportToMarkdown(report: ReportBlock[]) {
  return report
    .map((block) => {
      const body = block.body ? `${block.body}\n\n` : "";
      const priority = block.priority ? `Priority: ${block.priority}\n\n` : "";
      const bullets = block.bullets?.length
        ? `${block.bullets.map((item) => `- ${item}`).join("\n")}\n\n`
        : "";
      const quickWins = block.quickWins?.length
        ? `Quick Wins (30 Days)\n${block.quickWins.map((item) => `- ${item}`).join("\n")}\n\n`
        : "";
      const longTerm = block.longTermOpportunities?.length
        ? `Long-Term Opportunities (6-24 Months)\n${block.longTermOpportunities
            .map((item) => `- ${item}`)
            .join("\n")}\n\n`
        : "";
      const sources = block.sourceData?.length
        ? `Source Data\n${block.sourceData.map((item) => `- ${item}`).join("\n")}\n\n`
        : "";
      const questionResponses = block.questionResponses?.length
        ? `${block.questionResponses
            .map(
              (item) =>
                `Question: ${item.question}\nCustomer Response: ${item.response}`,
            )
            .join("\n\n")}\n\n`
        : "";
      const table = block.table
        ? `${block.table.columns.join(" | ")}\n${block.table.columns.map(() => "---").join(" | ")}\n${block.table.rows
            .map((row) => row.join(" | "))
            .join("\n")}\n\n`
        : "";

      return `## ${block.title}\n\n${priority}${body}${bullets}${table}${quickWins}${longTerm}${sources}${questionResponses}`.trim();
    })
    .join("\n\n");
}
