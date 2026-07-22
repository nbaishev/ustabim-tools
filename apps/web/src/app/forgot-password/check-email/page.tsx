import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RecoveryCheckEmailPage() {
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
            <span className="mt-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <MailCheck aria-hidden="true" className="size-6" />
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Проверьте почту
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Если пользователь с таким email существует, Supabase отправил
              одноразовую ссылку для изменения пароля.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-slate-600">
            <div className="space-y-2">
              <p>Проверьте папки «Спам» и «Промоакции».</p>
              <p>
                Ссылка ограничена по времени и может быть использована только
                один раз.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Отправить ссылку ещё раз</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
