import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GeologyWorkspace } from "./geology-workspace";

describe("GeologyWorkspace", () => {
  it("принимает PDF и честно блокирует серверный анализ", async () => {
    const user = userEvent.setup();
    render(<GeologyWorkspace />);

    const input = screen.getByLabelText("Выбрать PDF", { selector: "input" });
    await user.upload(
      input,
      new File(["report"], "geology-report.pdf", { type: "application/pdf" }),
    );

    expect(screen.getByText("geology-report.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Начать анализ" }));
    expect(screen.getByRole("status")).toHaveTextContent("Анализ не запущен");
  });

  it("показывает безопасную локальную ошибку для другого формата", async () => {
    const user = userEvent.setup();
    render(<GeologyWorkspace />);

    const input = screen.getByLabelText("Выбрать PDF", { selector: "input" });
    await user.upload(
      input,
      new File(["report"], "geology.pdf", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("не соответствует PDF");
  });

  it("переключает будущие разделы результата", async () => {
    const user = userEvent.setup();
    render(<GeologyWorkspace />);

    await user.click(screen.getByRole("button", { name: "Скважины" }));
    expect(screen.getByText("В разделе «Скважины» нет данных")).toBeInTheDocument();
  });
});
