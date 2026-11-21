"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
const celestial=require("./celestial.js");

const solarSamples=[
  ["Ramadi spring 06","2026-03-20T06:00:00Z",33.42819,43.30933,116.059982,33.425126],
  ["Ramadi spring 09","2026-03-20T09:00:00Z",33.42819,43.30933,173.574997,56.308944],
  ["Ramadi spring 12","2026-03-20T12:00:00Z",33.42819,43.30933,238.004674,38.687723],
  ["Ramadi summer 06","2026-06-21T06:00:00Z",33.42819,43.30933,91.014133,47.734342],
  ["Ramadi summer 09","2026-06-21T09:00:00Z",33.42819,43.30933,168.815963,79.834765],
  ["Ramadi summer 12","2026-06-21T12:00:00Z",33.42819,43.30933,266.463324,51.300201],
  ["Ramadi autumn 06","2026-09-22T06:00:00Z",33.42819,43.30933,118.673516,36.442001],
  ["Ramadi autumn 09","2026-09-22T09:00:00Z",33.42819,43.30933,180.213787,56.814821],
  ["Ramadi autumn 12","2026-09-22T12:00:00Z",33.42819,43.30933,241.435811,36.204342],
  ["Ramadi winter 06","2026-12-21T06:00:00Z",33.42819,43.30933,135.851141,18.124391],
  ["Ramadi winter 09","2026-12-21T09:00:00Z",33.42819,43.30933,178.694276,33.121935],
  ["Ramadi winter 12","2026-12-21T12:00:00Z",33.42819,43.30933,222.341372,19.486608],
  ["London DST 08","2026-10-25T08:00:00Z",51.5072,-0.1276,124.455866,10.036021],
  ["London DST 11","2026-10-25T11:00:00Z",51.5072,-0.1276,167.905547,25.574722],
  ["London DST 14","2026-10-25T14:00:00Z",51.5072,-0.1276,215.367383,19.837523],
  ["Equator 06","2026-03-20T06:00:00Z",0,0,90.144429,-1.879692],
  ["Equator 12","2026-03-20T12:00:00Z",0,0,91.401969,88.140404],
  ["Equator 18","2026-03-20T18:00:00Z",0,0,270.053389,1.838009],
  ["Tromso winter 06","2026-12-21T06:00:00Z",69.6492,18.9553,116.167407,-15.461176],
  ["Tromso winter 09","2026-12-21T09:00:00Z",69.6492,18.9553,156.603515,-4.879710],
  ["Tromso winter 12","2026-12-21T12:00:00Z",69.6492,18.9553,197.826776,-4.132761],
  ["Tromso summer 06","2026-06-21T06:00:00Z",69.6492,18.9553,98.810068,28.308415],
  ["Tromso summer 09","2026-06-21T09:00:00Z",69.6492,18.9553,147.056258,41.183600],
  ["Tromso summer 12","2026-06-21T12:00:00Z",69.6492,18.9553,203.256737,42.491953]
];

const lunarSamples=[
  ["new","2026-09-11T03:28:00Z",33.42819,43.30933,91.200175,6.350017,.03328],
  ["waxing crescent","2026-09-14T20:02:00Z",33.42819,43.30933,272.429410,-39.305049,14.57244],
  ["first quarter","2026-09-18T20:45:00Z",33.42819,43.30933,244.577168,-13.549188,49.49962],
  ["waxing gibbous","2026-09-22T22:35:00Z",33.42819,43.30933,241.866895,8.075895,84.88331],
  ["full","2026-09-26T16:50:00Z",33.42819,43.30933,103.408499,25.552999,99.96280],
  ["waning gibbous","2026-09-30T04:03:00Z",33.42819,43.30933,277.777143,32.117514,85.77397],
  ["last quarter","2026-10-03T13:26:00Z",33.42819,43.30933,335.818263,-26.204651,50.35480],
  ["waning crescent","2026-10-07T00:46:00Z",33.42819,43.30933,85.085146,13.491644,14.12717],
  ["London full","2026-09-26T16:50:00Z",51.5072,-0.1276,76.199211,-6.525393,99.96975],
  ["Equator first quarter","2026-09-18T20:45:00Z",0,0,232.291058,39.023796,49.60192],
  ["Tromso waning crescent","2026-10-07T00:46:00Z",69.6492,18.9553,72.062952,5.160992,14.31421]
];

