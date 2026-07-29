// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getClaims: mocks.getClaims },
    from: () => ({
      select: mocks.select,
      insert: mocks.insert,
    }),
  }),
}));

function request(body: unknown) {
  return new NextRequest("http://localhost/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function projectRow() {
  return {
    id: "project-id",
    name: "Школа",
    description: null,
    owner_id: "user-id",
    created_at: "2026-07-30T00:00:00.000Z",
    updated_at: "2026-07-30T00:00:00.000Z",
  };
}

describe("/api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } }, error: null });
  });

  it("не принимает подмену владельца и не создаёт пустой проект", async () => {
    for (const body of [
      { name: "", description: "" },
      { name: "Школа", ownerId: "another-user" },
    ]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("создаёт проект от имени пользователя из проверенной сессии", async () => {
    const single = vi.fn().mockResolvedValue({ data: projectRow(), error: null });
    const select = vi.fn().mockReturnValue({ single });
    mocks.insert.mockReturnValue({ select });

    const response = await POST(request({ name: "  Школа  ", description: "  Эскиз  " }));

    expect(response.status).toBe(201);
    expect(mocks.insert).toHaveBeenCalledWith({
      owner_id: "user-id",
      name: "Школа",
      description: "Эскиз",
    });
    await expect(response.json()).resolves.toMatchObject({
      data: { id: "project-id", ownerId: "user-id" },
    });
  });

  it("отдаёт владельца и доступный совместный проект с безопасным кешированием", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [projectRow(), { ...projectRow(), id: "member-project", owner_id: "other-user" }],
      error: null,
    });
    const is = vi.fn().mockReturnValue({ order });
    mocks.select.mockReturnValue({ is });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({
      data: [{ role: "owner" }, { role: "member" }],
    });
  });
});
