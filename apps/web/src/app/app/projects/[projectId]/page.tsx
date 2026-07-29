import { ArrowLeft, CalendarDays, FolderKanban, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteProjectMemberButton } from "@/features/projects/invite-project-member-button";
import { ProjectIfcModels } from "@/features/ifc/project-ifc-models";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Нет данных";

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (authError || typeof userId !== "string") notFound();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, description, owner_id, created_at, updated_at")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !project) notFound();

  const isOwner = project.owner_id === userId;
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  const canWriteIfc = isOwner || membership?.role === "editor";

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/app/projects">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Все проекты
        </Link>
      </Button>

      <section className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Проект</Badge>
            <Badge variant={isOwner ? "success" : "secondary"}>
              {isOwner ? "Владелец" : "Участник"}
            </Badge>
          </div>
          {isOwner ? <InviteProjectMemberButton projectId={project.id} /> : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {project.name}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          {project.description || "Описание проекта пока не добавлено."}
        </p>
      </section>

      <Card className="mt-8">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FolderKanban aria-hidden="true" className="size-5" />
            </span>
            <div>
              <CardTitle>Карточка проекта</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Базовые сведения и текущий уровень доступа.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          <div className="grid gap-2 px-5 py-5 sm:grid-cols-[180px_1fr] sm:px-6">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserRound aria-hidden="true" className="size-4" />
              Доступ
            </p>
            <p className="font-medium text-slate-950">
              {isOwner ? "Владелец проекта" : "Участник проекта"}
            </p>
          </div>
          <div className="grid gap-2 px-5 py-5 sm:grid-cols-[180px_1fr] sm:px-6">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays aria-hidden="true" className="size-4" />
              Создан
            </p>
            <p className="font-medium text-slate-950">{formatDate(project.created_at)}</p>
          </div>
          <div className="grid gap-2 px-5 py-5 sm:grid-cols-[180px_1fr] sm:px-6">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarDays aria-hidden="true" className="size-4" />
              Обновлён
            </p>
            <p className="font-medium text-slate-950">{formatDate(project.updated_at)}</p>
          </div>
        </CardContent>
      </Card>
      <ProjectIfcModels projectId={project.id} canWrite={canWriteIfc} userId={userId} />
    </div>
  );
}
