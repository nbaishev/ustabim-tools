"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

const minimumPasswordLength = 12;

function clearPasswords(form: HTMLFormElement) {
  for (const name of ["password", "passwordConfirmation"]) {
    const input = form.elements.namedItem(name);
    if (input instanceof HTMLInputElement) input.value = "";
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");

    setMessage("");

    if (password.length < minimumPasswordLength) {
      setMessage(`Пароль должен содержать не менее ${minimumPasswordLength} символов`);
      return;
    }

    if (password !== confirmation) {
      setMessage("Пароли не совпадают");
      return;
    }

    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage("Не удалось изменить пароль. Запросите новую ссылку.");
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login?reason=password-updated");
      router.refresh();
    } catch {
      setMessage("Не удалось изменить пароль. Запросите новую ссылку.");
    } finally {
      clearPasswords(form);
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-slate-800"
        >
          Новый пароль
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={minimumPasswordLength}
          required
          disabled={isPending}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
        <p className="text-xs text-slate-500">Минимум 12 символов</p>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password-confirmation"
          className="block text-sm font-medium text-slate-800"
        >
          Повторите пароль
        </label>
        <input
          id="password-confirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={minimumPasswordLength}
          required
          disabled={isPending}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        <KeyRound aria-hidden="true" className="size-4" />
        {isPending ? "Сохранение…" : "Сохранить новый пароль"}
      </Button>

      <p
        role="alert"
        aria-live="polite"
        className="min-h-6 text-center text-sm font-medium text-red-700"
      >
        {message}
      </p>
    </form>
  );
}
