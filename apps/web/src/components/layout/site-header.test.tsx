import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("показывает вход только пользователю без сессии", () => {
    render(<SiteHeader isAuthenticated={false} />);

    expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("link", { name: "Личный кабинет" })).not.toBeInTheDocument();
  });

  it("показывает личный кабинет пользователю с активной сессией", () => {
    render(<SiteHeader isAuthenticated />);

    expect(screen.getByRole("link", { name: "Личный кабинет" })).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.queryByRole("link", { name: "Войти" })).not.toBeInTheDocument();
  });
});
