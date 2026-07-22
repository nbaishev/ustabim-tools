import { describe, expect, it } from "vitest";

import {
  buildIfcTree,
  collectSpatialIds,
  flattenIfcProperties,
  formatIfcValue,
  getIfcAttribute,
  getIfcRaycastPointer,
  getIfcSectionNormal,
} from "./ifc-inspection";

describe("IFC inspection helpers", () => {
  it("keeps viewport coordinates for the fragments raycaster", () => {
    expect(getIfcRaycastPointer(640, 360)).toEqual({ x: 640, y: 360 });
  });

  it("returns axis-aligned section normals in both directions", () => {
    expect(getIfcSectionNormal("xy")).toEqual([0, 0, 1]);
    expect(getIfcSectionNormal("xz", true)).toEqual([0, -1, 0]);
    expect(getIfcSectionNormal("yz", true)).toEqual([-1, 0, 0]);
  });

  it("formats IFC values without exposing object placeholders", () => {
    expect(formatIfcValue(null)).toBe("—");
    expect(formatIfcValue(["A", 2])).toBe("A, 2");
    expect(formatIfcValue({ unit: "m" })).toBe('{"unit":"m"}');
  });

  it("reads and flattens attributes and related property sets", () => {
    const item = {
      Name: { value: "Wall 01" },
      IsDefinedBy: [
        {
          FireRating: { value: "REI 60" },
        },
      ],
    };

    expect(getIfcAttribute(item, "Name")).toBe("Wall 01");
    expect(flattenIfcProperties(item)).toEqual([
      { name: "Name", value: "Wall 01" },
      { name: "IsDefinedBy 1 · FireRating", value: "REI 60" },
    ]);
  });

  it("collects identifiers and builds a named spatial tree", () => {
    const source = {
      category: "IfcProject",
      localId: 1,
      children: [{ category: "IfcBuilding", localId: 2 }],
    };

    expect(collectSpatialIds(source)).toEqual([1, 2]);
    expect(buildIfcTree(source, new Map([[2, "Office"]]))).toEqual({
      category: "IfcProject",
      label: "IfcProject",
      localId: 1,
      children: [
        {
          category: "IfcBuilding",
          label: "Office · IfcBuilding",
          localId: 2,
          children: [],
        },
      ],
    });
  });
});
