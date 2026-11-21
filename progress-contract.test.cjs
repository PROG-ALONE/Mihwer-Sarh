"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
require("./extended-validation.js");
require("./progress-contract.js");
require("./progress-adapters.js");
require("./progress-engine.js");
require("./extended-lifecycle.js");

const contract=globalThis.MihwerProgressContract;
const engine=globalThis.MihwerProgressEngine;
const adapters=globalThis.MihwerProgressAdapters;
const period={type:"custom",start:"2026-11-01",end:"2026-11-30",asOf:"2026-11-20",timeZone:"UTC"};
const entry=(type,id,status,date="2026-11-10",extra={})=>({type,id,source:"testSource",date,status,...extra});

test("contract validates required identity, provenance, date, status, and subtask parent",()=>{
  assert.equal(contract.normalizeEntry(entry("task","a","done")).status,"completed");
  assert.equal(contract.normalizeEntry(entry("task","a","pending")).status,"incomplete");
  assert.throws(()=>contract.normalizeEntry({type:"task",id:"a",source:"testSource",status:"completed"}),/Invalid progress entry/);
  assert.throws(()=>contract.normalizeEntry(entry("task","a","not-a-status")),/Invalid progress status/);
  assert.throws(()=>contract.normalizeEntry(entry("extendedSubtask","sub","completed")),/parent id/);
  assert.throws(()=>contract.normalizeEntry({...entry("task","a","completed"),eligibility:"maybe"}),/eligibility/);
  assert.throws(()=>contract.normalizeEntry({...entry("task","a","completed"),metadata:{value:undefined}}),/metadata value/);
  const sparse=[];
  sparse.length=1;
  assert.throws(()=>contract.normalizeEntry({...entry("task","a","completed"),metadata:{values:sparse}}),/metadata value/);
  assert.throws(()=>contract.normalizeEntry(entry("task","a","completed","2026-02-31")),/Invalid progress entry/);
  assert.throws(()=>contract.normalizeEntry(entry("task","a","completed","2026-11-10T00:00:00Z")),/Invalid progress entry/);
  assert.throws(()=>contract.toCivilDate("2026-02-31T00:00:00Z"),/Invalid date/);
  assert.throws(()=>contract.toCivilDate("2026-11-10T00:00"),/Invalid date/);
});

test("period builder returns inclusive civil-date boundaries for day, ISO week, month, year and custom ranges",()=>{
  assert.deepEqual(
    (({type,start,end})=>({type,start,end}))(contract.createPeriod({type:"day",date:"2026-11-16",asOf:"2026-11-16"})),
    {type:"day",start:"2026-11-16",end:"2026-11-16"}
  );
  assert.deepEqual(
    (({start,end})=>({start,end}))(contract.createPeriod({type:"week",date:"2021-01-01",asOf:"2021-01-01"})),
    {start:"2020-12-28",end:"2021-01-03"}
  );
  assert.deepEqual(
    (({start,end})=>({start,end}))(contract.createPeriod({type:"month",date:"2024-02-03",asOf:"2024-02-03"})),
    {start:"2024-02-01",end:"2024-02-29"}
  );
  assert.deepEqual(
    (({start,end})=>({start,end}))(contract.createPeriod({type:"year",date:"2024-10-01",asOf:"2024-10-01"})),
    {start:"2024-01-01",end:"2024-12-31"}
  );
  assert.deepEqual(
    (({start,end})=>({start,end}))(contract.createPeriod({type:"custom",start:"2025-12-31",end:"2026-01-01",asOf:"2026-01-01"})),
    {start:"2025-12-31",end:"2026-01-01"}
  );
  assert.throws(()=>contract.createPeriod({type:"week",date:"2026-11-16",weekStartsOn:7}));
  assert.throws(()=>contract.createPeriod({type:"custom",start:"2026-02-31",end:"2026-03-01",asOf:"2026-03-01"}));
});

