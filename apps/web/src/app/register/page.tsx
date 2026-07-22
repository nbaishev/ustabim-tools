import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/register-form";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const hasInvalidLink = params.error === "invalid-link";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-5 inline-flex items-center gap-2 rounded text-sm font-medium text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Вернуться ко входу
        </Link>
        <Card>
          <CardHeader>
            <Badge variant="secondary">Новый аккаунт</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Регистрация в UstaBIM Tools
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Создайте аккаунт по email. Доступ откроется только после перехода
              по одноразовой ссылке из письма.
            </p>
            {hasInvalidLink ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Ссылка подтверждения недействительна или истекла. Повторите
                регистрацию или запросите новое письмо позднее.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
