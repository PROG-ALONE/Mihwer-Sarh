"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
require("./extended-validation.js");require("./progress-engine.js");
const {summarize}=globalThis.MihwerProgressEngine;
test("deduplicates within day, retains distinct dates, and separates exclusions",()=>{
  const entries=[{date:"2026-11-15",id:"a",status:"done"},{date:"2026-11-15",id:"a",status:"done"},{date:"2026-11-16",id:"a",status:"pending"},{date:"2026-11-16",id:"b",status:"cancelled"},{date:"2026-11-16",id:"c",status:"deferred"}];
  const s=summarize(entries);assert.equal(s.complete,1);assert.equal(s.eligible,2);assert.equal(s.ratio,.5);assert.equal(s.cancelled,1);assert.equal(s.deferred,1);assert.equal(s.evidence.length,4);
});
test("rejects conflicting duplicates and leaves no eligible data without a ratio",()=>{
  assert.throws(()=>summarize([{date:"2026-11-15",id:"a",status:"done"},{date:"2026-11-15",id:"a",status:"pending"}]));
  assert.equal(summarize([{date:"2026-11-15",id:"a",status:"cancelled"}]).ratio,null);
});
test("journey periods separate actual task, extended subtask and habit outcomes",()=>{
  const entries=[
    {kind:"task",id:"a",date:"2026-11-15",status:"done"},
    {kind:"task",id:"a",date:"2026-11-15",status:"done"},
    {kind:"task",id:"b",date:"2026-11-15",status:"pending"},
    {kind:"task",id:"c",date:"2026-11-15",status:"cancelled"},
    {kind:"task",id:"d",date:"2026-11-15",status:"deferred"},
    {kind:"extended",id:"s1",date:"2026-11-15",status:"done"},
    {kind:"extended",id:"s2",date:"2026-12-01",status:"pending"},
    {kind:"habit",id:"a",date:"2026-11-15",status:"done"},
    {kind:"habit",id:"a",date:"2026-11-16",status:"unrecorded"},
    {kind:"habit",id:"b",date:"2026-11-15",status:"exempt"},
    {kind:"habit",id:"c",date:"2026-11-15",status:"incomplete"},
    {kind:"habit",id:"d",date:"2026-11-17",status:"incomplete"}
  ];
  const p={start:"2026-11-01",end:"2026-12-31",today:"2026-11-16"};
  const r=globalThis.MihwerProgressEngine.summarizeJourney(entries,p);
  assert.deepEqual([r.task.complete,r.task.eligible,r.task.remaining,r.task.cancelled,r.task.deferred,r.task.ratio],[1,2,1,1,1,.5]);
  assert.deepEqual([r.extended.complete,r.extended.eligible,r.extended.ratio],[1,1,1]);
  assert.deepEqual([r.habit.complete,r.habit.remaining,r.habit.unrecorded,r.habit.exempt,r.habit.ratio],[1,1,1,1,.5]);
  assert.equal(r.task.evidence.length,4);
  assert.equal(globalThis.MihwerProgressEngine.summarizeJourney(entries,{...p,start:"2026-12-01"}).extended.ratio,null);
});
test("journey rejects contradictory duplicates and does not replicate extended subtasks across periods",()=>{
  const period={start:"2026-11-01",end:"2026-12-31",today:"2026-12-31"};
  const e={kind:"extended",id:"sub-1",date:"2026-11-30",status:"done"};
  assert.throws(()=>globalThis.MihwerProgressEngine.summarizeJourney([e,{...e,date:"2026-12-01"}],period));
  assert.throws(()=>globalThis.MihwerProgressEngine.summarizeJourney([e,{...e,status:"pending"}],period));
  const r=globalThis.MihwerProgressEngine.summarizeJourney([e],{...period,start:"2026-12-01"});
  assert.equal(r.extended.eligible,0);assert.equal(r.extended.ratio,null);
  assert.throws(()=>globalThis.MihwerProgressEngine.summarizeJourney([{...e,date:"2026-02-31"}],period));
});
test("updating and reopening one daily task changes only its own period",()=>{
  const {summarizeJourney}=globalThis.MihwerProgressEngine;
  const entries=[{kind:"task",id:"a",date:"2026-11-15",status:"pending"},{kind:"task",id:"b",date:"2026-11-16",status:"done"}];
  const period={start:"2026-11-15",end:"2026-11-16",today:"2026-11-16"};
  const day=date=>summarizeJourney(entries,{...period,start:date,end:date}).task;
  assert.equal(day("2026-11-15").complete,0);
  entries[0]={...entries[0],status:"done"};
  assert.equal(day("2026-11-15").complete,1);
  assert.equal(day("2026-11-16").complete,1);
  assert.equal(summarizeJourney(entries,period).task.ratio,1);
  entries[0]={...entries[0],status:"pending"};
  assert.equal(summarizeJourney(entries,period).task.ratio,.5);
  assert.equal(day("2026-11-16").complete,1);
});
test("legacy and period task summaries agree including deferred and cancelled",()=>{
  const entries=[{id:"x",date:"2026-11-15",status:"done"},{id:"y",date:"2026-11-15",status:"deferred"},{id:"z",date:"2026-11-15",status:"cancelled"},{id:"w",date:"2026-11-15",status:"pending"}];
  const old=summarize(entries);
  const current=globalThis.MihwerProgressEngine.summarizeJourney(entries.map(e=>({...e,kind:"task"})),{start:"2026-11-15",end:"2026-11-15",today:"2026-11-15"}).task;
  for(const key of ["complete","eligible","remaining","deferred","cancelled","ratio"]) assert.equal(old[key],current[key]);
});
test("loaded-day periods separate categories, exclude future and affect only related periods",()=>{
  const {summarizeLoadedDays}=globalThis.MihwerProgressEngine;
  const days=[
    {date:"2026-10-31",stations:[{tasks:[{id:"a",status:"done"},{id:"cancel",status:"cancelled"}]},{habit:true,tasks:[{id:"h",status:"pending"}]}]},
    {date:"2026-11-01",stations:[{tasks:[{id:"a",status:"pending"},{id:"delay",status:"deferred"}]}]},
    {date:"2026-11-03",stations:[{tasks:[{id:"future",status:"pending"}]}]}
  ];
  const oct={start:"2026-10-01",end:"2026-10-31",today:"2026-11-02"}, nov={start:"2026-11-01",end:"2026-11-30",today:"2026-11-02"},cross={start:"2026-10-29",end:"2026-11-04",today:"2026-11-02"};
  const a=summarizeLoadedDays(days,oct),b=summarizeLoadedDays(days,nov),c=summarizeLoadedDays(days,cross);
  assert.deepEqual([a.loadedDays,a.tasks.complete,a.tasks.eligible,a.tasks.cancelled,a.traditionalHabits.eligible],[1,1,1,1,1]);
  assert.deepEqual([b.loadedDays,b.tasks.complete,b.tasks.eligible,b.tasks.deferred],[1,0,1,1]);
  assert.deepEqual([c.loadedDays,c.tasks.complete,c.tasks.eligible],[2,1,2]);
  days[1].stations[0].tasks[0].status="done";
  assert.equal(summarizeLoadedDays(days,cross).tasks.ratio,1);
  assert.deepEqual(summarizeLoadedDays(days,oct),a);
  const future=summarizeLoadedDays(days,{start:"2026-11-03",end:"2026-11-30",today:"2026-11-02"});
  assert.equal(future.loadedDays,0);assert.equal(future.tasks.ratio,null);
});
