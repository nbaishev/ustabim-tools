import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = resolve(appRoot, "public/ifc-runtime");

const runtimeFiles = [
  {
    source: fileURLToPath(import.meta.resolve("web-ifc/web-ifc.wasm")),
    target: "web-ifc.wasm",
  },
  {
    source: fileURLToPath(import.meta.resolve("@thatopen/fragments/worker")),
    target: "fragments-worker.mjs",
  },
];

await mkdir(runtimeDirectory, { recursive: true });
await Promise.all(
  runtimeFiles.map(({ source, target }) =>
    copyFile(source, resolve(runtimeDirectory, target)),
  ),
);

console.log("IFC runtime assets synchronized.");
