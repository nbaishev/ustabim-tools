export const CHAT_MESSAGE_STATUSES = [
  "pending",
  "streaming",
  "completed",
  "failed",
  "cancelled",
] as const;

export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUSES)[number];
