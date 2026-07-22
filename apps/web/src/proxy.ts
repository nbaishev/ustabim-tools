import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/shared/config/supabase-env";

function accessRedirect(
  request: NextRequest,
  reason: "auth-required" | "not-configured",
  cookieResponse?: NextResponse,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  if (request.nextUrl.pathname === "/reset-password") {
    redirectUrl.pathname = "/forgot-password";
    redirectUrl.searchParams.set("error", "invalid-link");
  } else {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    redirectUrl.searchParams.set("reason", reason);
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);

  cookieResponse?.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let config;

  try {
    config = getSupabasePublicConfig();
  } catch {
    return accessRedirect(request, "not-configured");
  }

  if (!config) return accessRedirect(request, "not-configured");

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims?.sub !== "string") {
    return accessRedirect(request, "auth-required", response);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/reset-password"],
};
