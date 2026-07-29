"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Box,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Focus,
  LoaderCircle,
  Maximize2,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Ruler,
  Scissors,
  Trash2,
  X,
  Minimize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildIfcTree,
  collectSpatialIds,
  flattenIfcProperties,
  getIfcAttribute,
  getIfcRaycastPointer,
  getIfcSectionNormal,
  type IfcPropertyRow,
  type IfcSectionPlane,
  type IfcTreeNode,
} from "@/features/ifc/ifc-inspection";
import {
  hasIfcStepHeader,
  validateIfcFileMetadata,
} from "@/features/ifc/ifc-file-validation";

type ToolMode = "select" | "measure" | "section";

type SelectedElement = {
  category: string;
  globalId: string | null;
  localId: number;
  modelId: string;
  name: string;
  properties: IfcPropertyRow[];
};

type ViewerRuntime = {
  clearMeasurements: () => void;
  clearSelection: () => Promise<void>;
  deleteSections: () => void;
  dispose: () => void;
  invertSections: () => Promise<void>;
  load: (
    data: Uint8Array,
    fileName: string,
    onProgress: (progress: number) => void,
  ) => Promise<void>;
  resetView: () => Promise<void>;
  selectItem: (modelId: string, localId: number) => Promise<void>;
  setSectionPlane: (plane: IfcSectionPlane) => void;
  setTool: (tool: ToolMode) => void;
};

const initialCamera = [12, 12, 12, 0, 0, 0] as const;
const PANEL_VISIBILITY_STORAGE_KEY = "ustabim-ifc-panel-visibility";
const defaultPanelVisibility = { tree: true, properties: true };

type PanelVisibility = {
  properties: boolean;
  tree: boolean;
};

function getStoredPanelVisibility(): PanelVisibility | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(PANEL_VISIBILITY_STORAGE_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "tree" in parsed &&
      "properties" in parsed &&
      typeof parsed.tree === "boolean" &&
      typeof parsed.properties === "boolean"
    ) {
      return { tree: parsed.tree, properties: parsed.properties };
    }
  } catch {
    // Storage may be unavailable or contain an obsolete value.
  }

  return null;
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center px-5 py-8 text-center text-sm leading-6 text-slate-500">
      {children}
    </div>
  );
}

