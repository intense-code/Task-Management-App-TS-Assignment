const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  tasks: {
    read: () => ipcRenderer.invoke("tasks:read"),
    write: (payload) => ipcRenderer.invoke("tasks:write", payload)
  }
});
