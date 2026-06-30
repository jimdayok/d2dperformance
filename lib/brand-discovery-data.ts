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
    rows: 4,
    placeholder,
    required: true,
    ...options,
  };
}

export const brandDiscoverySections: DiscoverySection[] = [
  {
    id: "contact",
    title: "Contact Details",
    description: "So we know who this discovery belongs to and how to follow up.",
    estimatedMinutes: 2,
    questions: [
      textQuestion("name", "Name", "Jane Founder"),
      textQuestion("company", "Company", "Northline Custom Homes"),
      textQuestion("role", "Role", "Founder, Owner, President"),
      textQuestion("email", "Email", "jane@company.com", { inputType: "email" }),
      textQuestion("phone", "Phone", "(555) 555-5555", {
        inputType: "tel",
        required: false,
      }),
    ],
  },
  {
    id: "about-the-business",
    title: "About the Business",
    description: "Start with the business itself.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "business_do",
        "What does your business do?",
        "Describe the business in plain language.",
      ),
      paragraphQuestion(
        "start_when_why",
        "When and why did you start it?",
        "Tell the story of when it started and what made you begin.",
      ),
      paragraphQuestion(
        "products_services",
        "What products and/or services do you offer?",
        "List your products, services, or both.",
      ),
      paragraphQuestion(
        "specialty_focus",
        "What do you consider your specialty or main focus?",
        "What are you especially known for or most focused on?",
      ),
    ],
  },
  {
    id: "target-market",
    title: "Target Market",
    description: "Clarify who you serve and what they value.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "ideal_customer",
        "Who is your ideal customer?",
        "Describe the kind of customer you most want to attract.",
      ),
      textQuestion(
        "customer_location",
        "Where are your customers located? (local, regional, national?)",
        "Local, regional, national, or a mix",
      ),
      paragraphQuestion(
        "problem_solve",
        "What problem does your business solve for them?",
        "What are they trying to fix, avoid, or achieve?",
      ),
      paragraphQuestion(
        "best_customers_value",
        "What do your best customers value most about your business?",
        "Think quality, trust, speed, service, communication, reliability, or something else.",
      ),
    ],
  },
  {
    id: "competition",
    title: "Competition",
    description: "How the market looks from your perspective.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "top_competitors",
        "Who are your top competitors?",
        "List the businesses you compete with most directly.",
      ),
      paragraphQuestion(
        "competitors_do_well",
        "What do they do well?",
        "What are they genuinely strong at?",
      ),
      paragraphQuestion(
        "sets_apart",
        "What sets your business apart from them?",
        "What is meaningfully different about the way you work or what you offer?",
      ),
      paragraphQuestion(
        "customer_choose_you",
        "What would make a customer choose you instead?",
        "What is the deciding factor in your favor?",
      ),
    ],
  },
  {
    id: "brand-messaging",
    title: "Brand and Messaging",
    description: "How the business should be described and perceived.",
    estimatedMinutes: 4,
    questions: [
      textQuestion(
        "one_sentence_description",
        "How would you describe your business in one sentence?",
        "One clean sentence",
      ),
      textQuestion(
        "three_brand_words",
        "What three words should people associate with your brand?",
        "Word one, word two, word three",
      ),
      textQuestion(
        "tone_personality",
        "What tone or personality do you want your business to have? (e.g., bold, helpful, trusted, friendly?)",
        "Examples: bold, helpful, trusted, friendly",
      ),
      paragraphQuestion(
        "brands_admire",
        "Are there any brands or logos you admire (in or out of your industry)?",
        "List any brands, logos, or styles you admire.",
      ),
    ],
  },
  {
    id: "sales-marketing",
    title: "Sales and Marketing",
    description: "How people currently find you and what is already in motion.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "customers_find_out",
        "How do customers usually find out about you now?",
        "Word of mouth, search, referrals, social, signage, events, or something else.",
      ),
      paragraphQuestion(
        "platforms_tools",
        "What platforms or tools are you currently using (website, social, word-of-mouth, etc.)?",
        "List the platforms, tools, and channels you currently use.",
      ),
      paragraphQuestion(
        "advertising_marketing_worked",
        "Have you done any advertising or marketing? If so, what's worked best?",
        "Tell us what you have tried and what seems to be working best.",
      ),
    ],
  },
  {
    id: "swot",
    title: "Strengths, Improvement, Opportunities, Threats",
    description: "A practical look at the business today.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "biggest_strengths",
        "What are your biggest strengths as a business?",
        "What are you strongest at right now?",
      ),
      paragraphQuestion(
        "room_for_improvement",
        "Where do you see room for improvement?",
        "Be candid about where the business could be stronger.",
      ),
      paragraphQuestion(
        "new_opportunities",
        "What new opportunities do you want to explore?",
        "Markets, services, products, audiences, or partnerships.",
      ),
      paragraphQuestion(
        "external_challenges",
        "What external challenges or threats could affect your success?",
        "Competition, market pressure, hiring, pricing, visibility, or something else.",
      ),
    ],
  },
  {
    id: "mission-values-story",
    title: "Mission, Values, and Story",
    description: "Why the business exists and what guides it.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "why_start_business",
        "Why did you start your business?",
        "What made this business worth starting?",
      ),
      paragraphQuestion(
        "people_know_way_business",
        "What do you want people to know about the way you do business?",
        "What matters about how you operate?",
      ),
      paragraphQuestion(
        "values_principles",
        "What values or principles guide your company? (e.g., honesty, speed, quality, affordability)",
        "List the values or principles that guide how you work.",
      ),
      paragraphQuestion(
        "personal_story",
        "Is there a personal story behind how this business got started?",
        "Share any personal background or story behind the start.",
      ),
    ],
  },
  {
    id: "brand-personality",
    title: "Brand Personality",
    description: "How the brand should feel to other people.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "brand_person_personality",
        "If your brand were a person, how would you describe them? (e.g., friendly, tough, precise, helpful)",
        "Describe the personality in plain language.",
      ),
      paragraphQuestion(
        "customer_feeling",
        "What kind of feeling should customers get when they see your brand?",
        "How should they feel when they experience your brand?",
      ),
      paragraphQuestion(
        "logo_messaging_tone",
        "What tone or style do you want for your logo and messaging? (e.g., rugged, modern, vintage, bold)",
        "Describe the style you want the logo and messaging to have.",
      ),
      {
        id: "professional_vs_approachable",
        label: "Do you want the brand to feel more professional, approachable, or somewhere in between?",
        type: "multiple-choice",
        required: true,
        options: [
          { value: "professional", label: "Professional" },
          { value: "approachable", label: "Approachable" },
          { value: "somewhere-in-between", label: "Somewhere in between" },
        ],
      },
      textQuestion(
        "colors_like_best",
        "What colors do you like best?",
        "List colors, tones, or combinations you like.",
      ),
    ],
  },
  {
    id: "current-presence",
    title: "Current Presence",
    description: "What people see when they look you up right now.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "marketing_done_so_far",
        "What marketing (besides Facebook, GoDaddy, Google Business) have you done so far?",
        "Tell us what else you have done so far.",
      ),
      paragraphQuestion(
        "how_finding_and_seeing",
        "How are people currently finding or hearing about your business—and what do they see when they do?",
        "Describe both how they find you and what they see.",
      ),
      textQuestion(
        "have_images_examples",
        "Do you have any product images, shop photos, or examples of past work with description of job?",
        "Yes, no, or a short explanation",
      ),
      paragraphQuestion(
        "new_customer_look_up",
        "If a new customer looked you up today, what would they see?",
        "Describe the current public impression.",
      ),
    ],
  },
  {
    id: "future-vision",
    title: "Future Vision and Goals",
    description: "What the next year is meant to look like.",
    estimatedMinutes: 4,
    questions: [
      paragraphQuestion(
        "main_goals_6_12_months",
        "What are your main business goals in the next 6-12 months?",
        "What are the biggest goals for the next year?",
      ),
      paragraphQuestion(
        "expand_offerings_space_reach",
        "Do you plan to expand your offerings, space, or reach (within your tool business)?",
        "Tell us what expansion you are considering.",
      ),
      paragraphQuestion(
        "services_push_first",
        "Are there any specific products or services you want to push first?",
        "What would you want to lead with first?",
      ),
      paragraphQuestion(
        "success_one_year",
        "What would success look like one year from now?",
        "Describe what success would look like in a year.",
      ),
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
