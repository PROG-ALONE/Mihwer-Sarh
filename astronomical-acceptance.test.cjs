"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
const adhan=require("adhan");
const celestial=require("./celestial.js");

const prayerCases=[
  {
    name:"Ramadi autumn",
    date:"2026-11-19",
    zone:"Asia/Baghdad",
    latitude:33.42819,
    longitude:43.30933,
    method:"UmmAlQura",
    expected:{fajr:"05:13",sunrise:"06:42",dhuhr:"11:52",asr:"14:43",maghrib:"17:02",isha:"18:32"}
  },
  {
    name:"Ramadi summer",
    date:"2026-06-21",
    zone:"Asia/Baghdad",
    latitude:33.42819,
    longitude:43.30933,
    method:"UmmAlQura",
    expected:{fajr:"03:11",sunrise:"04:57",dhuhr:"12:09",asr:"15:52",maghrib:"19:20",isha:"20:50"}
  },
  {
    name:"Ramadi winter",
    date:"2026-12-21",
    zone:"Asia/Baghdad",
    latitude:33.42819,
    longitude:43.30933,
    method:"UmmAlQura",
    expected:{fajr:"05:35",sunrise:"07:07",dhuhr:"12:05",asr:"14:45",maghrib:"17:03",isha:"18:33"}
  },
  {
    name:"London autumn DST transition",
    date:"2026-10-25",
    zone:"Europe/London",
    latitude:51.5072,
    longitude:-0.1276,
    method:"MuslimWorldLeague",
    expected:{fajr:"04:49",sunrise:"06:42",dhuhr:"11:45",asr:"14:17",maghrib:"16:47",isha:"18:32"}
  }
];

function wallTime(date,zone) {
  return new Intl.DateTimeFormat("en-GB",{timeZone:zone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date);
}

function prayerTimes({date,zone,latitude,longitude,method}) {
  const [year,month,day]=date.split("-").map(Number);
  const params=adhan.CalculationMethod[method]();
  params.madhab=adhan.Madhab.Shafi;
  params.highLatitudeRule=adhan.HighLatitudeRule.recommended(new adhan.Coordinates(latitude,longitude));
  const calculated=new adhan.PrayerTimes(new adhan.Coordinates(latitude,longitude),new Date(year,month-1,day,12),params);
  return Object.fromEntries(["fajr","sunrise","dhuhr","asr","maghrib","isha"].map(key=>[key,wallTime(calculated[key],zone)]));
}

function localEventDate(date,zone) {
  const noon=Date.parse(`${date}T12:00:00Z`);
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(noon)).map(part=>[part.type,part.value]));
  const offsetText=new Intl.DateTimeFormat("en-US",{timeZone:zone,timeZoneName:"longOffset"}).formatToParts(new Date(noon)).find(part=>part.type==="timeZoneName").value;
  const match=/GMT([+-])(\d{2}):(\d{2})/.exec(offsetText);
  const offset=match?((match[1]==="-"?-1:1)*(Number(match[2])*60+Number(match[3]))):0;
  const localMidnight=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day))-offset*60000;
  return {start:localMidnight,end:localMidnight+86400000};
}

