"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const scenic=require("./immersive-journey.js");
const timeline=require("./journey-timeline.js");

test("traveler follows the road's cubic curve and reaches both station anchors",()=>{
  const a={x:100,y:200},b={x:160,y:400};
  assert.deepEqual(scenic.pointBetween(a,b,0),a);
  assert.deepEqual(scenic.pointBetween(a,b,1),b);
  assert.deepEqual(scenic.pointBetween(a,b,.5),{x:130,y:300});
  const point=scenic.pointBetween(a,b,.25);
  assert.ok(point.x>a.x&&point.x<b.x);
  assert.ok(point.y>a.y&&point.y<b.y);
  assert.deepEqual(a,{x:100,y:200});
});

test("traveler clamps to the first and last stops, including a one-stop route",()=>{
  const a={x:45,y:80},b={x:30,y:170};
  assert.deepEqual(scenic.pointBetween(a,b,-1),a);
  assert.deepEqual(scenic.pointBetween(a,b,2),b);
  assert.deepEqual(scenic.pointBetween(a,a,.8),a);
});

test("period traveler follows a continuous curved route between alternating cards",()=>{
  const a={x:100,y:100},left={x:20,y:150},right={x:180,y:250},b={x:100,y:300};
  assert.deepEqual(scenic.pointOnPeriodPath(a,left,right,b,0),a);
  assert.deepEqual(scenic.pointOnPeriodPath(a,left,right,b,1),b);
  const firstHalf=scenic.pointOnPeriodPath(a,left,right,b,.25);
  const secondHalf=scenic.pointOnPeriodPath(a,left,right,b,.75);
  assert.ok(firstHalf.x<a.x);
  assert.ok(secondHalf.x>b.x);
  assert.ok(firstHalf.y<secondHalf.y);
  assert.deepEqual(scenic.pointOnPeriodPath(a,left,right,b,-1),a);
  assert.deepEqual(scenic.pointOnPeriodPath(a,left,right,b,2),b);
});

test("period traveler position follows the represented date and time, not scroll position",()=>{
  const dates=["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20"];
  assert.equal(scenic.periodPosition(dates,"2026-11-16",0),0);
  assert.equal(scenic.periodPosition(dates,"2026-11-18",720),2.5);
  assert.equal(scenic.periodPosition(dates,"2026-11-20",1439),4);
  assert.equal(scenic.periodPosition(dates,"2026-11-10",720),0);
  assert.equal(scenic.periodPosition(dates,"2026-11-30",720),4);
  assert.throws(()=>scenic.periodPosition(["2026-02-31"],"2026-11-18",720),/Invalid period position/);
  assert.throws(()=>scenic.periodPosition(["2026-11-18","2026-11-17"],"2026-11-18",720),/ordered/);
});

test("period traveler maps selected time within day, week, month and year ranges",()=>{
  const week=["2026-11-16","2026-11-17","2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22"];
  const month=Array.from({length:30},(_,day)=>`2026-11-${String(day+1).padStart(2,"0")}`);
  const year=Array.from({length:12},(_,month)=>`2026-${String(month+1).padStart(2,"0")}-01`);
  assert.equal(scenic.periodPosition(["2026-11-19"],"2026-11-19",720),0);
  assert.equal(scenic.periodPosition(week,"2026-11-19",720),3.5);
  assert.equal(scenic.periodPosition(month,"2026-11-15",720),14.5);
  assert.ok(scenic.periodPosition(year,"2026-07-01",720)>6);
  assert.ok(scenic.periodPosition(year,"2026-07-01",720)<7);
});

test("traveler movement duration is measured, eased, and capped for distant stops",()=>{
  assert.equal(scenic.walkingDuration(0),900);
  assert.equal(scenic.walkingDuration(1),1220);
  assert.equal(scenic.walkingDuration(5),2500);
  assert.equal(scenic.walkingDuration(20),4500);
});

test("schedule choices use the existing timeline's cross-midnight rules",()=>{
  const date="2026-11-19";
  assert.deepEqual(timeline.shiftMinute(5,scenic.scheduleDelta("earlier",5,date,date,600)),{dayOffset:-1,minute:1430});
  assert.deepEqual(timeline.shiftMinute(1435,scenic.scheduleDelta("later",1435,date,date,600)),{dayOffset:1,minute:10});
  assert.deepEqual(timeline.shiftMinute(600,scenic.scheduleDelta("tomorrow",600,date,date,600)),{dayOffset:1,minute:600});
});

test("rescheduling missed work to now uses real civil dates, not preview scene time",()=>{
  assert.equal(scenic.scheduleDelta("now",540,"2026-11-19","2026-11-19",720),180);
  assert.equal(scenic.scheduleDelta("now",1380,"2026-11-18","2026-11-19",30),90);
  const delta=scenic.scheduleDelta("now",540,"2026-10-31","2026-11-02",720);
  assert.deepEqual(timeline.shiftMinute(540,delta),{dayOffset:2,minute:720});
});

test("schedule calculations handle leap days and year boundaries",()=>{
  assert.equal(scenic.scheduleDelta("now",0,"2028-02-28","2028-03-01",0),2880);
  assert.equal(scenic.scheduleDelta("now",1439,"2026-12-31","2027-01-01",0),1);
  assert.throws(()=>scenic.scheduleDelta("complete",0,"2026-11-19","2026-11-19",720),/Unknown schedule action/);
});
