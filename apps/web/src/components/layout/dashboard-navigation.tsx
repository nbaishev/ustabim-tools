"use client";

import {
  Bot,
  Box,
  Calculator,
  FolderKanban,
  LayoutDashboard,
  TestTubeDiagonal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";

const navigation = [
  { label: "Обзор", icon: LayoutDashboard, href: "/app", implemented: true },
  {
    label: "Проекты",
    icon: FolderKanban,
    href: "/app/projects",
    implemented: true,
  },
  { label: "IFC-модели", icon: Box, href: "/app/ifc", implemented: true },
  { label: "ИИ-чат", icon: Bot, href: "/app/chat", implemented: true },
  {
    label: "Геология",
    icon: TestTubeDiagonal,
    href: "/app/geology",
    implemented: true,
  },
  { label: "Калькуляторы", icon: Calculator, href: "/app", implemented: false },
  { label: "Профиль", icon: UserRound, href: "/app/profile", implemented: true },
];

function isActive(pathname: string, href: string) {
  return href === "/app"
    ? pathname === href
    : pathname.startsWith(`${href}/`) || pathname === href;
}

export function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return navigation.map(({ label, icon: Icon, href, implemented }) => {
    const active = implemented && isActive(pathname, href);

    return (
      <Link
        key={label}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          mobile
            ? "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          active
            ? mobile
              ? "bg-blue-700 text-white"
              : "bg-blue-600 font-semibold text-white"
            : mobile
              ? "bg-slate-100 text-slate-700"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
        )}
      >
        {mobile ? null : <Icon aria-hidden="true" className="size-4" />}
        {label}
      </Link>
    );
  });
}

export function DashboardPageLabel() {
  const pathname = usePathname();
  const label = pathname.startsWith("/app/ifc")
    ? "IFC-модели"
    : pathname.startsWith("/app/projects")
      ? "Проекты"
    : pathname.startsWith("/app/chat")
      ? "ИИ-чат"
      : pathname.startsWith("/app/geology")
        ? "Геология"
    : pathname === "/app/profile"
      ? "Профиль"
      : "Обзор";

  return (
    <p className="font-semibold text-slate-950">{label}</p>
  );
}
