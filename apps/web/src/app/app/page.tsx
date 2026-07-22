import { FolderOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { plannedTools } from "@/features/tools/tool-catalog";
import { ToolCard } from "@/features/tools/tool-card";

import { CreateProjectButton } from "./create-project-button";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <section>
        <p className="text-sm font-semibold text-blue-700">Обзор</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Добро пожаловать в UstaBIM Tools
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Это демонстрационный кабинет. Инструменты и пользовательские данные пока
          не подключены.
        </p>
      </section>

      <section aria-labelledby="tools-heading" className="mt-10">
        <h2 id="tools-heading" className="text-xl font-semibold text-slate-950">
          Инструменты
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plannedTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-projects-heading" className="mt-12">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle id="recent-projects-heading">Последние проекты</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FolderOpen aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-5 font-semibold text-slate-950">Проектов пока нет</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Управление проектами появится после подключения базы данных и проверки
              доступа.
            </p>
            <div className="mt-6">
              <CreateProjectButton />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
