"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { nextPrayer } = require("./prayer-summary");

const base = {
  today: "2026-11-21",
  timeZone: "Asia/Riyadh",
  configuredZone: "Asia/Riyadh",
  now: Date.parse("2026-11-21T12:00:00Z"),
  translate: label => ({ asr: "العصر", fajr: "الفجر" })[label]
};

test("next prayer uses the existing calculated instants and advances to tomorrow", () => {
  const calculate = date => ({
    times: date === base.today
      ? [{ label: "asr", time: "16:00", instant: Date.parse("2026-11-21T13:00:00Z"), date }]
      : [{ label: "fajr", time: "05:00", instant: Date.parse("2026-11-22T02:00:00Z"), date }]
  });
  assert.deepEqual(nextPrayer({ ...base, calculate }), {
    status: "ready", name: "العصر", time: "16:00", date: "2026-11-21"
  });
  assert.deepEqual(nextPrayer({ ...base, calculate, now: Date.parse("2026-11-21T20:00:00Z") }), {
    status: "ready", name: "الفجر", time: "05:00", date: "2026-11-22"
  });
});

test("unconfigured settings, mismatched zones and invalid calculations never invent a prayer time", () => {
  let calls = 0;
  const calculate = () => { calls += 1; return { error: "prayerSetup" }; };
  assert.equal(nextPrayer({ ...base, configuredZone: "UTC", calculate }).reason, "timezone_mismatch");
  assert.equal(calls, 0);
  assert.equal(nextPrayer({ ...base, calculate }).reason, "prayerSetup");
  assert.throws(() => nextPrayer({ ...base, calculate: () => ({ times: [{ instant: NaN }] }) }), /invalid_prayer_calculation/);
});