test("instant timestamps map to the supplied civil time zone at midnight boundaries",()=>{
  assert.equal(contract.toCivilDate("2026-11-15T20:59:59.999Z","Asia/Riyadh"),"2026-11-15");
  assert.equal(contract.toCivilDate("2026-11-15T21:00:00Z","Asia/Riyadh"),"2026-11-16");
  assert.equal(contract.toCivilDate("2026-11-16T20:59:59.999Z","Asia/Riyadh"),"2026-11-16");
  assert.equal(contract.toCivilDate("2026-11-16T21:00:00Z","Asia/Riyadh"),"2026-11-17");
  assert.throws(()=>contract.toCivilDate("2026-11-16T21:00:00Z","Not/AZone"),/time zone/);
  assert.deepEqual(
    (({start,end})=>({start,end}))(contract.normalizePeriod({
      type:"custom",start:"2025-12-31T00:00:00Z",end:"2026-01-01T23:59:59.999Z",
      asOf:"2026-01-01T23:59:59.999Z",timeZone:"UTC"
    })),
    {start:"2025-12-31",end:"2026-01-01"}
  );
});

test("aggregation classifies completion, incompletion, cancellation, deferral and future separately",()=>{
  const entries=[
    entry("task","done","completed"),
    entry("task","pending","incomplete"),
    entry("task","cancelled","cancelled"),
    entry("task","deferred","deferred"),
    entry("task","unrecorded","unrecorded"),
    entry("task","exempt","exempt"),
    entry("task","future-dated","incomplete","2026-11-21"),
    entry("task","future-state","future")
  ];
  const result=engine.aggregate(entries,period).byType.task;
  assert.deepEqual([result.completed,result.incomplete,result.eligible,result.cancelled,result.deferred,result.unrecorded,result.exempt,result.future,result.ratio],[1,1,2,1,1,1,1,2,.5]);
  assert.equal(result.evidence.length,6);
});

test("deduplicates equivalent observations and keeps similarly named subtasks under distinct parents",()=>{
  const duplicateA={...entry("task","same","completed"),observedBy:["dayView"]};
  const duplicateB={...entry("task","same","completed"),observedBy:["pathView"]};
  const duplicateFromOtherSource={...duplicateB,source:"importedTask"};
  const result=engine.aggregate([
    duplicateA,duplicateB,duplicateFromOtherSource,
    entry("extendedSubtask","same","completed","2026-11-10",{parentId:"parent-a"}),
    entry("extendedSubtask","same","incomplete","2026-11-10",{parentId:"parent-b"})
  ],period);
  assert.equal(result.uniqueEntries,3);
  assert.deepEqual([result.byType.task.completed,result.byType.task.eligible],[1,1]);
  assert.deepEqual([result.byType.extendedSubtask.completed,result.byType.extendedSubtask.eligible],[1,2]);
  assert.deepEqual(result.byType.task.evidence[0].observedBy,["dayView","importedTask","pathView","testSource"]);
  assert.deepEqual(result.byType.task.evidence[0].sources,["importedTask","testSource"]);
  assert.deepEqual(Object.keys(result.bySource.task),["importedTask","testSource"]);
  assert.deepEqual(
    [result.bySource.task.importedTask.eligible,result.bySource.task.testSource.eligible],
    [1,1]
  );
  assert.throws(()=>engine.aggregate([duplicateA,{...duplicateB,status:"incomplete"}],period),/Conflicting/);
});

