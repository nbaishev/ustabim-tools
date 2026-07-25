import { z } from "zod";

const n8nConfigSchema = z.object({
  webhookUrl: z
    .url("N8N_CHAT_WEBHOOK_URL должен быть корректным URL")
    .refine((value) => new URL(value).protocol === "https:", {
      message: "N8N_CHAT_WEBHOOK_URL должен использовать HTTPS",
    }),
  internalSecret: z.string().min(32, "N8N_INTERNAL_SECRET должен содержать не менее 32 символов"),
});

export type N8nChatConfig = z.infer<typeof n8nConfigSchema>;

const n8nGeologyConfigSchema = z.object({
  uploadWebhookUrl: z.url("N8N_GEOLOGY_UPLOAD_WEBHOOK_URL должен быть корректным URL").refine(
    (value) => new URL(value).protocol === "https:",
    { message: "N8N_GEOLOGY_UPLOAD_WEBHOOK_URL должен использовать HTTPS" },
  ),
  statusWebhookUrl: z.url("N8N_GEOLOGY_STATUS_WEBHOOK_URL должен быть корректным URL").refine(
    (value) => new URL(value).protocol === "https:",
    { message: "N8N_GEOLOGY_STATUS_WEBHOOK_URL должен использовать HTTPS" },
  ),
  downloadWebhookUrl: z.url("N8N_GEOLOGY_DOWNLOAD_WEBHOOK_URL должен быть корректным URL").refine(
    (value) => new URL(value).protocol === "https:",
    { message: "N8N_GEOLOGY_DOWNLOAD_WEBHOOK_URL должен использовать HTTPS" },
  ),
  internalSecret: z.string().min(32, "N8N_INTERNAL_SECRET должен содержать не менее 32 символов"),
});

export type N8nGeologyConfig = z.infer<typeof n8nGeologyConfigSchema>;

export function getN8nChatConfig(): N8nChatConfig {
  return n8nConfigSchema.parse({
    webhookUrl: process.env.N8N_CHAT_WEBHOOK_URL?.trim(),
    internalSecret: process.env.N8N_INTERNAL_SECRET,
  });
}

export function getN8nGeologyConfig(): N8nGeologyConfig {
  return n8nGeologyConfigSchema.parse({
    uploadWebhookUrl: process.env.N8N_GEOLOGY_UPLOAD_WEBHOOK_URL?.trim(),
    statusWebhookUrl: process.env.N8N_GEOLOGY_STATUS_WEBHOOK_URL?.trim(),
    downloadWebhookUrl: process.env.N8N_GEOLOGY_DOWNLOAD_WEBHOOK_URL?.trim(),
    internalSecret: process.env.N8N_INTERNAL_SECRET,
  });
}
