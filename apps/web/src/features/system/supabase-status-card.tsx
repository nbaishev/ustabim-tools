"use client";

import { useState } from "react";
import { Database, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type VisibleStatus =
  | "idle"
  | "checking"
  | "connected"
  | "not_configured"
  | "misconfigured"
  | "unavailable";

const statusLabels: Record<VisibleStatus, string> = {
  idle: "Не проверено",
  checking: "Проверка…",
  connected: "Подключено",
  not_configured: "Не настроено",
  misconfigured: "Ошибка настройки",
  unavailable: "Недоступно",
};

function isVisibleStatus(value: unknown): value is VisibleStatus {
  return typeof value === "string" && value in statusLabels;
}

export function SupabaseStatusCard() {
  const [status, setStatus] = useState<VisibleStatus>("idle");

  async function checkConnection() {
    setStatus("checking");

    try {
      const response = await fetch("/api/health/supabase", {
        method: "GET",
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      const candidate =
        typeof payload === "object" && payload !== null && "data" in payload
          ? (payload.data as { status?: unknown }).status
          : undefined;

      setStatus(isVisibleStatus(candidate) ? candidate : "unavailable");
    } catch {
      setStatus("unavailable");
    }
  }

  return (
    <Card className="mt-8 flex-row items-center justify-between gap-4 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Database aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">Соединение с Supabase</p>
            <Badge
              variant={status === "connected" ? "success" : "secondary"}
              data-testid="supabase-status"
            >
              {statusLabels[status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Проверяется только доступность проекта. Авторизация не выполняется.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={status === "checking"}
        onClick={checkConnection}
        className="shrink-0"
      >
        <RefreshCw
          aria-hidden="true"
          className={status === "checking" ? "size-4 animate-spin" : "size-4"}
        />
        <span className="hidden sm:inline">Проверить</span>
      </Button>
    </Card>
  );
}
