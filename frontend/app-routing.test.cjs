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
  const nav = ["day", "activities", "paths", "organizer"].map(control);
  const actions = [control(), control(), control()];
  const disclosures = [control(), control()];
  const events = {};
  const documentEvents = {};
  const location = { hash };
  const window = {
    location, scrollY: 0, scrollTo() {},
    history: { pushState(_state, _title, next) { location.hash = next; } },
    addEventListener(name, handler) { events[name] = handler; },
    MihwarTaskSlice: { render: () => "<p>server-auth-state</p>", state: { draft: "retained" } }
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
  return { context, view, dialog, topbar, mobile, nav, actions, disclosures, events, documentEvents, beforeDependencies, location, window };
}

for (const route of ["day", "week", "month", "year"]) {
  test(`direct #${route} restores the original journey renderer with the API client present`, () => {
    const app = shell(`#${route}`);
    assert.equal(app.beforeDependencies, "");
    assert.equal(typeof app.documentEvents.DOMContentLoaded, "function");
    assert.match(app.view.innerHTML, new RegExp(`original-journey">${route}`));
    assert.match(app.view.innerHTML, /data-journey-preview/);
    assert.doesNotMatch(app.view.innerHTML, /server-auth-state/);
    assert.equal(app.nav[0].disabled, false);
    assert.equal(app.topbar.hasAttribute("inert"), false);
    assert.equal(app.mobile.hasAttribute("inert"), false);
  });
}

test("navigation keeps API auth separate, restores the journey, and retains the server draft", () => {
  const app = shell();
  vm.runInContext('go("activities")', app.context);
  assert.equal(app.location.hash, "#activities");
  assert.match(app.view.innerHTML, /data-backend-task-slice.*server-auth-state/);
  assert.doesNotMatch(app.view.innerHTML, /original-journey|data-journey-preview/);
  assert.ok(app.actions.every(action => action.disabled));
  assert.ok(app.disclosures.every(disclosure => disclosure.style.display === "none"));
  vm.runInContext('go("day")', app.context);
  assert.equal(app.location.hash, "#day");
  assert.match(app.view.innerHTML, /original-journey/);
  assert.ok(app.actions.every(action => !action.disabled));
  assert.ok(app.disclosures.every(disclosure => disclosure.style.display === ""));
  assert.equal(app.window.MihwarTaskSlice.state.draft, "retained");
});

test("hash changes, back navigation, and unknown routes use the same original route", () => {
  const app = shell("#activities");
  app.location.hash = "#month";
  app.dialog.open = true;
  app.events.hashchange();
  assert.match(app.view.innerHTML, /original-journey">month/);
  assert.equal(app.dialog.open, false);
  app.location.hash = "#day";
  app.events.popstate();
  assert.match(app.view.innerHTML, /original-journey">day/);
  assert.match(shell("#unknown").view.innerHTML, /original-journey">day/);
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
