import { app, BrowserWindow, Notification, Tray, Menu } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const __dirname = '/var/local/www/w3/webdesign/codingTemple/React_Typescript/TaskManagementAppAssignment/taskAccomplisher'
const schedulesPath = path.join(__dirname, "tasks.json");

let win = null;
let tray = null;

// Keep track of timers so we can rebuild schedules when JSON changes
const timers = new Map();

function readSchedules() {
  const raw = fs.readFileSync(schedulesPath, "utf-8");
  return JSON.parse(raw);
}

function getAppUrl() {
  const cfg = readSchedules();

  if (!app.isPackaged) return cfg.appUrlDev;

  // When packaged, you’ll load your built React files. For now keep placeholder behavior.
  // You’ll swap this during packaging (see notes below).
  return cfg.appUrlProd.replace("__APP__", path.join(process.resourcesPath, "app.asar"));
}

function ensureWindow() {
  if (win && !win.isDestroyed()) return win;

  win = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  win.loadURL(getAppUrl());

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
  const n = new Notification({ title, body: message });

  n.on("click", () => openOrFocus(route || "/"));

  n.show();
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
}

function createTray() {
  // If you don’t set an icon, tray may be invisible on some setups.
  // Add one later: new Tray(path.join(__dirname, "tray.png"))
  tray = new Tray(path.join(__dirname, "tray.png")); // put a small png here

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
  ensureWindow();
  createTray();
  buildSchedules();

  // Auto-reload schedules when JSON changes
  chokidar.watch(schedulesPath, { ignoreInitial: true }).on("change", () => {
    try {
      buildSchedules();
      notify({ title: "Schedules updated", message: "Reloaded tasks.json", route: "/" });
    } catch (e) {
      notify({ title: "Schedule error", message: String(e?.message || e), route: "/" });
    }
  });
});

// Keep running as tray app
app.on("window-all-closed", () => {});
