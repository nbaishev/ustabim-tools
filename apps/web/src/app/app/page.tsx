import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentProjects } from "@/features/projects/recent-projects";
import { plannedTools } from "@/features/tools/tool-catalog";
import { ToolCard } from "@/features/tools/tool-card";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const hasConfirmedEmail = params.reason === "email-confirmed";

  return (
    <div className="mx-auto max-w-7xl">
      <section>
        <p className="text-sm font-semibold text-blue-700">Обзор</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Добро пожаловать в UstaBIM Tools
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Выберите инструмент или перейдите к работе с проектами.
        </p>
        {hasConfirmedEmail ? (
          <p className="mt-5 max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            Email подтверждён. Аккаунт готов к работе.
          </p>
        ) : null}
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
          <RecentProjects />
        </Card>
      </section>
    </div>
  );
}
