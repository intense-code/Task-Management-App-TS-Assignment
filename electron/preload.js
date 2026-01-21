
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  // placeholder for future IPC APIs if you want them
});
