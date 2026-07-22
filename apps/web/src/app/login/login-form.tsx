"use client";

import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

const placeholderMessage = "Авторизация будет подключена на следующем этапе";

export function LoginForm() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setMessage(placeholderMessage);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          placeholder="name@example.com"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="password" className="block text-sm font-medium text-slate-800">
            Пароль
          </label>
          <button
            type="button"
            onClick={() => setMessage(placeholderMessage)}
            className="rounded text-xs font-medium text-blue-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Забыли пароль?
          </button>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <Button type="submit" className="w-full">
        <LogIn aria-hidden="true" className="size-4" />
        Войти
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setMessage(placeholderMessage)}
      >
        Продолжить с Google
      </Button>

      <p
        role="status"
        aria-live="polite"
        className="min-h-6 text-center text-sm font-medium text-blue-800"
      >
        {message}
      </p>
    </form>
  );
}
