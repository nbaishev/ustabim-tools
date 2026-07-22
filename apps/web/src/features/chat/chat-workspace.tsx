"use client";

import {
  Bot,
  ChevronDown,
  Menu,
  MessageSquarePlus,
  Paperclip,
  PanelLeftClose,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";

const starterPrompts = [
  "Объясни свойства выбранного IFC-элемента",
  "Составь чек-лист проверки BIM-модели",
  "Помоги сформулировать техническое задание",
  "Какие данные нужны для инженерного расчёта?",
] as const;

export function ChatWorkspace() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function startNewChat() {
    setDraft("");
    setNotice("");
    setSidebarOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function choosePrompt(prompt: string) {
    setDraft(prompt);
    setNotice("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setNotice(
      "Сообщение не отправлено: серверный AI-контур ещё не подключён. Текст сохранён в поле ввода.",
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="relative mx-auto flex h-[calc(100dvh-10rem)] min-h-[620px] max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-8.5rem)]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Закрыть список диалогов"
          className="absolute inset-0 z-20 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`absolute inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-start bg-white"
            onClick={startNewChat}
          >
            <MessageSquarePlus aria-hidden="true" className="size-4" />
            Новый чат
          </Button>
          <button
            type="button"
            aria-label="Свернуть список диалогов"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeftClose aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="px-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400">
            <Search aria-hidden="true" className="size-4" />
            <span className="text-sm">Поиск по чатам</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Bot aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-700">Диалогов пока нет</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            История появится после подключения API и базы данных.
          </p>
        </div>

        <div className="border-t border-slate-200 p-4 text-xs leading-5 text-slate-500">
          История чатов будет доступна только владельцу аккаунта.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Открыть список диалогов"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              aria-label="Выбор ассистента"
            >
              <span className="truncate">UstaBIM AI</span>
              <ChevronDown aria-hidden="true" className="size-4 text-slate-500" />
            </button>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 sm:flex">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Интерфейс без AI backend
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="m-auto w-full max-w-3xl px-5 py-10 sm:px-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <Bot aria-hidden="true" className="size-6" />
            </div>
            <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Чем помочь в инженерной работе?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-600">
              Будущий ассистент сможет отвечать по данным проекта, BIM-моделям и
              документам. Инженерные выводы всегда требуют проверки специалистом.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => choosePrompt(prompt)}
                  className="rounded-xl border border-slate-200 p-4 text-left text-sm leading-5 text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-3 pb-3 pt-3 sm:px-6 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            {notice ? (
              <div
                role="status"
                className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
              >
                <span>{notice}</span>
                <button
                  type="button"
                  aria-label="Закрыть уведомление"
                  onClick={() => setNotice("")}
                  className="mt-0.5 shrink-0 rounded text-amber-700 hover:text-amber-950"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            >
              <label htmlFor="chat-message" className="sr-only">
                Сообщение ассистенту
              </label>
              <textarea
                ref={textareaRef}
                id="chat-message"
                value={draft}
                maxLength={8000}
                rows={2}
                placeholder="Сообщение для UstaBIM AI"
                onChange={(event) => {
                  setDraft(event.currentTarget.value);
                  setNotice("");
                }}
                onKeyDown={handleKeyDown}
                className="max-h-40 min-h-14 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled
                  title="Вложения станут доступны после подключения файлов проектов"
                  aria-label="Прикрепить файл — пока недоступно"
                  className="rounded-full p-2 text-slate-400 disabled:cursor-not-allowed"
                >
                  <Paperclip aria-hidden="true" className="size-5" />
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Отправить сообщение"
                  className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Send aria-hidden="true" className="size-4" />
                </button>
              </div>
            </form>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-slate-500">
              <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
              Не передавайте секреты. Ответы ИИ необходимо проверять.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
