import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChatWorkspace } from "./chat-workspace";

describe("ChatWorkspace", () => {
  it("подставляет стартовый запрос в поле ввода", async () => {
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    await user.click(
      screen.getByRole("button", {
        name: "Составь чек-лист проверки BIM-модели",
      }),
    );

    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue(
      "Составь чек-лист проверки BIM-модели",
    );
  });

  it("не имитирует ответ при отсутствии AI backend", async () => {
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    await user.type(screen.getByLabelText("Сообщение ассистенту"), "Привет");
    await user.click(screen.getByRole("button", { name: "Отправить сообщение" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Не удалось отправить сообщение",
    );
    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue("Привет");
  });

  it("создаёт новый пустой frontend-чат", async () => {
    const user = userEvent.setup();
    render(<ChatWorkspace />);

    await user.type(screen.getByLabelText("Сообщение ассистенту"), "Черновик");
    await user.click(screen.getByRole("button", { name: "Новый чат" }));

    expect(screen.getByLabelText("Сообщение ассистенту")).toHaveValue("");
  });
});
