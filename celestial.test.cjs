"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const celestial=require("./celestial.js");

const ramadi={latitude:33.42819,longitude:43.30933};
const localDayStart=Date.parse("2026-11-18T21:00:00Z");
const localDayEnd=Date.parse("2026-11-19T21:00:00Z");

test("Ramadi solar events use the date interval and geographic coordinates",()=>{
  const events=celestial.solarEvents(localDayStart,localDayEnd,ramadi.latitude,ramadi.longitude);
  assert.ok(events.sunrise instanceof Date);
  assert.ok(events.sunset instanceof Date);
  const local=(date)=>new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Baghdad",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date);
  assert.equal(local(events.sunrise),"06:41");
  assert.equal(local(events.sunset),"17:02");
});

test("solar altitude rises above the horizon by noon and falls below it at night",()=>{
  const before=celestial.sunPosition(new Date("2026-11-19T02:00:00Z"),ramadi.latitude,ramadi.longitude);
  const noon=celestial.sunPosition(new Date("2026-11-19T09:00:00Z"),ramadi.latitude,ramadi.longitude);
  const after=celestial.sunPosition(new Date("2026-11-19T18:00:00Z"),ramadi.latitude,ramadi.longitude);
  assert.ok(before.altitude<-.833);
  assert.ok(noon.altitude>35&&noon.altitude<65);
  assert.ok(after.altitude<-.833);
});

test("solar positions follow seasonal latitude and longitude changes",()=>{
  const winter=celestial.sunPosition(new Date("2026-12-21T09:00:00Z"),ramadi.latitude,ramadi.longitude);
  const summer=celestial.sunPosition(new Date("2026-06-21T09:00:00Z"),ramadi.latitude,ramadi.longitude);
  const northern=celestial.sunPosition(new Date("2026-06-21T09:00:00Z"),60,ramadi.longitude);
  const eastern=celestial.sunPosition(new Date("2026-06-21T09:00:00Z"),ramadi.latitude,ramadi.longitude+15);
  assert.ok(summer.altitude>winter.altitude);
  assert.notEqual(northern.altitude,summer.altitude);
  assert.notEqual(eastern.hourAngle,summer.hourAngle);
});

test("lunar position, visibility altitude and phase illumination are computed",()=>{
  const date=new Date("2026-11-19T09:00:00Z");
  const moon=celestial.moonPosition(date,ramadi.latitude,ramadi.longitude);
  assert.ok(moon.altitude>=-90&&moon.altitude<=90);
  assert.ok(moon.azimuth>=0&&moon.azimuth<360);
  assert.ok(moon.phase>=0&&moon.phase<2*Math.PI);
  assert.ok(moon.illumination>=0&&moon.illumination<=1);
  const newMoon=celestial.moonShadowOffset(0,27);
  const fullMoon=celestial.moonShadowOffset(Math.PI,27);
  assert.equal(Math.abs(newMoon),0);
  assert.equal(Math.abs(fullMoon),54);
});

test("topocentric lunar position includes distance, apparent altitude and bright-limb direction",()=>{
  const moon=celestial.moonPosition(new Date("2026-09-26T16:49:00Z"),39.0207,-122.81);
  assert.ok(moon.distanceKm>360000&&moon.distanceKm<410000);
  assert.ok(moon.angularRadius>.24&&moon.angularRadius<.28);
  assert.ok(moon.phaseAngle>=0&&moon.phaseAngle<=Math.PI);
  assert.ok(Math.abs(moon.apparentAltitude-moon.altitude-moon.refraction)<1e-10);
  const dark=celestial.moonShadowVector(0,0,27);
  const full=celestial.moonShadowVector(1,0,27);
  const brightWest=celestial.moonShadowVector(1,Math.PI/2,27);
  const brightEast=celestial.moonShadowVector(1,-Math.PI/2,27);
  assert.deepEqual(dark,{x:0,y:0});
  assert.ok(Math.abs(full.x)<1e-10);
  assert.equal(full.y,54);
  assert.equal(brightWest.x,-54);
  assert.equal(brightEast.x,54);
});

test("stellar visibility fades smoothly from civil twilight to astronomical night",()=>{
  const values=[-6,-9,-12,-15,-18].map(celestial.stellarVisibility);
  assert.deepEqual(values.slice(0,1),[0]);
  assert.deepEqual(values.slice(-1),[.75]);
  assert.ok(values.every((value,index)=>index===0||value>=values[index-1]));
});

test("projected celestial objects stay within the visible landscape",()=>{
  const point=celestial.project({altitude:35,azimuth:180},1000,800,330,250,500);
  assert.equal(point.x,500);
  assert.ok(point.y<330);
  assert.throws(()=>celestial.sunPosition(new Date(NaN),0,0),/Date/);
  assert.throws(()=>celestial.moonPosition(new Date(),91,0),/coordinates/);
});

test("scene lighting remains dark but visible below the horizon",()=>{
  const night=celestial.sceneLighting(-30);
  assert.match(night.top,/rgba\(.+,0\.680\)/);
  assert.match(night.mid,/rgba\(.+,0\.380\)/);
  assert.match(night.filter,/brightness\(0\.480\)/);
  assert.doesNotMatch(night.filter,/brightness\(0(?:\.0+)?\)/);
});

test("scene lighting transitions from twilight into natural daylight",()=>{
  const twilight=celestial.sceneLighting(0);
  const day=celestial.sceneLighting(45);
  assert.notEqual(twilight.top,day.top);
  assert.match(twilight.top,/rgba\(/);
  assert.match(day.top,/rgba\(92,163,208,0\.700\)/);
  assert.match(day.filter,/brightness\(0\.980\)/);
  assert.match(day.glow,/^rgb\(/);
});

test("scene lighting stays neutral when solar data is unavailable",()=>{
  const fallback=celestial.sceneLighting(Number.NaN);
  assert.match(fallback.filter,/brightness\(1\)/);
  assert.match(fallback.glow,/^rgb\(/);
});

test("scene phase follows astronomical altitude and rising or setting direction",()=>{
  const cases=[
    [{altitude:-25,hourAngle:-150},"night"],
    [{altitude:-10,hourAngle:-100},"dawn"],
    [{altitude:1,hourAngle:-90},"sunrise"],
    [{altitude:10,hourAngle:-50},"morning"],
    [{altitude:45,hourAngle:0},"noon"],
    [{altitude:20,hourAngle:40},"afternoon"],
    [{altitude:1,hourAngle:90},"sunset"],
    [{altitude:-10,hourAngle:100},"evening"]
  ];
  for(const [position,expected] of cases)assert.equal(celestial.solarPhase(position),expected);
  assert.throws(()=>celestial.solarPhase({altitude:0}),/solar position/);
});
