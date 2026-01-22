import { app, BrowserWindow, Notification, Tray, Menu, globalShortcut } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import chokidar from "chokidar";

// Allow autoplay for notification sounds.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// Module path helpers (ESM).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.join(__dirname, "..");
const schedulesPath = path.join(appRoot, "tasks.json");
const MAX_DELAY_MS = 2147483647; // ~24.8 days (setTimeout max delay)

// Global app state.
let win = null;
let tray = null;
let notificationWin = null;
let lastGoodConfig = { items: [], tasks: [] };
let trayAvailable = false;
const suppressNotificationOpen = new WeakSet();
const notificationQueue = [];
let notificationActive = false;

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

// Read schedules with a safe fallback to the last known-good config.
function readSchedules() {
  try {
    const raw = fs.readFileSync(schedulesPath, "utf-8");
    const parsed = JSON.parse(raw);
    lastGoodConfig = parsed;
    return parsed;
  } catch (err) {
    const message = err?.message || String(err);
    console.warn(`Failed to read schedules: ${message}`);
    return lastGoodConfig;
  }
}

function writeSchedules(nextConfig) {
  const next = `${JSON.stringify(nextConfig, null, 2)}\n`;
  const tmpPath = `${schedulesPath}.tmp`;
  fs.writeFileSync(tmpPath, next, "utf-8");
  fs.renameSync(tmpPath, schedulesPath);
  lastGoodConfig = nextConfig;
}

function rescheduleTaskInFile(task) {
  try {
    const cfg = readSchedules();
    const tasks = Array.isArray(cfg.tasks) ? cfg.tasks : [];
    const nextTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updated = tasks.map((t) => {
      if (t.enteredDate !== task.enteredDate) return t;
      const deadlinePressed = Boolean(t.deadline_pressed);
      return {
        ...t,
        finished: false,
        remove: false,
        enteredDate: new Date().toISOString(),
        notificationDate: nextTime,
        deadline: deadlinePressed ? t.deadline : nextTime,
        notify_pressed: true,
        deadline_pressed: deadlinePressed,
        reschedule_after_completed: Boolean(t.reschedule_after_completed)
      };
    });
    writeSchedules({ ...cfg, tasks: updated });
  } catch (err) {
    const message = err?.message || String(err);
    console.warn(`Failed to reschedule task: ${message}`);
  }
}

// Compute the correct URL for the renderer depending on environment.
function getAppUrl() {
  const cfg = readSchedules();

  if (!app.isPackaged) return cfg.appUrlDev || "http://localhost:5173/";

  // When packaged, you’ll load your built React files. For now keep placeholder behavior.
  // You’ll swap this during packaging (see notes below).
  const prod = cfg.appUrlProd || "file://__APP__/dist/index.html";
  return prod.replace("__APP__", path.join(process.resourcesPath, "app.asar"));
}

// Create the BrowserWindow lazily and keep a single instance.
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

// Bring the app to the front (or reopen) on demand.
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

// Create a small always-on-top notification window.
function showNotificationWindow({ title, message, route }) {
  notificationQueue.push({ title, message, route });
  if (notificationActive) return;
  showNextNotification();
}

