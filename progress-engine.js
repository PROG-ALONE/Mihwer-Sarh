"use strict";
if(!globalThis.MihwerProgressContract&&typeof require==="function")require("./progress-contract.js");
globalThis.MihwerProgressEngine = (() => {
  const contract=globalThis.MihwerProgressContract;
  function aggregate(entries,periodInput) {
    if(!Array.isArray(entries)) throw new Error("Entries must be an array");
    const period=contract.normalizePeriod(periodInput),unique=new Map();
    for(const input of entries) {
      const entry=contract.normalizeEntry(input),key=contract.identity(entry),prior=unique.get(key);
      entry.sources=[entry.source];
      entry.metadataBySource=entry.metadata===undefined?{}:{[entry.source]:entry.metadata};
      if(prior&&(prior.status!==entry.status||prior.date!==entry.date||prior.eligibility!==entry.eligibility)) throw new Error("Conflicting progress entry");
      if(prior) {
        for(const [source,metadata] of Object.entries(entry.metadataBySource)) {
          if(Object.hasOwn(prior.metadataBySource,source)&&JSON.stringify(prior.metadataBySource[source])!==JSON.stringify(metadata)) throw new Error("Conflicting progress metadata");
          prior.metadataBySource[source]=metadata;
        }
        prior.observedBy=[...new Set([...prior.observedBy,...entry.observedBy,...(prior.source===entry.source?[]:[prior.source,entry.source])])].sort();
        prior.sources=[...new Set([...prior.sources,...entry.sources])].sort();
        prior.source=prior.sources[0];
      }
      else unique.set(key,entry);
    }
    const ordered=[...unique.values()].map(entry=>{
      const metadataBySource=Object.fromEntries(Object.entries(entry.metadataBySource).sort(([a],[b])=>a.localeCompare(b)));
      const metadataValues=Object.values(metadataBySource);
      const merged={...entry,metadataBySource};
      delete merged.metadata;
      if(metadataValues.length&&metadataValues.every(value=>JSON.stringify(value)===JSON.stringify(metadataValues[0]))) merged.metadata=metadataValues[0];
      return merged;
    }).sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type)||a.id.localeCompare(b.id)||(a.parentId||"").localeCompare(b.parentId||"")||a.source.localeCompare(b.source));
    const inPeriod=ordered.filter(entry=>entry.date>=period.start&&entry.date<=period.end);
    const summarizeGroup=evidence=>{
      const eligibleEntries=evidence.filter(entry=>entry.eligibility==="eligible");
      const included=eligibleEntries.filter(entry=>entry.date<=period.asOf);
      const excluded=evidence.filter(entry=>entry.eligibility==="excluded").length;
      const future=eligibleEntries.filter(entry=>entry.status==="future"||entry.date>period.asOf).length;
      const completed=included.filter(entry=>entry.status==="completed").length;
      const incomplete=included.filter(entry=>entry.status==="incomplete").length;
      const cancelled=included.filter(entry=>entry.status==="cancelled").length;
      const deferred=included.filter(entry=>entry.status==="deferred").length;
      const unrecorded=included.filter(entry=>entry.status==="unrecorded").length;
      const exempt=included.filter(entry=>entry.status==="exempt").length;
      const eligible=completed+incomplete;
      return {completed,incomplete,eligible,ratio:eligible?completed/eligible:null,cancelled,deferred,future,unrecorded,exempt,excluded,evidence:evidence.filter(entry=>entry.date<=period.asOf&&entry.status!=="future")};
    };
    const byType={},bySource={};
    for(const type of [...new Set(inPeriod.map(entry=>entry.type))].sort()) {
      const typed=inPeriod.filter(entry=>entry.type===type);
      byType[type]=summarizeGroup(typed);
      bySource[type]={};
      const sources=[...new Set(typed.flatMap(entry=>entry.sources))].sort();
      for(const source of sources) bySource[type][source]=summarizeGroup(typed.filter(entry=>entry.sources.includes(source)));
    }
    return {period,byType,bySource,uniqueEntries:ordered.length};
  }

  function summarize(entries) {
    if(!Array.isArray(entries)) throw new Error("Entries must be an array");
    const result=summarizeJourney(entries.map(entry=>({...entry,kind:"task"})),{start:"0001-01-01",end:"9999-12-31",today:"9999-12-31"}).task;
    return {eligible:result.eligible,complete:result.complete,remaining:result.remaining,ratio:result.ratio,cancelled:result.cancelled,deferred:result.deferred,evidence:result.evidence};
  }
  function summarizeJourney(entries,{start,end,today}) {
    const statuses={task:["pending","done","deferred","cancelled"],extended:["pending","done","deferred","cancelled"],habit:["done","incomplete","unrecorded","exempt"]};
    if(!Array.isArray(entries)||!globalThis.MihwerExtendedValidation.isDate(start)||
        !globalThis.MihwerExtendedValidation.isDate(end)||!globalThis.MihwerExtendedValidation.isDate(today)||start>end) throw new Error("Invalid period");
    for(const entry of entries) {
      if(!entry||!Object.hasOwn(statuses,entry.kind)||typeof entry.id!=="string"||!entry.id||
          !globalThis.MihwerExtendedValidation.isDate(entry.date)||!statuses[entry.kind].includes(entry.status)) throw new Error("Invalid journey entry");
    }
    const canonical=entries.map(entry=>({
      id:entry.id,type:entry.kind==="extended"?"extendedSubtask":entry.kind,
      source:`legacy${entry.kind[0].toUpperCase()}${entry.kind.slice(1)}`,
      ...(entry.kind==="extended"?{parentId:"legacyParent"}:{}),date:entry.date,
      status:entry.status==="done"?"completed":entry.status==="pending"?"incomplete":entry.status
    }));
    let aggregated;
    try { aggregated=aggregate(canonical,{type:"custom",start,end,asOf:today,timeZone:"UTC"}); }
    catch(error) {
      if(error.message==="Conflicting progress entry") throw new Error("Conflicting journey entry");
      throw error;
    }
    return Object.fromEntries(Object.keys(statuses).map(kind=>{
      const type=kind==="extended"?"extendedSubtask":kind;
      const stats=aggregated.byType[type]||emptyStats();
      const evidence=stats.evidence.map(entry=>({
        kind,id:entry.id,date:entry.date,
        status:entry.status==="completed"?"done":entry.status==="incomplete"?(kind==="habit"?"incomplete":"pending"):entry.status
      }));
      return [kind,{
        complete:stats.completed,eligible:stats.eligible,remaining:stats.incomplete,
        deferred:stats.deferred,cancelled:stats.cancelled,unrecorded:stats.unrecorded,
        exempt:stats.exempt,ratio:stats.ratio,evidence
      }];
    }));
  }
  function emptyStats() {
    return {completed:0,incomplete:0,eligible:0,ratio:null,cancelled:0,deferred:0,unrecorded:0,exempt:0,evidence:[]};
  }
  function summarizeLoadedDays(days,period) {
    if(!Array.isArray(days)) throw new Error("Invalid days");
    const categories={tasks:[],traditionalHabits:[]}, loaded=new Set();
    for(const day of days) {
      if(!day||!globalThis.MihwerExtendedValidation.isDate(day.date)||!Array.isArray(day.stations)) throw new Error("Invalid day");
      if(day.date>=period.start&&day.date<=period.end&&day.date<=period.today) loaded.add(day.date);
      for(const station of day.stations) {
        if(!station||!Array.isArray(station.tasks)) throw new Error("Invalid station");
        const category=station.habit?"traditionalHabits":"tasks";
        for(const task of station.tasks) categories[category].push({kind:"task",id:task.id,date:day.date,status:task.status});
      }
    }
    return {loadedDays:loaded.size,tasks:summarizeJourney(categories.tasks,period).task,traditionalHabits:summarizeJourney(categories.traditionalHabits,period).task};
  }
  return {aggregate,summarize,summarizeJourney,summarizeLoadedDays};
})();
