import { describe, expect, it } from "vitest";

import { calculateBeam, calculateStripFoundation } from "./preliminary-calculations";

describe("preliminary calculations", () => {
  it("рассчитывает усилия и прогиб однопролётной балки с преобразованием единиц", () => {
    const result = calculateBeam({ spanM: 6, loadKnPerM: 10, widthMm: 300, heightMm: 500, modulusGpa: 30, allowableDeflectionRatio: 250 });

    expect(result).toMatchObject({ ok: true, data: { supportReactionKn: 30, maxShearKn: 30, maxMomentKnM: 45, inertiaMm4: 3_125_000_000, allowableDeflectionMm: 24, deflectionConditionMet: true } });
    if (result.ok) expect(result.data.deflectionMm).toBeCloseTo(1.8, 5);
  });

  it("отклоняет неположительные и нечисловые входы балки", () => {
    expect(calculateBeam({ spanM: 0, loadKnPerM: 1, widthMm: 1, heightMm: 1, modulusGpa: 1, allowableDeflectionRatio: 1 })).toEqual({ ok: false, error: "Заполните все поля положительными числами." });
  });

  it("сравнивает давление ленты с сопротивлением грунта", () => {
    const result = calculateStripFoundation({ lengthM: 10, widthM: 0.5, heightM: 0.6, verticalLoadKn: 600, soilResistanceKpa: 150 });

    expect(result).toEqual({ ok: true, data: { footingAreaM2: 5, contactPressureKpa: 120, maxLoadKn: 750, utilizationRatio: 0.8, reserveKn: 150, concreteVolumeM3: 3, pressureConditionMet: true } });
  });

  it("показывает превышение и отклоняет ошибочные входы фундамента", () => {
    const overloaded = calculateStripFoundation({ lengthM: 10, widthM: 0.5, heightM: 0.6, verticalLoadKn: 800, soilResistanceKpa: 150 });
    expect(overloaded).toMatchObject({ ok: true, data: { reserveKn: -50, pressureConditionMet: false } });
    expect(calculateStripFoundation({ lengthM: 10, widthM: Number.NaN, heightM: 1, verticalLoadKn: 1, soilResistanceKpa: 1 })).toEqual({ ok: false, error: "Заполните все поля положительными числами." });
  });
});
