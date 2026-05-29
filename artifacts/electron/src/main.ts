import { app, BrowserWindow, shell, ipcMain, Menu, dialog, nativeTheme } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import serve from "electron-serve";

const isDev = !app.isPackaged;

const loadURL = isDev
  ? undefined
  : serve({ directory: path.join(process.resourcesPath, "web") });

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  nativeTheme.themeSource = "dark";

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0b0d18",
    titleBarStyle: "hiddenInset",
    frame: process.platform !== "darwin",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    icon: isDev
      ? undefined
      : path.join(process.resourcesPath, "web", "favicon.ico"),
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    const devPort = process.env["AETHERPULSE_PORT"] ?? "26020";
    mainWindow.loadURL(`http://localhost:${devPort}/`);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    loadURL!(mainWindow);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "AetherPulse",
      submenu: [
        { label: "About AetherPulse", role: "about" },
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        ...(isDev ? [{ role: "toggleDevTools" as const }] : []),
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { role: "close" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("show-message-box", async (_event, opts: Electron.MessageBoxOptions) => {
  if (!mainWindow) return;
  return dialog.showMessageBox(mainWindow, opts);
});

ipcMain.handle("open-external", (_event, url: string) => {
  shell.openExternal(url);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update-downloaded");
});
