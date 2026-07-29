import { NextResponse } from "next/server";

import { getGeologyJobStatus, N8nGeologyError } from "@/features/geology/n8n-geology";
import { getN8nGeologyConfig } from "@/shared/config/n8n-env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const jobIdPattern = /^[A-Za-z0-9_-]{16,128}$/;

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: noStoreHeaders });
}

async function authorized() {
  try {
    const { auth } = await createServerSupabaseClient();
    const { data, error } = await auth.getClaims();
    return !error && typeof data?.claims?.sub === "string";
  } catch { return false; }
}

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (!(await authorized())) return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация.");
  const { jobId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!jobIdPattern.test(jobId) || !token || token.length < 16 || token.length > 512) return errorResponse(400, "VALIDATION_ERROR", "Некорректная ссылка на задачу.");
  try {
    const job = await getGeologyJobStatus(jobId, token, getN8nGeologyConfig());
    return NextResponse.json({ data: job }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof N8nGeologyError) return errorResponse(502, "GEOLOGY_UNAVAILABLE", "Не удалось получить статус анализа.");
    return errorResponse(502, "GEOLOGY_UNAVAILABLE", "Не удалось получить статус анализа.");
  }
}
