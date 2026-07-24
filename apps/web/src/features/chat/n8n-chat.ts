import { createHmac, randomUUID } from "node:crypto";

import type { N8nChatConfig } from "@/shared/config/n8n-env";

const requestTimeoutMs = 30_000;

export class N8nChatError extends Error {}

type N8nResponse = {
  data?: { answer?: unknown };
};

export async function requestN8nChatAnswer(
  message: string,
  config: N8nChatConfig,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const body = JSON.stringify({ message });
  const signature = createHmac("sha256", config.internalSecret)
    .update(`${timestamp}.${nonce}.${body}`)
    .digest("hex");

  let response: Response;

  try {
    response = await fetcher(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Usta-Timestamp": timestamp,
        "X-Usta-Nonce": nonce,
        "X-Usta-Signature": signature,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new N8nChatError("n8n unavailable");
  }

  if (!response.ok) {
    throw new N8nChatError("n8n rejected request");
  }

  let payload: N8nResponse;
  try {
    payload = (await response.json()) as N8nResponse;
  } catch {
    throw new N8nChatError("n8n invalid response");
  }

  const answer = payload.data?.answer;
  if (typeof answer !== "string" || !answer.trim()) {
    throw new N8nChatError("n8n missing answer");
  }

  return answer.trim();
}
