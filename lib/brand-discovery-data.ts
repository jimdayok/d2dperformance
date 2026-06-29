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
  "Confident",
  "Approachable",
  "Innovative",
  "Trustworthy",
  "Precise",
  "Creative",
  "Elegant",
  "Minimal",
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
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

const websiteGoalOptions = [
  "Trust you",
  "Understand your services",
  "Book a call",
  "Request a quote",
  "Buy something",
  "Get support",
].map((label) => ({
  value: label.toLowerCase().replaceAll(" ", "-"),
  label,
}));

export const brandDiscoverySections: DiscoverySection[] = [
  {
    id: "contact",
    title: "Contact",
    description: "Start with the basics so we know who this brand discovery is for.",
    estimatedMinutes: 2,
    questions: [
      textQuestion("name", "Name", "Jane Founder"),
      textQuestion("company", "Company", "Northline Custom Homes"),
      textQuestion("role", "Role", "Founder, CEO, Owner"),
      textQuestion("email", "Email", "jane@company.com", { inputType: "email" }),
      textQuestion("phone", "Phone", "(555) 555-5555", {
        inputType: "tel",
        required: false,
      }),
    ],
  },
  {
    id: "company-story",
    title: "Company Story",
    description: "Give us the short version of who you are and why this business exists.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "companyStart",
        "Why did you start this company?",
        "Tell us how the company began and what drove you to build it.",
      ),
      paragraphQuestion(
        "customerKnow",
        "What do you want customers to know about you?",
        "Share the message or feeling you want people to walk away with.",
      ),
      paragraphQuestion(
        "proudOf",
        "What are you most proud of?",
        "Wins, milestones, work quality, customer relationships, or progress that matters.",
      ),
    ],
  },
  {
    id: "customer",
    title: "Customer",
    description: "Clarify who you serve, what they need, and why they should choose you.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "idealCustomer",
        "Who is your ideal customer?",
        "Describe the type of customer you most want to attract.",
      ),
      paragraphQuestion(
        "customerProblem",
        "What problem do they come to you with?",
        "What is going wrong, missing, or frustrating before they find you?",
      ),
      paragraphQuestion(
        "chooseYou",
        "Why should they choose you instead of someone else?",
        "Explain the difference, trust factor, or value that sets you apart.",
      ),
    ],
  },
  {
    id: "brand-personality",
    title: "Brand Personality",
    description: "Choose the traits that should define how the brand comes across.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "brandPersonality",
        label: "Which words should describe your brand?",
        description: "Select all that fit.",
        type: "checkboxes",
        options: personalityOptions,
        required: true,
      },
      paragraphQuestion(
        "brandWordsAvoid",
        "Are there words you do NOT want associated with your brand?",
        "Tell us what the brand should avoid sounding or feeling like.",
      ),
    ],
  },
  {
    id: "look-and-feel",
    title: "Look and Feel",
    description: "Point us toward the visual tone that feels most aligned with your brand.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "visualDirection",
        label: "Pick your preferred visual direction",
        description: "Select all that feel right.",
        type: "checkboxes",
        options: visualDirectionOptions,
        required: true,
      },
      paragraphQuestion(
        "colorsLike",
        "What colors do you like?",
        "List colors, tones, or combinations that feel right.",
      ),
      paragraphQuestion(
        "colorsAvoid",
        "What colors should we avoid?",
        "Tell us which colors or moods feel wrong for the brand.",
      ),
    ],
  },
  {
    id: "logo-assets",
    title: "Logo and Visual Assets",
    description: "Let us know what already exists and what needs to happen next.",
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
        label: "Upload logo or files",
        description: "Upload anything useful you already have.",
        type: "upload",
        accept: ".pdf,.svg,.eps,.ai,.png,.jpg,.jpeg",
        multiple: true,
        required: false,
      },
      {
        id: "logoPlan",
        label: "What should happen with the logo?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "keep", label: "Keep it" },
          { value: "refresh", label: "Refresh it" },
          { value: "replace", label: "Replace it" },
          { value: "not-sure", label: "Not sure" },
        ],
      },
    ],
  },
  {
    id: "website-marketing",
    title: "Website and Marketing",
    description: "Tell us how the website should support trust, clarity, and conversion.",
    estimatedMinutes: 2,
    questions: [
      {
        id: "hasWebsite",
        label: "Do you have a website?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "websiteGoals",
        label: "What should your website help people do?",
        description: "Select all that apply.",
        type: "checkboxes",
        options: websiteGoalOptions,
        required: true,
      },
      paragraphQuestion(
        "websiteQuestions",
        "What questions should the website answer before someone contacts you?",
        "List the trust questions, objections, or details the site needs to cover.",
      ),
    ],
  },
  {
    id: "final-notes",
    title: "Final Notes",
    description: "Add anything else we should know and share any supporting files.",
    estimatedMinutes: 2,
    questions: [
      paragraphQuestion(
        "finalNotes",
        "Is there anything else we should know?",
        "Share anything important that has not come up yet.",
      ),
      {
        id: "supportingFiles",
        label: "Upload extra files, photos, examples, brochures, screenshots, or inspiration",
        description: "Upload whatever is helpful. File metadata will be included with your submission.",
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
        if (question.type === "checkboxes" || question.type === "upload") {
          return [question.id, []];
        }

        return [question.id, ""];
      }),
    ),
  );
}
