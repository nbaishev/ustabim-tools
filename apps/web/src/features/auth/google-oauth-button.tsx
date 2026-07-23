"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/shared/lib/supabase/client";

function safeAppPath(path: string) {
  return path === "/app" || (path.startsWith("/app/") && !path.startsWith("//"));
}

function GoogleMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600"
    >
      G
    </span>
  );
}

type GoogleOAuthButtonProps = {
  nextPath?: string;
  navigate?: (url: string) => void;
};

export function GoogleOAuthButton({
  nextPath = "/app",
  navigate = (url) => window.location.assign(url),
}: GoogleOAuthButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGoogleLogin() {
    setMessage("");
    setIsPending(true);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", safeAppPath(nextPath) ? nextPath : "/app");
      callbackUrl.searchParams.set("flow", "oauth");
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        setMessage(
          "Не удалось начать вход через Google. Проверьте настройку провайдера в Supabase.",
        );
        setIsPending(false);
        return;
      }

      navigate(data.url);
    } catch {
      setMessage(
        "Supabase не настроен или временно недоступен. Проверьте конфигурацию проекта.",
      );
      setIsPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => void handleGoogleLogin()}
      >
        <GoogleMark />
        {isPending ? "Переход к Google…" : "Продолжить с Google"}
      </Button>
      {message ? (
        <p role="alert" className="mt-3 text-center text-sm font-medium text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function AuthMethodDivider() {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        или по email
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
