"use strict";

globalThis.MihwerProgressHeatmap = (() => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validDate = value => {
    if(typeof value!=="string"||!datePattern.test(value))return false;
    const date=new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  };
  const addDays=(date,amount)=>{
    const result=new Date(`${date}T12:00:00Z`);
    result.setUTCDate(result.getUTCDate()+amount);
    return result.toISOString().slice(0,10);
  };
  const copy={
    ar:{
      title:"إنجاز آخر 30 يوماً",subtitle:"المهام والعادات والأنشطة والإنجازات",
      serverTasksHabits:"حالة المهام الحالية حسب تاريخها وسجلات العادات؛ الأنشطة غير متصلة بعد.",
      serverTasks:"حالة المهام الحالية حسب تاريخها؛ بقية المصادر غير متاحة أو غير متصلة.",
      total:"إنجاز",completed:"مكتمل",habits:"العادات",tasks:"المهام",activities:"الأنشطة",
      legend:["٢٥٪ أو أقل","٢٦–٥٠٪","٥١–٧٥٪","أكثر من ٧٥٪"],noData:"لا توجد بيانات",
      dayRecord:"سجل اليوم",back:"الإعدادات",achievement:"إنجاز",items:"عناصر",
      noItems:"لا توجد عناصر مسجلة لهذا اليوم.",activitiesLog:"سجل النشاط",
      noEvents:"لا توجد أحداث مسجلة لهذا اليوم.",done:"مكتمل",open:"غير مكتمل",
      exempt:"مستثنى",percent:"نسبة الإنجاز",streak:"خلال 30 يوماً"
    },
    en:{
      title:"Last 30 days",subtitle:"Tasks, habits, activities and achievements",
      serverTasksHabits:"Current task status by task date and recorded habits; activities are not connected yet.",
      serverTasks:"Current task status by task date; other sources are unavailable or not connected yet.",
      total:"Achievements",completed:"Completed",habits:"Habits",tasks:"Tasks",activities:"Activities",
      legend:["25% or less","26–50%","51–75%","Over 75%"],noData:"No data",
      dayRecord:"Daily record",back:"Settings",achievement:"Achievements",items:"items",
      noItems:"No items recorded for this day.",activitiesLog:"Activity log",
      noEvents:"No events recorded for this day.",done:"Completed",open:"Incomplete",
      exempt:"Exempt",percent:"Completion rate",streak:"Over 30 days"
    }
  };
  const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const text=(value,language)=>Array.isArray(value)?String(value[language==="ar"?0:1]??value[0]??""):String(value??"");
  function colorFor(percent,total){
    if(!total)return "none";
    if(percent<=25)return "low";
    if(percent<=50)return "mid";
    if(percent<=75)return "high";
    return "full";
  }
  function build({today,days=[],extendedTasks=[],habits=[]}){
    if(!validDate(today)||!Array.isArray(days)||!Array.isArray(extendedTasks)||!Array.isArray(habits))throw new Error("Invalid heatmap input");
    const start=addDays(today,-29),byDate=new Map();
    for(let offset=0;offset<30;offset++){
      const date=addDays(start,offset);
      byDate.set(date,{date,entries:[],completed:0,total:0,tasks:0,habits:0,activities:0});
    }
    const add=(date,category,id,name,completed)=>{
      if(!byDate.has(date)||typeof id!=="string"||!id||typeof completed!=="boolean")return;
      const record=byDate.get(date);
      record.entries.push({id,category,name,completed});
      record.total++;
      record[category]++;
      if(completed)record.completed++;
    };
    const uniqueDays=new Set();
    for(const day of days){
      if(!day||!validDate(day.date)||!Array.isArray(day.stations||[])||!Array.isArray(day.activities||[]))throw new Error("Invalid heatmap day");
      if(uniqueDays.has(day.date))throw new Error("Duplicate heatmap day");
      uniqueDays.add(day.date);
      for(const station of day.stations||[]){
        if(!station||!Array.isArray(station.tasks||[]))throw new Error("Invalid heatmap station");
        for(const task of station.tasks||[]){
          if(!task||task.archived||["cancelled","deferred"].includes(task.status))continue;
          if(!["done","pending","completed","incomplete"].includes(task.status))continue;
          add(day.date,station.habit?"habits":"tasks",task.id,task.name,["done","completed"].includes(task.status));
        }
      }
      for(const activity of day.activities||[]){
        if(!activity||["cancelled","archived"].includes(activity.status))continue;
        if(!["completed","scheduled","pending","incomplete"].includes(activity.status))continue;
        add(day.date,"activities",activity.id,activity.title,activity.status==="completed");
      }
    }
    for(const task of extendedTasks){
      if(!task||!Array.isArray(task.subtasks||[]))throw new Error("Invalid extended heatmap task");
      if(task.archived||task.status==="cancelled")continue;
      for(const subtask of task.subtasks||[]){
        if(!subtask||subtask.archived||subtask.status==="cancelled")continue;
        const completed=subtask.status==="completed"||subtask.done===true;
        const date=completed?subtask.completedDate:subtask.date;
        if(validDate(date))add(date,"tasks",subtask.id,subtask.name,completed);
      }
    }
    for(const habit of habits){
      if(!habit||typeof habit.id!=="string"||!habit.records||typeof habit.records!=="object"||Array.isArray(habit.records))throw new Error("Invalid heatmap habit");
      for(const [date,record] of Object.entries(habit.records)){
        if(!validDate(date)||!record||!["completed","incomplete"].includes(record.status))continue;
        add(date,"habits",habit.id,habit.name,record.status==="completed");
      }
    }
    const results=[...byDate.values()].map(day=>{
      const exactPercent=day.total?day.completed/day.total*100:null;
      const percent=exactPercent===null?null:Math.round(exactPercent);
      return {...day,percent,color:colorFor(exactPercent,day.total)};
    });
    const totals=results.reduce((sum,day)=>({
      completed:sum.completed+day.completed,total:sum.total+day.total,
      tasks:sum.tasks+day.tasks,habits:sum.habits+day.habits,activities:sum.activities+day.activities
    }),{completed:0,total:0,tasks:0,habits:0,activities:0});
    return {start,today,days:results,totals,percent:totals.total?Math.round(totals.completed/totals.total*100):null};
  }
  function render(model,language="ar"){
    const labels=copy[language]||copy.ar;
    const firstDay=language==="ar"?0:1;
    const lead=(new Date(`${model.start}T12:00:00Z`).getUTCDay()-firstDay+7)%7;
    const formatter=new Intl.DateTimeFormat(language==="ar"?"ar-SA-u-ca-gregory":"en-US",{weekday:"short",timeZone:"UTC"});
    const weekdayLabels=Array.from({length:7},(_,index)=>{
      const day=new Date(Date.UTC(2026,10,1+((firstDay+index)%7)));
      return `<span aria-hidden="true">${escape(formatter.format(day))}</span>`;
    }).join("");
    const cells=`${Array.from({length:lead},()=>'<span class="progress-heatmap-blank" aria-hidden="true"></span>').join("")}${model.days.map(day=>{
      const value=day.percent===null?labels.noData:`${day.percent}%`;
      const count=day.total?`${day.completed}/${day.total}`:labels.noData;
      const dateLocale=language==="ar"?"ar-SA-u-ca-gregory":"en-US";
      const dateLabel=new Intl.DateTimeFormat(dateLocale,{year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}).format(new Date(`${day.date}T12:00:00Z`));
      return `<button type="button" class="progress-heatmap-cell level-${day.color}" data-progress-day="${day.date}" aria-label="${escape(dateLabel)} · ${escape(value)} · ${escape(count)}" title="${escape(dateLabel)} · ${escape(value)}"><span>${escape(new Intl.DateTimeFormat(dateLocale,{day:"numeric",timeZone:"UTC"}).format(new Date(`${day.date}T12:00:00Z`)))}</span>${day.percent!==null?`<small>${day.percent}%</small>`:""}</button>`;
    }).join("")}`;
    const percent=model.percent===null?"—":`<span data-progress-count="${model.percent}">0</span>%`;
    return `<section class="progress-heatmap" aria-labelledby="progress-heatmap-title">
      <header class="progress-heatmap-head"><div><p class="eyebrow">${escape(labels.streak)}</p><h3 id="progress-heatmap-title">${escape(labels.title)}</h3><p>${escape(model.source==="server-tasks-habits"?labels.serverTasksHabits:model.source==="server-tasks"?labels.serverTasks:labels.subtitle)}</p></div><strong class="progress-heatmap-rate">${percent}</strong></header>
      <div class="progress-heatmap-summary" aria-label="${escape(labels.total)}"><span>${escape(labels.total)}</span><b><span data-progress-count="${model.totals.completed}">0</span><small> / ${model.totals.total}</small></b></div>
      <div class="progress-heatmap-grid" role="group" aria-label="${escape(labels.title)}"><div class="progress-heatmap-weekdays">${weekdayLabels}</div><div class="progress-heatmap-days" style="--heatmap-leading:${lead}">${cells}</div></div>
      <div class="progress-heatmap-legend">${labels.legend.map((item,index)=>`<span><i class="level-${["low","mid","high","full"][index]}"></i>${escape(item)}</span>`).join("")}<span><i class="level-none"></i>${escape(labels.noData)}</span></div>
    </section>`;
  }
  function renderDay(model,date,logEntries=[],language="ar"){
    const labels=copy[language]||copy.ar,day=model.days.find(item=>item.date===date);
    if(!day)throw new Error("Heatmap date is unavailable");
    if(!Array.isArray(logEntries))throw new Error("Invalid activity log entries");
    const dateLabel=new Intl.DateTimeFormat(language==="ar"?"ar-SA-u-ca-gregory":"en-US",{year:"numeric",month:"long",day:"numeric",weekday:"long",timeZone:"UTC"}).format(new Date(`${date}T12:00:00Z`));
    const categoryLabels={tasks:labels.tasks,habits:labels.habits,activities:labels.activities};
    const groups=["tasks","habits","activities"].map(category=>{
      const entries=day.entries.filter(entry=>entry.category===category);
      if(!entries.length)return "";
      return `<section class="progress-record-group"><h3>${escape(categoryLabels[category])}<b>${entries.length}</b></h3><ul>${entries.map(entry=>`<li class="${entry.completed?"is-complete":"is-open"}"><span class="progress-record-status" aria-hidden="true">${entry.completed?"✓":"·"}</span><span>${escape(text(entry.name,language))}</span><small>${escape(labels[entry.completed?"done":"open"])}</small></li>`).join("")}</ul></section>`;
    }).join("");
    const events=[...logEntries].filter(entry=>entry&&entry.date===date).sort((a,b)=>a.at-b.at);
    const logMarkup=events.length?`<ul class="progress-event-list">${events.map(entry=>{
      const time=Number.isFinite(entry.at)?new Intl.DateTimeFormat(language==="ar"?"ar":"en-US",{hour:"numeric",minute:"2-digit"}).format(entry.at):"";
      const detail=entry.detail?` · ${escape(entry.detail)}`:"";
      const action=entry.action==="completed"?labels.done:entry.action==="added"?(language==="ar"?"أُضيف":"Added"):entry.action==="updated"?(language==="ar"?"عُدّل":"Updated"):entry.action;
      return `<li><time>${escape(time)}</time><span>${escape(action)}${detail}</span></li>`;
    }).join("")}</ul>`:`<p class="progress-record-empty">${escape(labels.noEvents)}</p>`;
    const rate=day.percent===null?"—":`<span data-progress-count="${day.percent}">0</span>%`;
    const ratio=day.percent===null?0:day.percent;
    const totalLabel=language==="ar"?"العناصر المسجلة":"Recorded items";
    return `<section class="progress-day-record" aria-labelledby="progress-day-title">
      <button type="button" class="progress-record-back" data-utility="settings">‹ ${escape(labels.back)}</button>
      <header class="progress-record-head"><div><p class="eyebrow">${escape(labels.dayRecord)}</p><h2 id="progress-day-title">${escape(dateLabel)}</h2></div><div class="progress-record-ring" style="--record-progress:${ratio}"><strong>${rate}</strong></div></header>
      <div class="progress-record-metrics"><article><small>${escape(labels.achievement)}</small><b data-progress-count="${day.completed}">0</b></article><article><small>${escape(totalLabel)}</small><b data-progress-count="${day.total}">0</b></article><article><small>${escape(labels.tasks)}</small><b data-progress-count="${day.tasks}">0</b></article><article><small>${escape(labels.habits)}</small><b data-progress-count="${day.habits}">0</b></article></div>
      ${day.entries.length?`<div class="progress-record-groups">${groups}</div>`:`<p class="progress-record-empty">${escape(labels.noItems)}</p>`}
      <details class="progress-record-activity"><summary>${escape(labels.activitiesLog)}<b>${events.length}</b></summary>${logMarkup}</details>
    </section>`;
  }
  function animate(root=document,language="ar"){
    const reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll("[data-progress-count]").forEach(node=>{
      const target=Number(node.dataset.progressCount);
      if(!Number.isFinite(target)||target<0){throw new Error("Invalid progress count");}
      const formatter=new Intl.NumberFormat(language==="ar"?"ar-SA":"en-US");
      if(reduced||target===0){node.textContent=formatter.format(target);return;}
      const start=globalThis.performance.now(),duration=620;
      const frame=now=>{
        if(!node.isConnected)return;
        const ratio=Math.min(1,(now-start)/duration);
        const eased=1-Math.pow(1-ratio,3);
        node.textContent=formatter.format(Math.round(target*eased));
        if(ratio<1)globalThis.requestAnimationFrame(frame);
      };
      globalThis.requestAnimationFrame(frame);
    });
  }
  return {build,render,renderDay,colorFor,animate};
})();
