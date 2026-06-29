import type {
  DiscoveryFormValues,
  DiscoveryQuestion,
  DiscoverySection,
} from "@/types/brand-discovery";

function textQuestion(
  id: string,
  label: string,
  placeholder: string,
  options?: Partial<DiscoveryQuestion>,
): DiscoveryQuestion {
  return {
    id,
    label,
    type: "short-text",
    placeholder,
    required: true,
    ...options,
  };
}

function paragraphQuestion(
  id: string,
  label: string,
  placeholder: string,
  options?: Partial<DiscoveryQuestion>,
): DiscoveryQuestion {
  return {
    id,
    label,
    type: "paragraph",
    rows: 5,
    placeholder,
    required: true,
    ...options,
  };
}

const personalityOptions = [
  "Premium",
  "Practical",
  "Bold",
  "Warm",
  "Modern",
  "Traditional",
  "Technical",
  "Friendly",
  "Quiet Luxury",
  "Confident",
  "Approachable",
  "Innovative",
  "Trustworthy",
  "Precise",
  "Creative",
  "Serious",
  "Playful",
  "Rugged",
  "Elegant",
  "Minimal",
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

const feelingOptions = [
  "Confident",
  "Safe",
  "Inspired",
  "Relieved",
  "Proud",
  "Excited",
  "Protected",
  "Understood",
  "Successful",
  "Supported",
  "Exclusive",
  "Comfortable",
  "Energized",
  "Clear",
  "In Control",
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

const visualDirectionOptions = [
  "Modern luxury",
  "Warm and personal",
  "Clean and minimal",
  "Industrial and strong",
  "Classic and timeless",
  "Natural and earthy",
  "Bold and high-energy",
  "Technical and precise",
  "Editorial and premium",
  "Local and approachable",
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

const websiteGoalOptions = [
  "Generate leads",
  "Explain services",
  "Build trust",
  "Book calls",
  "Sell products",
  "Support current customers",
  "Other",
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

const uploadLabels = [
  "Logo",
  "Current brand files",
  "Photos",
  "Brochures",
  "Price lists",
  "Competitor examples",
  "Inspiration screenshots",
  "Other",
];

export const brandDiscoverySections: DiscoverySection[] = [
  {
    id: "welcome",
    title: "Welcome",
    description:
      "This guided interview takes about 15 to 20 minutes. Your progress saves automatically, so you can step away and come back at any time.",
    estimatedMinutes: 1,
    questions: [],
  },
  {
    id: "about-you",
    title: "About You",
    description: "Start with the basics so we know who we are building this brand around.",
    estimatedMinutes: 2,
    questions: [
      textQuestion("contactName", "Your name", "Jane Founder"),
      textQuestion("contactRole", "Your role/title", "Founder, CEO, Owner"),
      textQuestion("companyName", "Company name", "Northline Custom Homes"),
      textQuestion("industryCategory", "Industry/category", "Construction, legal, wellness", {
        description: "The industry or category you most want this brand to be known in.",
      }),
      textQuestion("bestEmail", "Best email", "jane@company.com", { inputType: "email" }),
      textQuestion("bestPhone", "Best phone", "(555) 555-5555", { inputType: "tel" }),
    ],
  },
  {
    id: "origin-story",
    title: "Origin Story",
    description: "Tell us why this company exists and what makes it worth building.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "companyStart",
        "Why did this company start?",
        "Tell the story of how the company began.",
      ),
      paragraphQuestion(
        "problemYouSolve",
        "What problem are you trying to solve?",
        "Describe the pain, frustration, or gap that made this business necessary.",
      ),
      paragraphQuestion(
        "deserveToExist",
        "Why does this company deserve to exist?",
        "What value does this business create that matters?",
      ),
      paragraphQuestion(
        "proudSoFar",
        "What are you most proud of so far?",
        "Wins, milestones, work quality, customer impact, or progress you want us to understand.",
      ),
    ],
  },
  {
    id: "customers",
    title: "Customers",
    description: "Define who this brand is for and what matters most to them.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "idealCustomer",
        "Who is your ideal customer?",
        "Describe the kind of customer you most want to attract.",
      ),
      paragraphQuestion(
        "notGoodFit",
        "Who is NOT a good fit?",
        "Describe the customer, project, or buyer you do not want more of.",
      ),
      paragraphQuestion(
        "problemBeforeFindingYou",
        "What problem do customers usually have before they find you?",
        "What is going wrong, missing, or frustrating before they call you?",
      ),
      paragraphQuestion(
        "customerCareMostAbout",
        "What do customers care about most when choosing someone like you?",
        "Price, trust, speed, expertise, service, clarity, design quality, or something else.",
      ),
    ],
  },
  {
    id: "difference",
    title: "Difference",
    description: "Clarify what separates you from competitors and what proves it.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "meaningfullyDifferent",
        "What makes you meaningfully different?",
        "Explain the real difference customers should notice and care about.",
      ),
      paragraphQuestion(
        "betterThanCompetitors",
        "What do you do better than competitors?",
        "Be specific about process, quality, communication, speed, strategy, or experience.",
      ),
      paragraphQuestion(
        "customerMisunderstanding",
        "What do customers misunderstand about your business?",
        "What do people assume incorrectly until they know you better?",
      ),
      paragraphQuestion(
        "proofYouAreGood",
        "What proof do you have that you are good at this?",
        "Results, retention, referrals, testimonials, awards, case studies, or reputation.",
      ),
    ],
  },
  {
    id: "personality",
    title: "Personality",
    description: "Choose the words that should shape how the brand comes across.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "brandPersonality",
        label: "If your company walked into a room, how should people describe it?",
        description: "Select all that fit.",
        type: "checkboxes",
        options: personalityOptions,
        required: true,
      },
      paragraphQuestion(
        "brandWordsShould",
        "Any words that should describe the brand?",
        "Add any important words that were not covered above.",
      ),
      paragraphQuestion(
        "brandWordsShouldNot",
        "Any words that should NOT describe the brand?",
        "Tell us what the brand should avoid sounding or feeling like.",
      ),
    ],
  },
  {
    id: "customer-feeling",
    title: "Customer Feeling",
    description: "Define the emotional outcome customers should walk away with.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "customerFeeling",
        label: "How should customers feel after working with you?",
        description: "Select all that fit.",
        type: "checkboxes",
        options: feelingOptions,
        required: true,
      },
    ],
  },
  {
    id: "visual-direction",
    title: "Visual Direction",
    description: "Point us toward the style direction that feels most aligned.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "visualDirection",
        label: "What visual direction feels closest to your brand?",
        description: "Select all that feel relevant.",
        type: "checkboxes",
        options: visualDirectionOptions,
        required: true,
      },
      paragraphQuestion(
        "colorsYouLike",
        "What colors do you like?",
        "List colors, moods, or combinations that feel right.",
      ),
      paragraphQuestion(
        "colorsToAvoid",
        "What colors should we avoid?",
        "List any colors, combinations, or tones that feel off-brand.",
      ),
      paragraphQuestion(
        "brandExamples",
        "Are there any brands, websites, or logos you like?",
        "Include links if possible and tell us what you like about them.",
      ),
    ],
  },
  {
    id: "logo",
    title: "Logo",
    description: "Tell us where the current logo stands and what should happen next.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "hasLogo",
        label: "Do you have a logo?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "logoFiles",
        label: "Upload logo files if available",
        type: "upload",
        accept: ".pdf,.svg,.eps,.ai,.png,.jpg,.jpeg",
        multiple: true,
        required: false,
      },
      {
        id: "logoPlan",
        label: "What do you want to do with the logo?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "keep", label: "Keep it" },
          { value: "refresh", label: "Refresh it" },
          { value: "replace", label: "Replace it" },
          { value: "not-sure", label: "Not sure" },
        ],
      },
      paragraphQuestion(
        "logoLikesDislikes",
        "What do you like or dislike about the current logo?",
        "Tell us what should carry forward and what should change.",
      ),
    ],
  },
  {
    id: "website",
    title: "Website",
    description: "Clarify the role your website should play in the business.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "hasWebsite",
        label: "Do you have a current website?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      textQuestion("websiteUrl", "Website URL", "https://yourwebsite.com", {
        inputType: "url",
        required: false,
      }),
      {
        id: "websiteGoals",
        label: "What should the website do?",
        description: "Select all that apply.",
        type: "checkboxes",
        options: websiteGoalOptions,
        required: true,
      },
      paragraphQuestion(
        "websiteQuestions",
        "What questions should the website answer before someone calls you?",
        "List the key questions, objections, or trust gaps the site needs to handle.",
      ),
      paragraphQuestion(
        "websitesYouLike",
        "What websites do you like?",
        "Include links if possible and tell us what you like about them.",
      ),
    ],
  },
  {
    id: "marketing-sales",
    title: "Marketing and Sales",
    description: "Show us how customers find you now and how your sales process works.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "findYouToday",
        "How do customers find you today?",
        "Referrals, social, search, events, ads, outreach, repeat business, or other sources.",
      ),
      paragraphQuestion(
        "findYouFuture",
        "Where do you want customers to find you in the future?",
        "What channels or opportunities do you want the brand to support next?",
      ),
      paragraphQuestion(
        "currentSalesProcess",
        "What is your current sales process?",
        "Walk us through what happens from first inquiry to signed client or sale.",
      ),
      paragraphQuestion(
        "commonObjections",
        "What objections do you hear most often?",
        "What concerns or hesitations come up before people buy?",
      ),
    ],
  },
  {
    id: "future-vision",
    title: "Future Vision",
    description: "Anchor this work in the future you are trying to build.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "oneYearVision",
        "Where do you want the company in 1 year?",
        "Describe the next 12 months in practical business terms.",
      ),
      paragraphQuestion(
        "threeYearVision",
        "Where do you want the company in 3 years?",
        "Describe the growth, positioning, team, or reputation you want to build.",
      ),
      paragraphQuestion(
        "fiveYearVision",
        "Where do you want the company in 5 years?",
        "What does success look like over the longer arc?",
      ),
      paragraphQuestion(
        "brandProjectSuccess",
        "What would make this brand project a success?",
        "Tell us what outcomes would make this feel worth it.",
      ),
    ],
  },
  {
    id: "uploads",
    title: "Uploads",
    description: "Share anything useful that helps us understand the current brand.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "supportingFiles",
        label: `Upload any of the following: ${uploadLabels.join(", ")}`,
        description: "Upload whatever is available. File metadata is saved with your discovery.",
        type: "upload",
        accept: ".pdf,.png,.jpg,.jpeg,.svg,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip",
        multiple: true,
        required: false,
      },
    ],
  },
];

export function createInitialDiscoveryAnswers(): DiscoveryFormValues {
  return Object.fromEntries(
    brandDiscoverySections.flatMap((section) =>
      section.questions.map((question) => {
        if (question.type === "checkboxes") {
          return [question.id, []];
        }

        if (question.type === "upload") {
          return [question.id, []];
        }

        return [question.id, ""];
      }),
    ),
  );
}
