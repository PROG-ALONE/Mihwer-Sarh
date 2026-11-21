"use strict";

globalThis.MihwerJourneyTimeline = (() => {
  const activeStatuses = new Set(["scheduled", "pending", "inProgress"]);
  const completedStatuses = new Set(["completed", "done"]);

  function parseClock(value) {
    if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  }

  function durationBetween(start, end) {
    const startMinute = parseClock(start), endMinute = parseClock(end);
    if (startMinute === null || endMinute === null) return null;
    return (endMinute - startMinute + 1440) % 1440;
  }

  function shiftMinute(startMinute, deltaMinutes) {
    if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute >= 1440 ||
        !Number.isInteger(deltaMinutes)) throw new Error("Invalid timeline shift");
    const total = startMinute + deltaMinutes;
    return {
      dayOffset: Math.floor(total / 1440),
      minute: ((total % 1440) + 1440) % 1440
    };
  }

  function stepPosition(index, direction, length) {
    if (!Number.isInteger(index) || !Number.isInteger(length) || length < 1 ||
        ![-1, 1].includes(direction)) throw new Error("Invalid journey navigation");
    return Math.max(0, Math.min(length - 1, index + direction));
  }

  function positionAtMinute(entries, minute) {
    if (!Array.isArray(entries) || !Number.isFinite(minute) ||
        entries.some(entry => !entry || (entry.startMinute !== null &&
          entry.startMinute !== undefined &&
          (!Number.isFinite(entry.startMinute) || entry.startMinute < -1440 ||
            entry.startMinute >= 2880)))) {
      throw new Error("Invalid journey position input");
    }
    if (entries.length < 2) return 0;
    const timed = entries.map((entry, index) => ({index, minute:entry.startMinute}))
      .filter(entry => Number.isFinite(entry.minute))
      .sort((a,b) => a.minute-b.minute || a.index-b.index);
    if (!timed.length) return Math.max(0, Math.min(entries.length-1, minute/1440*(entries.length-1)));
    const before = timed.filter(entry => entry.minute<=minute).at(-1);
    const after = timed.find(entry => entry.minute>minute);
    if (!before) {
      const ratio = Math.max(0, Math.min(1, minute/Math.max(1, timed[0].minute)));
      return timed[0].index*ratio;
    }
    if (!after) {
      const ratio = Math.max(0, Math.min(1, (minute-before.minute)/Math.max(1, 1440-before.minute)));
      return before.index+(entries.length-1-before.index)*ratio;
    }
    const ratio = Math.max(0, Math.min(1, (minute-before.minute)/Math.max(1, after.minute-before.minute)));
    return before.index+(after.index-before.index)*ratio;
  }

  function order(events) {
    if (!Array.isArray(events)) throw new Error("Timeline events must be an array");
    const seen = new Set();
    const ordered = events.map(event => {
      if (!event || typeof event.id !== "string" || !event.id ||
          typeof event.title !== "string" || !event.title ||
          (event.startMinute !== null && event.startMinute !== undefined &&
            (!Number.isInteger(event.startMinute) || event.startMinute < -1440 || event.startMinute >= 2880)) ||
          (event.durationMinutes !== null && event.durationMinutes !== undefined &&
            (!Number.isFinite(event.durationMinutes) || event.durationMinutes < 0)) ||
          (event.actualMinutes !== null && event.actualMinutes !== undefined &&
            (!Number.isFinite(event.actualMinutes) || event.actualMinutes < 0))) {
        throw new Error("Invalid timeline event");
      }
      if (seen.has(event.id)) throw new Error("Duplicate timeline event identity");
      seen.add(event.id);
      return {...event, startMinute:event.startMinute ?? null, durationMinutes:event.durationMinutes ?? null,
        actualMinutes:event.actualMinutes ?? null, overlap:false};
    }).sort((a,b)=>(a.startMinute ?? Infinity)-(b.startMinute ?? Infinity)||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    for (let i=0;i<ordered.length;i++) {
      const current=ordered[i];
      if (current.startMinute===null || !current.durationMinutes) continue;
      const end=current.startMinute+current.durationMinutes;
      for (let j=i+1;j<ordered.length;j++) {
        const next=ordered[j];
        if (next.startMinute===null || next.startMinute>=end) break;
        if (next.durationMinutes&&current.startMinute<next.startMinute+next.durationMinutes) {
          current.overlap=true;
          next.overlap=true;
        }
      }
    }
    return ordered;
  }

  function summarize(events, nowMinute) {
    if (!Array.isArray(events) || !Number.isFinite(nowMinute)) throw new Error("Invalid timeline summary input");
    const active=events.filter(event=>event.status==="scheduled"||event.status==="pending"||
      event.status==="inProgress"||completedStatuses.has(event.status));
    const completed=active.filter(event=>completedStatuses.has(event.status)).length;
    const overdue=active.filter(event=>activeStatuses.has(event.status)&&
      Number.isFinite(event.endMinute)&&event.endMinute<nowMinute).length;
    const plannedMinutes=active.reduce((sum,event)=>sum+(Number.isFinite(event.durationMinutes)?event.durationMinutes:0),0);
    const actualMinutes=active.reduce((sum,event)=>sum+(Number.isFinite(event.actualMinutes)?event.actualMinutes:0),0);
    return {
      scheduled:active.length,
      completed,
      overdue,
      remaining:Math.max(0,active.length-completed-overdue),
      cancelled:events.filter(event=>event.status==="cancelled").length,
      progress:active.length?completed/active.length:null,
      plannedMinutes,
      actualMinutes,
      overlapping:active.filter(event=>event.overlap).length
    };
  }

  return {parseClock, durationBetween, shiftMinute, stepPosition, positionAtMinute, order, summarize};
})();

if (typeof module !== "undefined" && module.exports) module.exports=globalThis.MihwerJourneyTimeline;
