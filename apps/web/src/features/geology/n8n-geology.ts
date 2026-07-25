import { createHash, createHmac, randomUUID } from "node:crypto";

import type { N8nGeologyConfig } from "@/shared/config/n8n-env";

const requestTimeoutMs = 120_000;

export type GeologyJobStatus = "queued" | "processing" | "done" | "error";

export class N8nGeologyError extends Error {
  constructor(public readonly code: "QUOTA_EXHAUSTED" | "WORKFLOW_ERROR" = "WORKFLOW_ERROR") {
    super(code);
  }
}

type JobCapability = { jobId: string; jobAccessToken: string; status: GeologyJobStatus };

function signature(secret: string, timestamp: string, nonce: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${nonce}.${body}`).digest("hex");
}

function signedHeaders(secret: string, body: string, contentType: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  return {
    "Content-Type": contentType,
    "X-Usta-Timestamp": timestamp,
    "X-Usta-Nonce": nonce,
    "X-Usta-Signature": signature(secret, timestamp, nonce, body),
  };
}

async function safePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isStatus(value: unknown): value is GeologyJobStatus {
  return value === "queued" || value === "processing" || value === "done" || value === "error";
}

function readErrorCode(payload: unknown): "QUOTA_EXHAUSTED" | "WORKFLOW_ERROR" {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = payload.error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "QUOTA_EXHAUSTED") {
      return "QUOTA_EXHAUSTED";
    }
  }
  return "WORKFLOW_ERROR";
}

export async function createGeologyJob(
  file: File,
  config: N8nGeologyConfig,
  fetcher: typeof fetch = fetch,
): Promise<JobCapability> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");
  const body = JSON.stringify({ filename: file.name, mimeType: file.type || "application/pdf", sha256: digest });
  let response: Response;
  try {
    response = await fetcher(config.uploadWebhookUrl, {
      method: "POST",
      headers: { ...signedHeaders(config.internalSecret, body, "application/pdf"), "X-Usta-File-Name": encodeURIComponent(file.name), "X-Usta-Content-SHA256": digest },
      body: bytes,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new N8nGeologyError();
  }
  const payload = await safePayload(response);
  if (!response.ok) throw new N8nGeologyError(readErrorCode(payload));
  const data = typeof payload === "object" && payload !== null && "data" in payload ? payload.data : payload;
  if (typeof data !== "object" || data === null || !("jobId" in data) || !("jobAccessToken" in data) || !("status" in data)
    || typeof data.jobId !== "string" || typeof data.jobAccessToken !== "string" || !isStatus(data.status)) {
    throw new N8nGeologyError();
  }
  return { jobId: data.jobId, jobAccessToken: data.jobAccessToken, status: data.status };
}

async function requestJob(
  webhookUrl: string,
  jobId: string,
  jobAccessToken: string,
  config: N8nGeologyConfig,
  fetcher: typeof fetch,
): Promise<Response> {
  const body = JSON.stringify({ jobId, jobAccessToken });
  try {
    return await fetcher(webhookUrl, { method: "POST", headers: signedHeaders(config.internalSecret, body, "application/json"), body, cache: "no-store", signal: AbortSignal.timeout(requestTimeoutMs) });
  } catch {
    throw new N8nGeologyError();
  }
}

export async function getGeologyJobStatus(jobId: string, jobAccessToken: string, config: N8nGeologyConfig, fetcher: typeof fetch = fetch): Promise<GeologyJobStatus> {
  const response = await requestJob(config.statusWebhookUrl, jobId, jobAccessToken, config, fetcher);
  const payload = await safePayload(response);
  if (!response.ok) throw new N8nGeologyError(readErrorCode(payload));
  const data = typeof payload === "object" && payload !== null && "data" in payload ? payload.data : payload;
  if (typeof data !== "object" || data === null || !("status" in data) || !isStatus(data.status)) throw new N8nGeologyError();
  return data.status;
}

export async function downloadGeologyReport(jobId: string, jobAccessToken: string, config: N8nGeologyConfig, fetcher: typeof fetch = fetch): Promise<Response> {
  const response = await requestJob(config.downloadWebhookUrl, jobId, jobAccessToken, config, fetcher);
  if (!response.ok || !response.body || !response.headers.get("content-type")?.toLowerCase().includes("application/pdf")) throw new N8nGeologyError();
  return response;
}
