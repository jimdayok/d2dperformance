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

export const executiveCoachingDiscoverySections: DiscoverySection[] = [
  {
    id: "contact",
    title: "Quick Intro",
    description: "A few basics so we know who this coaching conversation is for.",
    estimatedMinutes: 2,
    questions: [
      textQuestion("name", "Your name", "Jane Founder"),
      textQuestion("company", "Company", "Northline Manufacturing"),
      textQuestion("role", "Role", "Founder, President, CEO"),
      textQuestion("email", "Email", "jane@company.com", { inputType: "email" }),
      textQuestion("phone", "Phone", "(555) 555-5555", {
        inputType: "tel",
        required: false,
      }),
    ],
  },
  {
    id: "business-snapshot",
    title: "Business Snapshot",
    description: "These are cleaned-up versions of your core discovery questions, adapted for coaching.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "businessSummary",
        "What does your business do?",
        "Give us the plain-English version of what the company does and who it serves.",
      ),
      paragraphQuestion(
        "businessProblem",
        "What problem does your business solve for customers?",
        "Tell us what customers are trying to fix, avoid, or achieve when they come to you.",
      ),
      {
        id: "businessStage",
        label: "Which stage feels closest right now?",
        description: "Pick the one that best matches your current reality.",
        type: "multiple-choice",
        required: true,
        options: [
          {
            value: "founder-carrying-too-much",
            label: "Founder carrying too much",
            description: "The company is moving, but too much still depends on you.",
          },
          {
            value: "growing-and-stretching",
            label: "Growing and stretching",
            description: "Demand is there, but the operating rhythm is under strain.",
          },
          {
            value: "team-needs-alignment",
            label: "Team needs alignment",
            description: "The leadership team exists, but ownership and follow-through are uneven.",
          },
          {
            value: "transition-or-succession",
            label: "Transition or succession",
            description: "The business is navigating a leadership shift, handoff, or next chapter.",
          },
        ],
      },
    ],
  },
  {
    id: "leadership-reality",
    title: "Leadership Reality",
    description: "Help us understand the pressure points behind the coaching request.",
    estimatedMinutes: 3,
    questions: [
      {
        id: "pressurePoints",
        label: "Where do you feel the most pressure right now?",
        description: "Choose every area that is creating friction.",
        type: "checkboxes",
        required: true,
        options: [
          {
            value: "decision-fatigue",
            label: "Decision fatigue",
            description: "Too many decisions still route through you.",
          },
          {
            value: "team-accountability",
            label: "Team accountability",
            description: "Commitments are not turning into consistent follow-through.",
          },
          {
            value: "leadership-alignment",
            label: "Leadership alignment",
            description: "Key leaders are not operating from the same priorities or expectations.",
          },
          {
            value: "meeting-effectiveness",
            label: "Meeting effectiveness",
            description: "Meetings happen, but they do not reliably move work forward.",
          },
          {
            value: "growth-complexity",
            label: "Growth complexity",
            description: "The business has outgrown the old way of operating.",
          },
          {
            value: "role-clarity",
            label: "Role clarity",
            description: "People need clearer decision rights, ownership, or boundaries.",
          },
        ],
      },
      paragraphQuestion(
        "leadershipStrengths",
        "What are your biggest strengths as a leader or business right now?",
        "What is working well that coaching should protect and build on?",
      ),
      paragraphQuestion(
        "improvementAreas",
        "Where do you see the biggest room for improvement?",
        "Be candid about the habits, patterns, or systems that are slowing the business down.",
      ),
    ],
  },
  {
    id: "team-and-cadence",
    title: "Team and Cadence",
    description: "This section focuses on how the business is being led day to day.",
    estimatedMinutes: 2,
    questions: [
      paragraphQuestion(
        "teamValue",
        "What do your best people value most about working with you or your company?",
        "Think trust, speed, clarity, opportunity, support, standards, or culture.",
      ),
      {
        id: "accountabilityState",
        label: "How would you describe accountability on the team today?",
        description: "Choose the statement that feels most accurate.",
        type: "multiple-choice",
        required: true,
        options: [
          {
            value: "strong-and-consistent",
            label: "Strong and consistent",
            description: "People generally own outcomes and close loops well.",
          },
          {
            value: "good-but-dependent",
            label: "Good, but dependent on me",
            description: "The team follows through best when you stay very involved.",
          },
          {
            value: "uneven-across-team",
            label: "Uneven across the team",
            description: "Some leaders are strong, others create drag or ambiguity.",
          },
          {
            value: "needs-a-reset",
            label: "Needs a reset",
            description: "Ownership, expectations, and consequences need to be rebuilt.",
          },
        ],
      },
      paragraphQuestion(
        "meetingCadence",
        "What leadership meetings or rhythms exist today?",
        "Weekly leadership meeting, one-on-ones, scorecards, quarterly planning, or whatever is currently in place.",
      ),
    ],
  },
  {
    id: "goals-and-vision",
    title: "Goals and Vision",
    description: "These questions help us understand what success should look like.",
    estimatedMinutes: 3,
    questions: [
      paragraphQuestion(
        "nextYearSuccess",
        "What would success look like one year from now?",
        "Describe the business and leadership outcomes you would want to be true.",
      ),
      paragraphQuestion(
        "newOpportunities",
        "What new opportunities do you want to explore?",
        "Growth, expansion, succession, restructuring, new leaders, stronger systems, or a healthier pace.",
      ),
      paragraphQuestion(
        "externalThreats",
        "What external challenges or threats could affect your success?",
        "Market pressure, margin pressure, hiring, turnover, competition, capacity, or change fatigue.",
      ),
    ],
  },
  {
    id: "engagement-goals",
    title: "Coaching Fit",
    description: "A final pass so we know what kind of support would be most valuable.",
    estimatedMinutes: 2,
    questions: [
      paragraphQuestion(
        "whyNow",
        "Why are you exploring executive coaching now?",
        "What changed, stalled, or became important enough to address right now?",
      ),
      {
        id: "coachingOutcomes",
        label: "What would you most want coaching to improve?",
        description: "Choose the outcomes that matter most.",
        type: "checkboxes",
        required: true,
        options: [
          {
            value: "clearer-priorities",
            label: "Clearer priorities",
            description: "Less noise, better focus, and cleaner decisions.",
          },
          {
            value: "stronger-leadership-team",
            label: "Stronger leadership team",
            description: "Better ownership, sharper expectations, and healthier tension.",
          },
          {
            value: "better-meetings",
            label: "Better meetings and cadence",
            description: "A rhythm that drives action instead of draining time.",
          },
          {
            value: "less-founder-dependence",
            label: "Less founder dependence",
            description: "The business can move without everything bottlenecking through you.",
          },
          {
            value: "more-confidence",
            label: "More confidence in decisions",
            description: "You want clearer thinking in the middle of complexity.",
          },
          {
            value: "healthy-growth-structure",
            label: "Healthier growth structure",
            description: "Systems and leadership habits that can support the next phase.",
          },
        ],
      },
      paragraphQuestion(
        "finalNotes",
        "Anything else we should know before we talk?",
        "Share context, concerns, history, or what would make this feel especially helpful.",
        { required: false },
      ),
    ],
  },
];

export function createInitialExecutiveCoachingAnswers(): DiscoveryFormValues {
  return Object.fromEntries(
    executiveCoachingDiscoverySections.flatMap((section) =>
      section.questions.map((question) => {
        if (question.type === "checkboxes" || question.type === "upload") {
          return [question.id, []];
        }

        return [question.id, ""];
      }),
    ),
  );
}
