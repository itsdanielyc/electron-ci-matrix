// The main process: the "backend" of this app, the way Rust is in the Tauri
// template. It owns the window and registers the bridge's IPC calls; what each
// call does, and the check on its arguments, lives in handlers.ts.
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { channels, type PlatformInfo } from "./bridge";
import { greet } from "./handlers";

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

function start(): void {
  ipcMain.handle(channels.greet, (_e, name: unknown) => greet(name));
  ipcMain.handle(channels.platformInfo, () => platformInfo());
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

// A main process that cannot start has nothing to show the error in: log it
// and exit non-zero so the real-shell suite and the installer test both fail.
app.whenReady().then(start).catch((error: unknown) => {
  console.error(error);
  app.exit(1);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
