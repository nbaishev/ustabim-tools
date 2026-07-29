import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-800 text-sm text-white">
            UB
          </span>
          <span className="hidden sm:inline">UstaBIM Tools</span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-6 lg:flex">
          <a
            href="#capabilities"
            className="rounded text-sm text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Возможности
          </a>
          <a
            href="#workflow"
            className="rounded text-sm text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Как это работает
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/app">Личный кабинет</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
