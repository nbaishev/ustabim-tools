"use client";

import { CheckCircle2, Clock3, Download, FileSearch, FileText, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, validateGeologyPdf } from "@/features/geology/geology-file-validation";
import type { GeologyJobStatus } from "@/features/geology/n8n-geology";
import { cn } from "@/shared/lib/utils";

type JobCapability = { jobId: string; jobAccessToken: string };
const storageKey = "ustabim-geology-mvp-job";

const statusCopy: Record<GeologyJobStatus, string> = {
  queued: "Задача ожидает запуска",
  processing: "Отчёт анализируется",
  done: "PDF-отчёт готов к скачиванию",
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

export function GeologyWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [job, setJob] = useState<JobCapability | null>(null);
  const [status, setStatus] = useState<GeologyJobStatus | null>(null);

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
        const payload = await response.json() as { data?: { status?: GeologyJobStatus }; error?: { message?: string } };
        if (!response.ok || !payload.data?.status) throw new Error(payload.error?.message || "Не удалось получить статус анализа.");
        if (!stopped) setStatus(payload.data.status);
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
    setFile(nextFile); setError(""); setJob(null); setStatus(null); sessionStorage.removeItem(storageKey);
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

  const downloadUrl = job && status === "done" ? `/api/geology/jobs/${encodeURIComponent(job.jobId)}/download?token=${encodeURIComponent(job.jobAccessToken)}` : null;
  const busy = isStarting || status === "queued" || status === "processing";

  return <div className="mx-auto max-w-[1500px]">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><Badge variant="secondary">Предварительный анализ</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Анализ инженерной геологии</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Загрузите PDF-отчёт ИГИ. Он временно передаётся на сервер для формирования отдельного PDF-отчёта.</p></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950 lg:max-w-sm">Результат автоматического извлечения не является инженерным заключением и должен быть проверен специалистом.</div>
    </section>
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
      <Card><CardHeader className="border-b border-slate-100"><CardTitle>Исходный отчёт</CardTitle><p className="mt-1 text-sm text-slate-500">Один PDF до 100 МБ. Временные файлы и задача удаляются через 24 часа.</p></CardHeader><CardContent className="p-5 sm:p-6">
        {file ? <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><FileText className="size-6" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-950">{file.name}</p><p className="mt-1 text-sm text-slate-600">PDF · {formatFileSize(file.size)}</p></div><button type="button" aria-label="Удалить выбранный PDF" disabled={busy} onClick={() => { setFile(null); setJob(null); setStatus(null); setError(""); sessionStorage.removeItem(storageKey); }} className="self-start rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-950 disabled:opacity-50 sm:self-auto"><X className="size-5" /></button></div> : <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); acceptFile(event.dataTransfer.files?.[0]); }} className={cn("flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors", isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/70")}><span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Upload className="size-7" /></span><h2 className="mt-5 text-lg font-semibold text-slate-950">Перетащите сюда отчёт ИГИ</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Поддерживается один PDF до 100 МБ.</p><Button type="button" className="mt-5" onClick={() => inputRef.current?.click()}>Выбрать PDF</Button><input ref={inputRef} type="file" aria-label="Выбрать PDF" accept="application/pdf,.pdf" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => { acceptFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></div>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="size-4 text-emerald-600" />Данные проекта и структурированные результаты в MVP не сохраняются.</p><Button type="button" disabled={!file || busy} onClick={() => void startAnalysis()}>{isStarting ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}Начать анализ</Button></div>
      </CardContent></Card>
      <Card><CardHeader className="border-b border-slate-100"><CardTitle>Статус обработки</CardTitle></CardHeader><CardContent className="p-5"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{busy ? <LoaderCircle className="size-5 animate-spin" /> : <Clock3 className="size-5" />}</span><div><p className="font-semibold text-slate-900">{status ? statusCopy[status] : "Задача ещё не запущена"}</p><p className="mt-1 text-sm leading-6 text-slate-500">{status === "error" ? "Резерв demo-лимита возвращён. Можно повторить запуск." : "Статус обновляется каждые 5 секунд в этой вкладке."}</p></div></div>{downloadUrl && <Button asChild className="mt-5 w-full"><a href={downloadUrl}><Download className="size-4" />Скачать PDF-отчёт</a></Button>}</CardContent></Card>
    </section>
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Результат анализа</h2><p className="mt-1 text-xs text-slate-500">MVP выдаёт только готовый PDF-отчёт: ИГЭ, скважины, параметры и риски не заполняются фиктивными данными.</p></div><div className="grid min-h-56 place-items-center px-6 py-12 text-center"><div className="max-w-md"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><FileSearch className="size-6" /></span><h3 className="mt-4 font-semibold text-slate-900">{status === "done" ? "Отчёт готов" : "Результат появится после обработки"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{status === "done" ? "Скачайте PDF выше и проверьте его у профильного специалиста." : "Автоматические выводы не заменяют инженерную проверку."}</p></div></div></section>
  </div>;
}
