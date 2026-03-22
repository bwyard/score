"use strict";
const electron = require("electron");
const scoreBridge = {
  /** Send a typed message to the main process (fire-and-forget). */
  send(channel, payload) {
    electron.ipcRenderer.send(channel, payload);
  },
  /** Register a listener for messages pushed from the main process. */
  on(channel, handler) {
    const wrapped = (_, p) => {
      handler(p);
    };
    electron.ipcRenderer.on(channel, wrapped);
    return () => electron.ipcRenderer.removeListener(channel, wrapped);
  }
};
electron.contextBridge.exposeInMainWorld("scoreBridge", scoreBridge);
