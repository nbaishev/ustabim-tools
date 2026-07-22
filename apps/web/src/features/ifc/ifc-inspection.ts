export type IfcPropertyRow = {
  name: string;
  value: string;
};

export type IfcTreeNode = {
  category: string;
  label: string;
  localId: number | null;
  children: IfcTreeNode[];
};

type ItemAttribute = { value: unknown; type?: string };

type ItemData = Record<string, ItemAttribute | ItemData[]>;

export type SpatialTreeItem = {
  category: string | null;
  localId: number | null;
  children?: SpatialTreeItem[];
};

export type IfcSectionPlane = "xy" | "xz" | "yz";

export function getIfcSectionNormal(
  plane: IfcSectionPlane,
  inverted = false,
): readonly [number, number, number] {
  const direction = inverted ? -1 : 1;
  if (plane === "xy") return [0, 0, direction];
  if (plane === "xz") return [0, direction, 0];
  return [direction, 0, 0];
}

/**
 * FragmentsManager.raycast accepts viewport coordinates, not normalized
 * device coordinates. Keeping this contract explicit prevents double
 * normalization before the fragments engine receives the pointer.
 */
export function getIfcRaycastPointer(clientX: number, clientY: number) {
  return { x: clientX, y: clientY };
}

function isItemAttribute(value: unknown): value is ItemAttribute {
  return typeof value === "object" && value !== null && "value" in value;
}

export function formatIfcValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(formatIfcValue).join(", ");

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getIfcAttribute(
  item: ItemData | undefined,
  name: string,
): string | null {
  const attribute = item?.[name];
  if (!isItemAttribute(attribute)) return null;
  const value = formatIfcValue(attribute.value);
  return value === "—" ? null : value;
}

export function flattenIfcProperties(
  item: ItemData | undefined,
  limit = 250,
): IfcPropertyRow[] {
  if (!item) return [];

  const rows: IfcPropertyRow[] = [];
  const visit = (data: ItemData, prefix = "", depth = 0) => {
    if (depth > 3 || rows.length >= limit) return;

    for (const [name, entry] of Object.entries(data)) {
      if (rows.length >= limit) return;
      const path = prefix ? `${prefix} · ${name}` : name;

      if (isItemAttribute(entry)) {
        rows.push({ name: path, value: formatIfcValue(entry.value) });
        continue;
      }

      if (Array.isArray(entry)) {
        entry.forEach((child, index) => {
          visit(child, `${path} ${index + 1}`, depth + 1);
        });
      }
    }
  };

  visit(item);
  return rows;
}

export function collectSpatialIds(root: SpatialTreeItem, limit = 2000): number[] {
  const ids: number[] = [];
  const visit = (node: SpatialTreeItem) => {
    if (ids.length >= limit) return;
    if (node.localId !== null) ids.push(node.localId);
    node.children?.forEach(visit);
  };
  visit(root);
  return ids;
}

export function buildIfcTree(
  node: SpatialTreeItem,
  names: ReadonlyMap<number, string>,
): IfcTreeNode {
  const category = node.category ?? "IFC-элемент";
  const name = node.localId === null ? null : names.get(node.localId);

  return {
    category,
    label: name ? `${name} · ${category}` : category,
    localId: node.localId,
    children: (node.children ?? []).map((child) => buildIfcTree(child, names)),
  };
}
