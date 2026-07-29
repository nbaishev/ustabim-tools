"use client";

import { AlertTriangle, CheckCircle2, Clock3, Droplets, FileSearch, FileText, Layers3, LoaderCircle, MapPin, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, validateGeologyPdf } from "@/features/geology/geology-file-validation";
import type { GeologyJobStatus, GeologyReport } from "@/features/geology/n8n-geology";
import { cn } from "@/shared/lib/utils";

type JobCapability = { jobId: string; jobAccessToken: string };
const storageKey = "ustabim-geology-mvp-job";

const statusCopy: Record<GeologyJobStatus, string> = {
  queued: "Задача ожидает запуска",
  processing: "Отчёт анализируется",
  done: "Структурированный отчёт готов",
  error: "Не удалось обработать PDF",
};

function readSavedJob(): JobCapability | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (typeof parsed === "object" && parsed !== null && "jobId" in parsed && "jobAccessToken" in parsed
      && typeof parsed.jobId === "string" && typeof parsed.jobAccessToken === "string") {
      return { jobId: parsed.jobId, jobAccessToken: parsed.jobAccessToken };
    }
  } catch { sessionStorage.removeItem(storageKey); }
  return null;
}

function depthLabel(from?: number | null, to?: number | null) {
  if (from == null && to == null) return "Глубина не указана";
  if (from != null && to != null) return `${from}–${to} м`;
  return from != null ? `от ${from} м` : `до ${to} м`;
}

function riskTone(severity?: string) {
  if (severity === "high") return { label: "Высокий", className: "border-red-200 bg-red-50 text-red-800" };
  if (severity === "medium") return { label: "Средний", className: "border-amber-200 bg-amber-50 text-amber-800" };
  return { label: severity === "low" ? "Низкий" : "Не указан", className: "border-slate-200 bg-slate-50 text-slate-700" };
}

