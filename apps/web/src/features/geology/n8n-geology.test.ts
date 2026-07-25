import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { getGeologyJobStatus } from "./n8n-geology";

describe("n8n geology client", () => {
  it("подписывает capability-запрос и не помещает токен в URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { status: "processing" } })));
    const config = { uploadWebhookUrl: "https://n8n.example/upload", statusWebhookUrl: "https://n8n.example/status", downloadWebhookUrl: "https://n8n.example/download", internalSecret: "a".repeat(32) };
    const previousNow = Date.now;
    Date.now = () => 1_700_000_000_000;
    await getGeologyJobStatus("abcdefghijklmnop", "token-token-token-1", config, fetcher);
    Date.now = previousNow;
    const [, options] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(fetcher.mock.calls[0][0]).toBe(config.statusWebhookUrl);
    expect(String(options.body)).toBe(JSON.stringify({ jobId: "abcdefghijklmnop", jobAccessToken: "token-token-token-1" }));
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Usta-Signature"]).toBe(createHmac("sha256", config.internalSecret).update(`1700000000.${headers["X-Usta-Nonce"]}.${options.body}`).digest("hex"));
  });
});
