import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardShell } from "./dashboard-shell";

vi.mock("@/components/layout/dashboard-navigation", () => ({
  DashboardNavigation: () => <a href="/app">Обзор</a>,
  DashboardPageLabel: () => <p>Обзор</p>,
}));

vi.mock("@/features/auth/logout-button", () => ({
  LogoutButton: () => <button type="button">Выйти</button>,
}));

describe("DashboardShell", () => {
  it("скрывает и снова показывает боковое меню", async () => {
    const user = userEvent.setup();
    render(
      <DashboardShell userEmail="user@example.com">
        <p>Содержимое</p>
      </DashboardShell>,
    );

    const sidebar = screen.getByRole("complementary", { name: "Боковое меню" });
    const toggle = screen.getByRole("button", { name: "Скрыть меню" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);

    expect(sidebar).not.toHaveClass("lg:flex-col");
    expect(sidebar).toHaveClass("lg:items-start");
    expect(screen.getByRole("button", { name: "Показать меню" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Показать меню" }));

    expect(sidebar).not.toHaveClass("lg:hidden");
  });
});
