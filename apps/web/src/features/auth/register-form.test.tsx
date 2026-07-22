import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "./register-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signUp: mocks.signUp },
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("регистрирует пользователя с фиксированным callback и открывает нейтральный экран", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: { id: "test-user" } },
      error: null,
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    const password = "Strong-password-2026";

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.type(screen.getByLabelText("Пароль"), password);
    await user.type(screen.getByLabelText("Повторите пароль"), password);
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "engineer@example.com",
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fapp",
      },
    });
    expect(mocks.replace).toHaveBeenCalledWith("/register/check-email");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Пароль")).toHaveValue("");
  });

  it("не раскрывает ответ Supabase для уже существующего email", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    const password = "Strong-password-2026";

    await user.type(screen.getByLabelText("Email"), "existing@example.com");
    await user.type(screen.getByLabelText("Пароль"), password);
    await user.type(screen.getByLabelText("Повторите пароль"), password);
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(mocks.replace).toHaveBeenCalledWith("/register/check-email");
    expect(screen.queryByText(/already registered/i)).not.toBeInTheDocument();
  });

  it("показывает безопасную причину, если письмо не было отправлено", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: "over_email_send_rate_limit", status: 429 },
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    const password = "Strong-password-2026";

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.type(screen.getByLabelText("Пароль"), password);
    await user.type(screen.getByLabelText("Повторите пароль"), password);
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Превышен лимит отправки писем",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Пароль")).toHaveValue("");
  });

  it("не отправляет несовпадающие пароли и очищает их", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.type(screen.getByLabelText("Пароль"), "Strong-password-2026");
    await user.type(
      screen.getByLabelText("Повторите пароль"),
      "Different-password-2026",
    );
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Пароли не совпадают");
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Пароль")).toHaveValue("");
    expect(screen.getByLabelText("Повторите пароль")).toHaveValue("");
  });
});
