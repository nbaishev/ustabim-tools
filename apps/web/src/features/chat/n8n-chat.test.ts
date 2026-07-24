// @vitest-environment node

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { requestN8nChatAnswer } from "./n8n-chat";

const config = {
  webhookUrl: "https://n8n.example.test/webhook/ustabim-chat",
  internalSecret: "a-very-long-test-secret-that-is-not-used-in-production",
};

describe("requestN8nChatAnswer", () => {
  it("подписывает только сообщение и возвращает ответ n8n", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { answer: "Проверьте редакцию СН РК." } })),
    );

    await expect(requestN8nChatAnswer("Какой минимум?", config, fetcher)).resolves.toBe(
      "Проверьте редакцию СН РК.",
    );

    const [, init] = fetcher.mock.calls[0];
    const headers = new Headers(init?.headers);
    const body = JSON.stringify({ message: "Какой минимум?" });
    expect(init?.body).toBe(body);
    expect(headers.get("X-Usta-Signature")).toBe(
      createHmac("sha256", config.internalSecret)
        .update(`${headers.get("X-Usta-Timestamp")}.${headers.get("X-Usta-Nonce")}.${body}`)
        .digest("hex"),
    );
  });

  it("не пропускает некорректный ответ workflow", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: {} })),
    );

    await expect(requestN8nChatAnswer("Вопрос", config, fetcher)).rejects.toThrow(
      "n8n missing answer",
    );
  });

  it("безопасно обрабатывает таймаут webhook", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    await expect(requestN8nChatAnswer("Вопрос", config, fetcher)).rejects.toThrow(
      "n8n unavailable",
    );
  });
});
