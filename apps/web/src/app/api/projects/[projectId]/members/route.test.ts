// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({ getClaims: vi.fn(), rpc: vi.fn() }));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { getClaims: mocks.getClaims }, rpc: mocks.rpc }),
}));

const projectId = "f8b2a0f7-2f97-4b16-b60a-b1e76f277697";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/projects/${projectId}/members`, {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/projects/[projectId]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "owner-id" } }, error: null });
  });

  it("проверяет email, роль и неизвестные поля до обращения к Supabase", async () => {
    for (const body of [
      { email: "not-an-email", role: "editor" },
      { email: "member@example.com", role: "owner" },
      { email: "member@example.com", role: "viewer", userId: "forged" },
    ]) {
      expect((await POST(request(body), { params: Promise.resolve({ projectId }) })).status).toBe(400);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("передаёт только проверенные данные защищённой SQL-функции", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ id: "member-id", role: "editor" }], error: null });
    const response = await POST(request({ email: " member@example.com ", role: "editor" }), {
      params: Promise.resolve({ projectId }),
    });

    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("invite_project_member", {
      p_project_id: projectId, p_email: "member@example.com", p_role: "editor",
    });
  });

  it("не раскрывает существование пользователей и доступ к проекту", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0001" } });
    const response = await POST(request({ email: "member@example.com", role: "viewer" }), {
      params: Promise.resolve({ projectId }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Не удалось добавить участника. Проверьте email и права владельца проекта." },
    });
  });

  it("сообщает о неприменённой миграции приглашений", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    const response = await POST(request({ email: "member@example.com", role: "viewer" }), {
      params: Promise.resolve({ projectId }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: "Приглашения ещё не настроены. Примените миграции Supabase для участников проекта.",
      },
    });
  });
});
