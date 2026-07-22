"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicConfig } from "@/shared/config/supabase-env";

export function createBrowserSupabaseClient() {
  const { url, publicKey } = requireSupabasePublicConfig();

  return createBrowserClient(url, publicKey);
}