function ReportSection({ icon: Icon, title, count, children }: { icon: typeof Layers3; title: string; count?: number; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon className="size-4 text-blue-700" />{title}</h3>
      {count != null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>}
    </div>
    {children}
  </section>;
}

function GeologyReportView({ report }: { report: GeologyReport }) {
  const ige = report.ige || [];
  const boreholes = report.boreholes || [];
  const groundwater = report.groundwater || [];
  const risks = report.risks || [];
  const sources = report.sources || [];

  return <div className="space-y-5 p-5 sm:p-6">
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Краткая сводка</p>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700">{report.summary || "Сводка не извлечена из исходного отчёта."}</p>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <ReportSection icon={Layers3} title="Инженерно-геологические элементы" count={ige.length}>
        {ige.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-medium">ИГЭ</th><th className="px-4 py-3 font-medium">Описание</th><th className="px-4 py-3 font-medium">Интервал</th></tr></thead><tbody className="divide-y divide-slate-100">{ige.map((item, index) => <tr key={`${item.code}-${index}`}><td className="px-4 py-3 font-semibold text-slate-900">{item.code || "—"}</td><td className="px-4 py-3 leading-5 text-slate-600">{item.description || "Описание не извлечено"}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{depthLabel(item.depthFrom, item.depthTo)}</td></tr>)}</tbody></table></div> : <p className="px-4 py-5 text-sm text-slate-500">ИГЭ не извлечены.</p>}
      </ReportSection>

      <ReportSection icon={MapPin} title="Скважины" count={boreholes.length}>
        {boreholes.length ? <ul className="divide-y divide-slate-100">{boreholes.map((item, index) => <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3"><span className="font-medium text-slate-900">{item.name || "Скважина без названия"}</span><span className="whitespace-nowrap text-sm text-slate-600">{item.depth != null ? `${item.depth} м` : "Глубина не указана"}</span></li>)}</ul> : <p className="px-4 py-5 text-sm text-slate-500">Сведения о скважинах не извлечены.</p>}
      </ReportSection>

      <ReportSection icon={Droplets} title="Грунтовые воды" count={groundwater.length}>
        {groundwater.length ? <ul className="divide-y divide-slate-100">{groundwater.map((item, index) => <li key={`${item.borehole}-${index}`} className="px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-slate-900">{item.borehole || "Скважина не указана"}</span><span className="text-sm text-blue-800">{item.depth != null ? `${item.depth} м` : "Глубина не указана"}</span></div>{item.note && <p className="mt-1 text-sm leading-5 text-slate-600">{item.note}</p>}</li>)}</ul> : <p className="px-4 py-5 text-sm text-slate-500">Сведения о грунтовых водах не извлечены.</p>}
      </ReportSection>

      <ReportSection icon={AlertTriangle} title="Факторы риска" count={risks.length}>
        {risks.length ? <ul className="space-y-2 p-3">{risks.map((item, index) => { const tone = riskTone(item.severity); return <li key={`${item.text}-${index}`} className="rounded-lg border border-slate-100 p-3"><div className="flex flex-wrap items-start gap-2"><span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", tone.className)}>{tone.label}</span><p className="min-w-0 flex-1 text-sm leading-5 text-slate-700">{item.text || "Описание риска не извлечено"}</p></div></li>; })}</ul> : <p className="px-4 py-5 text-sm text-slate-500">Факторы риска не извлечены.</p>}
      </ReportSection>
    </div>

    {sources.length > 0 && <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-slate-800">Фрагменты исходного отчёта ({sources.length})</summary><ul className="mt-3 space-y-3 border-t border-slate-200 pt-3">{sources.map((source, index) => <li key={`${source.page}-${index}`} className="text-sm leading-6 text-slate-600"><span className="mr-2 font-medium text-slate-800">{source.page != null ? `Стр. ${source.page}` : "Страница не указана"}</span>{source.excerpt || "Фрагмент не извлечён"}</li>)}</ul></details>}
  </div>;
}

export function GeologyWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [job, setJob] = useState<JobCapability | null>(null);
  const [status, setStatus] = useState<GeologyJobStatus | null>(null);
  const [report, setReport] = useState<GeologyReport | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setJob(readSavedJob()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!job || status === "done" || status === "error") return;
    let stopped = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/geology/jobs/${encodeURIComponent(job.jobId)}?token=${encodeURIComponent(job.jobAccessToken)}`, { cache: "no-store" });
        const payload = await response.json() as { data?: { status?: GeologyJobStatus; report?: GeologyReport | null }; error?: { message?: string } };
        if (!response.ok || !payload.data?.status) throw new Error(payload.error?.message || "Не удалось получить статус анализа.");
        if (!stopped) { setStatus(payload.data.status); setReport(payload.data.report || null); }
      } catch (cause) { if (!stopped) setError(cause instanceof Error ? cause.message : "Не удалось получить статус анализа."); }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 5_000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, [job, status]);

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const validationError = validateGeologyPdf(nextFile);
    if (validationError) { setFile(null); setError(validationError); return; }
    setFile(nextFile); setError(""); setJob(null); setStatus(null); setReport(null); sessionStorage.removeItem(storageKey);
  }

  async function startAnalysis() {
    if (!file || isStarting) return;
    setIsStarting(true); setError("");
    try {
      const formData = new FormData(); formData.set("file", file);
      const response = await fetch("/api/geology/jobs", { method: "POST", body: formData });
      const payload = await response.json() as { data?: JobCapability & { status?: GeologyJobStatus }; error?: { message?: string } };
      if (!response.ok || !payload.data?.jobId || !payload.data.jobAccessToken) throw new Error(payload.error?.message || "Не удалось запустить анализ.");
      const capability = { jobId: payload.data.jobId, jobAccessToken: payload.data.jobAccessToken };
      sessionStorage.setItem(storageKey, JSON.stringify(capability));
      setJob(capability); setStatus(payload.data.status || "queued");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось запустить анализ."); }
    finally { setIsStarting(false); }
  }

  const busy = isStarting || status === "queued" || status === "processing";

  return <div className="mx-auto max-w-[1500px]">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><Badge variant="secondary">Предварительный анализ</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Анализ инженерной геологии</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Загрузите PDF-отчёт ИГИ. Он временно передаётся на сервер, а извлечённые сведения отображаются в структурированном виде.</p></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950 lg:max-w-sm">Результат автоматического извлечения не является инженерным заключением и должен быть проверен специалистом.</div>
    </section>
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
      <Card><CardHeader className="border-b border-slate-100"><CardTitle>Исходный отчёт</CardTitle><p className="mt-1 text-sm text-slate-500">Один PDF до 100 МБ. Временные файлы и задача удаляются через 24 часа.</p></CardHeader><CardContent className="p-5 sm:p-6">
        {file ? <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><FileText className="size-6" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-950">{file.name}</p><p className="mt-1 text-sm text-slate-600">PDF · {formatFileSize(file.size)}</p></div><button type="button" aria-label="Удалить выбранный PDF" disabled={busy} onClick={() => { setFile(null); setJob(null); setStatus(null); setReport(null); setError(""); sessionStorage.removeItem(storageKey); }} className="self-start rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-950 disabled:opacity-50 sm:self-auto"><X className="size-5" /></button></div> : <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); acceptFile(event.dataTransfer.files?.[0]); }} className={cn("flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors", isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/70")}><span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Upload className="size-7" /></span><h2 className="mt-5 text-lg font-semibold text-slate-950">Перетащите сюда отчёт ИГИ</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Поддерживается один PDF до 100 МБ.</p><Button type="button" className="mt-5" onClick={() => inputRef.current?.click()}>Выбрать PDF</Button><input ref={inputRef} type="file" aria-label="Выбрать PDF" accept="application/pdf,.pdf" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => { acceptFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></div>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="size-4 text-emerald-600" />Данные проекта и структурированные результаты в MVP не сохраняются.</p><Button type="button" disabled={!file || busy} onClick={() => void startAnalysis()}>{isStarting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Начать анализ</Button></div>
      </CardContent></Card>
      <Card><CardHeader className="border-b border-slate-100"><CardTitle>Статус обработки</CardTitle></CardHeader><CardContent className="p-5"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{busy ? <LoaderCircle className="size-5 animate-spin" /> : <Clock3 className="size-5" />}</span><div><p className="font-semibold text-slate-900">{status ? statusCopy[status] : "Задача ещё не запущена"}</p><p className="mt-1 text-sm leading-6 text-slate-500">{status === "done" ? "Ниже доступна структурированная сводка извлечённых данных." : status === "error" ? "Резерв demo-лимита возвращён. Можно повторить запуск." : "Статус обновляется каждые 5 секунд в этой вкладке."}</p></div></div></CardContent></Card>
    </section>
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Результат анализа</h2><p className="mt-1 text-xs text-slate-500">Извлечённые сведения требуют проверки профильным специалистом.</p></div>{report ? <GeologyReportView report={report} /> : <div className="grid min-h-56 place-items-center px-6 py-12 text-center"><div className="max-w-md"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><FileSearch className="size-6" /></span><h3 className="mt-4 font-semibold text-slate-900">{status === "done" ? "Структурированный отчёт не получен" : "Результат появится после обработки"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Автоматические выводы не заменяют инженерную проверку.</p></div></div>}</section>
  </div>;
}
