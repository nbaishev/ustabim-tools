import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
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
    expect(mocks.replace).toHaveBeenCalledWith(
      "/forgot-password/check-email",
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

    expect(mocks.replace).toHaveBeenCalledWith(
      "/forgot-password/check-email",
    );
    expect(screen.queryByText("User not found")).not.toBeInTheDocument();
  });
});
