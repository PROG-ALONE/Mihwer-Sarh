"use strict";

const systemLogCategories={
  tasks:["المهام","Tasks"],
  habits:["العادات","Habits"],
  extended:["المهام الممتدة","Extended tasks"],
  activities:["أنشطة اليوم","Daily activities"],
  prayer:["الصلاة","Prayer"],
  paths:["المسارات","Paths"],
  shopping:["المشتريات","Shopping"],
  subscriptions:["الاشتراكات","Subscriptions"],
  daily:["اليوم والنوم","Daily routine and sleep"]
};
const systemLogActions={
  added:["أُضيف","Added"],
  completed:["أُنجز","Completed"],
  reopened:["أُعيد فتحه","Reopened"],
  updated:["عُدّل","Updated"],
  archived:["أُرشف","Archived"],
  restored:["استُعيد","Restored"],
  deleted:["حُذف","Deleted"],
  cancelled:["أُلغي","Cancelled"],
  recorded:["سُجّل","Recorded"],
  undone:["أُلغي تسجيله","Record undone"],
  rescheduled:["أُعيدت جدولته","Rescheduled"],
  started:["بدأ","Started"],
  stopped:["توقف","Stopped"]
};
const systemLogEntries=[];
let systemLogNextId=0;
const systemLogText=value=>value[language==="ar"?0:1];
const systemLogCount=count=>language!=="ar"?`${count} events`:count===1?"حدث واحد":count===2?"حدثان":count<=10?`${count} أحداث`:`${count} حدثًا`;
function systemLogRecord(category,action,detail="",date=selectedDate){
  if(!Object.hasOwn(systemLogCategories,category)||!Object.hasOwn(systemLogActions,action)||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
  systemLogEntries.push({id:`system-log-${++systemLogNextId}`,category,action,detail:String(detail||"").trim(),date,at:Date.now()});
}
function systemLogView(){
  const grouped=new Map();
  for(const entry of [...systemLogEntries].sort((a,b)=>b.date.localeCompare(a.date)||b.at-a.at)){
    if(!grouped.has(entry.date))grouped.set(entry.date,new Map());
    const categories=grouped.get(entry.date);
    if(!categories.has(entry.category))categories.set(entry.category,[]);
    categories.get(entry.category).push(entry);
  }
  if(!grouped.size)return `<p class="organizer-log-empty">${language==="ar"?"لا توجد أحداث مسجلة بعد. ستظهر هنا أنشطة أقسام النظام عند استخدامها.":"No activity recorded yet. Activity from the system sections will appear here as you use them."}</p>`;
  const timeFormatter=new Intl.DateTimeFormat(language==="ar"?"ar":"en",{hour:"numeric",minute:"2-digit"});
  return `<div class="system-log-days">${[...grouped].map(([date,categories],dayIndex)=>`<details class="system-log-day" ${dayIndex===0?"open":""}><summary><bdi dir="ltr">${esc(date)}</bdi><span>${systemLogCount([...categories.values()].reduce((total,entries)=>total+entries.length,0))}</span></summary>${[...categories].map(([category,entries])=>`<section class="system-log-category system-log-${category}"><h3>${systemLogText(systemLogCategories[category])}<b>${entries.length}</b></h3><ul>${entries.map(entry=>`<li><time datetime="${new Date(entry.at).toISOString()}">${timeFormatter.format(entry.at)}</time><span>${systemLogText(systemLogActions[entry.action])}${entry.detail?` · ${esc(entry.detail)}`:""}</span></li>`).join("")}</ul></section>`).join("")}</details>`).join("")}</div>`;
}
globalThis.MihwerSystemLog={
  entries:systemLogEntries,
  record:systemLogRecord,
  view:systemLogView,
  entriesForDate:date=>systemLogEntries.filter(entry=>entry.date===date)
};
