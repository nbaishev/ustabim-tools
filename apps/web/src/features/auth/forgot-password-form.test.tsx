import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { resetPasswordForEmail: mocks.resetPasswordForEmail },
  }),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("отправляет recovery-ссылку на безопасный callback", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "engineer@example.com");
    await user.click(screen.getByRole("button", { name: "Отправить ссылку" }));

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "engineer@example.com",
      {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Freset-password",
      },
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Если пользователь с таким email существует",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });

  it("не раскрывает результат поиска пользователя", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: "Отправить ссылку" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Если пользователь с таким email существует",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("User not found");
  });
});
