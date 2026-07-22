import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
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
            <Badge variant="secondary">Восстановление доступа</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Восстановление пароля
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Укажите email существующего пользователя. Ссылка из письма будет
              одноразовой и ограниченной по времени.
            </p>
            {hasInvalidLink ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Ссылка недействительна или истекла. Запросите новое письмо.
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
