export const MAX_IFC_FILE_SIZE = 250 * 1024 * 1024;

export function validateIfcFileMetadata(file: File) {
  if (!file.name.toLowerCase().endsWith(".ifc")) {
    return "Выберите файл с расширением .ifc";
  }

  if (file.size === 0) return "IFC-файл пуст";

  if (file.size > MAX_IFC_FILE_SIZE) {
    return "Размер IFC-файла не должен превышать 250 МБ";
  }

  return null;
}

export function hasIfcStepHeader(buffer: ArrayBuffer) {
  const header = new TextDecoder().decode(buffer).replace(/^\uFEFF/, "").trimStart();
  return header.startsWith("ISO-10303-21;");
}
