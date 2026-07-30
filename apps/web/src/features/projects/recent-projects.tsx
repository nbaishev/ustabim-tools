"use client";

import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CardContent } from "@/components/ui/card";

type Project = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  role: "owner" | "member";
};

type ProjectsResponse = {
  data?: unknown;
  error?: { message?: unknown };
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const payload = (await response.json()) as ProjectsResponse;

        if (!response.ok || !Array.isArray(payload.data)) {
          throw new Error(
            typeof payload.error?.message === "string"
              ? payload.error.message
              : "Не удалось загрузить проекты.",
          );
        }

        if (active) setProjects(payload.data.slice(0, 5) as Project[]);
      } catch (error) {
        if (!active) return;
        setProjects([]);
        setNotice(
          error instanceof Error ? error.message : "Не удалось загрузить проекты.",
        );
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  if (projects === null) {
    return <CardContent className="px-5 py-8 text-sm text-slate-500">Загрузка проектов…</CardContent>;
  }

  if (!projects.length) {
    return (
      <CardContent className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <FolderOpen aria-hidden="true" className="size-6" />
        </span>
        <h3 className="mt-5 font-semibold text-slate-950">Проектов пока нет</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {notice || "Создайте проект, чтобы объединить модели, документы и результаты анализа."}
        </p>
        <Link href="/app/projects" className="mt-6 text-sm font-medium text-blue-700 hover:text-blue-800">
          Перейти к проектам
        </Link>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      <ul className="divide-y divide-slate-100" aria-label="Последние проекты">
        {projects.map((project) => {
          const updatedAt = formatUpdatedAt(project.updatedAt);

          return (
            <li key={project.id} className="px-5 py-4">
              <Link
                href={`/app/projects/${project.id}`}
                className="font-semibold text-slate-950 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {project.name}
              </Link>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {project.description || "Описание проекта пока не добавлено."}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {project.role === "owner" ? "Владелец" : "Участник"}
                {updatedAt ? ` · Обновлён ${updatedAt}` : null}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-100 px-5 py-4">
        <Link href="/app/projects" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          Все проекты
        </Link>
      </div>
    </CardContent>
  );
}