function showNextNotification() {
  if (notificationActive) return;
  const next = notificationQueue.shift();
  if (!next) return;
  const { title, message, route } = next;

  notificationActive = true;
  if (notificationWin && !notificationWin.isDestroyed()) {
    suppressNotificationOpen.add(notificationWin);
    notificationWin.close();
  }

  notificationWin = new BrowserWindow({
    width: 360,
    height: 120,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      autoplayPolicy: "no-user-gesture-required"
    }
  });

  const safeTitle = String(title || "Reminder").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMessage = String(message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const soundUrl = pathToFileURL(
    path.join(__dirname, "WavNotify", "mixkit-elevator-tone-2863.wav")
  ).toString();
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #111; color: #f5f5f5; }
          .wrap { padding: 12px 14px; }
          .title { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
          .msg { font-size: 13px; opacity: 0.9; }
          .hint { margin-top: 10px; font-size: 11px; opacity: 0.6; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="title">${safeTitle}</div>
          <div class="msg">${safeMessage}</div>
          <div class="hint">Click to open</div>
        </div>
        <script>
          const tone = new Audio("${soundUrl}");
          tone.volume = 1.0;
          tone.play().catch(() => {});
        </script>
      </body>
    </html>
  `;

  const currentWin = notificationWin;

  currentWin
    .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    .catch(() => {
      notificationActive = false;
      showNextNotification();
    });
  currentWin.once("ready-to-show", () => {
    if (!currentWin.isDestroyed()) currentWin.show();
  });
  setTimeout(() => {
    if (!currentWin.isDestroyed() && !currentWin.isVisible()) {
      currentWin.show();
    }
  }, 150);
  currentWin.webContents.once("dom-ready", () => {
    if (currentWin.isDestroyed()) return;
    try {
      currentWin.webContents.executeJavaScript(`
        document.body.addEventListener('click', () => {
          window.close();
        });
      `);
    } catch {
      // Ignore if the window is already gone.
    }
  });
  currentWin.on("closed", () => {
    if (notificationWin === currentWin) notificationWin = null;
    if (!suppressNotificationOpen.has(currentWin) && route) {
      openOrFocus(route);
    }
    notificationActive = false;
    showNextNotification();
  });
}

// Deliver a desktop notification (custom window that stays until click).
function notify({ title, message, route }) {
  const soundPath = path.join(__dirname, "WavNotify", "mixkit-elevator-tone-2863.wav");
  if (process.platform === "linux") {
    if (fs.existsSync("/usr/bin/paplay")) {
      execFile("/usr/bin/paplay", [soundPath], () => {});
    } else if (fs.existsSync("/usr/bin/aplay")) {
      execFile("/usr/bin/aplay", [soundPath], () => {});
    }
  }
  if (typeof app.beep === "function") {
    app.beep();
  }
  showNotificationWindow({ title, message, route: route || "/" });
}

// Track scheduled timers so they can be rebuilt on changes.
function clearAllTimers() {
  for (const [, t] of timers) clearTimeout(t);
  timers.clear();
}

// Build all schedules from tasks.json (recurring + one-off tasks).
// Schedules:
// - everyMinutes: repeats
// - at: "HH:MM" daily
function buildSchedules() {
  clearAllTimers();

  const cfg = readSchedules();
  const items = Array.isArray(cfg.items) ? cfg.items : [];
  const tasks = Array.isArray(cfg.tasks) ? cfg.tasks : [];

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
    if (!task || task.remove) continue;
    if (task.finished && !task.reschedule_after_completed) continue;
    if (typeof task.notificationDate !== "string") continue;

    const when = new Date(task.notificationDate);
    if (Number.isNaN(when.getTime())) continue;

    const id = task.id || `task-${index}-${when.getTime()}`;

    const scheduleAt = () => {
      const delay = when.getTime() - Date.now();
      // Allow a small grace window so edits near the minute don't miss notifications.
      if (delay <= 0) {
        if (delay >= -60 * 1000) {
          notify({
            title: task.name || "Task Reminder",
            message: task.details || "",
            route: "/"
          });
          if (task.reschedule_after_completed && task.finished) {
            rescheduleTaskInFile(task);
          }
        }
        return;
      }

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
        if (task.reschedule_after_completed && task.finished) {
          rescheduleTaskInFile(task);
        }
      }, delay);

      timers.set(id, t);
    };

    scheduleAt();
  }
}

// Create a tray icon and menu, if an icon is available.
function createTray() {
  // If you don’t set an icon, tray may be invisible on some setups.
  // Add one later: new Tray(path.join(__dirname, "tray.png"))
  const trayIconPath = path.join(__dirname, "tray.png");
  if (!fs.existsSync(trayIconPath)) {
    console.warn(`Tray icon not found at ${trayIconPath}; skipping tray.`);
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

// App lifecycle: bootstrap window, tray, and schedulers.
app.whenReady().then(() => {
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

  const schedulesDir = path.dirname(schedulesPath);
  chokidar
    .watch(schedulesDir, { ignoreInitial: true })
    .on("add", (changedPath) => {
      if (path.basename(changedPath) === path.basename(schedulesPath)) {
        scheduleReload();
      }
    })
    .on("change", (changedPath) => {
      if (path.basename(changedPath) === path.basename(schedulesPath)) {
        scheduleReload();
      }
    });
});

// Keep running as tray app
app.on("window-all-closed", () => {});

// Clean up on quit.
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
