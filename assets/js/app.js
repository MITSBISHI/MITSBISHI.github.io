import { loadConfig, saveConfig, resetConfig } from "./config.js";
import { createI18n } from "./i18n.js";
import { startClock } from "./time.js";
import { applyThemeController } from "./theme.js";

const els = {
  timeText: document.getElementById("timeText"),
  timeOfDayText: document.getElementById("timeOfDayText"),
  dayText: document.getElementById("dayText"),
  dateText: document.getElementById("dateText"),

  langButton: document.getElementById("langButton"),
  settingsButton: document.getElementById("settingsButton"),
  closeSettings: document.getElementById("closeSettings"),
  settingsSheet: document.getElementById("settingsSheet"),
  backdrop: document.getElementById("backdrop"),

  timeFormatSelect: document.getElementById("timeFormatSelect"),
  languageSelect: document.getElementById("languageSelect"),
  showSeconds: document.getElementById("showSeconds"),
  showTimeOfDay: document.getElementById("showTimeOfDay"),
  tvMode: document.getElementById("tvMode"),
  autoThemeSelect: document.getElementById("autoThemeSelect"),
  useLocationTheme: document.getElementById("useLocationTheme"),
  touchMode: document.getElementById("touchMode"),
  settingsLocked: document.getElementById("settingsLocked"),
  resetButton: document.getElementById("resetButton"),

  settingsTitle: document.getElementById("settingsTitle"),
  timeFormatLabel: document.getElementById("timeFormatLabel"),
  languageLabel: document.getElementById("languageLabel"),
  showSecondsLabel: document.getElementById("showSecondsLabel"),
  showTimeOfDayLabel: document.getElementById("showTimeOfDayLabel"),
  tvModeLabel: document.getElementById("tvModeLabel"),
  autoThemeLabel: document.getElementById("autoThemeLabel"),
  useLocationThemeLabel: document.getElementById("useLocationThemeLabel"),
  touchModeLabel: document.getElementById("touchModeLabel"),
  settingsLockedLabel: document.getElementById("settingsLockedLabel"),
  hintText: document.getElementById("hintText"),
  lockHintText: document.getElementById("lockHintText")
};

function setSheetOpen(open) {
  els.settingsSheet.hidden = !open;
  els.backdrop.hidden = !open;
  if (open) els.closeSettings.focus();
  else els.settingsButton.focus();
}

function wireSheetUI() {
  els.closeSettings.addEventListener("click", () => setSheetOpen(false));
  els.backdrop.addEventListener("click", () => setSheetOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.settingsSheet.hidden) setSheetOpen(false);
  });

  // Language button is a shortcut into settings
  els.langButton.addEventListener("click", () => setSheetOpen(true));
}

function applyTouchMode(enabled) {
  document.documentElement.dataset.touch = enabled ? "true" : "false";
}

function applyTvMode(enabled) {
  document.documentElement.dataset.tv = enabled ? "true" : "false";
}

function wireSettingsButtonLocking(getConfigRef, setConfigRef, i18n) {
  let pressTimer = null;

  function openIfUnlocked() {
    const cfg = getConfigRef();
    if (!cfg.settingsLocked) setSheetOpen(true);
  }

  function startHoldToUnlock() {
    const cfg = getConfigRef();
    if (!cfg.settingsLocked) {
      setSheetOpen(true);
      return;
    }

    pressTimer = setTimeout(() => {
      const c = getConfigRef();
      c.settingsLocked = false;
      setConfigRef(c);
      saveConfig(c);
      setSheetOpen(true);
      pressTimer = null;
    }, 2000);
  }

  function cancelHold() {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  }

  els.settingsButton.addEventListener("click", openIfUnlocked);
  els.settingsButton.addEventListener("pointerdown", startHoldToUnlock);
  els.settingsButton.addEventListener("pointerup", cancelHold);
  els.settingsButton.addEventListener("pointercancel", cancelHold);
  els.settingsButton.addEventListener("pointerleave", cancelHold);

  // Optional: tell the user what to do if they try clicking while locked
  els.settingsButton.addEventListener("click", () => {
    const cfg = getConfigRef();
    if (cfg.settingsLocked) {
      // Keep it calm: no alerts. The hint text inside settings explains it.
    }
  });
}

