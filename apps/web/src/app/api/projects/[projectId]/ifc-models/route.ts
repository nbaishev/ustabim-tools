import { NextResponse } from "next/server";

import { noStoreHeaders, requireProjectAccess, uuidPattern } from "./ifc-api";

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!uuidPattern.test(projectId)) return errorResponse(400, "Некорректный идентификатор проекта.");
  try {
    const access = await requireProjectAccess(projectId);
    if (access.unauthenticated) return errorResponse(401, "Требуется авторизация.");
    if (!access.allowed) return errorResponse(404, "Проект не найден.");
    const { data, error } = await access.supabase
      .from("ifc_models")
      .select("id, file_id, status, created_at, project_files!inner(original_name, size_bytes, uploaded_by, status, deleted_at)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .is("project_files.deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) return errorResponse(500, "Не удалось загрузить список IFC-моделей.");
    const models = (data ?? []).map((model) => {
      const file = Array.isArray(model.project_files) ? model.project_files[0] : model.project_files;
      return {
        id: model.id,
        fileId: model.file_id,
        status: model.status,
        createdAt: model.created_at,
        originalName: file?.original_name,
        sizeBytes: file?.size_bytes,
        uploadedBy: file?.uploaded_by,
      };
    });
    return NextResponse.json({ data: models }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось загрузить список IFC-моделей.");
  }
}
