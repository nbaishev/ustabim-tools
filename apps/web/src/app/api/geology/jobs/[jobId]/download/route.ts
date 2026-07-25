import { NextResponse } from "next/server";

import { downloadGeologyReport, N8nGeologyError } from "@/features/geology/n8n-geology";
import { getN8nGeologyConfig } from "@/shared/config/n8n-env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const jobIdPattern = /^[A-Za-z0-9_-]{16,128}$/;

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: noStoreHeaders });
}

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { auth } = await createServerSupabaseClient();
    const { data, error } = await auth.getClaims();
    if (error || typeof data?.claims?.sub !== "string") return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация.");
  } catch { return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация."); }
  const { jobId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!jobIdPattern.test(jobId) || !token || token.length < 16 || token.length > 512) return errorResponse(400, "VALIDATION_ERROR", "Некорректная ссылка на задачу.");
  try {
    const upstream = await downloadGeologyReport(jobId, token, getN8nGeologyConfig());
    return new NextResponse(upstream.body, { headers: { ...noStoreHeaders, "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="geology-report.pdf"', "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof N8nGeologyError) return errorResponse(502, "GEOLOGY_UNAVAILABLE", "Не удалось скачать готовый отчёт.");
    return errorResponse(502, "GEOLOGY_UNAVAILABLE", "Не удалось скачать готовый отчёт.");
  }
}
