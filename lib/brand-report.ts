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

function asList(value: DiscoveryAnswer | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function asUploads(value: DiscoveryAnswer | undefined) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is DiscoveryUploadMetadata =>
          typeof item === "object" && item !== null && "name" in item,
      )
    : [];
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

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (typeof value === "number") {
        return `${question.label}: ${value}/10`;
      }

      if (Array.isArray(value) && value.length > 0) {
        if (typeof value[0] === "string") {
          return `${question.label}: ${(value as string[]).join(", ")}`;
        }

        return `${question.label}: ${(value as DiscoveryUploadMetadata[])
          .map((file) => file.name)
          .join(", ")}`;
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 4)
    .map((item) => item.length > 140 ? `${item.slice(0, 137)}...` : item);

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

function reportText(value: string, fallback: string) {
  return value || fallback;
}

export function buildBrandReport(answers: DiscoveryFormValues): ReportBlock[] {
  const companyName = asString(answers.companyName) || "Your Company";
  const founderName = asString(answers.founderName) || "the founder";
  const industry = asString(answers.industry) || "its category";
  const businessSummary = asString(answers.businessSummary);
  const founderStory = asString(answers.founderStory);
  const mission = asString(answers.mission);
  const vision = asString(answers.vision);
  const idealCustomer = asString(answers.idealCustomer);
  const futureGoals = asString(answers.futureGoals);
  const uvp = asString(answers.uvp);
  const customerExperience = asString(answers.customerExperience);
  const websiteNeeds = asString(answers.websiteNeeds);
  const marketGap = asString(answers.marketGap);
  const salesProcess = asString(answers.salesProcess);
  const voiceAvoid = asString(answers.voiceAvoid);
  const visualDirection = asString(answers.visualDirection);
  const websiteUrl = asString(answers.websiteUrl);
  const socialMedia = asString(answers.socialMedia);
  const values = asList(answers.coreValues);
  const voiceTraits = asList(answers.brandVoice);
  const channels = asList(answers.marketingChannels);
  const personalityTraits = asList(answers.brandPersonality);
  const offerPriorities = asList(answers.priorityOffers);
  const uploadNames = [
    ...asUploads(answers.logoUploads),
    ...asUploads(answers.inspirationUploads),
  ].map((file) => file.name);

  return [
    {
      title: "Executive Summary",
      body: `${companyName} is being shaped as a ${reportText(
        industry,
        "well-positioned",
      )} brand with the goal of becoming more credible, differentiated, and useful in the market. The brand opportunity is to turn scattered ideas into a usable brand blueprint that supports leadership, sales, and growth.`,
      bullets: [
        reportText(businessSummary, "The business summary still needs deeper definition."),
        reportText(uvp, "Differentation needs sharper articulation."),
        reportText(futureGoals, "Future growth goals should be defined more concretely."),
      ],
    },
    {
      title: "Founder Story",
      body: reportText(
        founderStory,
        `${founderName} needs a more developed founder story that explains why this company had to exist.`,
      ),
    },
    {
      title: "Company Story",
      body: reportText(
        businessSummary,
        `${companyName} needs a clear plain-language company story customers can quickly understand.`,
      ),
    },
    {
      title: "Mission",
      body: reportText(mission, "Mission statement still needs refinement."),
    },
    {
      title: "Vision",
      body: reportText(vision, "Vision statement still needs refinement."),
    },
    {
      title: "Core Values",
      body: values.length
        ? `Core values currently point toward ${values.join(", ")}.`
        : "Core values should be clarified with more specificity and behavior examples.",
      bullets: values,
    },
    {
      title: "Purpose",
      body: reportText(
        mission,
        "The company's purpose should connect customer value with what the founder believes is worth building.",
      ),
    },
    {
      title: "Why This Company Exists",
      body: reportText(
        founderStory || mission,
        "The existence story should combine market frustration, founder conviction, and the better future this business offers.",
      ),
    },
    {
      title: "Brand Positioning",
      body: reportText(
        uvp,
        "Brand positioning needs a concise promise that explains who this is for, what it delivers, and why it is preferable.",
      ),
    },
    {
      title: "Unique Value Proposition",
      body: reportText(uvp, "Unique value proposition still needs to be articulated."),
    },
    {
      title: "Differentiators",
      body: reportText(
        marketGap,
        "Differentiators likely exist in the areas of trust, communication, delivery quality, and strategic clarity, but they need to be named explicitly.",
      ),
    },
    {
      title: "Target Audience",
      body: reportText(
        idealCustomer,
        "Primary, secondary, and future audiences should be defined in more commercial detail.",
      ),
      bullets: [
        `Primary: ${reportText(idealCustomer, "Still defining the core customer.")}`,
        "Secondary: adjacent buyers who value the same outcomes but may buy at a different pace.",
        "Future: aspirational customers who become realistic as the brand strengthens.",
      ],
    },
    {
      title: "Customer Personas",
      body: `Three draft personas should be built around the best-fit buyer for ${companyName}.`,
      bullets: [
        "Persona 1: primary buyer who values confidence, clarity, and premium execution.",
        "Persona 2: comparison shopper who needs proof, process, and trust signals.",
        "Persona 3: future aspirational client who buys status, outcome, and long-term partnership.",
      ],
    },
    {
      title: "Customer Journey",
      body: reportText(
        customerExperience,
        "The journey should move from awareness to referral with less ambiguity at each stage.",
      ),
      bullets: [
        "Awareness: initial exposure through referrals, reputation, or content.",
        "Research: customer validates expertise, trust, and fit.",
        "Comparison: brand story and proof help reduce uncertainty.",
        "Decision: sales process makes next steps feel low-friction and credible.",
        "Purchase: onboarding reinforces the promise.",
        "Referral: satisfied clients become amplifiers of trust.",
      ],
    },
    {
      title: "Objections",
      body: "Likely objections should be anticipated and answered with proof, positioning, and process clarity.",
      bullets: [
        "Why are you priced this way?",
        "How are you different from competitors?",
        "Can you actually deliver the experience you promise?",
      ],
    },
    {
      title: "Competitive Analysis",
      body: reportText(
        marketGap,
        "Competition analysis should compare strengths, weaknesses, positioning, and customer experience gaps.",
      ),
      bullets: [
        "Strengths: specialist focus, customer trust, quality of execution.",
        "Weaknesses: possible inconsistency in message or proof.",
        "Opportunities: claim a more premium and more coherent position.",
        "Threats: cheaper alternatives, better-known incumbents, unclear differentiation.",
      ],
    },
    {
      title: "SWOT Analysis",
      body: "A strategic SWOT should connect brand clarity to business reality rather than generic brainstorming.",
      bullets: [
        "Strengths: founder conviction, operational expertise, closeness to customers.",
        "Weaknesses: unclear story, inconsistent presentation, underused proof.",
        "Opportunities: stronger positioning, better website, more premium experience.",
        "Threats: price pressure, market confusion, generic competitors.",
      ],
    },
    {
      title: "Brand Personality",
      body: personalityTraits.length
        ? `Current personality signals point toward ${personalityTraits.join(", ")}.`
        : "Brand personality should be narrowed to the traits customers should feel immediately.",
    },
    {
      title: "Brand Archetype",
      body: "The brand most likely wants to balance the Sage, Creator, and Ruler archetypes with a grounded Everyman streak, but this should be pressure-tested against the founder story.",
    },
    {
      title: "Brand Voice Guide",
      body: voiceTraits.length
        ? `Voice should feel ${voiceTraits.join(", ")} while avoiding ${reportText(
            voiceAvoid,
            "language that feels vague, inflated, or overly corporate",
          )}.`
        : "Voice guidance should define words to use, words to avoid, tone, cadence, and examples.",
      bullets: [
        "Words to use: clear, practical, trusted, strategic, premium.",
        "Words to avoid: generic hype, filler buzzwords, overpromising claims.",
        "Sentence style: direct, human, and commercially useful.",
      ],
    },
    {
      title: "Visual Direction",
      body: reportText(
        visualDirection,
        "Visual direction should combine warmth, authority, and editorial restraint rather than trendy brand theatrics.",
      ),
      bullets: [
        "Logo recommendations: timeless, confident, structurally clean.",
        "Typography: editorial heading voice with highly readable body text.",
        "Photography: real work, leadership moments, planning, craftsmanship, premium environments.",
        "Icons and shapes: restrained, functional, quietly premium.",
      ],
    },
    {
      title: "Color Psychology",
      body: "Use a palette that signals trust, depth, warmth, and premium restraint. Soft blue and charcoal build credibility, while warmer neutrals keep the brand human.",
    },
    {
      title: "Logo Creative Brief",
      body: "The logo brief should reflect positioning, tone, audience, visual cues to avoid, and how the mark must perform across digital, print, signage, and social.",
    },
    {
      title: "Website Strategy",
      body: reportText(
        websiteNeeds,
        "The website strategy should prioritize trust, positioning clarity, conversion paths, and proof.",
      ),
      bullets: [
        "Recommended sitemap: Home, About, Services, Gallery or Work, Testimonials, FAQ, Contact, Resources.",
        `Current website reference: ${websiteUrl || "not provided yet"}`,
        offerPriorities.length
          ? `Offer emphasis should likely begin with: ${offerPriorities.join(", ")}.`
          : "Offer priority still needs clearer sequencing.",
      ],
    },
    {
      title: "Website Copy",
      body: "Website copy should be rewritten to sound like a mature company that understands business, not like a generic service provider chasing keywords.",
      bullets: [
        "Homepage headline should articulate the promise quickly.",
        "About page should build trust through conviction and practical philosophy.",
        "Service pages should connect outcomes to process and ideal fit.",
      ],
    },
    {
      title: "SEO",
      body: "SEO should support commercial intent, reputation, and category authority rather than vanity traffic alone.",
      bullets: [
        "Keyword strategy: target high-intent service and category terms.",
        "Content clusters: process, case studies, FAQs, trust-building education.",
        "Local visibility: optimize Google Business Profile and location-specific proof.",
      ],
    },
    {
      title: "Social Media",
      body: reportText(
        socialMedia,
        "Social should support awareness, trust, and point-of-view rather than becoming content for content's sake.",
      ),
      bullets: [
        "Voice: expert, useful, human, not performative.",
        "Cadence: consistent enough to stay visible without becoming distracting.",
        "Content pillars: expertise, proof, process, founder perspective, client outcomes.",
      ],
    },
    {
      title: "Marketing Plan",
      body: channels.length
        ? `Current channel priorities include ${channels.join(", ")}.`
        : "Marketing plan should define channel focus, message sequencing, proof strategy, and measurement discipline.",
      bullets: [
        "First 90 days: refine position, website message, proof assets, and referral talking points.",
        "6 months: publish authority-building content and improve conversion flows.",
        "12 months: scale the channels that convert with the least friction.",
      ],
    },
    {
      title: "Sales Strategy",
      body: reportText(
        salesProcess,
        "Sales strategy should translate the brand into an easier pitch, better objection handling, and more consistent follow-up.",
      ),
      bullets: [
        "Elevator pitch: simple and commercially clear.",
        "Phone pitch: empathy first, clarity second, confidence throughout.",
        "Proposal messaging: make the value feel concrete and premium.",
      ],
    },
    {
      title: "Taglines",
      body: "Generate 30 tagline directions that emphasize clarity, trust, premium experience, and strategic usefulness.",
    },
    {
      title: "Mission Options",
      body: "Generate 20 mission options that stay practical, human, and non-corporate.",
    },
    {
      title: "Homepage Headlines",
      body: "Generate 100 homepage headline options built around clarity, differentiation, and trusted execution.",
    },
    {
      title: "Value Propositions",
      body: "Generate 50 value proposition statements that work across website copy, proposals, and sales conversations.",
    },
    {
      title: "Email Signature",
      body: "Standardize titles, contact details, CTA links, and a more polished first-impression system.",
    },
    {
      title: "Google Business Profile",
      body: "Clarify the right categories, image strategy, review cadence, and service descriptions for local visibility.",
    },
    {
      title: "Press Release",
      body: "Draft a brand launch or repositioning release that sounds credible and newsworthy without overhyping the company.",
    },
    {
      title: "Brand Guidelines",
      body: "Create a practical working guide covering logo usage, spacing, colors, type, photography, tone, and brand behavior.",
    },
    {
      title: "Strategic Consultant Review",
      body: `If this were my company, I would pressure-test the premium story, raise the standard of proof, tighten the offer hierarchy, and build a brand system that makes ${companyName} easier to trust, easier to refer, and easier to choose over the next five years.`,
      bullets: [
        "Challenge assumptions: make sure the premium claim is supported by experience, process, and proof.",
        "Pricing strategy: consider whether pricing reflects the value and positioning the company wants to own.",
        "Customer experience: systematize onboarding, follow-up, and review generation.",
        "Partnerships: identify adjacent businesses and communities that strengthen credibility.",
        "Awards and certifications: pursue the signals that matter in this category, not vanity badges.",
        "Five-year roadmap: become known for a small number of strengths and repeat them relentlessly.",
      ],
    },
    {
      title: "Attached Inputs",
      body: uploadNames.length
        ? `Supporting files currently captured: ${uploadNames.join(", ")}`
        : "No supporting uploads captured yet.",
    },
  ];
}

export function reportToMarkdown(report: ReportBlock[]) {
  return report
    .map((block) => {
      const bullets =
        block.bullets?.map((item) => `- ${item}`).join("\n") ?? "";
      return `## ${block.title}\n\n${block.body}${bullets ? `\n\n${bullets}` : ""}`;
    })
    .join("\n\n");
}
