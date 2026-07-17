import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { ENV } from "../config/env.config";

const ai = new GoogleGenAI({
  apiKey: ENV.GEMINI_API_KEY,
});

const linkSchema = {
  type: Type.OBJECT,
  required: ["label", "url"],
  properties: {
    label: { type: Type.STRING },
    url: { type: Type.STRING },
  },
};

const responseSchema = {
  type: Type.OBJECT,
  required: [
    "basics",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ],
  properties: {
    basics: {
      type: Type.OBJECT,
      required: ["name", "title", "location", "email", "phone", "links"],
      properties: {
        name: { type: Type.STRING },
        title: { type: Type.STRING },
        location: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        links: { type: Type.ARRAY, items: linkSchema },
      },
    },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["company", "role", "period", "bullets"],
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          location: { type: Type.STRING },
          period: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["degree", "school", "period"],
        properties: {
          degree: { type: Type.STRING },
          school: { type: Type.STRING },
          location: { type: Type.STRING },
          period: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "description"],
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          tech: { type: Type.ARRAY, items: { type: Type.STRING } },
          links: { type: Type.ARRAY, items: linkSchema },
        },
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name"],
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },
    languages: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    interests: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
  },
};

const validator = z.object({
  basics: z.object({
    name: z.string().default(""),
    title: z.string().default(""),
    location: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    links: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
  }),
  summary: z.string().default(""),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        location: z.string().default(""),
        period: z.string().default(""),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().default(""),
        school: z.string().default(""),
        location: z.string().default(""),
        period: z.string().default(""),
        details: z.string().default(""),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),
        tech: z.array(z.string()).default([]),
        links: z
          .array(z.object({ label: z.string(), url: z.string() }))
          .default([]),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default(""),
        year: z.string().default(""),
      }),
    )
    .default([]),
  languages: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
});

function buildPrompt(rawText: string) {
  return [
    "You are a resume parser. The input is text extracted from a PDF - lines may be jumbled or out of natural reading order.",
    "Extract structured data:",
    '- basics: name, proffessional title, location, email, phone, social links (Linkedin / Github / Portfolio etc.; label like "LinkedIn" and the full URL)',
    "- summary: the professional summary paragraph (rejoin if split across lines)",
    "- experience: jobs most recent first, with company, role, period (preserve original date format), location if available and bullet points",
    "- education: degree, school, period, location, optional details",
    "- skills: flat array of technical skills",
    "- projects: name, one-sentence description, optional tech tags, optional links",
    "- certifications: name, issuer, year",
    "- languages: flat array of languages",
    "- interests: flat array of interests",
    "Rules:",
    "- Be conseervative: omit fields that are not clearly present. Use empty strings/arrays where missing",
    "- Do not invent or paragraphs - extract verbatim where possible",
    "- Each experience bullet should read as a complete sentence.",
    "- Preserve original data formats [eg: 'Jan 2022 - Dec 2023']",
    "Resume text:",
    "------------",
    rawText,
    "------------",
  ].join("\n");
}

const EMPTY = {
  basics: {
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    links: [],
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

export async function parseResumeText(rawText: string) {
  if (!ai || !rawText) {
    return EMPTY;
  }

  const prompt = buildPrompt(rawText);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
        },
      });

      const text = result.text?.trim() ?? "";
      if (!text) {
        throw new Error("Empty response from AI model");
      }

      const parsed = JSON.parse(text);
      return validator.parse(parsed);
    } catch (error) {
      if (attempt === 2) {
        console.error("Failed to parse resume text after 2 attempts", error);
        return EMPTY;
      }
    }
  }

  return EMPTY;
}
