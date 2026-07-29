import { IfcViewer } from "@/features/ifc/ifc-viewer";

export default async function IfcViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; modelId?: string }>;
}) {
  const { projectId, modelId } = await searchParams;
  return (
    <div className="mx-auto max-w-[1600px]">
      <IfcViewer projectId={projectId} modelId={modelId} />
    </div>
  );
}