function TreeBranch({
  modelId,
  node,
  onSelect,
  selectedId,
}: {
  modelId: string;
  node: IfcTreeNode;
  onSelect: (modelId: string, localId: number) => void;
  selectedId: number | null;
}) {
  const hasChildren = node.children.length > 0;
  const button = (
    <button
      type="button"
      disabled={node.localId === null}
      onClick={() => node.localId !== null && onSelect(modelId, node.localId)}
      className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-default ${
        selectedId === node.localId
          ? "bg-blue-100 font-semibold text-blue-900"
          : "text-slate-700 hover:bg-slate-100"
      }`}
      title={node.label}
    >
      <span className="block truncate">{node.label}</span>
    </button>
  );

  if (!hasChildren) return <li className="ml-5">{button}</li>;

  return (
    <li>
      <details open className="group/tree">
        <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-open/tree:rotate-90" />
          {button}
        </summary>
        <ul className="ml-2 border-l border-slate-200 pl-1">
          {node.children.map((child, index) => (
            <TreeBranch
              key={`${child.localId ?? child.category}-${index}`}
              modelId={modelId}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

export function IfcViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState("Подготовка 3D-сцены…");
  const [error, setError] = useState("");
  const [tool, setTool] = useState<ToolMode>("select");
  const [sectionPlane, setSectionPlane] = useState<IfcSectionPlane>("xy");
  const [sectionInverted, setSectionInverted] = useState(false);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [tree, setTree] = useState<{ modelId: string; root: IfcTreeNode } | null>(
    null,
  );
  const [measurement, setMeasurement] = useState<number | null>(null);
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>(
    defaultPanelVisibility,
  );
  const [hasRestoredPanelVisibility, setHasRestoredPanelVisibility] =
    useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedPanelVisibility = getStoredPanelVisibility();

      if (storedPanelVisibility) {
        setPanelVisibility(storedPanelVisibility);
      }

      setHasRestoredPanelVisibility(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hasRestoredPanelVisibility) return;

    try {
      window.localStorage.setItem(
        PANEL_VISIBILITY_STORAGE_KEY,
        JSON.stringify(panelVisibility),
      );
    } catch {
      // The viewer stays usable when browser storage is disabled.
    }
  }, [hasRestoredPanelVisibility, panelVisibility]);

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

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
        world.renderer.showLogo = false;
        world.camera = new OBC.OrthoPerspectiveCamera(components);
        await world.camera.controls.setLookAt(...initialCamera);

        components.init();
        const grid = components.get(OBC.Grids).create(world);
        grid.config.color.set(0x94a3b8);

        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(
          new URL(
            "/ifc-runtime/fragments-worker.mjs",
            window.location.origin,
          ).toString(),
        );

        world.camera.controls.addEventListener("update", () => {
          void fragments.core.update();
        });

        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          model.getClippingPlanesEvent = () =>
            world.renderer?.clippingPlanes ?? [];
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

        const clipper = components.get(OBC.Clipper);
        clipper.localClippingPlanes = true;
        clipper.setup();
        clipper.enabled = true;

        const canvas = world.renderer.three.domElement;
        const selectionStyle = {
          color: new THREE.Color("#2563eb"),
          renderedFaces: 1 as const,
          opacity: 0.72,
          transparent: true,
        };
        const measurementGroup = new THREE.Group();
        measurementGroup.name = "IFC measurements";
        world.scene.three.add(measurementGroup);

        let activeTool: ToolMode = "select";
        let activeSectionPlane: IfcSectionPlane = "xy";
        let sectionDirection = 1;
        let currentModelId: string | null = null;
        let firstMeasurePoint: InstanceType<typeof THREE.Vector3> | null = null;
        let pointerStart: { x: number; y: number } | null = null;

        const addMarker = (point: InstanceType<typeof THREE.Vector3>) => {
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false }),
          );
          marker.position.copy(point);
          marker.renderOrder = 10;
          measurementGroup.add(marker);
        };

        const clearMeasurements = () => {
          firstMeasurePoint = null;
          measurementGroup.traverse((object) => {
            if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          measurementGroup.clear();
          setMeasurement(null);
        };

        const inspectItem = async (modelId: string, localId: number) => {
          const model = fragments.list.get(modelId);
          if (!model) return;

          await fragments.resetHighlight();
          await fragments.highlight(selectionStyle, {
            [modelId]: new Set([localId]),
          });
          const [data] = await model.getItemsData([localId], {
            attributesDefault: true,
            relations: {
              IsDefinedBy: { attributes: true, relations: true },
            },
          });

          setSelected({
            category: getIfcAttribute(data, "_category") ?? "IFC-элемент",
            globalId: getIfcAttribute(data, "GlobalId"),
            localId,
            modelId,
            name: getIfcAttribute(data, "Name") ?? `Элемент #${localId}`,
            properties: flattenIfcProperties(data),
          });
        };

        const onPointerDown = (event: PointerEvent) => {
          pointerStart = { x: event.clientX, y: event.clientY };
        };

        const onPointerUp = async (event: PointerEvent) => {
          if (!currentModelId || !pointerStart) return;
          const distance = Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          );
          pointerStart = null;
          if (distance > 5) return;

          // FragmentsManager expects viewport coordinates here and converts
          // them to NDC internally using the supplied canvas bounds.
          const pointer = getIfcRaycastPointer(event.clientX, event.clientY);
          const mouse = new THREE.Vector2(pointer.x, pointer.y);
          let hit;
          try {
            hit = await fragments.raycast({
              camera: world.camera.three,
              mouse,
              dom: canvas,
            });
          } catch {
            setMessage("Не удалось определить элемент в этой точке");
            return;
          }
          if (!hit) {
            setMessage(
              activeTool === "measure"
                ? "Линейка: укажите точку непосредственно на геометрии"
                : activeTool === "section"
                  ? "Разрез: выберите поверхность модели"
                  : "В этой точке нет IFC-элемента",
            );
            return;
          }

          if (activeTool === "measure") {
            if (!firstMeasurePoint) {
              firstMeasurePoint = hit.point.clone();
              addMarker(firstMeasurePoint);
              setMessage("Линейка: укажите вторую точку");
              return;
            }

            const secondPoint = hit.point.clone();
            addMarker(secondPoint);
            const direction = secondPoint.clone().sub(firstMeasurePoint);
            const measuredDistance = direction.length();
            if (measuredDistance < 1e-6) {
              firstMeasurePoint = null;
              setMessage("Линейка: точки совпадают, начните измерение заново");
              return;
            }
            const radius = Math.min(0.05, Math.max(0.008, measuredDistance * 0.003));
            const segment = new THREE.Mesh(
              new THREE.CylinderGeometry(radius, radius, measuredDistance, 12),
              new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false }),
            );
            segment.position.copy(firstMeasurePoint).add(secondPoint).multiplyScalar(0.5);
            segment.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction.normalize(),
            );
            segment.renderOrder = 10;
            measurementGroup.add(segment);
            setMeasurement(measuredDistance);
            firstMeasurePoint = null;
            setMessage("Измерение добавлено. Укажите следующую первую точку");
            return;
          }

          if (activeTool === "section") {
            const normalValues = getIfcSectionNormal(
              activeSectionPlane,
              sectionDirection < 0,
            );
            const normal = new THREE.Vector3(...normalValues);
            clipper.createFromNormalAndCoplanarPoint(world, normal, hit.point);
            await fragments.core.update(true);
            activeTool = "select";
            setTool("select");
            setMessage(
              `Разрез ${activeSectionPlane.toUpperCase()} создан через выбранную точку. Можно выбирать видимые элементы`,
            );
            return;
          }

          await inspectItem(hit.fragments.modelId, hit.localId);
          setMessage(`Выбран элемент #${hit.localId}`);
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);

        runtime = {
          clearMeasurements,
          async clearSelection() {
            await fragments.resetHighlight();
            setSelected(null);
          },
          deleteSections() {
            clipper.deleteAll();
          },
          async load(data, name, onProgress) {
            clearMeasurements();
            clipper.deleteAll();
            await fragments.resetHighlight();
            setSelected(null);
            setTree(null);

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

            const spatialRoot = await model.getSpatialStructure();
            const ids = collectSpatialIds(spatialRoot);
            const dataRows = ids.length
              ? await model.getItemsData(ids, {
                  attributes: ["Name", "LongName"],
                  attributesDefault: true,
                })
              : [];
            const names = new Map<number, string>();
            dataRows.forEach((dataRow, index) => {
              const label =
                getIfcAttribute(dataRow, "Name") ??
                getIfcAttribute(dataRow, "LongName");
              if (label) names.set(ids[index], label);
            });
            setTree({
              modelId: model.modelId,
              root: buildIfcTree(spatialRoot, names),
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
          selectItem: inspectItem,
          setSectionPlane(plane) {
            activeSectionPlane = plane;
          },
          setTool(nextTool) {
            activeTool = nextTool;
            firstMeasurePoint = null;
            void fragments.core.update(true);
          },
          dispose() {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            clearMeasurements();
            components.dispose();
          },
          async invertSections() {
            sectionDirection *= -1;
            for (const [, plane] of clipper.list) {
              plane.normal.negate();
              plane.update();
            }
            await fragments.core.update(true);
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

  function activateTool(nextTool: ToolMode) {
    setTool(nextTool);
    runtimeRef.current?.setTool(nextTool);
    setMessage(
      nextTool === "measure"
        ? "Линейка: укажите первую точку на модели"
        : nextTool === "section"
          ? `Разрез ${sectionPlane.toUpperCase()}: укажите на модели точку прохождения плоскости`
          : "Режим выбора элемента",
    );
  }

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
    setTool("select");
    runtime.setTool("select");

    try {
      const buffer = await file.arrayBuffer();
      if (!hasIfcStepHeader(buffer.slice(0, 256))) {
        throw new Error("invalid-ifc-header");
      }

      await runtime.load(new Uint8Array(buffer), file.name, (progress) => {
        const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
        setMessage(`Преобразование модели: ${percent}%`);
      });
      setMessage("Модель загружена. Выберите элемент в сцене или дереве");
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

  const toolDisabled = !isReady || isLoading || !fileName;
  const gridColumns =
    panelVisibility.tree && panelVisibility.properties
      ? "lg:grid-cols-[280px_minmax(0,1fr)_320px]"
      : panelVisibility.tree
        ? "lg:grid-cols-[280px_minmax(0,1fr)]"
        : panelVisibility.properties
          ? "lg:grid-cols-[minmax(0,1fr)_320px]"
          : "lg:grid-cols-1";

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      setMessage("Полноэкранный режим недоступен в этом браузере");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white xl:flex-row xl:items-center xl:justify-between">
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
            variant={tool === "select" ? "default" : "outline"}
            disabled={toolDisabled}
            onClick={() => activateTool("select")}
            className={tool === "select" ? "" : "border-slate-600 bg-slate-900 text-white hover:bg-slate-800"}
          >
            <MousePointer2 className="size-4" /> Выбор
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tool === "measure" ? "default" : "outline"}
            disabled={toolDisabled}
            onClick={() => activateTool("measure")}
            className={tool === "measure" ? "" : "border-slate-600 bg-slate-900 text-white hover:bg-slate-800"}
          >
            <Ruler className="size-4" /> Линейка
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tool === "section" ? "default" : "outline"}
            disabled={toolDisabled}
            onClick={() => activateTool("section")}
            className={tool === "section" ? "" : "border-slate-600 bg-slate-900 text-white hover:bg-slate-800"}
          >
            <Scissors className="size-4" /> Разрез
          </Button>
          <select
            aria-label="Основная плоскость разреза"
            value={sectionPlane}
            disabled={toolDisabled}
            onChange={(event) => {
              const plane = event.currentTarget.value as IfcSectionPlane;
              setSectionPlane(plane);
              runtimeRef.current?.setSectionPlane(plane);
              if (tool === "section") {
                setMessage(
                  `Разрез ${plane.toUpperCase()}: укажите на модели точку прохождения плоскости`,
                );
              }
            }}
            className="h-8 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="xy">Плоскость XY</option>
            <option value="xz">Плоскость XZ</option>
            <option value="yz">Плоскость YZ</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant={sectionInverted ? "default" : "outline"}
            disabled={toolDisabled}
            onClick={() => {
              const inverted = !sectionInverted;
              setSectionInverted(inverted);
              void runtimeRef.current?.invertSections();
              setMessage(
                inverted
                  ? "Направление разреза инвертировано: скрывается противоположная сторона"
                  : "Используется исходное направление разреза",
              );
            }}
            className={
              sectionInverted
                ? ""
                : "border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
            }
          >
            <ArrowLeftRight className="size-4" /> Инвертировать
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={toolDisabled}
            onClick={() => {
              runtimeRef.current?.clearMeasurements();
              runtimeRef.current?.deleteSections();
              setMessage("Измерения и разрезы удалены");
            }}
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
            aria-label="Удалить измерения и разрезы"
          >
            <Trash2 className="size-4" /> Очистить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!isReady || isLoading}
            onClick={() => void runtimeRef.current?.resetView()}
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Focus className="size-4" /> Вписать
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setPanelVisibility((visibility) => ({
                ...visibility,
                tree: !visibility.tree,
              }))
            }
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
            aria-pressed={panelVisibility.tree}
          >
            {panelVisibility.tree ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            Дерево
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setPanelVisibility((visibility) => ({
                ...visibility,
                properties: !visibility.properties,
              }))
            }
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
            aria-pressed={panelVisibility.properties}
          >
            {panelVisibility.properties ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            Свойства
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void toggleFullscreen()}
            className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            {isFullscreen ? "Свернуть" : "На весь экран"}
          </Button>
          <Button asChild size="sm">
            <label
              aria-disabled={!isReady || isLoading}
              className={!isReady || isLoading ? "pointer-events-none opacity-60" : ""}
            >
              {isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
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

      <div className={`grid min-h-[72vh] ${gridColumns}`}>
        <aside className={`${panelVisibility.tree ? "" : "hidden"} order-2 min-h-0 border-t border-slate-200 bg-white lg:order-1 lg:border-r lg:border-t-0`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Дерево проекта</h2>
            <button
              type="button"
              onClick={() =>
                setPanelVisibility((visibility) => ({
                  ...visibility,
                  tree: false,
                }))
              }
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Скрыть дерево проекта"
              title="Скрыть дерево проекта"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
          <div className="max-h-[72vh] overflow-auto p-2">
            {tree ? (
              <ul>
                <TreeBranch
                  modelId={tree.modelId}
                  node={tree.root}
                  selectedId={selected?.localId ?? null}
                  onSelect={(modelId, localId) => {
                    setTool("select");
                    runtimeRef.current?.setTool("select");
                    void runtimeRef.current?.selectItem(modelId, localId);
                    setMessage(`Выбран элемент #${localId} из дерева`);
                  }}
                />
              </ul>
            ) : (
              <EmptyPanel>После открытия IFC здесь появится пространственная структура модели.</EmptyPanel>
            )}
          </div>
        </aside>

        <div
          ref={containerRef}
          role="application"
          aria-label="3D-сцена IFC"
          className="relative order-1 h-[72vh] min-h-[32rem] w-full bg-slate-200 lg:order-2"
        >
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute right-4 top-4 z-20 rounded-md bg-slate-950/85 p-2 text-white shadow-sm transition-colors hover:bg-slate-800"
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Открыть на весь экран"}
            title={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          {!fileName && !isLoading ? (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6 text-center">
              <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-950/85 p-6 text-white backdrop-blur-sm">
                <Box className="mx-auto size-9 text-blue-400" />
                <p className="mt-4 font-semibold">Откройте модель IFC</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Файл и его свойства обрабатываются локально в браузере и не
                  отправляются в Supabase Storage или IFC worker.
                </p>
              </div>
            </div>
          ) : null}
          {measurement !== null ? (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              {measurement.toFixed(3)} м
            </div>
          ) : null}
        </div>

        <aside className={`${panelVisibility.properties ? "" : "hidden"} order-3 min-h-0 border-t border-slate-200 bg-white lg:border-l lg:border-t-0`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Свойства</h2>
            <div className="flex items-center gap-1">
              {selected ? (
                <button
                  type="button"
                  onClick={() => void runtimeRef.current?.clearSelection()}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Снять выделение"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setPanelVisibility((visibility) => ({
                    ...visibility,
                    properties: false,
                  }))
                }
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Скрыть свойства"
                title="Скрыть свойства"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          <div className="max-h-[72vh] overflow-auto">
            {selected ? (
              <div>
                <div className="border-b border-slate-200 px-4 py-4">
                  <p className="break-words text-sm font-semibold text-slate-950">{selected.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.category} · #{selected.localId}
                  </p>
                  {selected.globalId ? (
                    <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
                      {selected.globalId}
                    </p>
                  ) : null}
                </div>
                <dl className="divide-y divide-slate-100">
                  {selected.properties.map((property, index) => (
                    <div key={`${property.name}-${index}`} className="px-4 py-2.5">
                      <dt className="break-words text-[11px] font-medium text-slate-500">
                        {property.name}
                      </dt>
                      <dd className="mt-1 break-words text-xs text-slate-900">
                        {property.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <EmptyPanel>Выберите элемент в 3D-сцене или дереве, чтобы увидеть его атрибуты и наборы свойств.</EmptyPanel>
            )}
          </div>
        </aside>
      </div>

      {error ? (
        <p role="alert" className="border-t border-red-900 bg-red-950 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
