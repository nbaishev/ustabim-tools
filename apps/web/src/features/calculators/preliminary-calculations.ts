export type CalculationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type BeamInput = {
  spanM: number;
  loadKnPerM: number;
  widthMm: number;
  heightMm: number;
  modulusGpa: number;
  allowableDeflectionRatio: number;
};

export type BeamResult = {
  supportReactionKn: number;
  maxShearKn: number;
  maxMomentKnM: number;
  inertiaMm4: number;
  deflectionMm: number;
  allowableDeflectionMm: number;
  deflectionConditionMet: boolean;
};

export type StripFoundationInput = {
  lengthM: number;
  widthM: number;
  heightM: number;
  verticalLoadKn: number;
  soilResistanceKpa: number;
};

export type StripFoundationResult = {
  footingAreaM2: number;
  contactPressureKpa: number;
  maxLoadKn: number;
  utilizationRatio: number;
  reserveKn: number;
  concreteVolumeM3: number;
  pressureConditionMet: boolean;
};

function validatePositiveValues(values: Record<string, number>): string | null {
  if (Object.values(values).some((value) => !Number.isFinite(value) || value <= 0)) {
    return "Заполните все поля положительными числами.";
  }
  return null;
}

export function calculateBeam(input: BeamInput): CalculationResult<BeamResult> {
  const error = validatePositiveValues(input);
  if (error) return { ok: false, error };

  const inertiaMm4 = (input.widthMm * input.heightMm ** 3) / 12;
  const spanMm = input.spanM * 1_000;
  const loadNPerMm = input.loadKnPerM;
  const modulusNPerMm2 = input.modulusGpa * 1_000;
  const deflectionMm =
    (5 * loadNPerMm * spanMm ** 4) /
    (384 * modulusNPerMm2 * inertiaMm4);
  const allowableDeflectionMm = spanMm / input.allowableDeflectionRatio;
  const supportReactionKn = (input.loadKnPerM * input.spanM) / 2;

  return {
    ok: true,
    data: {
      supportReactionKn,
      maxShearKn: supportReactionKn,
      maxMomentKnM: (input.loadKnPerM * input.spanM ** 2) / 8,
      inertiaMm4,
      deflectionMm,
      allowableDeflectionMm,
      deflectionConditionMet: deflectionMm <= allowableDeflectionMm,
    },
  };
}

export function calculateStripFoundation(
  input: StripFoundationInput,
): CalculationResult<StripFoundationResult> {
  const error = validatePositiveValues(input);
  if (error) return { ok: false, error };

  const footingAreaM2 = input.lengthM * input.widthM;
  const contactPressureKpa = input.verticalLoadKn / footingAreaM2;
  const maxLoadKn = input.soilResistanceKpa * footingAreaM2;
  const reserveKn = maxLoadKn - input.verticalLoadKn;

  return {
    ok: true,
    data: {
      footingAreaM2,
      contactPressureKpa,
      maxLoadKn,
      utilizationRatio: contactPressureKpa / input.soilResistanceKpa,
      reserveKn,
      concreteVolumeM3: footingAreaM2 * input.heightM,
      pressureConditionMet: contactPressureKpa <= input.soilResistanceKpa,
    },
  };
}
