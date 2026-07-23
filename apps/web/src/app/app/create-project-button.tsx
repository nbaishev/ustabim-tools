import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CreateProjectButton() {
  return (
    <Button asChild>
      <Link href="/app/projects">
        <Plus aria-hidden="true" className="size-4" />
        Создать проект
      </Link>
    </Button>
  );
}
