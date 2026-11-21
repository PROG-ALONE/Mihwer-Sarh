"use strict";

globalThis.MihwerProgressContract = (() => {
  const statuses = new Set(["completed", "incomplete", "cancelled", "deferred", "future", "unrecorded", "exempt"]);
  const aliases = {done:"completed", pending:"incomplete"};
  const validDate = value => globalThis.MihwerExtendedValidation.isDate(value);
  const validKey = value => typeof value === "string" && /^[A-Za-z][A-Za-z0-9._:-]*$/.test(value);

  function normalizeMetadataValue(value, seen=new Set()) {
    if(value===null||typeof value==="string"||typeof value==="boolean") return value;
    if(typeof value==="number"&&Number.isFinite(value)) return value;
    if(typeof value!=="object"||seen.has(value)) throw new Error("Invalid metadata value");
    seen.add(value);
    let normalized;
    if(Array.isArray(value)) normalized=Array.from(value,item=>normalizeMetadataValue(item,seen));
    else {
      const prototype=Object.getPrototypeOf(value);
      if(prototype!==Object.prototype&&prototype!==null) throw new Error("Invalid metadata value");
      normalized=Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalizeMetadataValue(value[key],seen)]));
    }
    seen.delete(value);
    return normalized;
  }

  function toCivilDate(value, timeZone="UTC") {
    if (typeof value !== "string" || typeof timeZone !== "string" || !timeZone) throw new Error("Invalid date or time zone");
    try { new Intl.DateTimeFormat("en", {timeZone}).format(0); }
    catch { throw new Error("Invalid time zone"); }
    if (validDate(value)) return value;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ||
        !validDate(value.slice(0, 10))) throw new Error("Invalid date");
    const instant = new Date(value);
    if (!Number.isFinite(instant.getTime())) throw new Error("Invalid date");
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone, year:"numeric", month:"2-digit", day:"2-digit"
    }).formatToParts(instant).map(part => [part.type, part.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    if (!validDate(date)) throw new Error("Invalid date");
    return date;
  }

  function normalizePeriod(period) {
    if (!period || typeof period !== "object") throw new Error("Invalid period");
    const timeZone = period.timeZone || "UTC";
    const start = toCivilDate(period.start, timeZone);
    const end = toCivilDate(period.end, timeZone);
    const asOf = toCivilDate(period.asOf ?? period.today, timeZone);
    const type = period.type || "custom";
    if (!["day", "week", "month", "year", "custom"].includes(type) || start > end) throw new Error("Invalid period");
    if (period.weekStartsOn !== undefined && (!Number.isInteger(period.weekStartsOn) || period.weekStartsOn < 0 || period.weekStartsOn > 6)) throw new Error("Invalid week start");
    return {
      type, start, end, asOf, timeZone,
      weekStartsOn:period.weekStartsOn ?? 1,
      boundary:"inclusive-civil-date"
    };
  }

  function createPeriod({type, date, start, end, asOf=date, timeZone="UTC", weekStartsOn=1}) {
    if (!["day", "week", "month", "year", "custom"].includes(type)) throw new Error("Invalid period type");
    let first, last;
    if (type === "custom") {
      first = toCivilDate(start, timeZone);
      last = toCivilDate(end, timeZone);
    } else {
      const anchor = toCivilDate(date, timeZone);
      const [year, month, day] = anchor.split("-").map(Number);
      if (type === "day") first = last = anchor;
      if (type === "week") {
        if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) throw new Error("Invalid week start");
        const offset = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() - weekStartsOn + 7) % 7;
        const firstDate = new Date(Date.UTC(year, month - 1, day - offset));
        const lastDate = new Date(Date.UTC(year, month - 1, day - offset + 6));
        first = firstDate.toISOString().slice(0, 10);
        last = lastDate.toISOString().slice(0, 10);
      }
      if (type === "month") {
        first = `${year}-${String(month).padStart(2, "0")}-01`;
        last = `${year}-${String(month).padStart(2, "0")}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
      }
      if (type === "year") {
        first = `${year}-01-01`;
        last = `${year}-12-31`;
      }
    }
    return normalizePeriod({type, start:first, end:last, asOf, timeZone, weekStartsOn});
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        !validKey(entry.type) || !validKey(entry.source) ||
        typeof entry.id !== "string" || !entry.id.trim() ||
        !validDate(entry.date)) throw new Error("Invalid progress entry");
    const status = aliases[entry.status] || entry.status;
    if (!statuses.has(status)) throw new Error("Invalid progress status");
    if ((entry.type === "subtask" || entry.type === "extendedSubtask") &&
        (typeof entry.parentId !== "string" || !entry.parentId.trim())) throw new Error("Subtask parent id is required");
    if (entry.parentId !== undefined && (typeof entry.parentId !== "string" || !entry.parentId.trim())) throw new Error("Invalid parent id");
    if (entry.metadata !== undefined && (!entry.metadata || typeof entry.metadata !== "object" || Array.isArray(entry.metadata))) throw new Error("Invalid metadata");
    if(!["eligible","excluded"].includes(entry.eligibility??"eligible")) throw new Error("Invalid progress eligibility");
    const observedBy = entry.observedBy === undefined ? [] : entry.observedBy;
    if (!Array.isArray(observedBy) || observedBy.some(value => !validKey(value))) throw new Error("Invalid observation sources");
    return {
      id:entry.id.trim(), type:entry.type, source:entry.source, date:entry.date,
      status, ...(entry.parentId === undefined ? {} : {parentId:entry.parentId.trim()}),
      ...(entry.metadata === undefined ? {} : {metadata:normalizeMetadataValue(entry.metadata)}),
      eligibility:entry.eligibility??"eligible",
      observedBy:[...new Set(observedBy)].sort()
    };
  }

  function identity(entry) {
    const key = [entry.type, entry.id, entry.parentId || ""];
    if (entry.type !== "extendedSubtask") key.push(entry.date);
    return JSON.stringify(key);
  }

  return {statuses:[...statuses], toCivilDate, normalizePeriod, createPeriod, normalizeEntry, identity};
})();