test("cross-source duplicates retain source-attributed metadata independent of input order",()=>{
  const first={...entry("recurringHabit","metadata-habit","completed"),source:"habitEngine",metadata:{amount:2,details:{unit:"pages"}}};
  const second={...entry("recurringHabit","metadata-habit","completed"),source:"daySummary",metadata:{amount:5,details:{unit:"minutes"}}};
  const forward=engine.aggregate([first,second],period);
  const reverse=engine.aggregate([second,first],period);
  assert.deepEqual(forward,reverse);
  assert.equal(forward.uniqueEntries,1);
  const merged=forward.byType.recurringHabit.evidence[0];
  assert.deepEqual(merged.sources,["daySummary","habitEngine"]);
  assert.deepEqual(merged.metadataBySource,{
    daySummary:{amount:5,details:{unit:"minutes"}},
    habitEngine:{amount:2,details:{unit:"pages"}}
  });
  assert.equal(Object.hasOwn(merged,"metadata"),false);
  assert.deepEqual(
    [forward.bySource.recurringHabit.daySummary.eligible,forward.bySource.recurringHabit.habitEngine.eligible],
    [1,1]
  );
  assert.throws(()=>engine.aggregate([
    first,{...first,metadata:{amount:3,details:{unit:"pages"}}}
  ],period),/Conflicting progress metadata/);
});

test("same-source metadata with reordered object keys is equivalent",()=>{
  const first={...entry("task","stable-metadata","completed"),metadata:{outer:{a:1,b:2}}};
  const second={...entry("task","stable-metadata","completed"),metadata:{outer:{b:2,a:1}}};
  assert.equal(engine.aggregate([first,second],period).uniqueEntries,1);
});

test("the new aggregator rejects same-identity status and extended-subtask date conflicts",()=>{
  const base=entry("extendedSubtask","subtask","completed","2026-11-10",{parentId:"parent"});
  assert.throws(()=>engine.aggregate([
    base,{...base,source:"secondObservation",status:"incomplete"}
  ],period),/Conflicting progress entry/);
  assert.throws(()=>engine.aggregate([
    base,{...base,source:"secondObservation",date:"2026-11-11"}
  ],period),/Conflicting progress entry/);
  assert.equal(engine.aggregate([
    entry("task","daily-task","completed","2026-11-10"),
    entry("task","daily-task","incomplete","2026-11-11")
  ],period).byType.task.eligible,2);
});

test("types and sources have independent denominators; empty and missing records are not failures",()=>{
  const result=engine.aggregate([
    entry("task","t1","completed","2026-11-10",{source:"dailyTask"}),
    entry("task","t2","incomplete","2026-11-10",{source:"dailyTask"}),
    entry("recurringHabit","h1","completed","2026-11-10",{source:"habitRecord"}),
    entry("recurringHabit","h2","incomplete","2026-11-10",{source:"habitRecord"}),
    entry("extendedSubtask","s1","completed","2026-11-10",{source:"extendedRecord",parentId:"parent"})
  ],period);
  assert.deepEqual([result.byType.task.eligible,result.byType.task.ratio],[2,.5]);
  assert.deepEqual([result.byType.recurringHabit.eligible,result.byType.recurringHabit.ratio],[2,.5]);
  assert.deepEqual([result.byType.extendedSubtask.eligible,result.byType.extendedSubtask.ratio],[1,1]);
  assert.equal(result.byType.all,undefined);
  assert.deepEqual(Object.keys(result.bySource.task),["dailyTask"]);
  assert.equal(engine.aggregate([],period).uniqueEntries,0);
  assert.equal(engine.aggregate([],period).byType.task,undefined);
  const recorded=engine.aggregate([entry("recurringHabit","h1","completed")],period).byType.recurringHabit;
  assert.deepEqual([recorded.eligible,recorded.unrecorded,recorded.ratio],[1,0,1]);
});

test("period boundaries are inclusive, and aggregation is deterministic",()=>{
  const boundaryPeriod={type:"custom",start:"2025-12-31",end:"2026-01-01",asOf:"2026-01-01",timeZone:"UTC"};
  const records=[
    entry("task","first","completed","2025-12-31"),
    entry("task","last","incomplete","2026-01-01"),
    entry("task","before","completed","2025-12-30"),
    entry("task","after","incomplete","2026-01-02")
  ];
  const first=engine.aggregate(records,boundaryPeriod);
  const second=engine.aggregate(records,boundaryPeriod);
  assert.deepEqual([first.byType.task.completed,first.byType.task.incomplete,first.byType.task.eligible],[1,1,2]);
  assert.deepEqual(first,second);
});

