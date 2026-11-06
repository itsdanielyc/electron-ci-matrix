// One config for the three Electron builds. The layout mirrors the Tauri
// template: the renderer is the Vite app at the root (index.html, src/), and
// the native side lives in electron/ the way Rust lives in src-tauri/.
import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      lib: { entry: resolve(import.meta.dirname, "electron/main.ts") },
    },
  },
  preload: {
    build: {
      lib: { entry: resolve(import.meta.dirname, "electron/preload.ts") },
      // A sandboxed preload must be CommonJS; the package is "type": "module",
      // so the file gets a .cjs extension.
      rolldownOptions: { output: { format: "cjs", entryFileNames: "[name].cjs" } },
    },
  },
  renderer: {
    root: ".",
    server: { port: 1420, strictPort: true },
    build: {
      rolldownOptions: { input: resolve(import.meta.dirname, "index.html") },
    },
  },
});