const limbSamples=[
  ["new","2026-09-11T03:28:00Z",89.536053,7.618852,91.200175,6.350017],
  ["waxing crescent","2026-09-14T20:02:00Z",335.806301,-50.743612,272.429410,-39.305049],
  ["first quarter","2026-09-18T20:45:00Z",353.153492,-54.768830,244.577168,-13.549188],
  ["waxing gibbous","2026-09-22T22:35:00Z",38.816181,-49.702576,241.866895,8.075895],
  ["full","2026-09-26T16:50:00Z",285.061710,-23.921832,103.408499,25.552999],
  ["waning gibbous","2026-09-30T04:03:00Z",101.637182,12.147981,277.777143,32.117514],
  ["last quarter","2026-10-03T13:26:00Z",253.708884,16.161273,335.818263,-26.204651],
  ["waning crescent","2026-10-07T00:46:00Z",75.812011,-29.649790,85.085146,13.491644]
];

const solarEventSamples=[
  ["Ramadi spring","2026-03-19T21:00:00Z","2026-03-20T21:00:00Z","Asia/Baghdad",33.42819,43.30933,"06:11","18:19"],
  ["Ramadi summer","2026-06-20T21:00:00Z","2026-06-21T21:00:00Z","Asia/Baghdad",33.42819,43.30933,"04:58","19:20"],
  ["Ramadi autumn","2026-09-21T21:00:00Z","2026-09-22T21:00:00Z","Asia/Baghdad",33.42819,43.30933,"05:55","18:04"],
  ["Ramadi winter","2026-12-20T21:00:00Z","2026-12-21T21:00:00Z","Asia/Baghdad",33.42819,43.30933,"07:07","17:03"],
  ["London DST","2026-10-24T23:00:00Z","2026-10-26T00:00:00Z","Europe/London",51.5072,-.1276,"06:42","16:47"]
];

const lunarEventSamples=[
  ["2026-09-11","05:53","18:22"],
  ["2026-09-14","09:01","19:49"],
  ["2026-09-18","12:58","22:32"],
  ["2026-09-22","15:48","01:24"],
  ["2026-09-26","17:41","05:28"],
  ["2026-09-30","20:04","09:58"],
  ["2026-10-03","23:06","13:15"],
  ["2026-10-07","02:34","15:55"]
];

function angularDifference(a,b) {
  return ((a-b+540)%360)-180;
}

function minuteOfDay(date,zone) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{
    timeZone:zone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(date).map(part=>[part.type,part.value]));
  return Number(parts.hour)*60+Number(parts.minute);
}

function minuteDifference(a,b) {
  const difference=Math.abs(a-b);
  return Math.min(difference,1440-difference);
}

function clockMinute(value) {
  const [hour,minute]=value.split(":").map(Number);
  return hour*60+minute;
}

test("solar azimuth and altitude agree with JPL DE441 samples across five sites and seasons",()=>{
  for(const [name,instant,latitude,longitude,referenceAzimuth,referenceAltitude] of solarSamples){
    const position=celestial.sunPosition(new Date(instant),latitude,longitude);
    assert.ok(Math.abs(position.altitude-referenceAltitude)<=.02,`${name} altitude: ${position.altitude} vs ${referenceAltitude}`);
    assert.ok(Math.abs(angularDifference(position.azimuth,referenceAzimuth))<=.1,`${name} azimuth: ${position.azimuth} vs ${referenceAzimuth}`);
  }
});

test("lunar position and illuminated fraction agree with JPL DE441 phase and site samples",()=>{
  for(const [name,instant,latitude,longitude,referenceAzimuth,referenceAltitude,referenceIllumination] of lunarSamples){
    const moon=celestial.moonPosition(new Date(instant),latitude,longitude);
    assert.ok(Math.abs(angularDifference(moon.azimuth,referenceAzimuth))<=.03,`${name} azimuth: ${moon.azimuth} vs ${referenceAzimuth}`);
    assert.ok(Math.abs(moon.altitude-referenceAltitude)<=.03,`${name} altitude: ${moon.altitude} vs ${referenceAltitude}`);
    assert.ok(Math.abs(moon.illumination*100-referenceIllumination)<=.75,`${name} illumination: ${moon.illumination*100} vs ${referenceIllumination}`);
  }
});

