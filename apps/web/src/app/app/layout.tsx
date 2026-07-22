import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSupabasePublicConfig } from "@/shared/config/supabase-env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    if (!getSupabasePublicConfig()) {
      redirect("/login?next=/app&reason=not-configured");
    }
  } catch {
    redirect("/login?next=/app&reason=not-configured");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    redirect("/login?next=/app&reason=auth-required");
  }

  const email = claims.email;
  const userEmail = typeof email === "string" ? email : null;

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}
