"use client";

import { FileUp, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { validateIfcFileMetadata } from "@/features/ifc/ifc-file-validation";

type IfcModel = {
  id: string;
  fileId: string;
  status: "uploaded" | "failed";
  createdAt: string;
  originalName: string;
  sizeBytes: number;
  uploadedBy: string;
};

type ApiResponse = { data?: unknown; error?: { message?: unknown } };

function messageFrom(payload: ApiResponse, fallback: string) {
  return typeof payload.error?.message === "string" ? payload.error.message : fallback;
}

function formatSize(bytes: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024) + " МБ";
}

export function ProjectIfcModels({ projectId, canWrite, userId }: { projectId: string; canWrite: boolean; userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<IfcModel[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/ifc-models`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !Array.isArray(payload.data)) throw new Error(messageFrom(payload, "Не удалось загрузить IFC-модели."));
      setModels(payload.data as IfcModel[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось загрузить IFC-модели.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadModels(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadModels]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || isUploading) return;
    const validationError = validateIfcFileMetadata(file);
    if (validationError) { setNotice(validationError); return; }
    setIsUploading(true);
    setNotice("");
    try {
      const create = await fetch(`/api/projects/${projectId}/ifc-models/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ fileName: file.name, contentType: "application/octet-stream", sizeBytes: file.size }),
      });
      const createPayload = (await create.json()) as ApiResponse;
      const upload = createPayload.data as { fileId?: unknown; uploadUrl?: unknown } | undefined;
      if (!create.ok || typeof upload?.fileId !== "string" || typeof upload.uploadUrl !== "string") throw new Error(messageFrom(createPayload, "Не удалось подготовить загрузку IFC."));
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream", "x-upsert": "false" },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Не удалось загрузить IFC в защищённое хранилище.");
      const complete = await fetch(`/api/projects/${projectId}/ifc-models/${upload.fileId}/complete`, { method: "POST" });
      const completePayload = (await complete.json()) as ApiResponse;
      if (!complete.ok) throw new Error(messageFrom(completePayload, "Не удалось подтвердить IFC-файл."));
      setNotice("IFC-модель загружена и готова к просмотру.");
      await loadModels();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось загрузить IFC.");
    } finally {
      setIsUploading(false);
    }
  }

  async function removeModel(model: IfcModel) {
    if (deletingId || !window.confirm(`Удалить «${model.originalName}» из проекта?`)) return;
    setDeletingId(model.id); setNotice("");
    try {
      const response = await fetch(`/api/projects/${projectId}/ifc-models/${model.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as ApiResponse;
        throw new Error(messageFrom(payload, "Не удалось удалить IFC-модель."));
      }
      setModels((current) => current.filter((item) => item.id !== model.id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось удалить IFC-модель.");
    } finally { setDeletingId(null); }
  }

  return <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div><h2 className="text-lg font-semibold text-slate-950">IFC-модели</h2><p className="mt-1 text-sm text-slate-500">Приватные модели доступны участникам этого проекта.</p></div>
      {canWrite ? <><input ref={inputRef} className="sr-only" type="file" accept=".ifc" onChange={handleFileChange} /><Button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}><FileUp className="size-4" />{isUploading ? "Загрузка…" : "Загрузить IFC"}</Button></> : null}
    </div>
    {notice ? <p role="status" className="mx-5 mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:mx-6">{notice}</p> : null}
    <div className="divide-y divide-slate-100">
      {isLoading ? <div className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500 sm:px-6"><LoaderCircle className="size-4 animate-spin" />Загружаем модели…</div> : null}
      {!isLoading && models.length === 0 ? <p className="px-5 py-6 text-sm text-slate-500 sm:px-6">В проекте ещё нет IFC-моделей.</p> : null}
      {models.map((model) => <div key={model.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate font-medium text-slate-950">{model.originalName}</p><p className="mt-1 text-sm text-slate-500">{formatSize(model.sizeBytes)} · {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(model.createdAt))}</p></div><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/app/ifc?projectId=${projectId}&modelId=${model.id}`}>Открыть</Link></Button>{(canWrite || model.uploadedBy === userId) ? <Button type="button" size="sm" variant="outline" disabled={deletingId === model.id} onClick={() => void removeModel(model)} aria-label={`Удалить ${model.originalName}`}><Trash2 className="size-4" /></Button> : null}</div></div>)}
    </div>
  </section>;
}
