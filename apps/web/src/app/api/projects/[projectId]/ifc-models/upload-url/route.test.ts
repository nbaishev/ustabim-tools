// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({ getClaims: vi.fn() }));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { getClaims: mocks.getClaims } }),
}));

const projectId = "11111111-1111-4111-8111-111111111111";

function request(body: unknown, key?: string) {
  return new NextRequest(`http://localhost/api/projects/${projectId}/ifc-models/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    body: JSON.stringify(body),
  });
}

describe("IFC upload URL", () => {
  beforeEach(() => vi.clearAllMocks());

  it("отклоняет не-IFC, неверный размер и запрос без ключа идемпотентности", async () => {
    for (const body of [
      { fileName: "model.pdf", contentType: "application/octet-stream", sizeBytes: 100 },
      { fileName: "model.ifc", contentType: "application/octet-stream", sizeBytes: 0 },
    ]) {
      expect((await POST(request(body, "request-1"), { params: Promise.resolve({ projectId }) })).status).toBe(400);
    }
    expect((await POST(request({ fileName: "model.ifc", contentType: "application/octet-stream", sizeBytes: 100 }), { params: Promise.resolve({ projectId }) })).status).toBe(400);
  });

  it("требует проверенную сессию до выдачи URL", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: {} }, error: null });
    const response = await POST(
      request({ fileName: "model.ifc", contentType: "application/octet-stream", sizeBytes: 100 }, "request-1"),
      { params: Promise.resolve({ projectId }) },
    );
    expect(response.status).toBe(401);
  });
});