test("day, week, month and year aggregates include both civil-date boundaries only",()=>{
  const cases=[
    ["day","2026-11-16",["2026-11-16","2026-11-16"],["2026-11-15","2026-11-17"]],
    ["week","2021-01-01",["2020-12-28","2021-01-03"],["2020-12-27","2021-01-04"]],
    ["month","2024-02-03",["2024-02-01","2024-02-29"],["2024-01-31","2024-03-01"]],
    ["year","2024-10-01",["2024-01-01","2024-12-31"],["2023-12-31","2025-01-01"]]
  ];
  for(const [type,date,[start,end],[before,after]] of cases) {
    const range=contract.createPeriod({type,date,asOf:end});
    const result=engine.aggregate([
      entry("task",`${type}-first`,"completed",start),
      entry("task",`${type}-last`,"completed",end),
      entry("task",`${type}-before`,"completed",before),
      entry("task",`${type}-after`,"completed",after)
    ],range);
    assert.deepEqual([result.byType.task.completed,result.byType.task.eligible],[2,2],type);
  }
});

test("read-only adapters map existing station, extended-task, and habit record shapes",()=>{
  const days=[{date:"2026-11-10",stations:[
    {id:"station-a",tasks:[{id:"task-a",status:"done"}]},
    {id:"station-b",habit:true,tasks:[{id:"habit-a",status:"pending"}]}
  ]}];
  const extended=[{id:"parent-a",name:"Parent A",pathId:"work",start:"2026-11-10",end:"2026-11-11",status:"open",subtasks:[
    {id:"shared-sub",name:"Pending subtask",date:"2026-11-10",done:false},
    {id:"completed-sub",name:"Completed subtask",date:"2026-11-10",completedDate:"2026-11-11",done:true}
  ]},{id:"parent-b",name:"Parent B",pathId:"work",start:"2026-11-10",end:"2026-11-11",status:"open",subtasks:[{id:"shared-sub",name:"Shared step",date:"2026-11-10",done:false}]}];
  const habits=[{id:"recurring-a",records:{
    "2026-11-10":{status:"completed",amount:3},
    "2026-11-11":{status:"exempt"}
  }}];
  const before=JSON.stringify({days,extended,habits});
  const entries=[
    ...adapters.fromStationDays(days),
    ...adapters.fromExtendedTasks(extended),
    ...adapters.fromRecurringHabits(habits)
  ];
  assert.deepEqual([entries[0].type,entries[0].status],["task","completed"]);
  assert.deepEqual([entries[1].type,entries[1].status],["traditionalHabit","incomplete"]);
  assert.equal(entries.filter(item=>item.type==="extendedSubtask"&&item.parentId==="parent-a").length,2);
  assert.equal(entries.filter(item=>item.type==="extendedSubtask"&&item.parentId==="parent-b").length,1);
  assert.equal(entries.filter(item=>item.type==="recurringHabit").length,2);
  assert.equal(JSON.stringify({days,extended,habits}),before);
  assert.throws(()=>adapters.fromExtendedTasks([{id:"parent",name:"Parent",pathId:"work",start:"2026-11-10",end:"",subtasks:[{id:"sub",name:"Sub",date:"2026-11-10",done:true}]}]),/requires completedDate/);
  assert.throws(()=>adapters.fromExtendedTasks([
    {id:"parent",name:"Parent",pathId:"work",start:"2026-11-10",end:"",subtasks:[{id:"sub",name:"One",date:"2026-11-10",done:false},{id:"sub",name:"Duplicate",date:"2026-11-10",done:false}]}
  ]),/Invalid extended task collection/);
  assert.throws(()=>adapters.fromStationDays([{date:"2026-11-10",stations:[{id:"s",tasks:[{id:"t",status:"unknown"}]}]}]),/Unsupported task status/);
});

