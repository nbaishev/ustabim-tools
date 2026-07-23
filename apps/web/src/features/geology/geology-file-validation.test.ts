import { describe, expect, it } from "vitest";

import {
  MAX_GEOLOGY_PDF_BYTES,
  formatFileSize,
  validateGeologyPdf,
} from "./geology-file-validation";

describe("geology PDF validation", () => {
  it("принимает непустой PDF", () => {
    expect(
      validateGeologyPdf(
        new File(["report"], "engineering-geology.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toBeNull();
  });

  it("отклоняет другой формат, пустой и слишком большой файл", () => {
    expect(validateGeologyPdf(new File(["x"], "report.docx"))).toMatch(/PDF/);
    expect(
      validateGeologyPdf(new File([], "empty.pdf", { type: "application/pdf" })),
    ).toMatch(/пуст/);

    const largeFile = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(largeFile, "size", { value: MAX_GEOLOGY_PDF_BYTES + 1 });
    expect(validateGeologyPdf(largeFile)).toMatch(/100 МБ/);
  });

  it("форматирует размер для интерфейса", () => {
    expect(formatFileSize(512 * 1024)).toBe("512 КБ");
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 МБ");
  });
});
