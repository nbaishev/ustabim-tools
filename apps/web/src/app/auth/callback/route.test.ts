import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  }),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обменивает signup code и открывает только кабинет", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=signup-code&next=%2Fapp",
    );

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("signup-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/app?reason=email-confirmed",
    );
  });

  it("сохраняет отдельный recovery destination", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=recovery-code&next=%2Freset-password",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost/reset-password",
    );
  });

  it("завершает Google OAuth только на безопасном пути кабинета", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=oauth-code&next=%2Fapp%2Fprojects&flow=oauth",
    );

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("location")).toBe("http://localhost/app/projects");
  });

  it("возвращает неуспешный OAuth на страницу входа", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid oauth code" },
    });
    const request = new NextRequest(
      "http://localhost/auth/callback?code=bad-code&next=%2Fapp&flow=oauth",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=oauth",
    );
  });

  it("отклоняет произвольный redirect до обращения к Supabase", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=code&next=https%3A%2F%2Fevil.example",
    );

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost/forgot-password?error=invalid-link",
    );
  });

  it("отклоняет внешний OAuth redirect до обращения к Supabase", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=code&next=https%3A%2F%2Fevil.example&flow=oauth",
    );

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost/forgot-password?error=invalid-link",
    );
  });
});
