// The seam between the UI and the backend. Inside Electron the calls go
// through the preload bridge (window.electronBridge) over IPC to the main
// process. Under the Vite dev server (`npm run dev:web`, the Playwright UI
// suite) there is no bridge and a labelled mock answers instead. A built app
// with no bridge is broken and says so: it never runs on the mock, where
// everything a person entered would be gone when the window closed. The mock
// is held to the same contract as the main process by
// tests/unit/contract.test.ts and by the real-shell suite, so a UI test that
// passes against the mock means something.
import type { ElectronBridge, PlatformInfo } from "../electron/bridge";
import { greeting } from "../contracts/greet";

export interface Backend {
  readonly kind: "native" | "mock";
  greet(name: string): Promise<string>;
  platformInfo(): Promise<PlatformInfo>;
}

declare global {
  interface Window {
    electronBridge?: ElectronBridge;
  }
}

export const mock: Backend = {
  kind: "mock",
  greet: async (name) => greeting(name),
  platformInfo: async () => ({
    os: "mock",
    arch: "mock",
    electron: "mock",
    packaged: false,
  }),
};

/**
 * Picks the backend. `dev` is Vite's `import.meta.env.DEV`: true under the
 * dev server, false in every build. Only the dev server may fall back to the
 * mock; a build without the bridge throws, and src/main.ts shows the message.
 */
export function selectBackend(bridge: ElectronBridge | undefined, dev: boolean): Backend {
  if (bridge) {
    return {
      kind: "native",
      greet: (name) => bridge.greet(name),
      platformInfo: () => bridge.platformInfo(),
    };
  }
  if (!dev) {
    throw new Error("The app could not reach its main process, so it cannot open or save anything. Reinstall it, or report this.");
  }
  return mock;
}
