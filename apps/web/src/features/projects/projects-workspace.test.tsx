import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectsWorkspace } from "./projects-workspace";

describe("ProjectsWorkspace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("показывает честное пустое состояние и будущие разделы", () => {
    render(<ProjectsWorkspace />);

    expect(screen.getByText("Создайте первый проект")).toBeInTheDocument();
    expect(screen.getByText("IFC-модели")).toBeInTheDocument();
    expect(screen.getByText("Геология")).toBeInTheDocument();
    expect(screen.getByText("Команда")).toBeInTheDocument();
  });

  it("создаёт проект через API и показывает его в списке", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "project-1",
            name: "Тестовый объект",
            description: "Стадия П",
            ownerId: "user-1",
            createdAt: "2026-07-30T00:00:00.000Z",
            updatedAt: "2026-07-30T00:00:00.000Z",
            role: "owner",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ProjectsWorkspace />);

    await user.click(screen.getByRole("button", { name: "Новый проект" }));
    const dialog = screen.getByRole("dialog", { name: "Новый проект" });
    expect(dialog).toBeVisible();

    await user.type(screen.getByLabelText("Название проекта"), "Тестовый объект");
    await user.type(screen.getByLabelText("Описание"), "Стадия П");
    await user.click(within(dialog).getByRole("button", { name: "Создать проект" }));

    expect(await screen.findByText("Тестовый объект")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Тестовый объект" })).toHaveAttribute(
      "href",
      "/app/projects/project-1",
    );
    expect(screen.queryByRole("dialog", { name: "Новый проект" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/projects",
      expect.objectContaining({ method: "POST" }),
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
