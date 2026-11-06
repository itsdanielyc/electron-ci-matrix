// The main process: the "backend" of this app, the way Rust is in the Tauri
// template. It answers the bridge's IPC calls. The greeting is implemented
// here on its own, not imported from contracts/, so the real-shell suite
// (tests/e2e) is what holds it to the contract.
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { channels, type PlatformInfo } from "./bridge";

function greet(name: string): string {
  return `Hello, ${name}! You've been greeted from the main process!`;
}

function platformInfo(): PlatformInfo {
  return {
    os: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    packaged: app.isPackaged,
  };
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
    title: "spike",
    show: false,
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once("ready-to-show", () => win.show());
  // Links open in the system browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devUrl) void win.loadURL(devUrl);
  else void win.loadFile(join(import.meta.dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle(channels.greet, (_e, name: unknown) => greet(String(name)));
  ipcMain.handle(channels.platformInfo, () => platformInfo());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
