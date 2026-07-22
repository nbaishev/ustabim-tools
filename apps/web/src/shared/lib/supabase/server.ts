import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicConfig } from "@/shared/config/supabase-env";

export async function createServerSupabaseClient() {
  const { url, publicKey } = requireSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. src/proxy.ts handles
          // refresh writes before protected routes are rendered.
        }
      },
    },
  });
}
