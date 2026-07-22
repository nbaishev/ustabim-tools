import type { SupabasePublicConfig } from "@/shared/config/supabase-env";

export type SupabaseConnectionStatus = "connected" | "unavailable";

export type SupabaseConnectionResult = {
  service: "supabase";
  status: SupabaseConnectionStatus;
};

export async function checkSupabaseConnection(
  config: SupabasePublicConfig,
  fetcher: typeof fetch = fetch,
): Promise<SupabaseConnectionResult> {
  try {
    const response = await fetcher(`${config.url}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: config.publicKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    return {
      service: "supabase",
      status: response.ok ? "connected" : "unavailable",
    };
  } catch {
    return {
      service: "supabase",
      status: "unavailable",
    };
  }
}
