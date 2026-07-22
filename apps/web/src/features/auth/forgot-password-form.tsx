"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

const safeSuccessMessage =
  "Если пользователь с таким email существует, на него отправлена ссылка для восстановления пароля.";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/reset-password");

    setMessage("");
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString(),
      });
      form.reset();
      setMessage(safeSuccessMessage);
    } catch {
      setMessage(
        "Supabase не настроен или временно недоступен. Проверьте конфигурацию проекта.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="recovery-email"
          className="block text-sm font-medium text-slate-800"
        >
          Email
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="name@example.com"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        <Mail aria-hidden="true" className="size-4" />
        {isPending ? "Отправка…" : "Отправить ссылку"}
      </Button>

      <p
        role="status"
        aria-live="polite"
        className="min-h-6 text-center text-sm font-medium text-slate-700"
      >
        {message}
      </p>
    </form>
  );
}
