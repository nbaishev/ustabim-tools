export const FILE_STATUSES = [
  "uploading",
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleted",
] as const;

export type FileStatus = (typeof FILE_STATUSES)[number];
