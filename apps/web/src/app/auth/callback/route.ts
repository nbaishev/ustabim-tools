import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function recoveryErrorRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/forgot-password";
  url.search = "";
  url.searchParams.set("error", "invalid-link");
  return NextResponse.redirect(url);
}

function signupErrorRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/register";
  url.search = "";
  url.searchParams.set("error", "invalid-link");
  return NextResponse.redirect(url);
}

function oauthErrorRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("error", "oauth");
  return NextResponse.redirect(url);
}

function isSafeAppPath(path: string | null): path is string {
  return Boolean(
    path &&
      (path === "/app" || (path.startsWith("/app/") && !path.startsWith("//"))),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const flow = request.nextUrl.searchParams.get("flow");

  const isOAuth = flow === "oauth" && isSafeAppPath(next);
  const isRecovery = flow === null && next === "/reset-password";
  const isSignup = flow === null && next === "/app";
  const errorRedirect = isOAuth
    ? oauthErrorRedirect
    : isSignup
      ? signupErrorRedirect
      : recoveryErrorRedirect;

  if (!code || (!isOAuth && !isRecovery && !isSignup)) return errorRedirect(request);

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) return errorRedirect(request);

    const url = request.nextUrl.clone();
    url.pathname = isOAuth ? next : isSignup ? "/app" : "/reset-password";
    url.search = "";
    if (isSignup) url.searchParams.set("reason", "email-confirmed");
    return NextResponse.redirect(url);
  } catch {
    return errorRedirect(request);
  }
}
