import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecentProjects } from "./recent-projects";

describe("RecentProjects", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("показывает последние проекты со ссылками на их карточки", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "project-1",
              name: "Жилой комплекс",
              description: "Стадия П",
              updatedAt: "2026-07-30T00:00:00.000Z",
              role: "owner",
            },
          ],
        }),
      }),
    );

    render(<RecentProjects />);

    expect(await screen.findByRole("link", { name: "Жилой комплекс" })).toHaveAttribute(
      "href",
      "/app/projects/project-1",
    );
    expect(screen.getByText("Стадия П")).toBeInTheDocument();
  });
});
