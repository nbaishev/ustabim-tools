import { describe, expect, it } from "vitest";

import { parseSupabasePublicEnv } from "./supabase-env";

describe("parseSupabasePublicEnv", () => {
  it("считает полностью пустую конфигурацию неподключённой", () => {
    expect(
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toBeNull();
  });

  it("возвращает проверенную публичную конфигурацию", () => {
    expect(
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-with-safe-length",
      }),
    ).toEqual({
      url: "https://project.supabase.co",
      publicKey: "public-anon-key-with-safe-length",
    });
  });

  it("отклоняет частично заполненную конфигурацию", () => {
    expect(() =>
      parseSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toThrow();
  });
});
