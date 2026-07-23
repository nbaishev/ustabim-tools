"use client";

import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

type LoginFormProps = {
  nextPath?: string;
};

function clearPassword(form: HTMLFormElement) {
  const password = form.elements.namedItem("password");

  if (password instanceof HTMLInputElement) password.value = "";
}

export function LoginForm({ nextPath = "/app" }: LoginFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setMessage("");
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(
          error.message.toLowerCase().includes("invalid login credentials")
            ? "Неверный email или пароль"
            : "Не удалось выполнить вход. Попробуйте ещё раз.",
        );
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setMessage(
        "Supabase не настроен или временно недоступен. Проверьте конфигурацию проекта.",
      );
    } finally {
      clearPassword(form);
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="name@example.com"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-slate-800">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        <LogIn aria-hidden="true" className="size-4" />
        {isPending ? "Выполняется вход…" : "Войти"}
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
