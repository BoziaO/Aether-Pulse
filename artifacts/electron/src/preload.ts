import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke("get-app-version"),

  showMessageBox: (opts: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke("show-message-box", opts),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("open-external", url),

  onUpdateAvailable: (callback: () => void) =>
    ipcRenderer.on("update-available", callback),

  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on("update-downloaded", callback),

  platform: process.platform,
  isElectron: true,
});
