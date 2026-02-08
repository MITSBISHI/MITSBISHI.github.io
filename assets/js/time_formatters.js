function two(n) {
  return String(n).padStart(2, "0");
}

function mapDigits(str, digitsMap) {
  if (!digitsMap) return str;
  return String(str).replace(/[0-9]/g, (d) => digitsMap[d] ?? d);
}

function getDigitsMap(i18n) {
  const digits = i18n.t("digits");
  if (digits && digits.includes(",")) {
    const parts = digits.split(",").map(s => s.trim());
    if (parts.length === 10) {
      const map = {};
      for (let i = 0; i < 10; i++) map[String(i)] = parts[i];
      return map;
    }
  }
  return null;
}

export function formatTime(date, { timeFormat, showSeconds, i18n }) {
  const digitsMap = getDigitsMap(i18n);

  let h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  let out;

  if (timeFormat === "24") {
    out = `${two(h)}:${two(m)}`;
  } else {
    const isPM = h >= 12;
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    out = `${h12}:${two(m)} ${isPM ? i18n.t("pm") : i18n.t("am")}`;
  }

  if (showSeconds) {
    out += `:${two(s)}`;
  }

  return mapDigits(out, digitsMap);
}

export function formatDay(date, { i18n }) {
  const dayIndex = date.getDay(); // 0..6
  return i18n.t(`weekday.${dayIndex}`);
}

export function formatDate(date, { i18n }) {
  const digitsMap = getDigitsMap(i18n);

  const day = date.getDate();
  const monthIndex = date.getMonth() + 1; // 1..12
  const year = date.getFullYear();

  const monthName = i18n.t(`month.${monthIndex}`);
  const template = i18n.t("dateTemplate");
  const out = template
    .replace("{day}", String(day))
    .replace("{month}", monthName)
    .replace("{year}", String(year));

  return mapDigits(out, digitsMap);
}

export function getTimeOfDay(date, i18n) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return i18n.t("timeofday.morning");
  if (h >= 12 && h < 17) return i18n.t("timeofday.afternoon");
  if (h >= 17 && h < 21) return i18n.t("timeofday.evening");
  return i18n.t("timeofday.night");
}
