import { app, BrowserWindow, Notification, Tray, Menu, globalShortcut, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_DELAY_MS = 2147483647; // ~24.8 days (setTimeout max delay)

let win = null;
let tray = null;
let lastGoodConfig = { items: [], tasks: [] };
let trayAvailable = false;
let schedulesPath = null;
let logFilePath = null;
let logFallbackPath = "/tmp/task-accomplisher.log";

app.setName("TaskAccomplisher");

function logMessage(message) {
  try {
    if (!logFilePath && app?.getPath) {
      logFilePath = path.join(app.getPath("userData"), "scheduler.log");
    }
    const line = `[${new Date().toISOString()}] ${message}\n`;
    if (logFilePath) fs.appendFileSync(logFilePath, line, "utf-8");
    if (logFallbackPath) fs.appendFileSync(logFallbackPath, line, "utf-8");
    console.log(message);
  } catch (err) {
    console.warn("Failed to write log", err);
  }
}

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
}

function getSchedulesPath() {
  if (schedulesPath) return schedulesPath;

  if (app.isPackaged) {
    const userDataPath = app.getPath("userData");
    schedulesPath = path.join(userDataPath, "tasks.json");

    if (!fs.existsSync(schedulesPath)) {
      const defaultPath = path.join(getAppRoot(), "tasks.json");
      let seed = { items: [], tasks: [] };

      if (fs.existsSync(defaultPath)) {
        try {
          seed = JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
        } catch {}
      }

      fs.writeFileSync(schedulesPath, JSON.stringify(seed, null, 2), "utf-8");
    }
  } else {
    schedulesPath = path.join(getAppRoot(), "tasks.json");
  }

  return schedulesPath;
}

function writeSchedules(nextConfig) {
  if (!nextConfig || typeof nextConfig !== "object") {
    throw new Error("Invalid schedules payload");
  }

  const targetPath = getSchedulesPath();
  const next = `${JSON.stringify(nextConfig, null, 2)}\n`;
  const tmpPath = `${targetPath}.tmp`;

  fs.writeFileSync(tmpPath, next, "utf-8");
  fs.renameSync(tmpPath, targetPath);
  lastGoodConfig = nextConfig;
}

function toggleWindow() {
  const w = ensureWindow();
  if (w.isVisible()) {
    w.hide();
  } else {
    w.show();
    w.focus();
  }
}

// Keep track of timers so we can rebuild schedules when JSON changes
const timers = new Map();

function readSchedules() {
  try {
    const raw = fs.readFileSync(getSchedulesPath(), "utf-8");
    const parsed = JSON.parse(raw);
    lastGoodConfig = parsed;
    logMessage(`Loaded schedules: items=${Array.isArray(parsed.items) ? parsed.items.length : 0}, tasks=${Array.isArray(parsed.tasks) ? parsed.tasks.length : 0}`);
    return parsed;
  } catch (err) {
    const message = err?.message || String(err);
    console.warn(`Failed to read schedules: ${message}`);
    return lastGoodConfig;
  }
}

function getAppUrl() {
  const cfg = readSchedules();

  if (!app.isPackaged) return cfg.appUrlDev || "http://localhost:5173/";

  const prodPath = path.join(getAppRoot(), "dist", "index.html");
  return pathToFileURL(prodPath).toString();
}

function ensureWindow() {
  if (win && !win.isDestroyed()) return win;

  win = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true
    }
  });

  win.loadURL(getAppUrl());
  win.once("ready-to-show", () => {
    // Show the window on launch so it's accessible even if the tray isn't visible.
    win.show();
  });

  // Tray-style behavior: close hides instead of quitting
  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  return win;
}

function openOrFocus(route = "/") {
  const w = ensureWindow();

  // If you use React Router with BrowserRouter:
  // - In dev, opening /route requires your dev server to serve it (Vite does).
  // - In prod via file:// you’ll likely use HashRouter (recommended) so route becomes #/...
  //
  // For simplest cross-env routing: use hash routes and open "#/path".
  const base = getAppUrl();
  const url = base.includes("file://")
    ? `${base}#${route.startsWith("/") ? route : `/${route}`}`
    : `${base}#${route.startsWith("/") ? route : `/${route}`}`;

  w.loadURL(url);

  if (w.isMinimized()) w.restore();
  w.show();
  w.focus();
}

function notify({ title, message, route }) {
  logMessage(`Notify: ${title || "Reminder"} | ${message || ""}`);

  if (!Notification.isSupported()) {
    if (process.platform === "linux") {
      execFile("notify-send", [title || "Reminder", message || ""], () => {});
    }
    return;
  }

  const n = new Notification({ title, body: message });

  n.on("click", () => openOrFocus(route || "/"));

  try {
    n.show();
  } catch (err) {
    logMessage(`Notification.show failed: ${err?.message || String(err)}`);
    if (process.platform === "linux") {
      execFile("notify-send", [title || "Reminder", message || ""], () => {});
    }
  }
}

function clearAllTimers() {
  for (const [, t] of timers) clearTimeout(t);
  timers.clear();
}

