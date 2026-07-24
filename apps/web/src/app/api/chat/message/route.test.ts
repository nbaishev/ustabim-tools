// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getConfig: vi.fn(),
  requestAnswer: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getClaims: mocks.getClaims },
  }),
}));

vi.mock("@/shared/config/n8n-env", () => ({
  getN8nChatConfig: mocks.getConfig,
}));

vi.mock("@/features/chat/n8n-chat", () => ({
  requestN8nChatAnswer: mocks.requestAnswer,
}));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/chat/message", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/chat/message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } }, error: null });
    mocks.getConfig.mockReturnValue({ webhookUrl: "https://n8n.example.test", internalSecret: "secret" });
  });

  it("отклоняет запрос без сессии", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null });

    const response = await POST(request({ content: "Привет" }));

    expect(response.status).toBe(401);
    expect(mocks.requestAnswer).not.toHaveBeenCalled();
  });

  it("отклоняет пустые, слишком длинные и лишние поля", async () => {
    for (const body of [
      { content: "   " },
      { content: "x".repeat(8001) },
      { content: "Привет", userId: "forged" },
    ]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    }
    expect(mocks.requestAnswer).not.toHaveBeenCalled();
  });

  it("возвращает нормализованный ответ workflow", async () => {
    mocks.requestAnswer.mockResolvedValue("  Нужна проверка.  ");

    const response = await POST(request({ content: "Вопрос" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { answer: "  Нужна проверка.  " } });
    expect(mocks.requestAnswer).toHaveBeenCalledWith(
      "Вопрос",
      expect.anything(),
    );
  });

  it("не раскрывает ошибку n8n", async () => {
    mocks.requestAnswer.mockRejectedValue(new Error("https://secret-n8n.example/stack"));

    const response = await POST(request({ content: "Вопрос" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "MODEL_ERROR",
        message: "Не удалось получить ответ ассистента. Попробуйте ещё раз.",
      },
    });
  });
});
