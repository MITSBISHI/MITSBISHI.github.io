import { formatTime, formatDay, formatDate, getTimeOfDay } from "./time_formatters.js";

export function startClock({ timeEl, timeOfDayEl, dayEl, dateEl, getConfig, i18n }) {
  function render(now) {
    const cfg = getConfig();

    timeEl.textContent = formatTime(now, {
      timeFormat: cfg.timeFormat,
      showSeconds: cfg.showSeconds,
      i18n
    });

    if (cfg.showTimeOfDay) {
      timeOfDayEl.textContent = getTimeOfDay(now, i18n);
      timeOfDayEl.hidden = false;
    } else {
      timeOfDayEl.hidden = true;
    }

    dayEl.textContent = formatDay(now, { i18n });
    dateEl.textContent = formatDate(now, { i18n });
  }

  function scheduleNextTick(now) {
    // Stable, calm ticking: align to next whole second.
    const delay = 1000 - now.getMilliseconds() + 10;
    timer = setTimeout(tick, delay);
  }

  function tick() {
    const now = new Date();
    render(now);
    scheduleNextTick(now);
  }

  let timer = null;
  tick();

  return {
    tickOnce: () => render(new Date()),
    stop: () => timer && clearTimeout(timer)
  };
}
