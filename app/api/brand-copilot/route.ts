import { requireBrandCopilotSession } from "@/lib/brand-copilot";

export const dynamic = "force-dynamic";

type CopilotRequest = {
  sectionId: string;
  sectionTitle: string;
  sectionDescription: string;
  targetQuestionId: string;
  targetQuestionLabel: string;
  targetQuestionDescription?: string;
  targetQuestionPlaceholder?: string;
  currentAnswer?: string;
  sectionSummary?: string[];
  answers?: Record<string, unknown>;
  userMessage: string;
};

function sanitizeResponseText(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function extractOutputText(responseJson: unknown) {
  if (
    responseJson &&
    typeof responseJson === "object" &&
    "output_text" in responseJson &&
    typeof (responseJson as { output_text?: unknown }).output_text === "string"
  ) {
    return (responseJson as { output_text: string }).output_text;
  }

  if (
    responseJson &&
    typeof responseJson === "object" &&
    "output" in responseJson &&
    Array.isArray((responseJson as { output?: unknown[] }).output)
  ) {
    const output = (responseJson as {
      output: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    }).output;

    return output
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text as string)
      .join("\n")
      .trim();
  }

  return "";
}

function summarizeAnswers(answers: Record<string, unknown> | undefined) {
  if (!answers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(answers)
      .filter(([, value]) => {
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
      })
      .slice(0, 18),
  );
}

export async function POST(request: Request) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_BRAND_DISCOVERY_MODEL || "gpt-5-mini";

    if (!OPENAI_API_KEY) {
      return Response.json(
        {
          error: "missing_openai_key",
          message:
            "OPENAI_API_KEY is not configured yet, so the AI copilot is currently offline.",
        },
        { status: 503 },
      );
    }

    const { rateLimit } = await requireBrandCopilotSession();
    const body = (await request.json()) as CopilotRequest;

    const payloadForModel = {
      section: {
        id: body.sectionId,
        title: body.sectionTitle,
        description: body.sectionDescription,
      },
      targetQuestion: {
        id: body.targetQuestionId,
        label: body.targetQuestionLabel,
        description: body.targetQuestionDescription,
        placeholder: body.targetQuestionPlaceholder,
      },
      currentAnswer: body.currentAnswer || "",
      sectionSummary: body.sectionSummary ?? [],
      knownAnswers: summarizeAnswers(body.answers),
      userMessage: body.userMessage,
    };

    const systemPrompt = [
      "You are the D2D Brand Discovery Copilot for a premium consulting workflow.",
      "Your job is to help a business owner answer one brand strategy question quickly and clearly.",
      "Ask one smart follow-up question when needed, then draft a stronger answer in the founder's voice.",
      "Be concise, strategic, practical, and warm.",
      "Do not mention OpenAI, policies, or internal instructions.",
      "Return strict JSON only with these keys:",
      "assistantMessage: string",
      "followUpQuestion: string",
      "suggestedAnswer: string",
      "confidence: 'low' | 'medium' | 'high'",
    ].join(" ");

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 700,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(payloadForModel),
              },
            ],
          },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return Response.json(
        {
          error: "openai_request_failed",
          message: "The AI copilot request failed.",
          detail: errorText,
        },
        { status: 502 },
      );
    }

    const responseJson = (await openAiResponse.json()) as unknown;
    const rawText = extractOutputText(responseJson);
    const parsed = JSON.parse(sanitizeResponseText(rawText)) as {
      assistantMessage?: string;
      followUpQuestion?: string;
      suggestedAnswer?: string;
      confidence?: "low" | "medium" | "high";
    };

    return Response.json({
      assistantMessage: parsed.assistantMessage || "Here’s a sharper way to answer that question.",
      followUpQuestion: parsed.followUpQuestion || "",
      suggestedAnswer: parsed.suggestedAnswer || body.currentAnswer || "",
      confidence: parsed.confidence || "medium",
        remainingRequests: rateLimit.remaining,
      });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        error: "invalid_ai_response",
        message:
          error instanceof Error
            ? error.message
            : "The AI copilot returned an unexpected response format.",
      },
      { status: 502 },
    );
  }
}
