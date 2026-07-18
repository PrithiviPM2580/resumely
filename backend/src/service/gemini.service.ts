import { ApiError, GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { ENV } from "../config/env.config";
import { APIError } from "../utils/api-error";

const ai = new GoogleGenAI({
  apiKey: ENV.GEMINI_API_KEY,
});

const responseSchema = {
  type: Type.OBJECT,
  required: [
    "atsScore",
    "scoreBreakdown",
    "issues",
    "strengths",
    "bulletRewrites",
    "keywordsPresent",
    "keywordsMissing",
    "summary",
  ],
  properties: {
    atsScore: {
      type: Type.NUMBER,
      description: "The ATS score of the resume, ranging from 0 to 100.",
    },
    scoreBreakdown: {
      type: Type.OBJECT,
      description: "A breakdown of the ATS score into different categories.",
      required: ["keywords", "formatting", "impact", "clarity"],
      properties: {
        keywords: {
          type: Type.NUMBER,
          description:
            "The score for keywords in the resume, ranging from 0 to 25.",
        },
        formatting: {
          type: Type.NUMBER,
          description:
            "The score for formatting in the resume, ranging from 0 to 25.",
        },
        impact: {
          type: Type.NUMBER,
          description:
            "The score for impact in the resume, ranging from 0 to 25.",
        },
        clarity: {
          type: Type.NUMBER,
          description:
            "The score for clarity in the resume, ranging from 0 to 25.",
        },
      },
    },
    issues: {
      type: Type.ARRAY,
      description:
        "A list of issues found in the resume exactly 5 pritorized issues.",
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        required: ["title", "severity", "explanation", "fix"],
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the issue found in the resume.",
          },
          severity: {
            type: Type.STRING,
            enum: ["low", "medium", "high"],
            description: "The severity of the issue found in the resume.",
          },
          explanation: {
            type: Type.STRING,
            description:
              "A detailed explanation of the issue found in the resume.",
          },
          fix: {
            type: Type.STRING,
            description: "A suggested fix for the issue found in the resume.",
          },
        },
      },
    },
    strengths: {
      type: Type.ARRAY,
      description:
        "A list of strengths found in the resume exactly 5 pritorized strengths.",
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        required: ["title", "evidence"],
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the strength found in the resume.",
          },
          evidence: {
            type: Type.STRING,
            description:
              "Evidence supporting the strength found in the resume.",
          },
        },
      },
    },
    bulletRewrites: {
      type: Type.ARRAY,
      description:
        "A list of bullet point rewrites for the resume exactly 5-10 pritorized bullet points.",
      items: {
        type: Type.OBJECT,
        required: ["section", "original", "rewritten", "rationale"],
        properties: {
          section: {
            type: Type.STRING,
            description:
              "The section of the resume where the bullet point is located.",
          },
          original: {
            type: Type.STRING,
            description: "The original bullet point from the resume.",
          },
          rewritten: {
            type: Type.STRING,
            description: "The rewritten bullet point for the resume.",
          },
          rationale: {
            type: Type.STRING,
            description: "The rationale for the rewritten bullet point.",
          },
        },
      },
    },
    keywordsPresent: {
      type: Type.ARRAY,
      description:
        "A list of keywords present in the resume that match the job description.",
      items: {
        type: Type.STRING,
      },
    },
    keywordsMissing: {
      type: Type.ARRAY,
      description:
        "A list of keywords missing from the resume that are present in the job description.",
      items: {
        type: Type.STRING,
      },
    },
    summary: {
      type: Type.STRING,
      description:
        "A summary of the overall assessment of the resume, including key findings and recommendations.",
    },
  },
};

export const analysisValidator = z.object({
  atsScore: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    keywords: z.number().min(0).max(25),
    formatting: z.number().min(0).max(25),
    impact: z.number().min(0).max(25),
    clarity: z.number().min(0).max(25),
  }),
  issues: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        explanation: z.string(),
        fix: z.string(),
      }),
    )
    .min(1)
    .max(5),
  strengths: z
    .array(
      z.object({
        title: z.string(),
        evidence: z.string(),
      }),
    )
    .min(1)
    .max(5),
  bulletRewrites: z
    .array(
      z.object({
        section: z.string(),
        original: z.string(),
        rewritten: z.string(),
        rationale: z.string(),
      }),
    )
    .default([]),
  keywordsPresent: z.array(z.string()).default([]),
  keywordsMissing: z.array(z.string()).default([]),
  summary: z.string(),
});

const buildPrompt = ({
  rawText,
  targetRole,
}: {
  rawText: string;
  targetRole: string;
}) => {
  return [
    "You are a senior technical recuriter and ATS expert reviewing a resume.",
    targetRole
      ? `The target role:${targetRole}.`
      : "No specific target role was provided - assess for the role candidate appears to be aiming for.",
    "- Score the resume from 0-100 based on the ATS readiness (keywords match, parsable formatting, quntified impact, clearity.)",
    "- Return exactly 5 prioritized issues, 5 prioritized strengths, and 5-10 weak bullets rewritten to be stronger, quantified, and ATS friendly.",
    "- Rewrites must preserve the original meaning. Each rewrite needs a one-line rationale.",
    "- Identify keywords clearly present and notable keywords missing for the approach traget role.",
    "- Be specific and evidence-based - cite prashing from the resume in explanations.",
    "Resume Text:",
    "------------",
    rawText,
    "------------",
  ].join("\n");
};

const callGemini = async (prompt: string) => {
  const result = await ai.models.generateContent({
    model: ENV.GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
    },
  });

  const text = result.text;
  if (!text) throw new Error("No text returned from Gemini API");
  return {
    text,
    usage: result.usageMetadata || {},
  };
};

export const analyzeResumeOutput = async ({
  rawText,
  targetRole,
}: {
  rawText: string;
  targetRole: string;
}) => {
  if (!ai)
    throw new Error("Gemini API not initialized. Please check your API key.");

  const prompt = buildPrompt({ rawText, targetRole });

  let lastError: unknown;
  for (let attempt = 1; attempt < 3; attempt++) {
    try {
      const { text, usage } = await callGemini(prompt);
      const parsed = JSON.parse(text);
      const validated = analysisValidator.parse(parsed);
      return {
        analysis: validated,
        model: ENV.GEMINI_MODEL,
        promptTokens: usage.promptTokenCount,
        responseTokens: usage.candidatesTokenCount,
      };
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
    }
  }
  throw new Error(`Failed to analyze resume after 2 attempts: ${lastError}`);
};
