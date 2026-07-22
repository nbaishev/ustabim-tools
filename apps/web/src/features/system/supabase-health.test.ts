// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { checkSupabaseConnection } from "./supabase-health";

const config = {
  url: "https://project.supabase.co",
  publicKey: "public-anon-key-with-safe-length",
};

describe("checkSupabaseConnection", () => {
  it("нормализует успешный health-ответ", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await expect(checkSupabaseConnection(config, fetcher)).resolves.toEqual({
      service: "supabase",
      status: "connected",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/health",
      expect.objectContaining({
        method: "GET",
        headers: { apikey: config.publicKey },
        cache: "no-store",
      }),
    );
  });

  it("не раскрывает техническую ошибку недоступного сервиса", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret"));

    await expect(checkSupabaseConnection(config, fetcher)).resolves.toEqual({
      service: "supabase",
      status: "unavailable",
    });
  });
});
