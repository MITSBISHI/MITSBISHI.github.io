function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function isNightByGuess(date = new Date()) {
  // Fallback heuristic if no location: dark between 19:00 and 07:00
  const h = date.getHours();
  return h >= 19 || h < 7;
}

async function getPositionOnce(timeoutMs = 6000) {
  if (!navigator.geolocation) return null;

  return await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 6 * 60 * 60 * 1000 }
    );
  });
}

async function isNightBySunApi(lat, lon) {
  const url = `https://api.sunrise-sunset.org/json?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lon)}&formatted=0`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Sun API failed");
  const data = await r.json();
  if (!data || data.status !== "OK") throw new Error("Sun API not OK");

  const now = new Date();
  const sunrise = new Date(data.results.sunrise);
  const sunset = new Date(data.results.sunset);

  return now < sunrise || now >= sunset;
}

export function applyThemeController() {
  async function refresh(config) {
    if (config.themeMode === "light") return setTheme("light");
    if (config.themeMode === "dark") return setTheme("dark");

    let night = null;

    if (config.useLocationForTheme) {
      const pos = await getPositionOnce();
      if (pos) {
        try {
          night = await isNightBySunApi(pos.lat, pos.lon);
        } catch {
          night = null;
        }
      }
    }

    if (night === null) night = isNightByGuess();

    setTheme(night ? "dark" : "light");
  }

  const interval = setInterval(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem("dementiaClockConfig") || "null");
      if (!cfg || cfg.themeMode !== "auto") return;
      refresh(cfg);
    } catch {
      // ignore
    }
  }, 5 * 60 * 1000);

  return { refresh, stop: () => clearInterval(interval) };
}
