import {
  Bot,
  Box,
  Calculator,
  FolderKanban,
  LayoutDashboard,
  Settings,
  TestTubeDiagonal,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const navigation = [
  { label: "Обзор", icon: LayoutDashboard, active: true },
  { label: "Проекты", icon: FolderKanban },
  { label: "IFC-модели", icon: Box },
  { label: "ИИ-чат", icon: Bot },
  { label: "Геология", icon: TestTubeDiagonal },
  { label: "Калькуляторы", icon: Calculator },
  { label: "Настройки", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
        <Link
          href="/"
          className="m-5 flex items-center gap-3 rounded-lg p-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm">
            UB
          </span>
          UstaBIM Tools
        </Link>
        <nav aria-label="Навигация кабинета" className="flex-1 space-y-1 px-4 py-4">
          {navigation.map(({ label, icon: Icon, active }) => (
            <Link
              key={label}
              href="/app"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                active
                  ? "bg-blue-600 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="border-t border-slate-800 p-6 text-xs leading-5 text-slate-400">
          Интерфейсный прототип
          <br />
          Без подключения к данным
        </p>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Рабочее пространство
              </p>
              <p className="font-semibold text-slate-950">Обзор</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Демо</Badge>
              <Button type="button" variant="outline" size="sm" aria-label="Профиль — демо">
                <UserRound aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Профиль</span>
              </Button>
            </div>
          </div>
          <nav
            aria-label="Мобильная навигация кабинета"
            className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden"
          >
            {navigation.map(({ label, active }) => (
              <Link
                key={label}
                href="/app"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  active ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
