export const GEOLOGY_JOB_STATUSES = [
  "uploaded",
  "queued",
  "extracting",
  "recognizing",
  "analyzing",
  "validating",
  "needs_review",
  "completed",
  "failed",
  "cancelled",
] as const;

export type GeologyJobStatus = (typeof GEOLOGY_JOB_STATUSES)[number];
