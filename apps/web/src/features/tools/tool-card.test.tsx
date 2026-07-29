import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ToolCard } from "./tool-card";

const card = {
  title: "IFC-просмотрщик",
  description: "Просмотр инженерной модели в браузере.",
};

describe("ToolCard", () => {
  it("показывает название и описание инструмента", () => {
    render(<ToolCard {...card} />);

    expect(screen.getByText(card.title)).toBeInTheDocument();
    expect(screen.getByText(card.description)).toBeInTheDocument();
  });

  it("создаёт доступную ссылку только при наличии href", () => {
    const { rerender } = render(<ToolCard {...card} href="/app" />);

    expect(
      screen.getByRole("link", { name: /IFC-просмотрщик: открыть инструмент/i }),
    ).toHaveAttribute("href", "/app");

    rerender(<ToolCard {...card} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

});
