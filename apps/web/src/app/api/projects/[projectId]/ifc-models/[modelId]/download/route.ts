import { NextResponse } from "next/server";

import { IFC_BUCKET, noStoreHeaders, requireProjectAccess, uuidPattern } from "../../ifc-api";

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> },
) {
  const { projectId, modelId } = await params;
  if (!uuidPattern.test(projectId) || !uuidPattern.test(modelId)) return errorResponse(400, "Некорректный идентификатор IFC.");
  try {
    const access = await requireProjectAccess(projectId);
    if (access.unauthenticated) return errorResponse(401, "Требуется авторизация.");
    if (!access.allowed) return errorResponse(404, "IFC-модель не найдена.");
    const { data: model, error } = await access.supabase
      .from("ifc_models")
      .select("id, project_files!inner(storage_bucket, storage_path, original_name, status, deleted_at)")
      .eq("id", modelId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .is("project_files.deleted_at", null)
      .maybeSingle();
    const file = model && (Array.isArray(model.project_files) ? model.project_files[0] : model.project_files);
    if (error || !file || file.status !== "uploaded") return errorResponse(404, "IFC-модель не найдена.");
    const { data: signed, error: signedError } = await access.supabase.storage.from(IFC_BUCKET).createSignedUrl(file.storage_path, 60);
    if (signedError || !signed) return errorResponse(500, "Не удалось подготовить ссылку просмотра IFC.");
    return NextResponse.json({ data: { downloadUrl: signed.signedUrl, fileName: file.original_name, expiresIn: 60 } }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось подготовить ссылку просмотра IFC.");
  }
}
