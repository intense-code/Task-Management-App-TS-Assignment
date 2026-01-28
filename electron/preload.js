
const { contextBridge } = require("electron")

contextBridge.exposeInMainWorld("desktop", {
  // placeholder for future IPC APIs if you want them
})
