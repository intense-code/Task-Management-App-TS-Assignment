const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  getTasks: () => ipcRenderer.invoke("tasks:get"),
  saveTasks: (payload) => ipcRenderer.invoke("tasks:save", payload)
});
