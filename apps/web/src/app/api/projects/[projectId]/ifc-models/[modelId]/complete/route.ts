import { NextResponse } from "next/server";

import { IFC_BUCKET, noStoreHeaders, requireProjectAccess, uuidPattern } from "../../ifc-api";

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> },
) {
  const { projectId, modelId: fileId } = await params;
  if (!uuidPattern.test(projectId) || !uuidPattern.test(fileId)) return errorResponse(400, "Некорректный идентификатор IFC.");
  try {
    const access = await requireProjectAccess(projectId, true);
    if (access.unauthenticated) return errorResponse(401, "Требуется авторизация.");
    if (!access.allowed) return errorResponse(403, "Недостаточно прав для загрузки IFC.");

    const { data: file, error: fileError } = await access.supabase
      .from("project_files")
      .select("id, storage_path, size_bytes, status")
      .eq("id", fileId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle();
    if (fileError || !file) return errorResponse(404, "IFC-файл не найден.");
    if (file.status === "uploaded") {
      const { data: model } = await access.supabase.from("ifc_models").select("id, status").eq("file_id", fileId).maybeSingle();
      if (!model) return errorResponse(409, "Загрузка IFC находится в некорректном состоянии.");
      return NextResponse.json({ data: { id: model.id, status: model.status } }, { headers: noStoreHeaders });
    }
    if (file.status !== "uploading") return errorResponse(409, "Загрузку IFC нельзя подтвердить.");

    const { data: signed, error: signedError } = await access.supabase.storage.from(IFC_BUCKET).createSignedUrl(file.storage_path, 60);
    if (signedError || !signed) return errorResponse(422, "Загруженный IFC-файл не найден в хранилище.");
    const probe = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-255" }, cache: "no-store" });
    const bytes = await probe.arrayBuffer();
    const expectedSize = probe.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
    const header = new TextDecoder().decode(bytes).replace(/^\uFEFF/, "").trimStart();
    if (!probe.ok || expectedSize !== String(file.size_bytes) || !header.startsWith("ISO-10303-21;")) {
      await access.supabase.from("project_files").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", fileId);
      return errorResponse(422, "Файл не прошёл проверку размера или IFC STEP-заголовка.");
    }
    const { error: updateError } = await access.supabase
      .from("project_files")
      .update({ status: "uploaded", updated_at: new Date().toISOString() })
      .eq("id", fileId);
    if (updateError) return errorResponse(500, "Не удалось подтвердить загрузку IFC.");
    const { data: model, error: modelError } = await access.supabase
      .from("ifc_models")
      .insert({ project_id: projectId, file_id: fileId, status: "uploaded" })
      .select("id, status")
      .single();
    if (modelError || !model) return errorResponse(500, "Не удалось создать модель IFC.");
    return NextResponse.json({ data: { id: model.id, status: model.status } }, { status: 201, headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось подтвердить загрузку IFC.");
  }
}
