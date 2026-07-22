import { Badge } from "@/components/ui/badge";
import { IfcViewer } from "@/features/ifc/ifc-viewer";

export default function IfcViewerPage() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <section>
        <Badge variant="secondary">Локальный просмотр</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          IFC-просмотрщик
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Откройте IFC-модель с компьютера, исследуйте пространственное дерево и
          свойства элементов, измеряйте расстояния и создавайте плоскости разреза.
        </p>
      </section>

      <IfcViewer />
    </div>
  );
}
