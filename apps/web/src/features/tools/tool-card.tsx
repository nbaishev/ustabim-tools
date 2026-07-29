import Link from "next/link";
import type { LucideIcon } from "lucide-react";

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
  href?: string;
  icon?: LucideIcon;
};

function ToolCardContent({
  title,
  description,
  icon: Icon,
  linked,
}: Omit<ToolCardProps, "href"> & { linked: boolean }) {
  return (
    <Card
      data-testid="tool-card"
      className={cn(
        "h-full border-slate-200/80 bg-white/80 shadow-sm transition duration-200",
        linked && "hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-lg hover:shadow-blue-950/10",
      )}
    >
      <CardHeader className="h-full">
        <div className="flex items-start gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-blue-800">
            {Icon ? <Icon aria-hidden="true" className="size-5" /> : null}
          </span>
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
