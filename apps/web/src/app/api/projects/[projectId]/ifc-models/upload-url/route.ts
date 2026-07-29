import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  IFC_BUCKET,
  MAX_IFC_FILE_SIZE,
  isIfcName,
  noStoreHeaders,
  requireProjectAccess,
  storagePath,
  uuidPattern,
} from "../ifc-api";

export const dynamic = "force-dynamic";

type Payload = { fileName?: unknown; contentType?: unknown; sizeBytes?: unknown };

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!uuidPattern.test(projectId)) return errorResponse(400, "Некорректный идентификатор проекта.");

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return errorResponse(400, "Проверьте параметры IFC-файла.");
  }
  if (!payload || typeof payload !== "object" || !Object.keys(payload).every((key) => ["fileName", "contentType", "sizeBytes"].includes(key)) || !["fileName", "contentType", "sizeBytes"].every((key) => key in payload)) {
    return errorResponse(400, "Проверьте параметры IFC-файла.");
  }
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const contentType = typeof payload.contentType === "string" ? payload.contentType : "";
  const sizeBytes = payload.sizeBytes;
  if (!fileName || fileName.length > 255 || !isIfcName(fileName) || typeof sizeBytes !== "number" || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_IFC_FILE_SIZE || !["application/octet-stream", "application/x-step"].includes(contentType)) {
    return errorResponse(400, "Выберите непустой IFC-файл размером до 250 МБ.");
  }
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKey || idempotencyKey.length > 200) {
    return errorResponse(400, "Для загрузки требуется корректный ключ идемпотентности.");
  }

  try {
    const access = await requireProjectAccess(projectId, true);
    if (access.unauthenticated) return errorResponse(401, "Требуется авторизация.");
    if (!access.allowed || !access.userId) return errorResponse(403, "Недостаточно прав для загрузки IFC.");

    const { data: existing, error: existingError } = await access.supabase
      .from("project_files")
      .select("id, storage_path, status")
      .eq("project_id", projectId)
      .eq("uploaded_by", access.userId)
      .eq("upload_idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existingError) return errorResponse(500, "Не удалось подготовить загрузку IFC.");
    if (existing?.status === "uploaded") return errorResponse(409, "Эта загрузка уже завершена.");

    const fileId = existing?.id ?? randomUUID();
    const path = existing?.storage_path ?? storagePath(projectId, fileId);
    if (!existing) {
      const { error } = await access.supabase.from("project_files").insert({
        id: fileId,
        project_id: projectId,
        uploaded_by: access.userId,
        storage_bucket: IFC_BUCKET,
        storage_path: path,
        original_name: fileName,
        mime_type: contentType,
        size_bytes: sizeBytes,
        upload_idempotency_key: idempotencyKey,
        status: "uploading",
      });
      if (error) return errorResponse(500, "Не удалось подготовить загрузку IFC.");
    }
    const { data, error } = await access.supabase.storage.from(IFC_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data) return errorResponse(500, "Не удалось подготовить защищённую ссылку загрузки.");
    return NextResponse.json({ data: { fileId, uploadUrl: data.signedUrl, expiresAt: null, requiredHeaders: {} } }, { status: 201, headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось подготовить загрузку IFC.");
  }
}
