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
      "In about 12 to 15 minutes, we’ll uncover the clearest version of your business, your customer, and the brand direction that should support growth.",
    estimatedMinutes: 1,
    questions: [
      {
        id: "discoveryGoal",
        label: "What do you need most from this process right now?",
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
      {
        id: "readiness",
        label: "How ready are you to define the brand behind this business?",
        type: "slider",
        min: 1,
        max: 10,
        step: 1,
        description: "This helps us calibrate how much strategic guidance you may need.",
      },
    ],
  },
  {
    id: "leadership-snapshot",
    title: "Leadership Snapshot",
    description:
      "Start with the person leading the business and the role they play in shaping it.",
    estimatedMinutes: 1,
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
        id: "companyName",
        label: "Company name",
        type: "short-text",
        placeholder: "Northline Custom Homes",
      },
      {
        id: "industry",
        label: "Industry",
        type: "short-text",
        placeholder: "Construction, professional services, manufacturing...",
      },
    ],
  },
  {
    id: "business-offer",
    title: "Business & Offer",
    description:
      "Capture what the company actually does and which offers should lead the story.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "businessSummary",
        label: "Describe the business in plain language.",
        type: "paragraph",
        rows: 5,
        placeholder: "What do you do, who do you serve, and what kind of work are you known for?",
      },
      {
        id: "productsServices",
        label: "What products or services drive the business today?",
        type: "paragraph",
        rows: 4,
        placeholder: "List the main offers, revenue drivers, or service lines that matter most.",
      },
    ],
  },
  {
    id: "founder-story",
    title: "Founder Story",
    description:
      "Your business already has a story. This part helps uncover the reason it exists and the conviction behind it.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "founderStory",
        label: "How did this business start?",
        type: "paragraph",
        rows: 6,
        placeholder: "Tell the story behind the company, what led you here, and what still drives you.",
        helpTitle: "Need help finding the story?",
        helpBody:
          "Great founder stories usually include a moment, frustration, conviction, or opportunity that made the company necessary.",
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
      {
        id: "mission",
        label: "What is your mission in practical terms?",
        type: "paragraph",
        rows: 4,
        placeholder: "Why does this company exist, and what role does it play in customers’ lives?",
      },
    ],
  },
  {
    id: "customer-market",
    title: "Customer & Market",
    description:
      "Strong brands are specific about who they are for, what the market gets wrong, and where trust is won.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "idealCustomer",
        label: "Describe your best-fit customer.",
        type: "paragraph",
        rows: 5,
        placeholder: "Who are they, what do they care about, and why are they worth serving well?",
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
    id: "positioning",
    title: "Positioning",
    description:
      "This is where scattered ideas become a usable market position and a clearer direction for growth.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "uvp",
        label: "What makes your company meaningfully different?",
        type: "paragraph",
        rows: 5,
        placeholder: "Explain the real difference customers should care about.",
        helpTitle: "Need help?",
        helpBody:
          "Think about specialization, transparency, speed, communication, premium experience, or a better process.",
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
      {
        id: "futureGoals",
        label: "What do you want the next three years to look like?",
        type: "paragraph",
        rows: 4,
        placeholder: "Growth, pricing, reputation, geography, category authority, team size...",
      },
    ],
  },
  {
    id: "brand-direction",
    title: "Brand Direction",
    description:
      "Shape how the brand should sound, feel, and be experienced before any visual system tries to carry too much weight.",
    estimatedMinutes: 2,
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
        ],
      },
      {
        id: "customerExperience",
        label: "Describe the ideal customer experience.",
        type: "paragraph",
        rows: 5,
        placeholder: "What should clients experience from the first call through delivery and follow-up?",
      },
      {
        id: "visualDirection",
        label: "What visual cues already feel right for the brand?",
        type: "paragraph",
        rows: 4,
        placeholder: "Think timeless, modern, architectural, handcrafted, minimal, warm, executive...",
      },
    ],
  },
  {
    id: "activation",
    title: "Activation",
    description:
      "Bring the strategy into the channels and touchpoints that need to support growth.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "websiteNeeds",
        label: "What should your website or digital presence do better?",
        type: "paragraph",
        rows: 4,
        placeholder: "Explain what needs to improve in messaging, trust, conversion, or structure.",
      },
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
        id: "salesProcess",
        label: "How does a prospect become a customer today?",
        type: "paragraph",
        rows: 4,
        placeholder: "Describe the journey from lead to close and where friction shows up.",
      },
    ],
  },
  {
    id: "uploads",
    title: "Uploads",
    description:
      "Optional, but helpful. Add anything that gives context to your current brand or visual direction.",
    estimatedMinutes: 1,
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
        label: "Inspiration images, screenshots, project photos, or competitor references",
        type: "upload",
        accept: ".png,.jpg,.jpeg,.pdf",
        multiple: true,
      },
    ],
  },
];

function initialAnswerForQuestion(question: DiscoveryQuestion) {
  switch (question.type) {
    case "checkboxes":
    case "ranking":
    case "priority-order":
      return [];
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