test("completed extended subtasks require and preserve an explicit completion date",()=>{
  const task={id:"parent",name:"Parent",pathId:"work",start:"2026-11-01",end:"2026-11-30",status:"open",
    subtasks:[{id:"sub",name:"Step",date:"2026-11-10",done:true,status:"completed"}]};
  assert.equal(globalThis.MihwerExtendedValidation.validCollection([task]),false);
  assert.throws(()=>adapters.fromExtendedTasks([task]),/Completed extended subtask requires completedDate/);

  const completed={...task,subtasks:[{...task.subtasks[0],completedDate:"2026-11-16"}]};
  assert.equal(globalThis.MihwerExtendedValidation.validCollection([completed]),true);
  const [adapted]=adapters.fromExtendedTasks([completed]);
  assert.equal(adapted.date,"2026-11-16");
  assert.equal(adapted.metadata.completedDate,"2026-11-16");
  assert.equal(Object.hasOwn(adapted,"completedDate"),false);
  const duplicated=engine.aggregate([...adapters.fromExtendedTasks([completed]),...adapters.fromExtendedTasks([completed])],period);
  assert.equal(duplicated.uniqueEntries,1);
  assert.deepEqual([duplicated.byType.extendedSubtask.completed,duplicated.byType.extendedSubtask.eligible],[1,1]);
});

test("extended subtasks inherit parent eligibility without losing their recorded status",()=>{
  const task=(id,status,archived=false)=>({id,name:id,pathId:"work",start:"2026-11-01",end:"2026-11-30",status,archived,subtasks:[{id:"shared-sub",name:"Subtask",date:"2026-11-10",done:false}]});
  const subtasks=[
    ...adapters.fromExtendedTasks([task("active-parent","open")]),
    ...adapters.fromExtendedTasks([task("cancelled-parent","cancelled")]),
    ...adapters.fromExtendedTasks([task("archived-parent","open",true)])
  ];
  assert.deepEqual(subtasks.map(item=>item.eligibility),["eligible","excluded","excluded"]);
  assert.deepEqual(subtasks.map(item=>item.status),["incomplete","incomplete","incomplete"]);
  assert.deepEqual(subtasks.map(item=>item.parentId),["active-parent","cancelled-parent","archived-parent"]);
  const result=engine.aggregate(subtasks,period).byType.extendedSubtask;
  assert.deepEqual([result.incomplete,result.eligible,result.excluded,result.ratio],[1,1,2,0]);
  assert.deepEqual(result.evidence.map(item=>item.status),["incomplete","incomplete","incomplete"]);
});

test("extended adapter excludes cancelled and archived subtasks while retaining their state",()=>{
  const entries=adapters.fromExtendedTasks([
    {id:"parent",name:"Parent",pathId:"work",start:"2026-11-01",end:"2026-11-30",status:"open",subtasks:[
      {id:"active",name:"Active",date:"2026-11-10",done:false,status:"pending"},
      {id:"cancelled",name:"Cancelled",date:"2026-11-10",done:false,status:"cancelled",cancelledDate:"2026-11-11"},
      {id:"archived",name:"Archived",date:"2026-11-10",done:false,status:"pending",archived:true}
    ]}
  ]);
  const result=engine.aggregate(entries,period).byType.extendedSubtask;
  assert.deepEqual([result.incomplete,result.eligible,result.cancelled,result.excluded,result.ratio],[1,1,0,2,0]);
  assert.deepEqual(result.evidence.map(item=>item.status),["incomplete","incomplete","cancelled"]);
});

