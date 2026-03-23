"use strict";
const electron = require("electron");
const path = require("node:path");
const createWindow = () => {
  const win = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0d0d0f",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  if (process.env["MAIN_WINDOW_VITE_DEV_SERVER_URL"]) {
    void win.loadURL(process.env["MAIN_WINDOW_VITE_DEV_SERVER_URL"]);
    win.webContents.openDevTools();
  } else {
    void win.loadFile(
      path.join(__dirname, `../renderer/${process.env["MAIN_WINDOW_VITE_NAME"] ?? "main_window"}/index.html`)
    );
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    void electron.shell.openExternal(url);
    return { action: "deny" };
  });
  return win;
};
electron.app.on("ready", createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
electron.ipcMain.on("mode:selected", (_event, payload) => {
  console.log("[score-studio] mode selected", payload);
});
electron.ipcMain.on("transport:play", () => {
});
electron.ipcMain.on("transport:stop", () => {
});
