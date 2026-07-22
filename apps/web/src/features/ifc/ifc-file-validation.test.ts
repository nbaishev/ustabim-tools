import { describe, expect, it } from "vitest";

import {
  hasIfcStepHeader,
  MAX_IFC_FILE_SIZE,
  validateIfcFileMetadata,
} from "./ifc-file-validation";

describe("IFC file validation", () => {
  it("принимает непустой IFC-файл в пределах лимита", () => {
    const file = new File(["ISO-10303-21;"], "model.IFC");
    expect(validateIfcFileMetadata(file)).toBeNull();
  });

  it("отклоняет неверное расширение и слишком большой файл", () => {
    expect(validateIfcFileMetadata(new File(["data"], "model.txt"))).toMatch(
      /расширением .ifc/,
    );

    const largeFile = new File([new Uint8Array(1)], "large.ifc");
    Object.defineProperty(largeFile, "size", { value: MAX_IFC_FILE_SIZE + 1 });
    expect(validateIfcFileMetadata(largeFile)).toMatch(/250 МБ/);
  });

  it("проверяет STEP-заголовок IFC", () => {
    expect(
      hasIfcStepHeader(new TextEncoder().encode("ISO-10303-21;\nHEADER;").buffer),
    ).toBe(true);
    expect(
      hasIfcStepHeader(new TextEncoder().encode("not an IFC file").buffer),
    ).toBe(false);
  });
});
