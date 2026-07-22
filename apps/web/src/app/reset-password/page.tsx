import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export default async function ResetPasswordPage() {
  let hasValidSession = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    hasValidSession = !error && typeof data?.claims?.sub === "string";
  } catch {
    hasValidSession = false;
  }

  if (!hasValidSession) {
    redirect("/forgot-password?error=invalid-link");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <Badge variant="secondary">Новый пароль</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Задайте новый пароль
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              После сохранения текущая recovery-сессия будет завершена. Войдите
              снова с новым паролем.
            </p>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