// Schedules:
// - everyMinutes: repeats
// - at: "HH:MM" daily
function buildSchedules() {
  clearAllTimers();

  const cfg = readSchedules();
  const items = Array.isArray(cfg.items) ? cfg.items : [];
  const tasks = Array.isArray(cfg.tasks) ? cfg.tasks : [];

  logMessage("Building schedules");

  for (const item of items) {
    if (!item?.id) continue;

    // everyMinutes repeating
    if (Number.isFinite(item.everyMinutes) && item.everyMinutes > 0) {
      const ms = Math.floor(item.everyMinutes * 60 * 1000);

      // fire first after ms (change to immediate if you want)
      const tick = () => {
        notify({ title: item.title || "Reminder", message: item.message || "", route: item.route });
        const t = setTimeout(tick, ms);
        timers.set(item.id, t);
      };

      const t = setTimeout(tick, ms);
      timers.set(item.id, t);
      continue;
    }

    // daily at HH:MM
    if (typeof item.at === "string" && /^\d{2}:\d{2}$/.test(item.at)) {
      const [HH, MM] = item.at.split(":").map(Number);

      const scheduleNext = () => {
        const now = new Date();
        const next = new Date();
        next.setHours(HH, MM, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);

        const delay = next.getTime() - now.getTime();

        const t = setTimeout(() => {
          notify({ title: item.title || "Reminder", message: item.message || "", route: item.route });
          scheduleNext(); // schedule again for tomorrow
        }, delay);

        timers.set(item.id, t);
      };

      scheduleNext();
    }
  }

  for (const [index, task] of tasks.entries()) {
    if (!task || task.finished || task.remove) continue;
    if (typeof task.notificationDate !== "string") continue;

    const when = new Date(task.notificationDate);
    if (Number.isNaN(when.getTime())) continue;

    const id = task.id || `task-${index}-${when.getTime()}`;
    const initialDelay = when.getTime() - Date.now();
    logMessage(`Task schedule: id=${id} delayMs=${initialDelay}`);

    const scheduleAt = () => {
      const delay = when.getTime() - Date.now();
      if (delay <= 0) return;

      if (delay > MAX_DELAY_MS) {
        const t = setTimeout(scheduleAt, MAX_DELAY_MS);
        timers.set(id, t);
        return;
      }

      const t = setTimeout(() => {
        notify({
          title: task.name || "Task Reminder",
          message: task.details || "",
          route: "/"
        });
      }, delay);

      timers.set(id, t);
    };

    scheduleAt();
  }
}

function createTray() {
  // If you don’t set an icon, tray may be invisible on some setups.
  // Add one later: new Tray(path.join(__dirname, "tray.png"))
  const platform = process.platform;
  const iconCandidates = [
    platform === "darwin" ? "trayTemplate.png" : null,
    platform === "win32" ? "tray.ico" : null,
    "tray.png"
  ].filter(Boolean);

  const trayIconPath = iconCandidates
    .map((name) => path.join(__dirname, name))
    .find((p) => fs.existsSync(p));

  if (!trayIconPath) {
    console.warn("Tray icon not found; skipping tray.");
    return;
  }

  tray = new Tray(trayIconPath); // put a small png here
  trayAvailable = true;

  const menu = Menu.buildFromTemplate([
    { label: "Open", click: () => openOrFocus("/") },
    {
      label: "Test Notification",
      click: () => notify({ title: "Test", message: "Click to open app", route: "/" })
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Scheduler");
  tray.setContextMenu(menu);
  tray.on("click", () => openOrFocus("/"));
}

app.whenReady().then(() => {
  logMessage(`User data path: ${app.getPath("userData")}`);
  logMessage(`Notification supported: ${Notification.isSupported()}`);
  logMessage(`notify-send available: ${fs.existsSync("/usr/bin/notify-send") || fs.existsSync("/bin/notify-send")}`);

  ipcMain.handle("tasks:read", async () => readSchedules());
  ipcMain.handle("tasks:write", async (_event, payload) => {
    writeSchedules(payload);
    return { ok: true };
  });

  if (process.platform === "win32") {
    app.setAppUserModelId("com.codextemple.taskaccomplisher");
  }

  ensureWindow();
  createTray();
  buildSchedules();

  // Fallback: global shortcut to toggle window when tray is unavailable.
  globalShortcut.register("CommandOrControl+Shift+Y", () => {
    toggleWindow();
  });

  if (!trayAvailable) {
    win.show();
  }

  // Auto-reload schedules when JSON changes
  let reloadTimer = null;
  const scheduleReload = () => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      try {
        buildSchedules();
        // Comment out this line if you don't want a toast on every save.
        // notify({ title: "Schedules updated", message: "Reloaded tasks.json", route: "/" });
      } catch (e) {
        notify({ title: "Schedule error", message: String(e?.message || e), route: "/" });
      }
    }, 300);
  };

  chokidar.watch(getSchedulesPath(), { ignoreInitial: true }).on("change", scheduleReload);
});

// Keep running as tray app
app.on("window-all-closed", () => {});

app.on("activate", () => {
  if (!win) ensureWindow();
  win.show();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
