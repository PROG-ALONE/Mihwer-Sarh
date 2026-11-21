"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function createSystemLog(){
  const context=vm.createContext({
    language:"ar",
    selectedDate:"2026-11-20",
    esc:value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))
  });
  vm.runInContext(fs.readFileSync(require.resolve("./system-log.js"),"utf8"),context);
  return context;
}

test("records activity across sections and groups it by day",()=>{
  const context=createSystemLog(),log=context.MihwerSystemLog;
  log.record("shopping","added","قهوة");
  log.record("subscriptions","updated","خدمة");
  const html=log.view();
  assert.match(html,/2026-11-20/);
  assert.match(html,/المشتريات/);
  assert.match(html,/الاشتراكات/);
  assert.match(html,/قهوة/);
  assert.match(html,/خدمة/);
  assert.equal((html.match(/class="system-log-day"/g)||[]).length,1);
});

test("orders later dates first and escapes event details",()=>{
  const context=createSystemLog(),log=context.MihwerSystemLog;
  log.record("tasks","completed","<مهمة>");
  context.selectedDate="2026-11-21";
  log.record("habits","completed","عادة");
  const html=log.view();
  assert.ok(html.indexOf("2026-11-21")<html.indexOf("2026-11-20"));
  assert.match(html,/&lt;مهمة&gt;/);
});
