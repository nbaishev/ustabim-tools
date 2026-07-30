import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

async function manage(projectId: string, memberId: string, action: "update_role" | "remove", role?: "editor" | "viewer") {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || typeof authData?.claims?.sub !== "string") return errorResponse(401, "Требуется авторизация.");
  const { data, error } = await supabase.rpc("manage_project_member", {
    p_project_id: projectId, p_member_id: memberId, p_action: action, p_role: role ?? null,
  });
  if (error || !Array.isArray(data) || !data.length) return errorResponse(400, "Не удалось изменить участника проекта.");
  return NextResponse.json({ data: { role: action === "remove" ? null : role } }, { headers: noStoreHeaders });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string; memberId: string }> }) {
  const { projectId, memberId } = await params;
  if (!uuidPattern.test(projectId) || !uuidPattern.test(memberId)) return errorResponse(400, "Некорректный идентификатор участника.");
  try {
    const body = (await request.json()) as { role?: unknown };
    if (!body || typeof body !== "object" || (body.role !== "editor" && body.role !== "viewer")) return errorResponse(400, "Выберите роль редактора или наблюдателя.");
    return await manage(projectId, memberId, "update_role", body.role);
  } catch { return errorResponse(400, "Выберите роль редактора или наблюдателя."); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string; memberId: string }> }) {
  const { projectId, memberId } = await params;
  if (!uuidPattern.test(projectId) || !uuidPattern.test(memberId)) return errorResponse(400, "Некорректный идентификатор участника.");
  try { return await manage(projectId, memberId, "remove"); }
  catch { return errorResponse(500, "Не удалось удалить участника проекта."); }
}
