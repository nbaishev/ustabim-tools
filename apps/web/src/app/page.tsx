import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  FileText,
  Layers3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plannedTools } from "@/features/tools/tool-catalog";
import { ToolCard } from "@/features/tools/tool-card";
import { hasActiveSupabaseSession } from "@/shared/lib/supabase/server";

const workSteps = [
  "Создайте защищённый аккаунт",
  "Откройте личный кабинет",
  "Выберите инструмент для текущей задачи",
];

const benefits = [
  {
    icon: Box,
    title: "Откройте модель",
    description:
      "Просматривайте локальный IFC прямо в браузере: геометрия, структура, свойства, измерения и сечения.",
  },
  {
    icon: FileText,
    title: "Сверяйте контекст",
    description:
      "Держите под рукой проектные данные и инструменты для работы с инженерными документами.",
  },
  {
    icon: Sparkles,
    title: "Принимайте решения осознанно",
    description:
      "Используйте автоматизацию как вспомогательный слой, сохраняя экспертную проверку результатов.",
  },
];

export default async function Home() {
  const isAuthenticated = await hasActiveSupabaseSession();
  const primaryHref = isAuthenticated ? "/app" : "/register";
  const primaryLabel = isAuthenticated ? "Перейти в кабинет" : "Создать аккаунт";

  return (
    <>
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main>
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_30%,rgba(37,99,235,0.35),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:48px_48px]"
          />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-28">
            <div className="relative z-10 max-w-3xl self-center">
              <Badge className="border border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/10">
                Инженерная среда для BIM
              </Badge>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
                BIM-данные и инженерные задачи — в одном контексте
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                Работайте с локальными IFC-моделями, документацией и инженерными
                инструментами в понятном защищённом рабочем пространстве.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                {isAuthenticated ? null : (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-slate-600 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/login">Войти в аккаунт</Link>
                  </Button>
                )}
              </div>
              <div className="mt-9 flex items-center gap-2 text-sm text-slate-300">
                <LockKeyhole aria-hidden="true" className="size-4 text-blue-300" />
                Защищённый вход и разграничение доступа
              </div>
            </div>

            <div className="relative min-h-72 lg:min-h-full">
              <div className="absolute inset-0 rotate-2 rounded-3xl bg-blue-500/20 blur-2xl" />
              <div className="relative h-full overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-black/40">
                <Image
                  src="/images/bim-hero.png"
                  alt="Абстрактная цифровая BIM-модель"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent p-6 pt-24 sm:p-8 sm:pt-28">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
                    <Layers3 aria-hidden="true" className="size-4" />
                    Единый рабочий контекст
                  </div>
                  <p className="mt-3 max-w-sm text-xl font-medium tracking-tight">
                    Модель, документы и инструменты — без переключения между
                    разрозненными средами.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Для ежедневной инженерной работы
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Меньше ручной рутины. Больше ясности в данных.
                </h2>
              </div>
              <p className="max-w-2xl leading-7 text-slate-600">
                UstaBIM Tools собирает ключевые точки работы с проектом в одной
                среде — от осмотра модели до ориентирования в документах.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Инструменты платформы
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Инструменты для работы с данными проекта.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Выберите направление работы, подходящее для вашей инженерной задачи.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {plannedTools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-24 border-y border-slate-200 bg-slate-950 py-16 text-white sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
                Простой старт
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                От аккаунта к рабочему пространству за несколько шагов.
              </h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {workSteps.map((step, index) => (
                <li key={step} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <span className="text-sm font-semibold text-blue-300">0{index + 1}</span>
                  <p className="mt-8 text-lg font-medium">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-300" />
              Инженерные расчёты и автоматизированный анализ носят вспомогательный
              характер и требуют проверки квалифицированным специалистом.
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
              Начните работу
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Соберите инженерную работу в одной среде.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              Создайте аккаунт, чтобы перейти к инструментам UstaBIM Tools.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
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
