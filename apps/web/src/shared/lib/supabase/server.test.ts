import { beforeEach, describe, expect, it, vi } from "vitest";

import { hasActiveSupabaseSession } from "./server";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: mocks.getClaims },
  }),
}));

describe("hasActiveSupabaseSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key-long-enough-for-test";
  });

  it("подтверждает сессию только при валидном subject", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-id" } },
      error: null,
    });

    await expect(hasActiveSupabaseSession()).resolves.toBe(true);
  });

  it("возвращает false при ошибке проверки claims", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: null },
      error: { message: "invalid session" },
    });

    await expect(hasActiveSupabaseSession()).resolves.toBe(false);
  });
});
