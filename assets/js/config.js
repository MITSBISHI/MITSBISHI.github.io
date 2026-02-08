const STORAGE_KEY = "dementiaClockConfig";

async function loadDefaults() {
  const r = await fetch("config/defaults.json", { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load config/defaults.json");
  return await r.json();
}

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

function migrateConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return null;

  const v = Number(cfg.schemaVersion || 1);

  // v1 -> v2
  if (v < 2) {
    cfg.schemaVersion = 2;
    if (typeof cfg.showSeconds !== "boolean") cfg.showSeconds = false;
    if (typeof cfg.showTimeOfDay !== "boolean") cfg.showTimeOfDay = true;
    if (typeof cfg.settingsLocked !== "boolean") cfg.settingsLocked = true;
    if (typeof cfg.tvMode !== "boolean") cfg.tvMode = false;
  }

  return cfg;
}

export async function loadConfig() {
  const defaults = await loadDefaults();
  const savedRaw = localStorage.getItem(STORAGE_KEY);
  const saved = migrateConfig(safeParse(savedRaw)) || {};
  const merged = { ...defaults, ...saved };

  merged.timeFormat = merged.timeFormat === "24" ? "24" : "12";
  merged.language = typeof merged.language === "string" ? merged.language : defaults.language;
  merged.themeMode = ["auto", "light", "dark"].includes(merged.themeMode) ? merged.themeMode : defaults.themeMode;
  merged.useLocationForTheme = !!merged.useLocationForTheme;
  merged.touchMode = !!merged.touchMode;
  merged.tvMode = !!merged.tvMode;
  merged.showSeconds = !!merged.showSeconds;
  merged.showTimeOfDay = !!merged.showTimeOfDay;
  merged.settingsLocked = !!merged.settingsLocked;
  merged.schemaVersion = 2;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export async function resetConfig() {
  const defaults = await loadDefaults();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export function getConfigFromStorage() {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}
