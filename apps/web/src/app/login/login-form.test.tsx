import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signInWithPassword: mocks.signInWithPassword },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("передаёт credentials Supabase и открывает безопасный next path", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm nextPath="/app" />);

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.type(screen.getByLabelText("Пароль"), "temporary-password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "engineer@example.com",
      password: "temporary-password",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/app");
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Пароль")).toHaveValue("");
  });

  it("показывает безопасную ошибку и очищает пароль", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.type(screen.getByLabelText("Пароль"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Неверный email или пароль");
    expect(screen.getByLabelText("Пароль")).toHaveValue("");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
