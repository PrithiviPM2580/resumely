import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  COOKIE_NAME: z.string().default("arr_token"),
  CLIENT_ORIGIN: z.url().default("http://localhost:5173"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
});

const checkEnv = (env: Record<string, string | undefined>) => {
  const parsedEnv = envSchema.safeParse(env);
  if (!parsedEnv.success) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(parsedEnv.error.issues, null, 2)}`,
    );
  }
  return parsedEnv.data;
};

export const ENV = checkEnv(process.env);
