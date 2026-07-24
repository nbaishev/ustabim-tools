import { NextResponse } from "next/server";
import { z } from "zod";

import { requestN8nChatAnswer } from "@/features/chat/n8n-chat";
import { getN8nChatConfig } from "@/shared/config/n8n-env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  content: z.string().trim().min(1).max(8_000),
}).strict();

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "VALIDATION_ERROR", "Введите корректное сообщение.");
  }

  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Сообщение должно содержать от 1 до 8000 символов.");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || typeof data?.claims?.sub !== "string") {
      return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация.");
    }
  } catch {
    return errorResponse(401, "UNAUTHORIZED", "Требуется авторизация.");
  }

  try {
    const answer = await requestN8nChatAnswer(
      parsed.data.content,
      getN8nChatConfig(),
    );
    return NextResponse.json({ data: { answer } }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(
      502,
      "MODEL_ERROR",
      "Не удалось получить ответ ассистента. Попробуйте ещё раз.",
    );
  }
}