function eventText(instant,zone) {
  return instant?new Intl.DateTimeFormat("en-GB",{timeZone:zone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(instant):null;
}

test("Ramadi sunrise and sunset agree with the independent AlAdhan reference within one minute",()=>{
  const cases=[
    {date:"2026-11-19",expected:["06:42","17:02"]},
    {date:"2026-06-21",expected:["04:57","19:20"]},
    {date:"2026-12-21",expected:["07:07","17:03"]}
  ];
  for(const sample of cases){
    const interval=localEventDate(sample.date,"Asia/Baghdad");
    const events=celestial.solarEvents(interval.start,interval.end,33.42819,43.30933);
    assert.ok(events.sunrise&&events.sunset,`${sample.date}: solar events must exist`);
    const actual=[eventText(events.sunrise,"Asia/Baghdad"),eventText(events.sunset,"Asia/Baghdad")];
    for(let i=0;i<2;i++){
      const actualMinute=Number(actual[i].slice(0,2))*60+Number(actual[i].slice(3));
      const expectedMinute=Number(sample.expected[i].slice(0,2))*60+Number(sample.expected[i].slice(3));
      const difference=Math.abs(actualMinute-expectedMinute);
      assert.ok(Math.min(difference,1440-difference)<=1,`${sample.date}: ${actual[i]} differs from ${sample.expected[i]}`);
    }
  }
});

test("Ramadi daylight length changes with season and solar altitude follows the daily arc",()=>{
  const winter=localEventDate("2026-12-21","Asia/Baghdad"),summer=localEventDate("2026-06-21","Asia/Baghdad");
  const winterEvents=celestial.solarEvents(winter.start,winter.end,33.42819,43.30933);
  const summerEvents=celestial.solarEvents(summer.start,summer.end,33.42819,43.30933);
  const winterLength=winterEvents.sunset-winterEvents.sunrise,summerLength=summerEvents.sunset-summerEvents.sunrise;
  assert.ok(summerLength-winterLength>4*60*60*1000);
  const samples=[
    ["2026-11-19T02:13:00Z",-20,-16],
    ["2026-11-19T03:42:00Z",-2,1],
    ["2026-11-19T08:52:00Z",35,40],
    ["2026-11-19T11:42:00Z",20,26],
    ["2026-11-19T14:02:00Z",-2,1],
    ["2026-11-19T21:00:00Z",-90,-60]
  ];
  const positions=samples.map(([instant])=>celestial.sunPosition(new Date(instant),33.42819,43.30933));
  samples.forEach(([,minimum,maximum],index)=>assert.ok(positions[index].altitude>=minimum&&positions[index].altitude<=maximum));
  assert.ok(positions[2].altitude>positions[3].altitude);
  assert.equal(celestial.solarPhase(positions[0]),"night");
  assert.equal(celestial.solarPhase(positions[2]),"noon");
  assert.equal(celestial.solarPhase(positions[4]),"sunset");
});

test("prayer calculations match independent AlAdhan minute references for standard-latitude cases",()=>{
  for(const sample of prayerCases){
    const actual=prayerTimes(sample);
    for(const [name,expected] of Object.entries(sample.expected)){
      const actualMinute=Number(actual[name].slice(0,2))*60+Number(actual[name].slice(3));
      const expectedMinute=Number(expected.slice(0,2))*60+Number(expected.slice(3));
      const difference=Math.abs(actualMinute-expectedMinute);
      assert.ok(Math.min(difference,1440-difference)<=2,`${sample.name} ${name}: ${actual[name]} vs ${expected}`);
    }
  }
});

test("prayer instants are independent of the computer time zone and use the selected civil date",()=>{
  const source=`const a=require("adhan");const p=a.CalculationMethod.UmmAlQura();const x=new a.PrayerTimes(new a.Coordinates(33.42819,43.30933),new Date(2026,10,19,12),p);console.log(JSON.stringify(Object.fromEntries(["fajr","sunrise","dhuhr","asr","maghrib","isha"].map(k=>[k,x[k].toISOString()]))))`;
  const zones=["UTC","Asia/Baghdad","America/Los_Angeles","Europe/London"];
  const results=zones.map(TZ=>{
    const run=spawnSync(process.execPath,["-e",source],{encoding:"utf8",env:{...process.env,TZ}});
    assert.equal(run.status,0,run.stderr);
    return JSON.parse(run.stdout);
  });
  for(const result of results.slice(1))assert.deepEqual(result,results[0]);
  assert.equal(results[0].fajr,"2026-11-19T02:13:00.000Z");
  assert.equal(results[0].isha,"2026-11-19T15:32:00.000Z");
});

test("high-latitude prayer calculation uses the documented library rule and exposes method variance",()=>{
  const coords=new adhan.Coordinates(64.1466,-21.9426);
  assert.equal(adhan.HighLatitudeRule.recommended(coords),adhan.HighLatitudeRule.SeventhOfTheNight);
  const actual=prayerTimes({date:"2026-12-21",zone:"Atlantic/Reykjavik",latitude:64.1466,longitude:-21.9426,method:"MuslimWorldLeague"});
  assert.equal(actual.fajr,"08:32");
  assert.equal(actual.isha,"18:20");
  assert.notEqual(actual.fajr,"07:54");
  assert.notEqual(actual.isha,"18:48");
});

test("lunar position and illumination vary continuously with the selected date and time",()=>{
  const first=new Date("2026-11-19T09:00:00Z"),next=new Date("2026-11-19T09:05:00Z"),later=new Date("2026-11-20T09:00:00Z");
  const a=celestial.moonPosition(first,33.42819,43.30933),b=celestial.moonPosition(next,33.42819,43.30933),c=celestial.moonPosition(later,33.42819,43.30933);
  assert.ok(Math.abs(a.altitude-b.altitude)<3);
  assert.notEqual(a.azimuth,b.azimuth);
  assert.notEqual(a.phase,c.phase);
  assert.ok(a.illumination>=0&&a.illumination<=1);
});

test("lunar rise, set and full-moon illumination match the independent USNO day service",()=>{
  const zone="America/Los_Angeles";
  const events=celestial.lunarEvents(
    Date.parse("2026-09-26T07:00:00Z"),
    Date.parse("2026-09-27T07:00:00Z"),
    39.0207,-122.81
  );
  assert.equal(eventText(events.moonrise,zone),"18:54");
  assert.equal(eventText(events.moonset,zone),"07:03");
  const fullMoon=celestial.moonPosition(new Date("2026-09-26T16:49:00Z"),39.0207,-122.81);
  assert.equal(`${Math.round(fullMoon.illumination*100)}%`,"100%");
});

test("lunar illumination follows new, quarter and full phases through a lunation",()=>{
  const samples=[
    ["2026-09-26T16:49:00Z",.99,1],
    ["2026-10-04T02:00:00Z",.4,.6],
    ["2026-10-11T10:00:00Z",0,.02],
    ["2026-10-19T00:00:00Z",.4,.6]
  ];
  for(const [instant,minimum,maximum] of samples){
    const moon=celestial.moonPosition(new Date(instant),39.0207,-122.81);
    assert.ok(moon.illumination>=minimum&&moon.illumination<=maximum,`${instant}: ${moon.illumination}`);
  }
});
