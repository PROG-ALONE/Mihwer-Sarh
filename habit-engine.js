"use strict";
globalThis.MihwerHabitEngine = (() => {
  const {isDate} = globalThis.MihwerExtendedValidation;
  function validate(habit) {
    if (!habit || typeof habit.name!=="string" || !habit.name.trim() || habit.name.length>100 ||
        !isDate(habit.start) || (habit.end!=="" && (!isDate(habit.end)||habit.end<habit.start)) ||
        !["daily","weekly"].includes(habit.frequency) || !Array.isArray(habit.days) ||
        (habit.frequency==="weekly" && (!habit.days.length || habit.days.some(day=>!Number.isInteger(day)||day<0||day>6))) ||
        !Number.isFinite(habit.target) || habit.target<=0 || typeof habit.unit!=="string" || !habit.unit.trim() || habit.unit.length>30) throw new Error("Invalid habit");
    return habit;
  }
  function definitionAt(habit,date) {
    validate(habit);
    if(!isDate(date)) throw new Error("Invalid date");
    const revisions=habit.revisions||[];
    if(!Array.isArray(revisions)) throw new Error("Invalid revisions");
    let result=habit, previous="";
    for(const revision of revisions) {
      if(!revision||!isDate(revision.effective)||revision.effective<=previous) throw new Error("Invalid revision");
      const {effective,frequency,days,target,unit}=revision;
      const next={...habit,frequency,days,target,unit};
      validate(next);
      if(effective<=date) result=next;
      previous=effective;
    }
    return result;
  }
  function revise(habit,changes,today) {
    if(!isDate(today)) throw new Error("Invalid date");
    const tomorrow=new Date(`${today}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
    const effective=tomorrow.toISOString().slice(0,10);
    if(!isDate(effective)) throw new Error("Invalid effective date");
    const current=definitionAt(habit,effective);
    const next={...current,frequency:changes.frequency,days:changes.days,target:changes.target,unit:changes.unit};
    validate(next);
    const revision={effective,frequency:next.frequency,days:[...next.days],target:next.target,unit:next.unit};
    const revisions=(habit.revisions||[]).filter(item=>item.effective!==effective);
    if(revisions.some(item=>item.effective>effective)) throw new Error("Future revision exists");
    return {...habit,revisions:[...revisions,revision]};
  }
  function scheduled(habit,date) {
    const definition=definitionAt(habit,date);
    if(date<definition.start||(definition.end&&date>definition.end)) return false;
    return definition.frequency==="daily" || definition.days.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
  }
  function record(habit,date,today,status,amount) {
    if(!isDate(today)||!scheduled(habit,date)||date>today) throw new Error("Day unavailable");
    if(!["completed","incomplete","exempt"].includes(status)) throw new Error("Invalid status");
    if(status!=="exempt"&&(!Number.isFinite(amount)||amount<0)) throw new Error("Invalid amount");
    const definition=definitionAt(habit,date);
    if(status==="completed"&&amount<definition.target) throw new Error("Target not met");
    if(status==="incomplete"&&amount>=definition.target) throw new Error("Target reached");
    return {...habit,records:{...(habit.records||{}),[date]:{status,amount:status==="exempt"?null:amount}}};
  }
  function unrecord(habit,date) {
    validate(habit);
    if(!isDate(date)||!scheduled(habit,date)) throw new Error("Day unavailable");
    if(!habit.records||!Object.hasOwn(habit.records,date)) throw new Error("Habit record not found");
    const records={...habit.records};
    delete records[date];
    return {...habit,records};
  }
  function adjust(habit,date,today,direction) {
    validate(habit);
    if(!isDate(today)||!scheduled(habit,date)||date>today) throw new Error("Day unavailable");
    if(direction!==-1&&direction!==1) throw new Error("Invalid adjustment");
    const definition=definitionAt(habit,date),entry=habit.records?.[date];
    const amount=entry?.status==="exempt"?0:entry?.amount??0;
    const step=Math.min(1,definition.target);
    const nextAmount=Math.max(0,Math.min(definition.target,amount+direction*step));
    return record(habit,date,today,nextAmount>=definition.target?"completed":"incomplete",nextAmount);
  }
  function summary(habit,dates,today) {
    if(!isDate(today)||!Array.isArray(dates)||dates.some(date=>!isDate(date))) throw new Error("Invalid period");
    const observed=[...new Set(dates)].filter(date=>date<=today&&scheduled(habit,date)).map(date=>({date,record:habit.records?.[date]}));
    const entries=observed.map(item=>({kind:"habit",id:habit.id||"habit",date:item.date,status:item.record?.status==="completed"?"done":item.record?.status||"unrecorded"}));
    const result=globalThis.MihwerProgressEngine.summarizeJourney(entries,{start:"0001-01-01",end:today,today}).habit;
    return {complete:result.complete,incomplete:result.remaining,exempt:result.exempt,unrecorded:result.unrecorded,ratio:result.ratio};
  }
  function periodSummary(habits,{start,end,today}) {
    if(!Array.isArray(habits)||!isDate(start)||!isDate(end)||!isDate(today)||start>end) throw new Error("Invalid habit period");
    const last=end<today?end:today, entries=[], ids=new Set();
    for(const habit of habits) {
      validate(habit);
      if(typeof habit.id!=="string"||!habit.id||ids.has(habit.id)) throw new Error("Invalid or duplicate habit id");
      ids.add(habit.id);
      for(const date of Object.keys(habit.records||{})) {
        if(!isDate(date)) throw new Error("Invalid record date");
        if(date<start||date>last) continue;
        if(!scheduled(habit,date)) throw new Error("Record on unscheduled date");
        const status=habit.records[date]?.status;
        if(!["completed","incomplete","exempt"].includes(status)) throw new Error("Invalid record");
        entries.push({kind:"habit",id:habit.id,date,status:status==="completed"?"done":status});
      }
    }
    return globalThis.MihwerProgressEngine.summarizeJourney(entries,{start,end,today}).habit;
  }
  return {validate,definitionAt,revise,scheduled,record,unrecord,adjust,summary,periodSummary};
})();
