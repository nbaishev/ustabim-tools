import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

export type ToolCardProps = {
  title: string;
  description: string;
  status: "planned" | "development" | "available";
  href?: string;
  icon?: LucideIcon;
};

const statusLabels: Record<ToolCardProps["status"], string> = {
  planned: "Планируется",
  development: "В разработке",
  available: "Доступно",
};

const statusVariants: Record<
  ToolCardProps["status"],
  "default" | "secondary" | "success"
> = {
  planned: "secondary",
  development: "default",
  available: "success",
};

function ToolCardContent({
  title,
  description,
  status,
  icon: Icon,
  linked,
}: Omit<ToolCardProps, "href"> & { linked: boolean }) {
  return (
    <Card
      data-testid="tool-card"
      className={cn(
        "h-full transition-colors",
        linked && "hover:border-blue-300 hover:bg-blue-50/30",
      )}
    >
      <CardHeader className="h-full">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-blue-800">
            {Icon ? <Icon aria-hidden="true" className="size-5" /> : null}
          </span>
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ToolCard(props: ToolCardProps) {
  if (!props.href) {
    return <ToolCardContent {...props} linked={false} />;
  }

  return (
    <Link
      href={props.href}
      aria-label={`${props.title}: открыть инструмент`}
      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    >
      <ToolCardContent {...props} linked />
    </Link>
  );
}
