import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DashboardNavigation,
  DashboardPageLabel,
} from "./dashboard-navigation";

const mocks = vi.hoisted(() => ({
  pathname: "/app",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

describe("DashboardNavigation", () => {
  beforeEach(() => {
    mocks.pathname = "/app";
  });

  it("отмечает обзор на корневой странице кабинета", () => {
    render(<DashboardNavigation />);

    expect(screen.getByRole("link", { name: "Обзор" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Профиль" })).toHaveAttribute(
      "href",
      "/app/profile",
    );
    expect(screen.getByRole("link", { name: "IFC-модели" })).toHaveAttribute(
      "href",
      "/app/ifc",
    );
  });

  it("отмечает IFC-просмотрщик как текущий раздел", () => {
    mocks.pathname = "/app/ifc";
    render(
      <>
        <DashboardNavigation />
        <DashboardPageLabel />
      </>,
    );

    expect(screen.getByRole("link", { name: "IFC-модели" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("IFC-модели", { selector: "p" })).toBeInTheDocument();
  });

  it("отмечает профиль и меняет заголовок раздела", () => {
    mocks.pathname = "/app/profile";
    render(
      <>
        <DashboardNavigation />
        <DashboardPageLabel />
      </>,
    );

    expect(screen.getByRole("link", { name: "Профиль" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Профиль", { selector: "p" })).toBeInTheDocument();
  });
});
