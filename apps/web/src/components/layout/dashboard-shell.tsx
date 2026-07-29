"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  DashboardNavigation,
  DashboardPageLabel,
} from "@/components/layout/dashboard-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/logout-button";

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      className={`min-h-screen bg-slate-50 lg:grid ${
        isSidebarOpen ? "lg:grid-cols-[256px_1fr]" : "lg:grid-cols-[56px_1fr]"
      }`}
    >
      <aside
        id="dashboard-sidebar"
        aria-label="Боковое меню"
        className={`hidden border-r border-slate-200 bg-slate-950 text-white lg:flex ${
          isSidebarOpen ? "lg:flex-col" : "lg:items-start"
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={isSidebarOpen ? "m-3 self-end text-slate-300 hover:bg-slate-800 hover:text-white" : "m-2 text-slate-300 hover:bg-slate-800 hover:text-white"}
          aria-label={isSidebarOpen ? "Скрыть меню" : "Показать меню"}
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
        >
          {isSidebarOpen ? (
            <PanelLeftClose aria-hidden="true" className="size-5" />
          ) : (
            <PanelLeftOpen aria-hidden="true" className="size-5" />
          )}
        </Button>
        {isSidebarOpen ? (
          <>
            <Link
              href="/"
              className="m-5 mt-0 flex items-center gap-3 rounded-lg p-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm">
                UB
              </span>
              UstaBIM Tools
            </Link>
            <nav
              aria-label="Навигация кабинета"
              className="flex-1 space-y-1 px-4 py-4"
            >
              <DashboardNavigation />
            </nav>
            <p className="border-t border-slate-800 p-6 text-xs leading-5 text-slate-400">
              Защищённая сессия
            </p>
          </>
        ) : null}
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Рабочее пространство
              </p>
              <DashboardPageLabel />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Сессия активна</Badge>
              {userEmail ? (
                <span className="hidden max-w-48 truncate text-sm text-slate-600 md:inline">
                  {userEmail}
                </span>
              ) : null}
              <LogoutButton />
            </div>
          </div>
          <nav
            aria-label="Мобильная навигация кабинета"
            className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden"
          >
            <DashboardNavigation mobile />
          </nav>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
