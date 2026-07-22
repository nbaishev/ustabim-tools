import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (!user && !error) redirect("/login?next=/app/profile&reason=auth-required");

  return (
    <div className="mx-auto max-w-4xl">
      <section>
        <p className="text-sm font-semibold text-blue-700">Аккаунт</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Профиль пользователя
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Актуальные данные учётной записи загружаются напрямую из Supabase Auth.
        </p>
      </section>

      {error || !user ? (
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardContent className="p-5 text-sm text-amber-950">
            Не удалось загрузить данные профиля. Обновите страницу позднее.
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-8">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <div>
                <CardTitle>Данные аккаунта</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Только для просмотра</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[200px_1fr] sm:px-6">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Mail aria-hidden="true" className="size-4" />
                Email
              </p>
              <p className="break-all font-medium text-slate-950">
                {user.email ?? "Нет данных"}
              </p>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[200px_1fr] sm:px-6">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Подтверждение email
              </p>
              <div>
                {user.email_confirmed_at ? (
                  <Badge variant="success">Подтверждён</Badge>
                ) : (
                  <Badge variant="secondary">Не подтверждён</Badge>
                )}
              </div>
            </div>
            <div className="grid gap-2 px-5 py-5 sm:grid-cols-[200px_1fr] sm:px-6">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <CalendarDays aria-hidden="true" className="size-4" />
                Аккаунт создан
              </p>
              <p className="font-medium text-slate-950">
                {formatDate(user.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
