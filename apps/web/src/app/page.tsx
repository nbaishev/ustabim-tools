import { ArrowRight, DraftingCompass, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plannedTools } from "@/features/tools/tool-catalog";
import { ToolCard } from "@/features/tools/tool-card";
import { hasActiveSupabaseSession } from "@/shared/lib/supabase/server";

export default async function Home() {
  const isAuthenticated = await hasActiveSupabaseSession();

  return (
    <>
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main>
        <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(110deg,#eff6ff_0%,#ffffff_52%,#f1f5f9_100%)]"
          />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.3fr_0.7fr] lg:px-8 lg:py-30">
            <div className="max-w-3xl">
              <Badge variant="secondary">Инженерная платформа</Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-balance text-slate-950 sm:text-5xl lg:text-6xl">
                Инженерные задачи в одном рабочем пространстве
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                UstaBIM Tools объединяет просмотр IFC-моделей,
                инженерные калькуляторы, ИИ-ассистента и предварительный анализ
                геологических отчётов в понятном веб-интерфейсе.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/app">
                    Открыть инструменты
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                {isAuthenticated ? null : (
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Войти</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <div className="w-full rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/50 sm:p-8">
                <div className="flex items-center justify-between">
                  <DraftingCompass aria-hidden="true" className="size-8 text-blue-300" />
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Рабочая среда
                  </span>
                </div>
                <p className="mt-16 text-2xl font-medium tracking-tight">
                  Точные данные. Проверяемые результаты. Единый проектный контекст.
                </p>
                <div className="mt-8 flex items-center gap-2 border-t border-slate-800 pt-5 text-sm text-slate-300">
                  <ShieldCheck aria-hidden="true" className="size-4 text-emerald-400" />
                  Архитектура с разграничением доступа
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-8 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Инструменты
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Всё необходимое для инженерного проекта
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Работайте с BIM-моделями, инженерными документами и проектными
                данными в едином пространстве.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {plannedTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-8 border-y border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight">О платформе</h2>
            <div className="space-y-4 leading-7 text-slate-600">
              <p>
                UstaBIM Tools — отдельный сервис для специалистов BIM и
                строительства с защищённым входом и единым рабочим пространством.
              </p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
                Инженерные расчёты и результаты автоматизированного анализа
                являются вспомогательными и должны проверяться квалифицированным
                специалистом.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <span>© UstaBIM Tools</span>
        <span>Инженерные инструменты для BIM и строительства</span>
      </footer>
    </>
  );
}
