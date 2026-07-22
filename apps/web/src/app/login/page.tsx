import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/app") && !value.startsWith("//") ? value : "/app";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(firstValue(params.next));
  const reason = firstValue(params.reason);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 rounded text-sm font-medium text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Вернуться на главную
        </Link>
        <Card>
          <CardHeader>
            <Badge variant="secondary">Безопасный вход</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Вход в UstaBIM Tools
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Используйте email и пароль существующего пользователя Supabase.
              Регистрация и Google OAuth пока не реализованы.
            </p>
            {reason === "not-configured" ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Supabase не настроен. Заполните публичные переменные окружения.
              </p>
            ) : null}
            {reason === "password-updated" ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                Пароль изменён. Войдите с новым паролем.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <LoginForm nextPath={nextPath} />
            <Link
              href="/forgot-password"
              className="mt-1 block rounded text-center text-sm font-medium text-blue-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Забыли пароль?
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
