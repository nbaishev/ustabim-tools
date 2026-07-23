export const MAX_GEOLOGY_PDF_BYTES = 100 * 1024 * 1024;

export function validateGeologyPdf(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Выберите отчёт инженерно-геологических изысканий в формате PDF";
  }

  if (file.type && file.type !== "application/pdf") {
    return "Тип выбранного файла не соответствует PDF";
  }

  if (file.size === 0) return "Выбранный PDF-файл пуст";

  if (file.size > MAX_GEOLOGY_PDF_BYTES) {
    return "Размер PDF-файла не должен превышать 100 МБ";
  }

  return null;
}

export function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}
