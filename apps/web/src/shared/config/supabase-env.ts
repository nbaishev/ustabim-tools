import { z } from "zod";

const supabasePublicConfigSchema = z.object({
  url: z.url("NEXT_PUBLIC_SUPABASE_URL должен быть корректным URL"),
  publicKey: z
    .string()
    .trim()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY должен содержать публичный ключ проекта"),
});

export type SupabasePublicConfig = z.infer<typeof supabasePublicConfigSchema>;

type SupabasePublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export function parseSupabasePublicEnv(
  environment: SupabasePublicEnv,
): SupabasePublicConfig | null {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url && !publicKey) return null;

  return supabasePublicConfigSchema.parse({ url, publicKey });
}

export function getSupabasePublicConfig() {
  return parseSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase не настроен. Заполните NEXT_PUBLIC_SUPABASE_URL и " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY в apps/web/.env.local.",
    );
  }

  return config;
}
