import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function recoveryErrorRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/forgot-password";
  url.search = "";
  url.searchParams.set("error", "invalid-link");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");

  if (!code || next !== "/reset-password") {
    return recoveryErrorRedirect(request);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) return recoveryErrorRedirect(request);

    const url = request.nextUrl.clone();
    url.pathname = "/reset-password";
    url.search = "";
    return NextResponse.redirect(url);
  } catch {
    return recoveryErrorRedirect(request);
  }
}
