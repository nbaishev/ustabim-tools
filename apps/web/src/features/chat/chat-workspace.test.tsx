import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatWorkspace } from "./chat-workspace";

describe("ChatWorkspace", () => {
  it("подставляет стартовый запрос в поле ввода", async () => {
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    await user.click(
      screen.getByRole("button", {
        name: "Как проверить актуальность редакции строительного норматива?",
      }),
    );

    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue(
      "Как проверить актуальность редакции строительного норматива?",
    );
  });

  it("показывает ожидание и добавляет ответ агента", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { answer: "Проверьте актуальную редакцию СН РК." } }),
      }),
    );
    render(<ChatWorkspace />);

    await user.type(screen.getByLabelText("Сообщение ассистенту"), "Привет");
    await user.click(screen.getByRole("button", { name: "Отправить сообщение" }));

    await waitFor(() => {
      expect(screen.getByText("Проверьте актуальную редакцию СН РК.")).toBeInTheDocument();
    });
    expect(screen.getByText("Привет")).toBeInTheDocument();
    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue("");
    vi.unstubAllGlobals();
  });

  it("сохраняет черновик после ошибки API", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Сервис недоступен")));
    render(<ChatWorkspace />);

    await user.type(screen.getByLabelText("Сообщение ассистенту"), "Привет");
    await user.click(screen.getByRole("button", { name: "Отправить сообщение" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Сервис недоступен"));
    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue("Привет");
    vi.unstubAllGlobals();
  });

  it("создаёт новый пустой frontend-чат", async () => {
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    await user.type(screen.getByLabelText("Сообщение ассистенту"), "Черновик");
    await user.click(screen.getByRole("button", { name: "Новый чат" }));

    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue("");
  });
});
