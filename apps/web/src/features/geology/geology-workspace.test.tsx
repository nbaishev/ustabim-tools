import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GeologyWorkspace } from "./geology-workspace";

describe("GeologyWorkspace", () => {
  it("запускает анализ и показывает скачивание после polling", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { jobId: "abcdefghijklmnop", jobAccessToken: "1234567890123456", status: "queued" } }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { status: "done" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<GeologyWorkspace />);

    const input = screen.getByLabelText("Выбрать PDF", { selector: "input" });
    await user.upload(
      input,
      new File(["report"], "geology-report.pdf", { type: "application/pdf" }),
    );

    expect(screen.getByText("geology-report.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Начать анализ" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Скачать PDF-отчёт" })).toHaveAttribute("href", expect.stringContaining("/download?token=")));
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

  it("не показывает фиктивные структурированные данные", () => {
    render(<GeologyWorkspace />);
    expect(screen.getByText(/ИГЭ, скважины, параметры и риски не заполняются фиктивными данными/)).toBeInTheDocument();
  });
});
