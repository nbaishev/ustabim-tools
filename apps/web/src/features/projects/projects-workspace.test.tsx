import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ProjectsWorkspace } from "./projects-workspace";

describe("ProjectsWorkspace", () => {
  it("показывает честное пустое состояние и будущие разделы", () => {
    render(<ProjectsWorkspace />);

    expect(screen.getByText("Создайте первый проект")).toBeInTheDocument();
    expect(screen.getByText("IFC-модели")).toBeInTheDocument();
    expect(screen.getByText("Геология")).toBeInTheDocument();
    expect(screen.getByText("Команда")).toBeInTheDocument();
  });

  it("открывает форму и не имитирует сохранение без API", async () => {
    const user = userEvent.setup();
    render(<ProjectsWorkspace />);

    await user.click(screen.getByRole("button", { name: "Новый проект" }));
    const dialog = screen.getByRole("dialog", { name: "Новый проект" });
    expect(dialog).toBeVisible();

    await user.type(screen.getByLabelText("Название проекта"), "Тестовый объект");
    await user.type(screen.getByLabelText("Описание"), "Стадия П");
    await user.click(within(dialog).getByRole("button", { name: "Создать проект" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Не удалось создать проект",
    );
    expect(screen.getByLabelText("Название проекта")).toHaveValue(
      "Тестовый объект",
    );
  });

  it("сбрасывает поиск и фильтр", async () => {
    const user = userEvent.setup();
    render(<ProjectsWorkspace />);

    await user.type(screen.getByLabelText("Поиск проектов"), "Школа");
    await user.click(screen.getByRole("button", { name: "Совместные" }));
    expect(screen.getByText("Проекты не найдены")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сбросить фильтры" }));
    expect(screen.getByLabelText("Поиск проектов")).toHaveValue("");
    expect(screen.getByText("Создайте первый проект")).toBeInTheDocument();
  });
});
