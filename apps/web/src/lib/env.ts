import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  INTERNAL_APP_PASSWORD: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_DEFAULT_CHANNEL: z.string().optional(),
  WORKER_API_URL: z.string().url().default("http://localhost:8000"),
  WORKER_API_TOKEN: z.string().default("dev-worker-token")
});

export function getEnv() {
  return envSchema.parse(process.env);
}
