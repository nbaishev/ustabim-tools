export const CALCULATOR_RUN_STATUSES = [
  "pending",
  "completed",
  "failed",
] as const;

export type CalculatorRunStatus = (typeof CALCULATOR_RUN_STATUSES)[number];
