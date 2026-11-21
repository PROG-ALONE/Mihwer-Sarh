"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const timeline=require("./journey-timeline.js");

test("parses local clock values and durations across midnight",()=>{
  assert.equal(timeline.parseClock("00:05"),5);
  assert.equal(timeline.parseClock("23:40"),1420);
  assert.equal(timeline.parseClock("24:00"),null);
  assert.equal(timeline.durationBetween("23:40","00:10"),30);
  assert.equal(timeline.durationBetween("09:00","10:30"),90);
  assert.equal(timeline.durationBetween("bad","10:30"),null);
});

test("shifts schedule times in both directions across midnight",()=>{
  assert.deepEqual(timeline.shiftMinute(600,30),{dayOffset:0,minute:630});
  assert.deepEqual(timeline.shiftMinute(1435,10),{dayOffset:1,minute:5});
  assert.deepEqual(timeline.shiftMinute(5,-10),{dayOffset:-1,minute:1435});
  assert.throws(()=>timeline.shiftMinute(1440,5),/Invalid timeline shift/);
});

test("journey position advances in event order between real scheduled times",()=>{
  const entries=[
    {startMinute:420},
    {startMinute:null},
    {startMinute:600},
    {startMinute:1080}
  ];
  assert.equal(timeline.positionAtMinute(entries,420),0);
  assert.equal(timeline.positionAtMinute(entries,510),1);
  assert.equal(timeline.positionAtMinute(entries,600),2);
  assert.ok(timeline.positionAtMinute(entries,900)>2);
  assert.equal(timeline.positionAtMinute(entries,1440),3);
});

test("manual journey navigation steps one stop and clamps at either end",()=>{
  assert.equal(MihwerJourneyTimeline.stepPosition(1,-1,4),0);
  assert.equal(MihwerJourneyTimeline.stepPosition(1,1,4),2);
  assert.equal(MihwerJourneyTimeline.stepPosition(0,-1,4),0);
  assert.equal(MihwerJourneyTimeline.stepPosition(3,1,4),3);
  assert.throws(()=>MihwerJourneyTimeline.stepPosition(0,0,4),/Invalid journey navigation/);
});

test("untimed journey entries do not become midnight events",()=>{
  assert.equal(timeline.positionAtMinute([
    {startMinute:null},{startMinute:480},{startMinute:null},{startMinute:720}
  ],600),2);
  assert.equal(timeline.positionAtMinute([{startMinute:null},{startMinute:null}],720),.5);
  assert.throws(()=>timeline.positionAtMinute([],NaN),/Invalid journey position input/);
  assert.throws(()=>timeline.positionAtMinute([{startMinute:2880}],30),/Invalid journey position input/);
});

test("sorts timed events while retaining untimed events and equal-time entries",()=>{
  const ordered=timeline.order([
    {id:"untimed",title:"Untimed",status:"pending"},
    {id:"later",title:"Later",startMinute:600,status:"pending"},
    {id:"same-b",title:"Same B",startMinute:540,status:"pending"},
    {id:"same-a",title:"Same A",startMinute:540,status:"pending"}
  ]);
  assert.deepEqual(ordered.map(event=>event.id),["same-a","same-b","later","untimed"]);
});

test("marks every overlapping interval without removing or shifting events",()=>{
  const ordered=timeline.order([
    {id:"first",title:"First",startMinute:540,durationMinutes:60,status:"pending"},
    {id:"overlap",title:"Overlap",startMinute:570,durationMinutes:30,status:"pending"},
    {id:"touching",title:"Touching",startMinute:600,durationMinutes:20,status:"pending"},
    {id:"untimed",title:"Untimed",status:"pending"}
  ]);
  assert.equal(ordered.length,4);
  assert.deepEqual(ordered.map(event=>event.overlap),[true,true,false,false]);
  assert.equal(ordered[0].startMinute,540);
  assert.equal(ordered[1].startMinute,570);
});

test("summarizes completion, overdue, remaining, time, cancellation and overlaps",()=>{
  const summary=timeline.summarize([
    {status:"completed",durationMinutes:30,actualMinutes:25,overlap:false},
    {status:"pending",endMinute:500,durationMinutes:60,actualMinutes:0,overlap:true},
    {status:"inProgress",endMinute:700,durationMinutes:45,actualMinutes:12,overlap:true},
    {status:"cancelled",durationMinutes:20,actualMinutes:0,overlap:false}
  ],600);
  assert.deepEqual(summary,{
    scheduled:3,completed:1,overdue:1,remaining:1,cancelled:1,progress:1/3,
    plannedMinutes:135,actualMinutes:37,overlapping:2
  });
});

test("does not count unconfigured or exempt markers as scheduled work",()=>{
  const summary=timeline.summarize([
    {status:"unconfigured"},
    {status:"exempt"},
    {status:"scheduled",durationMinutes:20}
  ],0);
  assert.equal(summary.scheduled,1);
  assert.equal(summary.remaining,1);
  assert.equal(summary.plannedMinutes,20);
});

test("rejects invalid and duplicate timeline identities",()=>{
  assert.throws(()=>timeline.order([{id:"",title:"Bad"}]),/Invalid timeline event/);
  assert.throws(()=>timeline.order([
    {id:"same",title:"First"},{id:"same",title:"Second"}
  ]),/Duplicate timeline event identity/);
  assert.throws(()=>timeline.summarize([],NaN),/Invalid timeline summary input/);
});
