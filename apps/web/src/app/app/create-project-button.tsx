"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CreateProjectButton() {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        type="button"
        onClick={() =>
          setMessage("Управление проектами будет добавлено на следующем этапе")
        }
      >
        <Plus aria-hidden="true" className="size-4" />
        Создать проект
      </Button>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-blue-800">
        {message}
      </p>
    </div>
  );
}
