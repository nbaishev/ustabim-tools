"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={logout}
    >
      <LogOut aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">{isPending ? "Выход…" : "Выйти"}</span>
    </Button>
  );
}
