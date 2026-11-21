"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {join} = require("node:path");
require("./extended-validation.js");
require("./extended-lifecycle.js");
const {stateAt,transition,transitionSubtask,toggleSubtask,overlapsPeriod} = globalThis.MihwerExtendedLifecycle;
const base = () => ({id:"parent",start:"2026-11-15",end:"2026-11-17",subtasks:[{id:"s",date:"2026-11-15",name:"Step",done:false}]});
test("parent completion is explicit, independent of subtask completion, and within period", () => {
  const withIncomplete=transition(base(),"complete","2026-11-15");
  assert.equal(withIncomplete.status,"completed");
  assert.equal(withIncomplete.subtasks[0].done,false);
  assert.equal(withIncomplete.subtasks[0].status,undefined);
  assert.equal(transition({...base(),subtasks:[]},"complete","2026-11-15").status,"completed");
  const ready={...base(),subtasks:[{id:"s",done:true}]};
  assert.throws(() => transition(ready,"complete","2026-11-14"));
  assert.throws(() => transition(ready,"complete","2026-11-18"));
  assert.equal(transition(ready,"complete","2026-11-17").status,"completed");
});
test("archive, restore, cancel and reopen preserve subtasks", () => {
  const task=base(), archived=transition(task,"archive","2026-11-15");
  assert.throws(() => transition(archived,"cancel","2026-11-15"));
  const restored=transition(archived,"restore-archive","2026-11-15");
  const cancelled=transition(restored,"cancel","2026-11-15");
  const reopened=transition(cancelled,"restore","2026-11-15");
  assert.deepEqual(reopened.subtasks,task.subtasks);
  const done=transition({...reopened,subtasks:[{id:"s",done:true}]},"complete","2026-11-15");
  assert.equal(transition(done,"reopen","2026-11-18").status,"open");
});

test("parent completion never implies or mutates independent subtask state",()=>{
  const task=base(),completeChild={...task,subtasks:[{...task.subtasks[0],done:true}]};
  assert.equal(transition(completeChild,"complete","2026-11-17").status,"completed");
  assert.equal(completeChild.status,undefined);
  assert.equal(task.subtasks[0].done,false);
  assert.equal(transition({...base(),subtasks:[{...base().subtasks[0],done:false}]}, "complete","2026-11-17").subtasks[0].done,false);
});

test("subtask completion and reopening preserve independent identity and dates",()=>{
  const task=base(),completed=transitionSubtask(task,"s","complete","2026-11-16");
  assert.equal(completed.subtasks[0].id,"s");
  assert.equal(completed.subtasks[0].done,true);
  assert.equal(completed.subtasks[0].status,"completed");
  assert.equal(completed.subtasks[0].completedDate,"2026-11-16");
  assert.equal(task.subtasks[0].done,false);
  const reopened=transitionSubtask(completed,"s","reopen","2026-11-17");
  assert.equal(reopened.subtasks[0].status,"pending");
  assert.equal(reopened.subtasks[0].done,false);
  assert.equal(Object.hasOwn(reopened.subtasks[0],"completedDate"),false);
  assert.throws(()=>transitionSubtask(task,"s","complete","2026-11-14"),/Outside task period/);
});

test("UI toggle delegates to validated transitions and cannot complete future subtasks",()=>{
  const source=readFileSync(join(__dirname,"paths-lab.js"),"utf8");
  assert.match(source,/MihwerExtendedLifecycle\.toggleSubtask\(task,sub\.id,zoneDate\(\)\)/);
  assert.doesNotMatch(source,/sub\.done=!sub\.done;sub\.status=/);
  const future={...base(),subtasks:[{id:"s",date:"2026-11-17",name:"Future",done:false}]};
  assert.throws(()=>toggleSubtask(future,"s","2026-11-16"),/Outside task period/);
  assert.throws(()=>transitionSubtask(future,"s","complete","2026-11-16"),/Outside task period/);
  assert.equal(future.subtasks[0].done,false);
  const due={...base(),subtasks:[{id:"s",date:"2026-11-16",name:"Due",done:false}]};
  const completed=toggleSubtask(due,"s","2026-11-16");
  assert.equal(completed.subtasks[0].status,"completed");
  assert.equal(completed.subtasks[0].completedDate,"2026-11-16");
  assert.equal(due.subtasks[0].done,false);
});

test("subtask cancellation, restoration and archiving are explicit reversible transitions",()=>{
  const task=base(),cancelled=transitionSubtask(task,"s","cancel","2026-11-16");
  assert.equal(cancelled.subtasks[0].status,"cancelled");
  assert.equal(cancelled.subtasks[0].cancelledDate,"2026-11-16");
  const restored=transitionSubtask(cancelled,"s","restore","2026-11-17");
  assert.equal(restored.subtasks[0].status,"pending");
  assert.equal(Object.hasOwn(restored.subtasks[0],"cancelledDate"),false);
  const archived=transitionSubtask(restored,"s","archive","2026-11-17");
  assert.equal(archived.subtasks[0].archived,true);
  assert.throws(()=>transitionSubtask(archived,"s","cancel","2026-11-17"),/archived/);
  const unarchived=transitionSubtask(archived,"s","restore-archive","2026-11-17");
  assert.equal(unarchived.subtasks[0].archived,false);
});

test("subtask transitions reject missing, duplicate and inactive-parent relations",()=>{
  assert.throws(()=>transitionSubtask(base(),"missing","complete","2026-11-16"),/identity/);
  const duplicated=base();duplicated.subtasks.push({...duplicated.subtasks[0]});
  assert.throws(()=>transitionSubtask(duplicated,"s","complete","2026-11-16"),/identity/);
  assert.throws(()=>transitionSubtask({...base(),status:"cancelled"},"s","complete","2026-11-16"),/not active/);
  assert.throws(()=>transitionSubtask({...base(),archived:true},"s","complete","2026-11-16"),/not active/);
  assert.throws(()=>transitionSubtask({...base(),status:"completed"},"s","complete","2026-11-16"),/not active/);
});

test("extended task period overlap uses inclusive civil-date intersection",()=>{
  const task=base();
  assert.equal(overlapsPeriod(task,"2026-11-15","2026-11-15"),true);
  assert.equal(overlapsPeriod(task,"2026-11-18","2026-11-20"),false);
});

test("derives not-started, in-progress, overdue, completed, cancelled and archived task states",()=>{
  const task=base();
  assert.equal(stateAt(task,"2026-11-14"),"notStarted");
  assert.equal(stateAt(task,"2026-11-16"),"inProgress");
  assert.equal(stateAt(task,"2026-11-18"),"overdue");
  assert.equal(stateAt({...task,status:"completed"},"2026-11-18"),"completed");
  assert.equal(stateAt({...task,status:"cancelled"},"2026-11-16"),"cancelled");
  assert.equal(stateAt({...task,archived:true},"2026-11-16"),"archived");
  assert.throws(()=>stateAt(task,"2026-02-31"),/Invalid task period/);
});
