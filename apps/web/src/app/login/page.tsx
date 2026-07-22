import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
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
            <Badge variant="secondary">Прототип</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Вход в UstaBIM Tools
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Форма демонстрирует будущий интерфейс. Авторизация и передача данных
              пока не подключены.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