test("parent and subtask restoration updates adapter eligibility without mutating child completion",()=>{
  const lifecycle=globalThis.MihwerExtendedLifecycle;
  const task={id:"parent",name:"Parent",pathId:"work",start:"2026-11-01",end:"2026-11-30",status:"open",
    subtasks:[{id:"sub",name:"Step",date:"2026-11-10",done:false,status:"pending"}]};
  const parentCancelled=lifecycle.transition(task,"cancel","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([parentCancelled])[0].eligibility,"excluded");
  const parentRestored=lifecycle.transition(parentCancelled,"restore","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([parentRestored])[0].eligibility,"eligible");
  const childCancelled=lifecycle.transitionSubtask(parentRestored,"sub","cancel","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([childCancelled])[0].eligibility,"excluded");
  assert.equal(childCancelled.subtasks[0].done,false);
  const childRestored=lifecycle.transitionSubtask(childCancelled,"sub","restore","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([childRestored])[0].eligibility,"eligible");
  const childArchived=lifecycle.transitionSubtask(childRestored,"sub","archive","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([childArchived])[0].eligibility,"excluded");
  const childUnarchived=lifecycle.transitionSubtask(childArchived,"sub","restore-archive","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([childUnarchived])[0].eligibility,"eligible");
  const parentArchived=lifecycle.transition(parentRestored,"archive","2026-11-16");
  assert.equal(adapters.fromExtendedTasks([parentArchived])[0].eligibility,"excluded");
  assert.equal(adapters.fromExtendedTasks([lifecycle.transition(parentArchived,"restore-archive","2026-11-16")])[0].eligibility,"eligible");
});

test("completed parent does not complete or exclude its incomplete subtask",()=>{
  const [entry]=adapters.fromExtendedTasks([
    {id:"completed-parent",name:"Parent",pathId:"work",start:"2026-11-01",end:"2026-11-30",status:"completed",subtasks:[
      {id:"still-open",name:"Still open",date:"2026-11-10",done:false,status:"pending"}
    ]}
  ]);
  const result=engine.aggregate([entry],period).byType.extendedSubtask;
  assert.deepEqual([entry.status,entry.eligibility,result.incomplete,result.eligible,result.ratio],["incomplete","eligible",1,1,0]);
});

test("overlapping period reads do not duplicate an extended subtask inside one period",()=>{
  const extended=[{id:"parent",name:"Long task",pathId:"work",start:"2026-11-29",end:"2026-12-08",subtasks:[
    {id:"step",name:"Cross-month step",date:"2026-12-01",done:false}
  ]}];
  const entry=adapters.fromExtendedTasks(extended)[0];
  const first=engine.aggregate([entry,{...entry,source:"secondObservation"}],{
    type:"custom",start:"2026-11-29",end:"2026-12-02",asOf:"2026-12-02",timeZone:"UTC"
  });
  assert.equal(first.uniqueEntries,1);
  assert.deepEqual([first.byType.extendedSubtask.incomplete,first.byType.extendedSubtask.eligible],[1,1]);
});

test("legacy engine API retains its return shape and separate category results",()=>{
  const legacy=engine.summarizeJourney([
    {kind:"task",id:"task-a",date:"2026-11-10",status:"done"},
    {kind:"task",id:"task-b",date:"2026-11-10",status:"pending"},
    {kind:"extended",id:"sub-a",date:"2026-11-10",status:"done"},
    {kind:"habit",id:"habit-a",date:"2026-11-10",status:"incomplete"}
  ],{start:"2026-11-01",end:"2026-11-30",today:"2026-11-20"});
  assert.deepEqual(Object.keys(legacy),["task","extended","habit"]);
  assert.deepEqual([legacy.task.complete,legacy.task.eligible,legacy.task.remaining,legacy.task.ratio],[1,2,1,.5]);
  assert.deepEqual([legacy.extended.complete,legacy.extended.eligible,legacy.habit.complete,legacy.habit.eligible],[1,1,0,1]);
});
