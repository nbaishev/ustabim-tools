import { NextResponse } from "next/server";

import { noStoreHeaders, requireProjectAccess, uuidPattern } from "../ifc-api";

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> },
) {
  const { projectId, modelId } = await params;
  if (!uuidPattern.test(projectId) || !uuidPattern.test(modelId)) return errorResponse(400, "Некорректный идентификатор IFC.");
  try {
    const access = await requireProjectAccess(projectId);
    if (access.unauthenticated) return errorResponse(401, "Требуется авторизация.");
    if (!access.allowed || !access.userId) return errorResponse(404, "IFC-модель не найдена.");
    const { data: model, error } = await access.supabase
      .from("ifc_models")
      .select("id, file_id, project_files!inner(uploaded_by, deleted_at)")
      .eq("id", modelId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle();
    const file = model && (Array.isArray(model.project_files) ? model.project_files[0] : model.project_files);
    if (error || !model || !file || file.deleted_at) return errorResponse(404, "IFC-модель не найдена.");
    const writeAccess = await requireProjectAccess(projectId, true);
    if (!writeAccess.allowed && file.uploaded_by !== access.userId) return errorResponse(403, "Недостаточно прав для удаления IFC.");
    const now = new Date().toISOString();
    const { error: modelError } = await access.supabase.from("ifc_models").update({ deleted_at: now, updated_at: now }).eq("id", modelId);
    const { error: fileError } = await access.supabase.from("project_files").update({ status: "deleted", deleted_at: now, updated_at: now }).eq("id", model.file_id);
    if (modelError || fileError) return errorResponse(500, "Не удалось удалить IFC-модель.");
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось удалить IFC-модель.");
  }
}
