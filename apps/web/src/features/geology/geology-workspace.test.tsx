import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GeologyWorkspace } from "./geology-workspace";

describe("GeologyWorkspace", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("запускает анализ и показывает структурированный отчёт после polling", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { jobId: "abcdefghijklmnop", jobAccessToken: "1234567890123456", status: "queued" } }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: "done", report: { summary: "Участок сложен суглинками.", ige: [{ code: "ИГЭ-1", description: "Суглинок", depthFrom: 0, depthTo: 3 }], risks: [{ severity: "high", text: "Возможна просадочность" }] } } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<GeologyWorkspace />);

    const input = screen.getByLabelText("Выбрать PDF", { selector: "input" });
    await user.upload(
      input,
      new File(["report"], "geology-report.pdf", { type: "application/pdf" }),
    );

    expect(screen.getByText("geology-report.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Начать анализ" }));
    await waitFor(() => expect(screen.getByText("Участок сложен суглинками.")).toBeInTheDocument());
    expect(screen.getByText("ИГЭ-1")).toBeInTheDocument();
    expect(screen.getByText("Высокий")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/geology/jobs", expect.objectContaining({ method: "POST" }));
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

  it("не показывает фиктивные структурированные данные до получения отчёта", () => {
    render(<GeologyWorkspace />);
    expect(screen.getByText("Результат появится после обработки")).toBeInTheDocument();
  });
});
