"use strict";

(function attachMihwerPrayerSummary(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerPrayerSummary = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { isDate, shiftDate } = globalThis.MihwerDataValidation || require("./data-validation");

  function nextPrayer({ today, timeZone, configuredZone, calculate, translate, now = Date.now() }) {
    if (!isDate(today) || typeof timeZone !== "string" || !timeZone ||
        typeof configuredZone !== "string" || typeof calculate !== "function" ||
        typeof translate !== "function" || !Number.isFinite(now)) {
      throw new TypeError("invalid_prayer_summary_request");
    }
    if (timeZone !== configuredZone) return { status: "unavailable", reason: "timezone_mismatch" };
    for (const date of [today, shiftDate(today, 1)]) {
      const result = calculate(date);
      if (result?.error || result?.differentDay) return { status: "unavailable", reason: result.error || "date_mismatch" };
      if (!Array.isArray(result?.times) || result.times.some(item =>
        !item || typeof item.label !== "string" || typeof item.time !== "string" ||
        !Number.isFinite(item.instant) || item.date !== date
      )) throw new Error("invalid_prayer_calculation");
      const prayer = result.times.find(item => item.instant > now);
      if (prayer) {
        const name = translate(prayer.label);
        if (typeof name !== "string" || !name) throw new Error("invalid_prayer_label");
        return { status: "ready", name, time: prayer.time, date };
      }
    }
    return { status: "unavailable", reason: "prayer_unavailable" };
  }

  return Object.freeze({ nextPrayer });
});
