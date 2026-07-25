import { NextResponse } from "next/server";

import { MAX_GEOLOGY_PDF_BYTES, validateGeologyPdf } from "@/features/geology/geology-file-validation";
import { createGeologyJob, N8nGeologyError } from "@/features/geology/n8n-geology";
import { getN8nGeologyConfig } from "@/shared/config/n8n-env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: noStoreHeaders });
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    return !error && typeof data?.claims?.sub === "string";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация.");

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_GEOLOGY_PDF_BYTES + 1024 * 1024) {
    return errorResponse(413, "FILE_TOO_LARGE", "Размер PDF-файла не должен превышать 100 МБ.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse(400, "VALIDATION_ERROR", "Передайте PDF-файл в форме.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Не удалось прочитать PDF-файл.");
  }
  const files = formData.getAll("file");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return errorResponse(400, "VALIDATION_ERROR", "Выберите один PDF-файл.");
  }
  const validationError = validateGeologyPdf(files[0]);
  if (validationError) return errorResponse(400, "VALIDATION_ERROR", validationError);

  try {
    const job = await createGeologyJob(files[0], getN8nGeologyConfig());
    return NextResponse.json({ data: job }, { status: 202, headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof N8nGeologyError && error.code === "QUOTA_EXHAUSTED") {
      return errorResponse(429, "QUOTA_EXHAUSTED", "Демонстрационный лимит обработки PDF исчерпан.");
    }
    return errorResponse(502, "GEOLOGY_UNAVAILABLE", "Не удалось запустить анализ. Попробуйте ещё раз.");
  }
}
