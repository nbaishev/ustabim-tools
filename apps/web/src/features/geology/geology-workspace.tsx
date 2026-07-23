"use client";

import {
  CheckCircle2,
  Clock3,
  Droplets,
  FileSearch,
  FileText,
  Layers3,
  MapPin,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatFileSize,
  validateGeologyPdf,
} from "@/features/geology/geology-file-validation";
import { cn } from "@/shared/lib/utils";

const resultTabs = ["Сводка", "ИГЭ", "Скважины", "Параметры", "Риски"] as const;
type ResultTab = (typeof resultTabs)[number];

const resultCapabilities = [
  {
    title: "Инженерно-геологические элементы",
    description: "Коды ИГЭ, описания, слои и извлечённые характеристики.",
    icon: Layers3,
  },
  {
    title: "Скважины и разрезы",
    description: "Глубины, отметки, интервалы слоёв и привязка к ИГЭ.",
    icon: MapPin,
  },
  {
    title: "Грунтовые воды",
    description: "Уровни появления и установления с указанием источника.",
    icon: Droplets,
  },
  {
    title: "Риски и неоднозначности",
    description: "Предварительные замечания, требующие ручной проверки.",
    icon: ShieldAlert,
  },
] as const;

const pipeline = [
  ["1", "Извлечение", "Текст и таблицы PDF"],
  ["2", "Распознавание", "OCR для сканов"],
  ["3", "Структурирование", "ИГЭ и параметры"],
  ["4", "Проверка", "Источники и риски"],
] as const;

export function GeologyWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultTab>("Сводка");

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const validationError = validateGeologyPdf(nextFile);
    if (validationError) {
      setFile(null);
      setNotice("");
      setError(validationError);
      return;
    }

    setFile(nextFile);
    setError("");
    setNotice("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary">Предварительный анализ</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Анализ инженерной геологии
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Загрузите PDF-отчёт ИГИ, чтобы собрать ИГЭ, данные скважин,
            характеристики грунтов, уровни вод и замечания в едином рабочем виде.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950 lg:max-w-sm">
          Результат автоматического извлечения не является инженерным заключением и
          должен быть проверен специалистом.
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Исходный отчёт</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Файл обрабатывается локально в браузере и не передаётся на сервер.
                </p>
              </div>
              <label className="text-sm text-slate-600">
                <span className="mb-1.5 block text-xs font-medium text-slate-500">
                  Проект
                </span>
                <select
                  disabled
                  aria-label="Проект для геологического отчёта"
                  className="h-9 min-w-52 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
                >
                  <option>Нет доступных проектов</option>
                </select>
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {file ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <FileText aria-hidden="true" className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-950">{file.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    PDF · {formatFileSize(file.size)} · файл выбран
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Удалить выбранный PDF"
                  onClick={() => {
                    setFile(null);
                    setNotice("");
                  }}
                  className="self-start rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-950 sm:self-auto"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (event.currentTarget === event.target) setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={cn(
                  "flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50/70",
                )}
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Upload aria-hidden="true" className="size-7" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">
                  Перетащите сюда отчёт ИГИ
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Поддерживается один PDF до 100 МБ. Для сканированных страниц
                  используется отдельный этап OCR.
                </p>
                <Button type="button" className="mt-5" onClick={() => inputRef.current?.click()}>
                  Выбрать PDF
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  aria-label="Выбрать PDF"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {error ? (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {notice}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
                <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-600" />
                Исходные значения и страницы-источники будут сохраняться отдельно.
              </p>
              <Button
                type="button"
                disabled={!file}
                onClick={() =>
                  setNotice(
                    "Анализ не запущен: сначала необходимо подключить проекты, приватный Storage и geology workflow.",
                  )
                }
              >
                <Sparkles aria-hidden="true" className="size-4" />
                Начать анализ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Что будет извлечено</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {resultCapabilities.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-3 px-5 py-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="pipeline-heading" className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 id="pipeline-heading" className="text-lg font-semibold text-slate-950">
            Этапы обработки
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 aria-hidden="true" className="size-4" />
            Для запуска выберите проект
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {pipeline.map(([number, title, description]) => (
            <div key={number} className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {number}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="result-heading" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="result-heading" className="font-semibold text-slate-950">
              Результат анализа
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Структурированные данные с привязкой к страницам исходного отчёта.
            </p>
          </div>
          <Badge variant="secondary">Нет данных</Badge>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2 sm:px-5">
          {resultTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-900",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <FileSearch aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">
              В разделе «{activeTab}» нет данных
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Здесь появятся проверяемые результаты после серверной обработки PDF.
              Автоматические выводы будут явно отделены от подтверждённых данных.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
