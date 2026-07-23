"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

type SignupError = {
  code?: string;
  message?: string;
  status?: number;
};

const accountExistenceCodes = new Set([
  "email_exists",
  "identity_already_exists",
  "user_already_exists",
]);

function signupErrorMessage(error: SignupError) {
  if (error.status === 429 || error.code?.startsWith("over_")) {
    return "Превышен лимит отправки писем. Подождите несколько минут и попробуйте снова.";
  }

  if (error.code === "email_provider_disabled") {
    return "Регистрация по email отключена в Supabase. Проверьте настройки Auth.";
  }

  if (error.code === "weak_password") {
    return "Supabase отклонил пароль как недостаточно надёжный. Используйте более сложный пароль.";
  }

  return "Не удалось отправить письмо подтверждения. Проверьте Auth logs и SMTP-настройки Supabase.";
}

function hidesAccountExistence(error: SignupError) {
  return (
    accountExistenceCodes.has(error.code ?? "") ||
    error.message?.toLowerCase() === "user already registered"
  );
}

function clearPasswords(form: HTMLFormElement) {
  for (const name of ["password", "passwordConfirmation"]) {
    const input = form.elements.namedItem(name);
    if (input instanceof HTMLInputElement) input.value = "";
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    setMessage("");
    setIsError(false);

    if (password.length < 12) {
      setMessage("Пароль должен содержать не менее 12 символов");
      setIsError(true);
      clearPasswords(form);
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("Пароли не совпадают");
      setIsError(true);
      clearPasswords(form);
      return;
    }

    setIsPending(true);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/app");
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl.toString() },
      });

      if (error && !hidesAccountExistence(error)) {
        setMessage(signupErrorMessage(error));
        setIsError(true);
        return;
      }

      form.reset();
      router.replace("/register/check-email");
    } catch {
      setMessage(
        "Supabase не настроен или временно недоступен. Проверьте конфигурацию проекта.",
      );
      setIsError(true);
    } finally {
      clearPasswords(form);
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-slate-800"
        >
          Email
        </label>
        <input
          id="register-email"
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
        <label
          htmlFor="register-password"
          className="block text-sm font-medium text-slate-800"
        >
          Пароль
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          disabled={isPending}
          aria-describedby="register-password-hint"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
        <p id="register-password-hint" className="text-xs text-slate-500">
          Не менее 12 символов.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="register-password-confirmation"
          className="block text-sm font-medium text-slate-800"
        >
          Повторите пароль
        </label>
        <input
          id="register-password-confirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          disabled={isPending}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        <UserPlus aria-hidden="true" className="size-4" />
        {isPending ? "Создание аккаунта…" : "Создать аккаунт"}
      </Button>

      <p
        role={isError ? "alert" : "status"}
        aria-live="polite"
        className={`min-h-6 text-center text-sm font-medium ${isError ? "text-red-700" : "text-slate-700"}`}
      >
        {message}
      </p>
    </form>
  );
}
