import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CalculatorsWorkspace } from "./calculators-workspace";

describe("CalculatorsWorkspace", () => {
  it("показывает результаты балки и очищает их после изменения входа", async () => {
    const user = userEvent.setup();
    render(<CalculatorsWorkspace kind="beam" />);

    expect(screen.getByRole("figure", { name: "Расчётная схема балки" })).toHaveTextContent("q = 10 кН/м");

    await user.click(screen.getByRole("button", { name: "Рассчитать" }));

    expect(screen.getByText("Макс. изгибающий момент")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Условие по введённому критерию выполнено");

    await user.clear(screen.getByRole("spinbutton", { name: "Пролёт L" }));
    await user.type(screen.getByRole("spinbutton", { name: "Пролёт L" }), "7");

    expect(screen.queryByText("Макс. изгибающий момент")).not.toBeInTheDocument();
  });

  it("показывает ошибку валидации и сбрасывает форму фундамента", async () => {
    const user = userEvent.setup();
    render(<CalculatorsWorkspace kind="strip-foundation" />);
    expect(screen.getByRole("figure", { name: "Расчётная схема ленточного фундамента" })).toHaveTextContent("N = 600 кН");
    const length = screen.getByRole("spinbutton", { name: "Суммарная длина L" });

    await user.clear(length);
    await user.click(screen.getByRole("button", { name: "Рассчитать" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Заполните все поля положительными числами.");

    await user.click(screen.getByRole("button", { name: "Сбросить" }));

    expect(length).toHaveValue(10);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
