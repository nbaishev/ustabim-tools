"use client";

import { Trash2, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Member = { id: string; email: string; role: "owner" | "editor" | "viewer" };
type ApiResponse = { data?: unknown; error?: { message?: unknown } };

const roleLabel = { owner: "Владелец", editor: "Редактор", viewer: "Наблюдатель" } as const;

export function ProjectMembersCard({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [notice, setNotice] = useState("");
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/projects/${projectId}/members`)
      .then(async (response) => ({ response, payload: (await response.json()) as ApiResponse }))
      .then(({ response, payload }) => {
        if (!response.ok || !Array.isArray(payload.data)) throw new Error();
        if (active) setMembers(payload.data as Member[]);
      })
      .catch(() => active && setNotice("Не удалось загрузить участников проекта."));
    return () => { active = false; };
  }, [projectId]);

  async function changeMember(memberId: string, action: "update" | "remove", role?: "editor" | "viewer") {
    setBusyMemberId(memberId);
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: action === "remove" ? "DELETE" : "PATCH",
        headers: action === "update" ? { "Content-Type": "application/json" } : undefined,
        body: action === "update" ? JSON.stringify({ role }) : undefined,
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(typeof payload.error?.message === "string" ? payload.error.message : "Не удалось изменить участника проекта.");
      setMembers((current) => action === "remove"
        ? current.filter((member) => member.id !== memberId)
        : current.map((member) => member.id === memberId ? { ...member, role: role! } : member));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось изменить участника проекта.");
    } finally { setBusyMemberId(null); }
  }

  return (
    <Card className="mt-8">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UsersRound aria-hidden="true" className="size-5" /></span>
          <div><CardTitle>Участники</CardTitle><p className="mt-1 text-sm text-slate-500">Роли и доступ к этому проекту.</p></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {notice ? <p role="status" className="m-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{notice}</p> : null}
        <ul className="divide-y divide-slate-100">
          {members.map((member) => {
            const editable = member.role !== "owner";
            const busy = busyMemberId === member.id;
            return <li key={member.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="break-all font-medium text-slate-950">{member.email}</p><Badge variant={member.role === "owner" ? "success" : "secondary"} className="mt-2">{roleLabel[member.role]}</Badge></div>
              {editable ? <div className="flex items-center gap-2">
                <select aria-label={`Роль ${member.email}`} value={member.role} disabled={busy} onChange={(event) => void changeMember(member.id, "update", event.currentTarget.value as "editor" | "viewer")} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
                  <option value="editor">Редактор</option><option value="viewer">Наблюдатель</option>
                </select>
                <Button type="button" variant="outline" size="icon" disabled={busy} aria-label={`Удалить ${member.email}`} onClick={() => { if (window.confirm(`Удалить ${member.email} из проекта?`)) void changeMember(member.id, "remove"); }}><Trash2 aria-hidden="true" className="size-4" /></Button>
              </div> : null}
            </li>;
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
