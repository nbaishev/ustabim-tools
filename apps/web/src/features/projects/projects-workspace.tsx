"use client";

import {
  Bot,
  Box,
  Calculator,
  FileStack,
  FolderKanban,
  Plus,
  Search,
  TestTubeDiagonal,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

const filters = ["Все", "Мои", "Совместные"] as const;
type ProjectFilter = (typeof filters)[number];

const projectSections = [
  {
    title: "Файлы",
    description: "Приватные IFC, PDF и другие исходные документы проекта.",
    icon: FileStack,
  },
  {
    title: "IFC-модели",
    description: "Модели, структура, свойства, сохранённые виды и разрезы.",
    icon: Box,
  },
  {
    title: "Геология",
    description: "Исходные отчёты ИГИ, извлечённые данные и проверка рисков.",
    icon: TestTubeDiagonal,
  },
  {
    title: "ИИ-чат",
    description: "Диалоги с разрешённым контекстом файлов конкретного проекта.",
    icon: Bot,
  },
  {
    title: "Расчёты",
    description: "Версионированные запуски калькуляторов и сохранённые результаты.",
    icon: Calculator,
  },
  {
    title: "Команда",
    description: "Участники, роли и управляемый доступ к данным проекта.",
    icon: UsersRound,
  },
] as const;

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setNotice(
      "Не удалось создать проект. Введённые данные сохранены в форме.",
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="create-project-title" className="text-lg font-semibold text-slate-950">
              Новый проект
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Создатель автоматически станет владельцем проекта.
            </p>
          </div>
          <button
            type="button"
            aria-label="Закрыть форму проекта"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          <label className="block text-sm font-medium text-slate-800">
            Название проекта
            <input
              autoFocus
              required
              maxLength={120}
              value={name}
              onChange={(event) => {
                setName(event.currentTarget.value);
                setNotice("");
              }}
              placeholder="Например, Жилой комплекс на Абая"
              className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Описание
            <textarea
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(event) => {
                setDescription(event.currentTarget.value);
                setNotice("");
              }}
              placeholder="Краткое назначение, стадия и состав исходных данных"
              className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {notice ? (
            <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
              {notice}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              <Plus aria-hidden="true" className="size-4" />
              Создать проект
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProjectsWorkspace() {
  const [filter, setFilter] = useState<ProjectFilter>("Все");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasFilter = filter !== "Все" || query.trim().length > 0;

  return (
    <div className="mx-auto max-w-[1500px]">
      {dialogOpen ? <CreateProjectDialog onClose={() => setDialogOpen(false)} /> : null}

      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary">Рабочее пространство</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Проекты
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Объединяйте BIM-модели, инженерные документы, анализы, расчёты и
            участников в изолированном контуре одного объекта.
          </p>
        </div>
        <Button type="button" size="lg" onClick={() => setDialogOpen(true)}>
          <Plus aria-hidden="true" className="size-5" />
          Новый проект
        </Button>
      </section>

      <section aria-label="Статистика проектов" className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Всего проектов", "0"],
          ["Мои проекты", "0"],
          ["Совместные", "0"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-2xl font-semibold text-slate-950">{value}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="project-list-heading" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div>
            <h2 id="project-list-heading" className="font-semibold text-slate-950">
              Все проекты
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Будут показаны только проекты, доступные текущему пользователю.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block">
              <span className="sr-only">Поиск проектов</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Поиск проектов"
                className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </label>
            <div className="flex rounded-lg bg-slate-100 p-1">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === item
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid min-h-80 place-items-center px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FolderKanban aria-hidden="true" className="size-7" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-slate-950">
              {hasFilter ? "Проекты не найдены" : "Создайте первый проект"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasFilter
                ? "Измените поисковый запрос или сбросьте фильтры."
                : "Проект станет общей точкой доступа к файлам, моделям, анализам и работе команды."}
            </p>
            {hasFilter ? (
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setQuery("");
                  setFilter("Все");
                }}
              >
                Сбросить фильтры
              </Button>
            ) : (
              <Button type="button" className="mt-5" onClick={() => setDialogOpen(true)}>
                <Plus aria-hidden="true" className="size-4" />
                Создать проект
              </Button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="project-contents-heading" className="mt-10">
        <div>
          <h2 id="project-contents-heading" className="text-xl font-semibold text-slate-950">
            Что будет внутри проекта
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Все разделы используют один идентификатор проекта и наследуют его
            правила доступа. Файл другого проекта нельзя будет подключить к анализу
            или чату.
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projectSections.map(({ title, description, icon: Icon }) => (
            <Card key={title}>
              <CardContent className="flex gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-700">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
