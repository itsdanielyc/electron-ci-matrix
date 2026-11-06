// Runs sandboxed with contextIsolation on. It exposes exactly the typed bridge
// and nothing else: no ipcRenderer, no Node.
import { contextBridge, ipcRenderer } from "electron";
import { channels, type ElectronBridge } from "./bridge";

const bridge: ElectronBridge = {
  greet: (name) => ipcRenderer.invoke(channels.greet, name),
  platformInfo: () => ipcRenderer.invoke(channels.platformInfo),
};

contextBridge.exposeInMainWorld("electronBridge", bridge);
