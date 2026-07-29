"use client";

import { UserPlus, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

type InviteResponse = { error?: { message?: unknown } };

export function InviteProjectMemberButton({ projectId }: { projectId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const payload = (await response.json()) as InviteResponse;
      if (!response.ok) {
        throw new Error(
          typeof payload.error?.message === "string"
            ? payload.error.message
            : "Не удалось добавить участника. Попробуйте ещё раз.",
        );
      }

      setNotice("Участник добавлен в проект.");
      setEmail("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Не удалось добавить участника. Попробуйте ещё раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setDialogOpen(true)}>
        <UserPlus aria-hidden="true" className="size-4" />
        Добавить участника
      </Button>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="invite-member-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="invite-member-title" className="text-lg font-semibold text-slate-950">Добавить участника</h2>
                <p className="mt-1 text-sm text-slate-500">Пользователь должен быть зарегистрирован и подтвердить email.</p>
              </div>
              <button type="button" aria-label="Закрыть форму добавления участника" onClick={() => setDialogOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
              <label className="block text-sm font-medium text-slate-800">
                Email пользователя
                <input type="email" required maxLength={254} autoFocus value={email} onChange={(event) => { setEmail(event.currentTarget.value); setNotice(""); }} placeholder="colleague@example.com" className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Роль
                <select value={role} onChange={(event) => setRole(event.currentTarget.value as "editor" | "viewer")} className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="editor">Редактор — может работать с данными проекта</option>
                  <option value="viewer">Наблюдатель — доступ только для просмотра</option>
                </select>
              </label>

              {notice ? <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">{notice}</p> : null}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Закрыть</Button>
                <Button type="submit" disabled={!email.trim() || isSubmitting}>
                  <UserPlus aria-hidden="true" className="size-4" />
                  {isSubmitting ? "Добавляем…" : "Добавить"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
