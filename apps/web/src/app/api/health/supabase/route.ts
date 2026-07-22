import { NextResponse } from "next/server";

import { checkSupabaseConnection } from "@/features/system/supabase-health";
import { getSupabasePublicConfig } from "@/shared/config/supabase-env";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET() {
  try {
    const config = getSupabasePublicConfig();

    if (!config) {
      return NextResponse.json(
        { data: { service: "supabase", status: "not_configured" } },
        { status: 200, headers: noStoreHeaders },
      );
    }

    const result = await checkSupabaseConnection(config);

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: noStoreHeaders,
      },
    );
  } catch {
    return NextResponse.json(
      { data: { service: "supabase", status: "misconfigured" } },
      { status: 200, headers: noStoreHeaders },
    );
  }
}
