// The renderer as a plain web app: `npm run dev:web` and the Playwright UI
// suite use it. Outside Electron there is no preload bridge, so src/api.ts
// falls back to the labelled mock.
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/out/**", "**/release/**"] },
  },
});
