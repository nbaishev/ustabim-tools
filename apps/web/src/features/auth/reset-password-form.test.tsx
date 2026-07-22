import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "./reset-password-form";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));

vi.mock("@/shared/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signOut: mocks.signOut,
      updateUser: mocks.updateUser,
    },
  }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("обновляет пароль, завершает recovery-сессию и возвращает ко входу", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    const password = "Strong-password-2026";

    await user.type(screen.getByLabelText("Новый пароль"), password);
    await user.type(screen.getByLabelText("Повторите пароль"), password);
    await user.click(
      screen.getByRole("button", { name: "Сохранить новый пароль" }),
    );

    expect(mocks.updateUser).toHaveBeenCalledWith({ password });
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/login?reason=password-updated");
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Новый пароль")).toHaveValue("");
  });

  it("не отправляет несовпадающие пароли", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Новый пароль"), "Strong-password-2026");
    await user.type(
      screen.getByLabelText("Повторите пароль"),
      "Different-password-2026",
    );
    await user.click(
      screen.getByRole("button", { name: "Сохранить новый пароль" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Пароли не совпадают");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
