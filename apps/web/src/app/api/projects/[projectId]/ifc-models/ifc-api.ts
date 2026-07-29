import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export const IFC_BUCKET = "project-ifc";
export const MAX_IFC_FILE_SIZE = 250 * 1024 * 1024;
export const noStoreHeaders = { "Cache-Control": "private, no-store" };
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isIfcName(value: string) {
  return value.toLowerCase().endsWith(".ifc");
}

export function storagePath(projectId: string, fileId: string) {
  return `projects/${projectId}/${fileId}/source.ifc`;
}

export async function requireProjectAccess(projectId: string, write = false) {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || typeof userId !== "string") {
    return { supabase, userId: null, allowed: false, unauthenticated: true };
  }

  const { data, error } = await supabase.rpc(
    write ? "can_write_project_files" : "can_read_project",
    { p_project_id: projectId },
  );
  return { supabase, userId, allowed: data === true && !error, unauthenticated: false };
}