async function main() {
  wireSheetUI();

  let config = await loadConfig();
  applyTouchMode(!!config.touchMode);
  applyTvMode(!!config.tvMode);

  const i18n = await createI18n({
    initialLanguage: config.language,
    languageSelectEl: els.languageSelect
  });

  const theme = applyThemeController();
  await theme.refresh(config);

  let clock = null;

  function applyStaticLabels() {
    els.settingsTitle.textContent = i18n.t("settings.title");
    els.timeFormatLabel.textContent = i18n.t("settings.timeFormat");
    els.languageLabel.textContent = i18n.t("settings.language");
    els.showSecondsLabel.textContent = i18n.t("settings.showSeconds");
    els.showTimeOfDayLabel.textContent = i18n.t("settings.showTimeOfDay");
    els.tvModeLabel.textContent = i18n.t("settings.tvMode");
    els.autoThemeLabel.textContent = i18n.t("settings.theme");
    els.useLocationThemeLabel.textContent = i18n.t("settings.useLocationForTheme");
    els.touchModeLabel.textContent = i18n.t("settings.touchMode");
    els.settingsLockedLabel.textContent = i18n.t("settings.lockSettings");
    els.resetButton.textContent = i18n.t("settings.reset");
    els.hintText.textContent = i18n.t("settings.hint");
    els.lockHintText.textContent = i18n.t("settings.lockHint");

    els.timeFormatSelect.querySelector('option[value="12"]').textContent = i18n.t("settings.option.12h");
    els.timeFormatSelect.querySelector('option[value="24"]').textContent = i18n.t("settings.option.24h");
    els.autoThemeSelect.querySelector('option[value="auto"]').textContent = i18n.t("settings.option.auto");
    els.autoThemeSelect.querySelector('option[value="light"]').textContent = i18n.t("settings.option.light");
    els.autoThemeSelect.querySelector('option[value="dark"]').textContent = i18n.t("settings.option.dark");
  }

  applyStaticLabels();

  i18n.onLanguageChanged(() => {
    applyStaticLabels();
    config.language = i18n.getLanguage();
    saveConfig(config);
    if (clock) clock.tickOnce();
  });

  function mountClock() {
    if (clock) clock.stop();
    clock = startClock({
      timeEl: els.timeText,
      timeOfDayEl: els.timeOfDayText,
      dayEl: els.dayText,
      dateEl: els.dateText,
      getConfig: () => config,
      i18n
    });
  }

  mountClock();

  // Settings initial values
  els.timeFormatSelect.value = config.timeFormat;
  els.autoThemeSelect.value = config.themeMode;
  els.useLocationTheme.checked = !!config.useLocationForTheme;
  els.touchMode.checked = !!config.touchMode;
  els.tvMode.checked = !!config.tvMode;
  els.showSeconds.checked = !!config.showSeconds;
  els.showTimeOfDay.checked = !!config.showTimeOfDay;
  els.settingsLocked.checked = !!config.settingsLocked;

  // Locking behaviour for gear button
  wireSettingsButtonLocking(
    () => config,
    (newCfg) => { config = newCfg; },
    i18n
  );

  // When settings sheet is open, allow normal interaction even if re-locked
  els.settingsButton.addEventListener("click", () => {
    if (!config.settingsLocked) setSheetOpen(true);
  });

  // Control changes (persist + refresh)
  els.timeFormatSelect.addEventListener("change", () => {
    config.timeFormat = els.timeFormatSelect.value;
    saveConfig(config);
    clock.tickOnce();
  });

  els.showSeconds.addEventListener("change", () => {
    config.showSeconds = els.showSeconds.checked;
    saveConfig(config);
    clock.tickOnce();
  });

  els.showTimeOfDay.addEventListener("change", () => {
    config.showTimeOfDay = els.showTimeOfDay.checked;
    saveConfig(config);
    clock.tickOnce();
  });

  els.tvMode.addEventListener("change", () => {
    config.tvMode = els.tvMode.checked;
    applyTvMode(!!config.tvMode);
    saveConfig(config);
    clock.tickOnce();
  });

  els.autoThemeSelect.addEventListener("change", async () => {
    config.themeMode = els.autoThemeSelect.value;
    saveConfig(config);
    await theme.refresh(config);
  });

  els.useLocationTheme.addEventListener("change", async () => {
    config.useLocationForTheme = els.useLocationTheme.checked;
    saveConfig(config);
    await theme.refresh(config);
  });

  els.touchMode.addEventListener("change", () => {
    config.touchMode = els.touchMode.checked;
    applyTouchMode(!!config.touchMode);
    saveConfig(config);
  });

  els.settingsLocked.addEventListener("change", () => {
    config.settingsLocked = els.settingsLocked.checked;
    saveConfig(config);
    // If user locks while sheet is open, keep it open; lock applies next time.
  });

  els.resetButton.addEventListener("click", async () => {
    const ok = confirm(i18n.t("settings.confirmReset"));
    if (!ok) return;

    config = await resetConfig();

    els.timeFormatSelect.value = config.timeFormat;
    els.autoThemeSelect.value = config.themeMode;
    els.useLocationTheme.checked = !!config.useLocationForTheme;
    els.touchMode.checked = !!config.touchMode;
    els.tvMode.checked = !!config.tvMode;
    els.showSeconds.checked = !!config.showSeconds;
    els.showTimeOfDay.checked = !!config.showTimeOfDay;
    els.settingsLocked.checked = !!config.settingsLocked;

    applyTouchMode(!!config.touchMode);
    applyTvMode(!!config.tvMode);

    await i18n.setLanguage(config.language);
    await theme.refresh(config);
    clock.tickOnce();
  });
}

main().catch((e) => console.error(e));
