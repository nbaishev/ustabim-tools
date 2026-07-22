"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Box, FileUp, Focus, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  hasIfcStepHeader,
  validateIfcFileMetadata,
} from "@/features/ifc/ifc-file-validation";

type ViewerRuntime = {
  dispose: () => void;
  load: (
    data: Uint8Array,
    fileName: string,
    onProgress: (progress: number) => void,
  ) => Promise<void>;
  resetView: () => Promise<void>;
};

const initialCamera = [12, 12, 12, 0, 0, 0] as const;

export function IfcViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState("Подготовка 3D-сцены…");
  const [error, setError] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let runtime: ViewerRuntime | null = null;

    async function initialize() {
      try {
        const [OBC, THREE] = await Promise.all([
          import("@thatopen/components"),
          import("three"),
        ]);

        const components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          InstanceType<typeof OBC.SimpleScene>,
          InstanceType<typeof OBC.OrthoPerspectiveCamera>,
          InstanceType<typeof OBC.SimpleRenderer>
        >();

        world.scene = new OBC.SimpleScene(components);
        world.scene.setup({ backgroundColor: new THREE.Color("#e2e8f0") });
        world.renderer = new OBC.SimpleRenderer(components, container!, {
          antialias: true,
          alpha: false,
        });
        world.camera = new OBC.OrthoPerspectiveCamera(components);
        await world.camera.controls.setLookAt(...initialCamera);

        components.init();
        const grid = components.get(OBC.Grids).create(world);
        grid.config.color.set(0x94a3b8);

        const fragments = components.get(OBC.FragmentsManager);
        const workerUrl = new URL(
          "/ifc-runtime/fragments-worker.mjs",
          window.location.origin,
        ).toString();
        fragments.init(workerUrl);

        world.camera.controls.addEventListener("update", () => {
          void fragments.core.update();
        });

        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          world.meshes.clear();
          model.object.traverse((child) => {
            if (child instanceof THREE.Mesh) world.meshes.add(child);
          });
          void fragments.core.update(true);
        });

        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: new URL("/ifc-runtime/", window.location.origin).toString(),
            absolute: true,
          },
        });

        let currentModelId: string | null = null;

        runtime = {
          async load(data, name, onProgress) {
            if (currentModelId) {
              await fragments.core.disposeModel(currentModelId);
              currentModelId = null;
              world.meshes.clear();
            }

            const model = await ifcLoader.load(data, true, name, {
              processData: {
                progressCallback: (progress) => onProgress(progress),
              },
            });
            currentModelId = model.modelId;
            await fragments.core.update(true);
            world.meshes.clear();
            model.object.traverse((child) => {
              if (child instanceof THREE.Mesh) world.meshes.add(child);
            });

            if (world.meshes.size > 0) {
              await world.camera.fit(world.meshes, 0.8);
            } else {
              await world.camera.controls.setLookAt(...initialCamera, true);
            }
          },
          async resetView() {
            if (world.meshes.size > 0) {
              await world.camera.fit(world.meshes, 0.8);
              return;
            }
            await world.camera.controls.setLookAt(...initialCamera, true);
          },
          dispose() {
            components.dispose();
          },
        };

        if (cancelled) {
          runtime.dispose();
          return;
        }

        runtimeRef.current = runtime;
        setIsReady(true);
        setMessage("Выберите локальный IFC-файл");
      } catch {
        if (!cancelled) {
          setError("Не удалось инициализировать 3D-просмотрщик в этом браузере.");
          setMessage("");
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      runtime?.dispose();
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const metadataError = validateIfcFileMetadata(file);
    if (metadataError) {
      setError(metadataError);
      return;
    }

    const runtime = runtimeRef.current;
    if (!runtime) {
      setError("3D-просмотрщик ещё не готов. Повторите попытку через несколько секунд.");
      return;
    }

    setError("");
    setIsLoading(true);
    setFileName(file.name);
    setMessage("Чтение IFC-файла…");

    try {
      const buffer = await file.arrayBuffer();
      if (!hasIfcStepHeader(buffer.slice(0, 256))) {
        throw new Error("invalid-ifc-header");
      }

      await runtime.load(new Uint8Array(buffer), file.name, (progress) => {
        const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
        setMessage(`Преобразование модели: ${percent}%`);
      });
      setMessage("Модель загружена локально");
    } catch {
      setFileName(null);
      setError(
        "Не удалось прочитать IFC-файл. Проверьте его целостность и поддерживаемую версию схемы.",
      );
      setMessage("Выберите другой IFC-файл");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {fileName ?? "Новая IFC-сцена"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400" role="status" aria-live="polite">
            {message}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!isReady || isLoading}
            onClick={() => void runtimeRef.current?.resetView()}
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Focus aria-hidden="true" className="size-4" />
            Вписать модель
          </Button>
          <Button asChild size="sm">
            <label
              aria-disabled={!isReady || isLoading}
              className={!isReady || isLoading ? "pointer-events-none opacity-60" : ""}
            >
              {isLoading ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <FileUp aria-hidden="true" className="size-4" />
              )}
              {isLoading ? "Обработка…" : "Открыть IFC"}
              <input
                type="file"
                accept=".ifc,application/x-step"
                className="sr-only"
                disabled={!isReady || isLoading}
                onChange={handleFileChange}
              />
            </label>
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        role="application"
        aria-label="3D-сцена IFC"
        className="relative h-[58vh] min-h-96 w-full"
      >
        {!fileName && !isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6 text-center">
            <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-950/85 p-6 text-white backdrop-blur-sm">
              <Box aria-hidden="true" className="mx-auto size-9 text-blue-400" />
              <p className="mt-4 font-semibold">Откройте модель IFC</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Файл обрабатывается в браузере и на этом этапе не отправляется
                в Supabase Storage или IFC worker.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="border-t border-red-900 bg-red-950 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
