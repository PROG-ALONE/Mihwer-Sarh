"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
require("./extended-validation.js");
const {isDate, validFields, datesFit, validCollection, overlapsPeriod} = globalThis.MihwerExtendedValidation;

test("validates real calendar dates and optional end", () => {
  assert.equal(isDate("2024-02-29"), true);
  assert.equal(isDate("2025-02-29"), false);
  assert.equal(isDate("2026-13-01"), false);
  assert.equal(validFields("Task", "2026-11-15", "", "work", ["work"]), true);
  assert.equal(validFields(" ", "2026-11-15", "", "work", ["work"]), false);
  assert.equal(validFields("Task", "2026-11-15", "2026-11-14", "work", ["work"]), false);
  assert.equal(validFields("Task", "2026-11-15", "", "other", ["work"]), false);
});

test("edited period must retain scheduled and completion dates", () => {
  const tasks = [{date: "2026-11-15", completedDate: "2026-11-17"}];
  assert.equal(datesFit(tasks, "2026-11-15", "2026-11-17"), true);
  assert.equal(datesFit(tasks, "2026-11-16", "2026-11-17"), false);
  assert.equal(datesFit(tasks, "2026-11-15", "2026-11-16"), false);
  assert.equal(datesFit(tasks, "2026-11-15", ""), true);
  assert.equal(datesFit([{date: "2025-02-29"}], "2025-02-01", ""), false);
});

test("validates stable parent and subtask identities with one nested level",()=>{
  const task={id:"parent-a",name:"Project",pathId:"work",start:"2026-11-01",end:"2026-12-31",createdAt:"2026-10-30T09:00:00.000Z",
    subtasks:[{id:"sub-a",name:"First",date:"2026-11-02",done:false},{id:"sub-b",name:"Second",date:"2026-11-03",done:false}]};
  assert.equal(validCollection([task]),true);
  assert.equal(validCollection([]),true);
  assert.equal(validCollection([task,{...task,id:"parent-a"}]),false);
  assert.equal(validCollection([{...task,subtasks:[...task.subtasks,{...task.subtasks[0]}]}]),false);
  assert.equal(validCollection([
    task,{...task,id:"parent-b",subtasks:[{...task.subtasks[0]}]}
  ]),true);
  assert.equal(validCollection([{...task,subtasks:[{...task.subtasks[0],parentId:"missing-parent"}]}]),false);
  assert.equal(validCollection([{...task,subtasks:[{...task.subtasks[0],subtasks:[]}]}]),false);
  assert.equal(validCollection([{...task,parentId:"parent-a"}]),false);
  assert.equal(validCollection([{...task,subtasks:[{...task.subtasks[0],id:"parent-a"}]}]),false);
  assert.equal(validCollection([{...task,createdAt:"not-a-timestamp"}]),false);
});

test("extended tasks overlap inclusive day, week and month ranges without requiring endpoint duplication",()=>{
  const task={id:"long",name:"Long task",pathId:"work",start:"2026-11-29",end:"2026-12-08",subtasks:[]};
  assert.equal(overlapsPeriod(task,"2026-11-29","2026-11-29"),true);
  assert.equal(overlapsPeriod(task,"2026-11-23","2026-11-29"),true);
  assert.equal(overlapsPeriod(task,"2026-11-30","2026-12-06"),true);
  assert.equal(overlapsPeriod(task,"2026-12-07","2026-12-13"),true);
  assert.equal(overlapsPeriod(task,"2026-11-01","2026-11-30"),true);
  assert.equal(overlapsPeriod(task,"2026-12-01","2026-12-31"),true);
  assert.equal(overlapsPeriod(task,"2026-12-09","2026-12-15"),false);
  assert.equal(overlapsPeriod({...task,end:""},"2026-12-01","2026-12-31"),true);
  assert.throws(()=>overlapsPeriod(task,"2026-12-01","2026-11-30"),/Invalid task period/);
});
