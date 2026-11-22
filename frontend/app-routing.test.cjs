"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

function control(screen) {
  const attributes = new Set(["inert"]);
  const classes = new Set();
  return {
    dataset: { screen }, disabled: true, innerHTML: "", open: false, style: {},
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      toggle(value, enabled) { if (enabled) classes.add(value); else classes.delete(value); }
    },
    setAttribute: name => attributes.add(name),
    removeAttribute: name => attributes.delete(name),
    hasAttribute: name => attributes.has(name),
    addEventListener() {},
    close() { this.open = false; }
  };
}

function shell(hash = "#day") {
  const view = control(), dialog = control(), topbar = control(), mobile = control();
  const nav = ["day", "activities", "paths", "notes", "organizer"].map(control);
  const actions = [control(), control(), control()];
  const disclosures = [control(), control()];
  const events = {};
  const documentEvents = {};
  const location = { hash };
  const periodSelections = [];
  const modulePages = [];
  const window = {
    location, scrollY: 0, scrollTo() {},
    history: { pushState(_state, _title, next) { location.hash = next; } },
    addEventListener(name, handler) { events[name] = handler; },
    MihwarTaskSlice: {
      render: () => "<p>server-auth-state</p>",
      renderModulePage: keys => { modulePages.push(keys); return `<p>server-module:${keys.join(",")}</p>`; },
      setPeriodForScreen: period => periodSelections.push(period),
      setActivitiesSurface() {},
      state: { draft: "retained" }
    }
  };
  const document = {
    documentElement: {}, body: control(),
    addEventListener(name, handler) { documentEvents[name] = handler; },
    querySelector(selector) {
      if (selector === "#view") return view;
      if (selector === "#dialog") return dialog;
      if (selector === ".topbar") return topbar;
      if (selector === ".mobile-nav") return mobile;
      return selector.startsWith("#") ? control() : null;
    },
    querySelectorAll(selector) {
      if (selector.includes(".main-nav")) return nav;
      if (selector === ".top-actions button") return actions;
      if (selector === ".notice,#scenic-disclosure") return disclosures;
      return [];
    }
  };
  const context = vm.createContext({
    window, document, Intl, Date, Map, Set,
    matchMedia: () => ({ matches: true }),
    MihwerWheelGestureGate: class { reset() {} },
    setTimeout, clearTimeout
  });
  const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
  vm.runInContext(source, context);
  const beforeDependencies = view.innerHTML;
  vm.runInContext('journey=()=>`<section class="original-journey">${screen}</section>`; render();', context);
  return { context, view, dialog, topbar, mobile, nav, actions, disclosures, events, documentEvents, beforeDependencies, location, window, periodSelections, modulePages };
}

for (const route of ["day", "week", "month", "year"]) {
  test(`direct #${route} renders the server-backed journey and selects its period`, () => {
    const app = shell(`#${route}`);
    assert.equal(app.beforeDependencies, "");
    assert.equal(typeof app.documentEvents.DOMContentLoaded, "function");
    assert.match(app.view.innerHTML, /data-backend-task-slice/);
    assert.match(app.view.innerHTML, /server-auth-state/);
    assert.deepEqual(app.periodSelections, [route]);
    assert.doesNotMatch(app.view.innerHTML, /data-journey-preview/);
    assert.equal(app.nav[0].disabled, false);
    assert.equal(app.topbar.hasAttribute("inert"), false);
    assert.equal(app.mobile.hasAttribute("inert"), false);
  });
}

test("navigation preserves the API session state and retains drafts across product pages", () => {
  const app = shell();
  vm.runInContext('go("activities")', app.context);
  assert.equal(app.location.hash, "#activities");
  assert.match(app.view.innerHTML, /data-backend-task-slice.*server-auth-state/);
  assert.doesNotMatch(app.view.innerHTML, /original-journey|data-journey-preview/);
  assert.ok(app.actions.every(action => action.disabled));
  assert.ok(app.disclosures.every(disclosure => disclosure.style.display === "none"));
  vm.runInContext('go("day")', app.context);
  assert.equal(app.location.hash, "#day");
  assert.match(app.view.innerHTML, /server-auth-state/);
  assert.ok(app.actions.every(action => action.disabled));
  assert.ok(app.disclosures.every(disclosure => disclosure.style.display === "none"));
  assert.equal(app.window.MihwarTaskSlice.state.draft, "retained");
});

test("hash changes and browser back/forward keep journey routes on the server-backed renderer", () => {
  const app = shell("#activities");
  app.location.hash = "#month";
  app.dialog.open = true;
  app.events.hashchange();
  assert.match(app.view.innerHTML, /server-auth-state/);
  assert.deepEqual(app.periodSelections, ["month"]);
  assert.equal(app.dialog.open, false);
  app.location.hash = "#day";
  app.events.popstate();
  assert.match(app.view.innerHTML, /server-auth-state/);
  assert.deepEqual(app.periodSelections, ["month", "day"]);
  assert.match(shell("#unknown").view.innerHTML, /server-auth-state/);
});

test("original goals, notes, and shopping URLs render their source module pages", () => {
  for (const [hash, keys] of [
    ["#paths", ["projects", "goals", "project-milestones", "goal-project-links"]],
    ["#notes", ["notes"]],
    ["#organizer", ["shopping-lists", "shopping-items", "subscriptions", "subscription-occurrences"]]
  ]) {
    const app = shell(hash);
    assert.match(app.view.innerHTML, /server-module:/);
    assert.deepEqual(JSON.parse(JSON.stringify(app.modulePages[0])), keys);
    assert.doesNotMatch(app.view.innerHTML, /temporary|prototype|معاينة محلية/);
  }
});

test("API task controls ignore original station edits but handle server add controls", async () => {
  const handlers = {};
  const context = vm.createContext({
    require: createRequire(path.join(__dirname, "task-slice.js")),
    module: { exports: {} },
    document: {
      readyState: "loading",
      addEventListener(name, handler) { handlers[name] = handler; }
    },
    setInterval() {}, render() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "task-slice.js"), "utf8"), context);
  const slice = context.module.exports;
  await slice.start();
  slice.state.auth = "authenticated";
  slice.state.tasks = [{ id: "server-task", title: "Saved task", startDate: "2026-11-21", priority: 1 }];
  const target = {
    dataset: { taskEdit: "server-task" },
    closest: () => null,
    matches: selector => selector === "[data-task-edit]"
  };
  handlers.click({ target: { closest: () => target } });
  assert.equal(slice.state.editing, null);
  target.closest = () => ({});
  target.matches = selector => selector === "[data-task-add]";
  handlers.click({ target: { closest: () => target } });
  assert.equal(slice.state.editing, "new");
});
