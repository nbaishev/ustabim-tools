import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

type CreateProjectPayload = {
  name?: unknown;
  description?: unknown;
};

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: noStoreHeaders });
}

function projectWriteError(error: { code?: string } | null) {
  if (error?.code === "42P01") {
    return errorResponse(
      503,
      "Хранилище проектов ещё не настроено. Примените миграции Supabase.",
    );
  }

  if (error?.code === "42501") {
    return errorResponse(
      503,
      "Нет доступа к хранилищу проектов. Проверьте RLS и права роли authenticated.",
    );
  }

  return errorResponse(500, "Не удалось создать проект. Попробуйте ещё раз.");
}

function asProject(
  row: {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
  },
  role: "owner" | "member" = "owner",
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role,
  };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: claimsError } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;

    if (claimsError || typeof userId !== "string") {
      return errorResponse(401, "Требуется авторизация.");
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, owner_id, created_at, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      return errorResponse(500, "Не удалось загрузить проекты.");
    }

    return NextResponse.json(
      {
        data: (data ?? []).map((project) =>
          asProject(project, project.owner_id === userId ? "owner" : "member"),
        ),
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return errorResponse(500, "Не удалось загрузить проекты.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateProjectPayload;
    if (
      !payload ||
      typeof payload !== "object" ||
      !Object.keys(payload).every((key) => key === "name" || key === "description")
    ) {
      return errorResponse(400, "Проверьте данные формы проекта.");
    }
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";

    if (
      !name ||
      name.length > 120 ||
      (typeof payload.description !== "undefined" && typeof payload.description !== "string") ||
      description.length > 1000
    ) {
      return errorResponse(400, "Проверьте название и описание проекта.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: authData, error: claimsError } = await supabase.auth.getClaims();
    const ownerId = authData?.claims?.sub;

    if (claimsError || typeof ownerId !== "string") {
      return errorResponse(401, "Требуется авторизация.");
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: ownerId,
        name,
        description: description || null,
      })
      .select("id, name, description, owner_id, created_at, updated_at")
      .single();

    if (error || !data) return projectWriteError(error);

    return NextResponse.json(
      { data: asProject(data) },
      { status: 201, headers: noStoreHeaders },
    );
  } catch {
    return errorResponse(400, "Проверьте данные формы проекта.");
  }
}
