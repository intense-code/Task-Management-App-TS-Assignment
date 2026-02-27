
import { contextBridge } from "electron";

export type DesktopApi = {
  // placeholder for future IPC APIs if you want them
};

contextBridge.exposeInMainWorld("desktop", {} as DesktopApi);
