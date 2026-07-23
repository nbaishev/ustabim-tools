import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoogleOAuthButton } from "./google-oauth-button";

const mocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signInWithOAuth: mocks.signInWithOAuth },
  }),
}));

describe("GoogleOAuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("запускает Google PKCE flow с фиксированным callback", async () => {
    const oauthUrl = "https://project.supabase.co/auth/v1/authorize?provider=google";
    const navigate = vi.fn();
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: oauthUrl }, error: null });
    const user = userEvent.setup();
    render(<GoogleOAuthButton nextPath="/app/projects" navigate={navigate} />);

    await user.click(screen.getByRole("button", { name: "Продолжить с Google" }));

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fapp%2Fprojects&flow=oauth",
        skipBrowserRedirect: true,
      },
    });
    expect(navigate).toHaveBeenCalledWith(oauthUrl);
  });

  it("заменяет внешний next и показывает безопасную ошибку", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: {},
      error: { message: "Unsupported provider" },
    });
    const user = userEvent.setup();
    render(<GoogleOAuthButton nextPath="https://evil.example" />);

    await user.click(screen.getByRole("button", { name: "Продолжить с Google" }));

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Fapp&flow=oauth",
        skipBrowserRedirect: true,
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Не удалось начать вход через Google",
    );
    expect(screen.getByRole("button", { name: "Продолжить с Google" })).toBeEnabled();
  });

  it("возвращает кнопку в активное состояние, если OAuth URL не получен", async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });
    const user = userEvent.setup();
    render(<GoogleOAuthButton />);

    await user.click(screen.getByRole("button", { name: "Продолжить с Google" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Не удалось начать вход через Google",
    );
    expect(screen.getByRole("button", { name: "Продолжить с Google" })).toBeEnabled();
  });
});
