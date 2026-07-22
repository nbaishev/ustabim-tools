export const IFC_MODEL_STATUSES = [
  "uploaded",
  "processing",
  "ready",
  "failed",
] as const;

export type IfcModelStatus = (typeof IFC_MODEL_STATUSES)[number];
