"use strict";

(function attachMihwerDataValidation(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerDataValidation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

  function isUuid(value) {
    return typeof value === "string" && UUID.test(value);
  }

  function isDate(value) {
    if (typeof value !== "string" || !DATE.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }

  function isTimestamp(value) {
    return typeof value === "string" && TIMESTAMP.test(value) &&
      isDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
  }

  function shiftDate(value, days) {
    if (!isDate(value) || !Number.isInteger(days)) throw new TypeError("invalid_date_shift");
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    const result = date.toISOString().slice(0, 10);
    if (!isDate(result)) throw new TypeError("invalid_date_shift");
    return result;
  }

  return Object.freeze({ isUuid, isDate, isTimestamp, shiftDate });
});
