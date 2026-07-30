import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InvitePayload = { email?: unknown; role?: unknown };

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

function inviteError(error: { code?: string } | null) {
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return errorResponse(
      503,
      "Приглашения ещё не настроены. Примените миграции Supabase для участников проекта.",
    );
  }

  if (error?.code === "42501") {
    return errorResponse(
      503,
      "Нет доступа к участникам проекта. Проверьте миграции Supabase и RLS-права.",
    );
  }

  if (error?.code === "P0001") {
    return errorResponse(
      503,
      "База данных использует предыдущую версию приглашений. Примените миграции участников проекта.",
    );
  }

  return errorResponse(
    400,
    "Пользователь с этим email не найден или вы пытаетесь добавить владельца проекта.",
  );
}

function listError(error: { code?: string } | null) {
  if (error?.code === "PGRST202" || error?.code === "42883") {
    return errorResponse(
      503,
      "Список участников ещё не настроен. Примените миграцию 00006_manage_project_members.sql.",
    );
  }
  if (error?.code === "42501") {
    return errorResponse(503, "Нет доступа к участникам проекта. Проверьте миграции Supabase и RLS-права.");
  }
  return errorResponse(400, "Не удалось загрузить участников проекта.");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!uuidPattern.test(projectId)) return errorResponse(400, "Некорректный идентификатор проекта.");
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    if (authError || typeof authData?.claims?.sub !== "string") return errorResponse(401, "Требуется авторизация.");
    const { data, error } = await supabase.rpc("list_project_members", { p_project_id: projectId });
    if (error || !Array.isArray(data)) return listError(error);
    return NextResponse.json({ data }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось загрузить участников проекта.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!uuidPattern.test(projectId)) {
    return errorResponse(400, "Некорректный идентификатор проекта.");
  }

  let payload: InvitePayload;
  try {
    payload = (await request.json()) as InvitePayload;
  } catch {
    return errorResponse(400, "Проверьте email и роль участника.");
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !Object.keys(payload).every((key) => key === "email" || key === "role")
  ) {
    return errorResponse(400, "Проверьте email и роль участника.");
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const role = payload.role;
  if (
    !email || email.length > 254 || !emailPattern.test(email) ||
    (role !== "editor" && role !== "viewer")
  ) {
    return errorResponse(400, "Проверьте email и роль участника.");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getClaims();
    if (authError || typeof authData?.claims?.sub !== "string") {
      return errorResponse(401, "Требуется авторизация.");
    }

    const { data, error } = await supabase.rpc("invite_project_member", {
      p_project_id: projectId,
      p_email: email,
      p_role: role,
    });
    const member = Array.isArray(data) ? data[0] : null;
    if (error || !member || typeof member !== "object") return inviteError(error);

    return NextResponse.json({ data: { role } }, { status: 201, headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "Не удалось добавить участника. Попробуйте ещё раз.");
  }
}
