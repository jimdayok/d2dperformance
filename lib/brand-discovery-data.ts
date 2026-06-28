import type {
  DiscoveryFormValues,
  DiscoveryQuestion,
  DiscoverySection,
} from "@/types/brand-discovery";

export const brandDiscoverySections: DiscoverySection[] = [
  {
    id: "welcome",
    title: "Let's Build Your Brand",
    description:
      "In about an hour, we'll help uncover everything needed to build a complete professional brand for your company.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "readiness",
        label: "How ready are you to define the brand behind this business?",
        type: "slider",
        min: 1,
        max: 10,
        step: 1,
        description: "This helps us calibrate how much strategic guidance you may need.",
      },
      {
        id: "discoveryGoal",
        label: "What are you hoping this process will give you most?",
        type: "multiple-choice",
        options: [
          {
            value: "clarity",
            label: "Brand clarity",
            description: "I need direction before I invest in design, website, or marketing.",
          },
          {
            value: "positioning",
            label: "Positioning",
            description: "I need help defining how we should be perceived in the market.",
          },
          {
            value: "growth",
            label: "Growth direction",
            description: "I need a stronger story and system to support sales and growth.",
          },
        ],
      },
    ],
  },
  {
    id: "about-you",
    title: "About You",
    description: "Let's start with the person shaping the business and the role you play in it.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "founderName",
        label: "Your name",
        type: "short-text",
        placeholder: "Jane Founder",
      },
      {
        id: "founderRole",
        label: "Your role",
        type: "short-text",
        placeholder: "Founder, CEO, Managing Partner...",
      },
      {
        id: "leadershipStrengths",
        label: "Where do you feel strongest as a leader today?",
        type: "checkboxes",
        options: [
          { value: "vision", label: "Vision and direction" },
          { value: "sales", label: "Sales and relationships" },
          { value: "operations", label: "Operations and delivery" },
          { value: "team", label: "Leadership and people" },
          { value: "craft", label: "Product or service quality" },
        ],
      },
    ],
  },
  {
    id: "your-business",
    title: "Your Business",
    description: "Capture the shape of the company today so the brand is built on reality, not aspiration alone.",
    estimatedMinutes: 5,
    questions: [
      {
        id: "companyName",
        label: "Company name",
        type: "short-text",
        placeholder: "Northline Custom Homes",
      },
      {
        id: "industry",
        label: "Industry",
        type: "short-text",
        placeholder: "Custom home building, professional services, manufacturing...",
      },
      {
        id: "revenueRange",
        label: "Revenue range",
        type: "multiple-choice",
        options: [
          { value: "pre-launch", label: "Pre-launch" },
          { value: "0-500k", label: "$0-$500K" },
          { value: "500k-2m", label: "$500K-$2M" },
          { value: "2m-10m", label: "$2M-$10M" },
          { value: "10m-50m", label: "$10M-$50M" },
        ],
      },
      {
        id: "businessSummary",
        label: "Describe the business in plain language.",
        type: "paragraph",
        rows: 5,
        placeholder: "What do you do, who do you serve, and what kind of work are you known for?",
      },
    ],
  },
  {
    id: "founder-story",
    title: "Founder Story",
    description: "Your business already has a story. This process helps uncover it.",
    estimatedMinutes: 5,
    questions: [
      {
        id: "founderStory",
        label: "How did this business start?",
        type: "paragraph",
        rows: 6,
        placeholder: "Tell the story behind the company, what led you here, and what still drives you.",
        helpTitle: "Need help finding the story?",
        helpBody: "Great founder stories usually include a moment, frustration, conviction, or opportunity that made the company necessary.",
        helpExamples: [
          "I saw clients constantly overpaying for generic solutions and knew there was a better way.",
          "After years in custom building, I wanted to create a more premium and transparent client experience.",
          "The company began because the market had expertise, but not enough trust or follow-through.",
        ],
        brandExamples: [
          "Apple centers simplicity and belief in better design.",
          "Patagonia anchors the brand in values and purpose.",
        ],
      },
    ],
  },
  {
    id: "mission",
    title: "Mission",
    description: "Clarify the practical role your company plays in the lives of customers.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "mission",
        label: "What is your mission?",
        type: "paragraph",
        rows: 4,
        placeholder: "Why does this company exist in a practical sense?",
      },
    ],
  },
  {
    id: "vision",
    title: "Vision",
    description: "Define the future you are building toward over the next several years.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "vision",
        label: "What future are you trying to create?",
        type: "paragraph",
        rows: 4,
        placeholder: "Describe where the company is headed and what success looks like long term.",
      },
    ],
  },
  {
    id: "core-values",
    title: "Core Values",
    description: "Values become useful when they shape behavior under pressure, not just on a wall.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "coreValues",
        label: "Which values matter most?",
        type: "checkboxes",
        options: [
          { value: "craftsmanship", label: "Craftsmanship" },
          { value: "transparency", label: "Transparency" },
          { value: "service", label: "Service" },
          { value: "discipline", label: "Discipline" },
          { value: "innovation", label: "Innovation" },
          { value: "community", label: "Community" },
        ],
      },
      {
        id: "valuesStory",
        label: "How should those values show up in the real customer experience?",
        type: "paragraph",
        rows: 4,
        placeholder: "Give examples of how clients or team members should feel these values.",
      },
    ],
  },
  {
    id: "ideal-customer",
    title: "Ideal Customer",
    description: "Strong brands are specific about who they are built for and who they are not.",
    estimatedMinutes: 5,
    questions: [
      {
        id: "idealCustomer",
        label: "Describe your best-fit customer.",
        type: "paragraph",
        rows: 5,
        placeholder: "Who are they, what do they care about, and why are they worth serving well?",
      },
      {
        id: "customerIncome",
        label: "What income or buying power best describes your primary customer?",
        type: "short-text",
        placeholder: "$150K household income, enterprise buyer, affluent homeowner...",
      },
    ],
  },
  {
    id: "competition",
    title: "Competition",
    description: "Your competition includes both direct competitors and the default alternatives customers settle for.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "competition",
        label: "Who are customers comparing you against?",
        type: "paragraph",
        rows: 4,
        placeholder: "List direct competitors, cheaper alternatives, or the status quo.",
      },
      {
        id: "marketGap",
        label: "Where do you think the market is underserving people?",
        type: "paragraph",
        rows: 4,
        placeholder: "What do competitors miss, overcomplicate, or fail to deliver?",
      },
    ],
  },
  {
    id: "unique-value-proposition",
    title: "Unique Value Proposition",
    description: "Clarity before creative. The difference must be useful, not just clever.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "uvp",
        label: "What makes your company meaningfully different?",
        type: "paragraph",
        rows: 5,
        placeholder: "Explain the real difference customers should care about.",
        helpTitle: "Need help?",
        helpBody: "Think about materials, specialization, transparency, speed, communication, or a more premium experience.",
        helpExamples: [
          "We use better materials and explain every recommendation clearly.",
          "We specialize in high-end custom homes for clients who want timeless design.",
          "We are faster, cleaner, and more transparent than most competitors.",
        ],
        brandExamples: [
          "Yeti owns durability and lifestyle.",
          "Tesla combines innovation with status and category leadership.",
        ],
      },
    ],
  },
  {
    id: "products-services",
    title: "Products & Services",
    description: "Define the offers that should lead the brand story and the ones that should support it.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "productsServices",
        label: "What do you sell today?",
        type: "paragraph",
        rows: 4,
        placeholder: "List your products, services, and core revenue drivers.",
      },
      {
        id: "priorityOffers",
        label: "Which offers should be prioritized in the market story?",
        type: "priority-order",
        options: [
          { value: "flagship", label: "Flagship offer" },
          { value: "high-margin", label: "Highest-margin offer" },
          { value: "retainer", label: "Retainer or recurring work" },
          { value: "entry", label: "Entry-point offer" },
        ],
      },
    ],
  },
  {
    id: "brand-personality",
    title: "Brand Personality",
    description: "Choose the traits that should be felt immediately when people encounter the brand.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "brandPersonality",
        label: "Rank the personality traits that best fit your brand.",
        type: "ranking",
        options: [
          { value: "sincere", label: "Sincere" },
          { value: "competent", label: "Competent" },
          { value: "sophisticated", label: "Sophisticated" },
          { value: "rugged", label: "Rugged" },
          { value: "exciting", label: "Exciting" },
        ],
      },
      {
        id: "archetypeNotes",
        label: "What kind of emotional response should the brand create?",
        type: "paragraph",
        rows: 4,
        placeholder: "Trust, confidence, calm, aspiration, momentum...",
      },
    ],
  },
  {
    id: "brand-voice",
    title: "Brand Voice",
    description: "Voice turns strategy into language people can actually recognize and remember.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "brandVoice",
        label: "How should the brand sound?",
        type: "checkboxes",
        options: [
          { value: "clear", label: "Clear" },
          { value: "warm", label: "Warm" },
          { value: "confident", label: "Confident" },
          { value: "practical", label: "Practical" },
          { value: "premium", label: "Premium" },
          { value: "playful", label: "Playful" },
        ],
      },
      {
        id: "voiceAvoid",
        label: "What language or tone should the brand avoid?",
        type: "paragraph",
        rows: 3,
        placeholder: "Too corporate, too trendy, too technical, too salesy...",
      },
    ],
  },
  {
    id: "customer-experience",
    title: "Customer Experience",
    description: "The brand should match how it feels to work with you before, during, and after the engagement.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "customerExperience",
        label: "Describe the ideal client experience.",
        type: "paragraph",
        rows: 5,
        placeholder: "What should clients experience from the first call through delivery and follow-up?",
      },
    ],
  },
  {
    id: "visual-identity",
    title: "Visual Identity",
    description: "Visual direction should reinforce strategy, not distract from it.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "visualDirection",
        label: "What visual cues already feel right for the brand?",
        type: "paragraph",
        rows: 4,
        placeholder: "Think timeless, modern, architectural, handcrafted, minimal...",
      },
      {
        id: "brandColor",
        label: "Choose a color that feels directionally right today.",
        type: "color",
      },
    ],
  },
  {
    id: "website",
    title: "Website",
    description: "Your website should reflect the maturity, quality, and confidence of the business.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "websiteUrl",
        label: "Current website",
        type: "website",
        placeholder: "https://yourwebsite.com",
      },
      {
        id: "websiteNeeds",
        label: "What should the website do better?",
        type: "paragraph",
        rows: 4,
        placeholder: "Explain what needs to improve in messaging, trust, conversion, or structure.",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Build brand awareness before you market it. Then make marketing much more useful.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "marketingChannels",
        label: "Which channels matter most right now?",
        type: "checkboxes",
        options: [
          { value: "referrals", label: "Referrals" },
          { value: "social", label: "Social media" },
          { value: "seo", label: "SEO and content" },
          { value: "email", label: "Email marketing" },
          { value: "events", label: "Networking and events" },
          { value: "ads", label: "Paid ads" },
        ],
      },
      {
        id: "marketingConfidence",
        label: "How confident are you in your current marketing direction?",
        type: "slider",
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
  {
    id: "social-media",
    title: "Social Media",
    description: "Social should support the business, not become a performance treadmill.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "socialMedia",
        label: "How should social media support the brand?",
        type: "paragraph",
        rows: 4,
        placeholder: "Brand awareness, education, community, proof of quality, recruiting...",
      },
    ],
  },
  {
    id: "sales-process",
    title: "Sales Process",
    description: "The brand should make the sales conversation easier, more credible, and more consistent.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "salesProcess",
        label: "How does a prospect become a customer today?",
        type: "paragraph",
        rows: 5,
        placeholder: "Describe the journey from lead to close and where friction shows up.",
      },
    ],
  },
  {
    id: "future-goals",
    title: "Future Goals",
    description: "The brand should support where the company is going next, not just where it has been.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "futureGoals",
        label: "What do you want the next three years to look like?",
        type: "paragraph",
        rows: 5,
        placeholder: "Growth, geography, pricing, reputation, team, category authority...",
      },
    ],
  },
  {
    id: "uploads",
    title: "Uploads",
    description: "Add anything that helps us understand your current brand reality or visual preferences.",
    estimatedMinutes: 4,
    questions: [
      {
        id: "logoUploads",
        label: "Current logo or business card files",
        type: "upload",
        accept: ".png,.jpg,.jpeg,.pdf,.svg",
        multiple: true,
      },
      {
        id: "inspirationUploads",
        label: "Inspiration images, Pinterest screenshots, project photos, or competitor references",
        type: "upload",
        accept: ".png,.jpg,.jpeg,.pdf",
        multiple: true,
      },
      {
        id: "voiceMemo",
        label: "Voice recording placeholder",
        type: "voice-placeholder",
        description: "Future: record a voice note when typing is not the best way to capture nuance.",
      },
      {
        id: "videoWalkthrough",
        label: "Video upload placeholder",
        type: "video-placeholder",
        description: "Future: share a quick walkthrough of your business, showroom, team, or current materials.",
      },
    ],
  },
];

function initialAnswerForQuestion(question: DiscoveryQuestion) {
  switch (question.type) {
    case "checkboxes":
    case "ranking":
    case "priority-order":
      return question.options?.map((option) => option.value) ?? [];
    case "slider":
      return question.min ?? 1;
    case "color":
      return "#1a6ac9";
    case "upload":
      return [];
    default:
      return "";
  }
}

export function createInitialDiscoveryAnswers(): DiscoveryFormValues {
  return Object.fromEntries(
    brandDiscoverySections.flatMap((section) =>
      section.questions.map((question) => [
        question.id,
        initialAnswerForQuestion(question),
      ]),
    ),
  );
}