test("lunar bright-limb direction agrees with independently derived JPL sky directions",()=>{
  const radians=Math.PI/180;
  const normalize=value=>((value+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  for(const [name,instant,sunAzimuth,sunAltitude,moonAzimuth,moonAltitude] of limbSamples){
    const azimuthDifference=normalize((sunAzimuth-moonAzimuth)*radians);
    const east=Math.cos(sunAltitude*radians)*Math.sin(azimuthDifference);
    const up=Math.sin(sunAltitude*radians)*Math.cos(moonAltitude*radians)
      -Math.cos(sunAltitude*radians)*Math.sin(moonAltitude*radians)*Math.cos(azimuthDifference);
    const reference=Math.atan2(-east,up);
    const actual=celestial.moonPosition(new Date(instant),33.42819,43.30933).brightLimbAngle;
    assert.ok(Math.abs(normalize(actual-reference))<=.01,`${name} limb angle: ${actual} vs ${reference}`);
  }
});

test("solar rise and set agree with one-minute JPL event samples, including DST and polar no-event days",()=>{
  for(const [name,start,end,zone,latitude,longitude,expectedRise,expectedSet] of solarEventSamples){
    const events=celestial.solarEvents(Date.parse(start),Date.parse(end),latitude,longitude);
    assert.ok(events.sunrise&&events.sunset,`${name} must have both solar events`);
    assert.ok(minuteDifference(minuteOfDay(events.sunrise,zone),clockMinute(expectedRise))<=2,`${name} sunrise`);
    assert.ok(minuteDifference(minuteOfDay(events.sunset,zone),clockMinute(expectedSet))<=2,`${name} sunset`);
  }
  const tromsoSummer=celestial.solarEvents(Date.parse("2026-06-20T22:00:00Z"),Date.parse("2026-06-21T22:00:00Z"),69.6492,18.9553);
  const tromsoWinter=celestial.solarEvents(Date.parse("2026-12-20T23:00:00Z"),Date.parse("2026-12-21T23:00:00Z"),69.6492,18.9553);
  assert.deepEqual(tromsoSummer,{sunrise:null,sunset:null});
  assert.deepEqual(tromsoWinter,{sunrise:null,sunset:null});
});

test("lunar rise and set agree within two minutes with one-minute JPL event samples",()=>{
  for(const [date,expectedRise,expectedSet] of lunarEventSamples){
    const start=Date.parse(`${date}T00:00:00+03:00`);
    const events=celestial.lunarEvents(start,start+86400000,33.42819,43.30933);
    assert.ok(events.moonrise&&events.moonset,`${date} must have both lunar events`);
    assert.ok(minuteDifference(minuteOfDay(events.moonrise,"Asia/Baghdad"),clockMinute(expectedRise))<=2,`${date} moonrise`);
    assert.ok(minuteDifference(minuteOfDay(events.moonset,"Asia/Baghdad"),clockMinute(expectedSet))<=2,`${date} moonset`);
  }
});

test("London prayer instants stay invariant across host time zones on the DST transition date",()=>{
  const source=`const a=require("adhan");const p=a.CalculationMethod.MuslimWorldLeague();p.madhab=a.Madhab.Shafi;const x=new a.PrayerTimes(new a.Coordinates(51.5072,-.1276),new Date(2026,9,25,12),p);console.log(JSON.stringify(Object.fromEntries(["fajr","sunrise","dhuhr","asr","maghrib","isha"].map(k=>[k,x[k].toISOString()]))))`;
  const zones=["UTC","Asia/Baghdad","Europe/London","America/Los_Angeles"];
  const results=zones.map(TZ=>{
    const run=spawnSync(process.execPath,["-e",source],{encoding:"utf8",env:{...process.env,TZ}});
    assert.equal(run.status,0,run.stderr);
    return JSON.parse(run.stdout);
  });
  for(const result of results.slice(1))assert.deepEqual(result,results[0]);
  assert.equal(results[0].fajr,"2026-10-25T04:49:00.000Z");
  assert.equal(results[0].asr,"2026-10-25T14:15:00.000Z");
});
