"use strict";
const recurringHabits=[];
globalThis.MihwerRecurringHabits=recurringHabits;
const habitLabels={
  title:["متابعة اليوم","Daily check-in"], create:["إضافة عادة","Add habit"],
  name:["اسم العادة","Habit name"], path:["المسار","Path"], frequency:["التكرار","Frequency"], daily:["يومياً","Daily"], weekly:["أسبوعياً في الأيام المحددة","Weekly on selected days"],
  days:["أيام الأسبوع للتكرار الأسبوعي","Weekdays for weekly recurrence"], start:["تاريخ البداية","Start date"], end:["تاريخ النهاية الاختياري","Optional end date"], target:["الهدف","Target"], unit:["الوحدة","Unit"],
  save:["حفظ","Save"], undoRecord:["إلغاء تسجيل اليوم","Undo today's record"], today:["تسجيل اليوم المختار","Record selected day"], quantity:["الكمية المنجزة","Amount achieved"], status:["الحالة","Status"], complete:["مكتملة","Completed"], incomplete:["غير مكتملة","Incomplete"], exempt:["مستثناة","Exempt"], unknown:["لم تسجل","Not recorded"], future:["يوم مستقبلي؛ لا يمكن تسجيله بعد","Future day; recording is unavailable"],
  scheduled:["مجدولة","Scheduled"], noSchedule:["غير مجدولة","Not scheduled"], error:["تعذر الحفظ. تحقق من الأيام والهدف والوحدة والكمية والتاريخ.","Could not save. Check the weekdays, target, unit, amount and date."],
  separate:["هذه العادات التجريبية منفصلة حالياً عن ملخص المهام والعادات أعلاه.","These experimental habits are currently separate from the task and habit summary above."],
  evidence:["المكتمل ÷ الأيام المسجلة المكتملة وغير المكتملة؛ الأيام المستثناة وغير المسجلة والمستقبلية مستبعدة.","Completed ÷ recorded completed and incomplete days; exempt, unrecorded and future days are excluded."],
  weeklySummary:["آخر ٧ أيام","Last 7 days"], monthlySummary:["آخر ٣٠ يوماً","Last 30 days"], noRate:["لا تكفي البيانات لحساب نسبة","Not enough data for a rate"], records:["مسجلة","recorded"], unrecorded:["غير مسجلة","unrecorded"],
  manage:["كل العادات المتكررة","All recurring habits"],
  edit:["تعديل العادة","Edit habit"], editNote:["يبدأ التكرار والهدف والوحدة الجديدة غداً؛ تبقى الأيام السابقة واليوم وفق إعداداتها السابقة.","The new schedule, target and unit start tomorrow; today and earlier days keep their previous settings."],
  effective:["تسري التعديلات من","Changes take effect on"],
  recordOptions:["تعديل التسجيل","Adjust today's record"], historySettings:["السجل والإعدادات","History and settings"],
  quickRecord:["تسجيل الإنجاز","Mark complete"], recordedToday:["مكتملة اليوم","Completed today"],
  weekHabit:["العادات المتكررة المسجلة","Recurring habits recorded"], weekHabitNote:["العادات المتكررة: المكتملة من المسجلة المكتملة وغير المكتملة؛ غير المسجلة والمستثناة والمستقبل مستبعدة.","Recurring habits: completed out of recorded completed and incomplete; unrecorded, exempt and future days are excluded."],
  decrease:["تقليل الكمية","Decrease amount"], increase:["زيادة الكمية","Increase amount"],
  noneYet:["لا توجد عادة كمية بعد","No tracked habits yet"],
  archived:["العادات المؤرشفة","Archived habits"], archiveUndo:["أُرشفت العادة؛ احتُفظ بسجلها.","Habit archived; its history is preserved."], restore:["استعادة","Restore"]
};
const ht=key=>habitLabels[key][language==="ar"?0:1];
function habitDates(end,count) {
  const date=new Date(`${end}T12:00:00Z`);
  return Array.from({length:count},(_,i)=>{const d=new Date(date);d.setUTCDate(date.getUTCDate()-i);return d.toISOString().slice(0,10);});
}
function habitNextDay(date) {
  const next=new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate()+1);
  return next.toISOString().slice(0,10);
}
function habitWeekdays(days=[]) {
  return Array.from({length:7},(_,i)=>{const date=new Date(Date.UTC(2026,10,15+i));return `<label><input type="checkbox" name="days" value="${i}" ${days.includes(i)?"checked":""}> ${esc(new Intl.DateTimeFormat(language==="ar"?"ar":"en",{weekday:"short",timeZone:"UTC"}).format(date))}</label>`;}).join("");
}
function habitWeekStrip(date) {
  const selected=new Date(`${date}T12:00:00Z`);
  selected.setUTCDate(selected.getUTCDate()-selected.getUTCDay());
  return `<nav class="habit-date-strip" aria-label="${ht("title")}">${Array.from({length:7},(_,index)=>{
    const day=new Date(selected);
    day.setUTCDate(selected.getUTCDate()+index);
    const value=day.toISOString().slice(0,10),locale=language==="ar"?"ar":"en";
    const weekday=new Intl.DateTimeFormat(locale,{weekday:"short",timeZone:"UTC"}).format(day);
    const number=new Intl.DateTimeFormat(locale,{day:"numeric",timeZone:"UTC"}).format(day);
    const label=new Intl.DateTimeFormat(locale,{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}).format(day);
    return `<button type="button" class="habit-date ${value===date?"is-selected":""}" data-period-date="${value}" data-period-screen="activities" aria-label="${esc(label)}" aria-pressed="${value===date}"><span>${esc(weekday)}</span><strong>${esc(number)}</strong></button>`;
  }).join("")}</nav>`;
}
function recurringSection(pathId=null) {
  const scoped=recurringHabits.filter(habit=>!pathId||habit.pathId===pathId);
  const all=scoped.filter(habit=>!habit.archived),archived=scoped.filter(habit=>habit.archived);
  const habits=all.filter(habit=>MihwerHabitEngine.scheduled(habit,selectedDate));
  const card=habit=>{
    const record=habit.records[selectedDate],definition=MihwerHabitEngine.definitionAt(habit,selectedDate);
    const status=!MihwerHabitEngine.scheduled(habit,selectedDate)?ht("noSchedule"):selectedDate>zoneDate()?ht("future"):record?ht(record.status==="completed"?"complete":record.status):ht("unknown");
    const canRecord=selectedDate<=zoneDate()&&MihwerHabitEngine.scheduled(habit,selectedDate);
    const amount=record?.amount??0;
    const percent=Math.min(100,Math.round(amount/definition.target*100));
    const progressStyle=`style="--habit-value:${percent}%"`;
    const icon=lifePaths.find(path=>path.id===habit.pathId)?.icon||"◉";
    const quickAction=canRecord?record?.status==="completed"
      ?`<button type="button" class="habit-progress is-complete" ${progressStyle} data-habit-unrecord="${esc(habit.id)}" data-record-date="${esc(selectedDate)}" aria-label="${ht("undoRecord")}" title="${ht("undoRecord")}"><span dir="ltr">${percent}%</span></button>`
      :record?`<button type="button" class="habit-progress" ${progressStyle} data-habit-open="${esc(habit.id)}" aria-label="${ht("recordOptions")}" title="${ht("recordOptions")}"><span dir="ltr">${percent}%</span></button>`
      :`<button type="button" class="habit-progress" ${progressStyle} data-habit-quick-complete="${esc(habit.id)}" data-record-date="${esc(selectedDate)}" aria-label="${ht("quickRecord")}" title="${ht("quickRecord")}"><span dir="ltr">${percent}%</span></button>`
      :`<span class="habit-progress is-disabled" ${progressStyle}><span dir="ltr">${percent}%</span></span>`;
    const controls=canRecord?`<div class="habit-amount-controls"><button type="button" data-habit-adjust="${esc(habit.id)}" data-adjustment="-1" data-record-date="${esc(selectedDate)}" aria-label="${ht("decrease")}" ${amount<=0?"disabled":""}>−</button><button type="button" data-habit-adjust="${esc(habit.id)}" data-adjustment="1" data-record-date="${esc(selectedDate)}" aria-label="${ht("increase")}" ${amount>=definition.target?"disabled":""}>＋</button></div>`:"";
    return `<article class="habit-checkin-card" data-habit-swipe="${esc(habit.id)}"><button type="button" class="habit-checkin-title" data-habit-open="${esc(habit.id)}"><span class="habit-symbol" aria-hidden="true">${esc(icon)}</span><span><strong>${esc(habit.name)}</strong><small>${esc(status)} · <bdi dir="ltr">${esc(amount)} / ${definition.target} ${esc(definition.unit)}</bdi></small></span></button>${quickAction}${controls}<p class="habit-error" role="alert"></p></article>`;
  };
  const completed=habits.filter(habit=>habit.records[selectedDate]?.status==="completed").length,percent=habits.length?Math.round(completed/habits.length*100):0;
  return `<section class="activity-group recurring-habits ${all.length?"":"recurring-habits-empty"}"><div class="habit-section-head"><div><h3>${ht("title")}</h3><time dir="ltr">${esc(selectedDate)}</time></div>${habits.length?`<span class="habit-overview-ring" style="--habit-value:${percent}%" role="img" aria-label="${completed} / ${habits.length}">${completed}/${habits.length}</span>`:""}</div>${pathId?habitWeekStrip(selectedDate):""}<div class="habit-checkin-grid ${habits.length===1?"is-single":""}">${habits.length?habits.map(card).join(""):`<p class="muted">${all.length?ht("noSchedule"):ht("noneYet")}</p>`}</div><button type="button" class="habit-add" data-habit-create-open><span aria-hidden="true">＋</span>${ht("create")}</button>${all.length?`<details class="utility-details"><summary>${ht("manage")} (${all.length})</summary><div class="habit-checkin-grid">${all.map(card).join("")}</div></details>`:""}${archived.length?`<details class="utility-details archived-habits"><summary>${ht("archived")} (${archived.length})</summary><div class="habit-archived-list">${archived.map(habit=>`<div><span>${esc(habit.name)}</span><button type="button" class="secondary" data-habit-restore="${esc(habit.id)}">${ht("restore")}</button></div>`).join("")}</div></details>`:""}</section>`;
}
function recurringWeekDetail(date) {
  const habits=recurringHabits.filter(habit=>!habit.archived&&MihwerHabitEngine.scheduled(habit,date));
  if(!habits.length||date>zoneDate())return "";
  const entries=habits.map(habit=>{const record=habit.records[date];return {kind:"habit",id:habit.id,date,status:record?.status==="completed"?"done":record?.status||"unrecorded"};});
  const stats=MihwerProgressEngine.summarizeJourney(entries,{start:date,end:date,today:zoneDate()}).habit;
  return `<small>${ht("weekHabit")}: ${stats.ratio===null?ht("noRate"):`<b dir="ltr">${stats.complete}/${stats.eligible} · ${Math.round(stats.ratio*100)}%</b>`} · ${stats.unrecorded} ${ht("unrecorded")}</small>`;
}
function recurringPeriodSummary(start,end) {
  const result=MihwerHabitEngine.periodSummary(recurringHabits.filter(habit=>!habit.archived),{start,end,today:zoneDate()});
  const value=result.ratio===null?ht("noRate"):`${result.complete}/${result.eligible} · ${Math.round(result.ratio*100)}%`;
  return `<p data-recurring-period>${ht("weekHabit")}: ${result.ratio===null?esc(value):`<b dir="ltr">${esc(value)}</b>`}</p><p class="muted">${ht("evidence")}</p>`;
}
let habitSwipe=null,suppressHabitClick=false,habitArchiveNoticeTimer=0;
function archiveRecurringHabit(id) {
  const habit=recurringHabits.find(item=>item.id===id&&!item.archived);
  if(!habit)return;
  habit.archived=true;
  globalThis.MihwerSystemLog?.record("habits","archived",habit.name);
  render();
  let notice=document.querySelector("#habit-archive-notice");
  if(!notice){notice=document.createElement("div");notice.id="habit-archive-notice";notice.className="task-archive-notice";notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");document.body.append(notice);}
  notice.innerHTML=`<span>${esc(habit.name)} · ${ht("archiveUndo")}</span><button type="button" class="secondary" data-habit-restore="${esc(id)}">${ht("restore")}</button>`;
  notice.hidden=false;
  clearTimeout(habitArchiveNoticeTimer);
  habitArchiveNoticeTimer=setTimeout(()=>{notice.hidden=true;},7000);
}
document.addEventListener("pointerdown",event=>{
  if(!(event.target instanceof Element))return;
  const card=event.target.closest(".activities-page .habit-checkin-card[data-habit-swipe]");
  if(!card)return;
  habitSwipe={card,pointerId:event.pointerId,x:event.clientX,y:event.clientY};
},true);
document.addEventListener("pointermove",event=>{
  if(!habitSwipe||habitSwipe.pointerId!==event.pointerId)return;
  const dx=event.clientX-habitSwipe.x,dy=event.clientY-habitSwipe.y;
  if(Math.abs(dy)>Math.abs(dx)||dx<=0)return;
  habitSwipe.card.classList.add("is-swiping");
  habitSwipe.card.style.setProperty("--swipe-offset",`${Math.min(dx,88)}px`);
},true);
document.addEventListener("pointerup",event=>{
  if(!habitSwipe||habitSwipe.pointerId!==event.pointerId)return;
  const gesture=habitSwipe;habitSwipe=null;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  gesture.card.classList.remove("is-swiping");
  gesture.card.style.removeProperty("--swipe-offset");
  if(!gesture.card.isConnected)return;
  if(Math.abs(dx)>=20||Math.abs(dy)>=20){
    suppressHabitClick=true;
    setTimeout(()=>{suppressHabitClick=false;},0);
  }
  if(dx<64||dx<Math.abs(dy)*1.25)return;
  archiveRecurringHabit(gesture.card.dataset.habitSwipe);
},true);
document.addEventListener("pointercancel",()=>{
  habitSwipe?.card.classList.remove("is-swiping");
  habitSwipe?.card.style.removeProperty("--swipe-offset");
  habitSwipe=null;
},true);
document.addEventListener("click",event=>{
  if(!suppressHabitClick)return;
  event.preventDefault();event.stopImmediatePropagation();suppressHabitClick=false;
},true);
function habitCreate() {
  dialogTitle.textContent=ht("create");
  const weekdays=habitWeekdays();
  dialogContent.innerHTML=`<form data-habit-create data-record-date="${esc(selectedDate)}"><label class="field">${ht("name")}<input name="name" maxlength="100" required></label><label class="field">${ht("path")}<select name="path">${lifePaths.map(path=>`<option value="${esc(path.id)}">${esc(pathName(path.id))}</option>`).join("")}</select></label><label class="field">${ht("frequency")}<select name="frequency"><option value="daily">${ht("daily")}</option><option value="weekly">${ht("weekly")}</option></select></label><fieldset class="prayer-units"><legend>${ht("days")}</legend>${weekdays}</fieldset><div class="dialog-fields"><label class="field">${ht("start")}<input type="date" name="start" value="${esc(selectedDate)}" required></label><label class="field">${ht("end")}<input type="date" name="end"></label><label class="field">${ht("target")}<input type="number" name="target" min="0.01" step="any" value="1" required></label><label class="field">${ht("unit")}<input name="unit" maxlength="30" required></label></div><p role="alert" class="habit-error"></p><button class="primary" type="submit">${ht("save")}</button></form><p class="muted">${lt("temporary")}</p>`;
  if(!dialog.open)dialog.showModal();
}
function habitDetail(id) {
  const habit=recurringHabits.find(item=>item.id===id);if(!habit)return;
  const rec=habit.records[selectedDate],definition=MihwerHabitEngine.definitionAt(habit,selectedDate),effective=habitNextDay(zoneDate()),next=MihwerHabitEngine.definitionAt(habit,effective),available=MihwerHabitEngine.scheduled(habit,selectedDate)&&selectedDate<=zoneDate();
  const summary=(count,label)=>{const s=MihwerHabitEngine.summary(habit,habitDates(selectedDate,count),zoneDate());return `<div class="summary-card"><small>${ht(label)}</small><strong>${s.ratio===null?ht("noRate"):`${Math.round(s.ratio*100)}% · ${s.complete}/${s.complete+s.incomplete}`}</strong><small>${s.unrecorded} ${ht("unrecorded")}</small></div>`;};
  dialogTitle.textContent=habit.name;
  const recordStatus=rec?ht(rec.status==="completed"?"complete":rec.status):ht("unknown");
  dialogContent.innerHTML=`<section class="habit-detail-summary"><small>${esc(pathName(habit.pathId))} · ${ht(definition.frequency)}</small><strong>${definition.target} ${esc(definition.unit)}</strong><span>${recordStatus} · <b dir="ltr">${esc(selectedDate)}</b></span></section>${available?`<div class="habit-quick-action">${rec?.status==="completed"?`<span class="habit-recorded">${ht("recordedToday")}</span><button type="button" class="secondary" data-habit-unrecord="${esc(id)}" data-record-date="${esc(selectedDate)}">${ht("undoRecord")}</button>`:`<button type="button" class="primary" data-habit-quick-complete="${esc(id)}" data-record-date="${esc(selectedDate)}">${ht("quickRecord")}</button>`}</div><p role="alert" class="habit-error" data-habit-record-error></p><details class="utility-details"><summary>${ht("recordOptions")}</summary><form data-habit-record="${esc(id)}" data-record-date="${esc(selectedDate)}"><label class="field">${ht("status")}<select name="status"><option value="completed" ${rec?.status==="completed"?"selected":""}>${ht("complete")}</option><option value="incomplete" ${rec?.status==="incomplete"?"selected":""}>${ht("incomplete")}</option><option value="exempt" ${rec?.status==="exempt"?"selected":""}>${ht("exempt")}</option></select></label><label class="field">${ht("quantity")}<input name="amount" type="number" min="0" step="any" value="${rec?.amount??0}"></label><p role="alert" class="habit-error"></p><button class="secondary" type="submit">${ht("save")}</button></form></details>`:`<p class="muted">${selectedDate>zoneDate()?ht("future"):ht("noSchedule")}</p>`}<details class="utility-details"><summary>${ht("historySettings")}</summary><div class="date-cards">${summary(7,"weeklySummary")}${summary(30,"monthlySummary")}</div><details class="utility-details"><summary>${pt("evidence")}</summary><p>${ht("evidence")}</p></details><details class="utility-details"><summary>${ht("edit")}</summary><p>${ht("editNote")} ${ht("effective")}: <b dir="ltr">${esc(effective)}</b></p><form data-habit-edit="${esc(id)}" data-effective="${esc(effective)}"><label class="field">${ht("frequency")}<select name="frequency"><option value="daily" ${next.frequency==="daily"?"selected":""}>${ht("daily")}</option><option value="weekly" ${next.frequency==="weekly"?"selected":""}>${ht("weekly")}</option></select></label><fieldset class="prayer-units"><legend>${ht("days")}</legend>${habitWeekdays(next.days)}</fieldset><div class="dialog-fields"><label class="field">${ht("target")}<input type="number" name="target" min="0.01" step="any" value="${next.target}" required></label><label class="field">${ht("unit")}<input name="unit" maxlength="30" value="${esc(next.unit)}" required></label></div><p role="alert" class="habit-error"></p><button class="secondary" type="submit">${ht("save")}</button></form></details></details><p class="muted">${lt("temporary")}</p>`;
  if(!dialog.open)dialog.showModal();
}
document.addEventListener("click",event=>{
  const restore=event.target.closest("[data-habit-restore]");
  if(restore){
    const habit=recurringHabits.find(item=>item.id===restore.dataset.habitRestore&&item.archived);
    if(!habit)return;
    habit.archived=false;
    globalThis.MihwerSystemLog?.record("habits","restored",habit.name);
    document.querySelector("#habit-archive-notice")?.setAttribute("hidden","");
    render();return;
  }
  if(suppressHabitClick)return;
  if(event.target.closest("[data-habit-create-open]")){habitCreate();return;}
  const adjust=event.target.closest("[data-habit-adjust]");
  if(adjust){
    const index=recurringHabits.findIndex(item=>item.id===adjust.dataset.habitAdjust);
    try {
      if(index<0||adjust.dataset.recordDate!==selectedDate)throw new Error("Invalid context");
      recurringHabits[index]=MihwerHabitEngine.adjust(recurringHabits[index],selectedDate,zoneDate(),Number(adjust.dataset.adjustment));
    }catch(error){console.error("Habit amount adjustment failed:",error);adjust.closest(".habit-checkin-card")?.querySelector(".habit-error")?.replaceChildren(document.createTextNode(ht("error")));return;}
    globalThis.MihwerSystemLog?.record("habits","updated",recurringHabits[index].name);
    render();return;
  }
  const quick=event.target.closest("[data-habit-quick-complete]");
  if(quick){
    const wasInDialog=!!quick.closest("dialog"),id=quick.dataset.habitQuickComplete;
    const index=recurringHabits.findIndex(item=>item.id===quick.dataset.habitQuickComplete);
    try {
      if(index<0||quick.dataset.recordDate!==selectedDate)throw new Error("Invalid context");
      const habit=recurringHabits[index],definition=MihwerHabitEngine.definitionAt(habit,selectedDate),record=habit.records[selectedDate];
      recurringHabits[index]=MihwerHabitEngine.record(habit,selectedDate,zoneDate(),"completed",record?.amount??definition.target);
    }catch(error){console.error("Habit quick completion failed:",error);quick.closest(".habit-checkin-card")?.querySelector(".habit-error")?.replaceChildren(document.createTextNode(ht("error")));return;}
    globalThis.MihwerSystemLog?.record("habits","completed",recurringHabits[index].name);
    render();if(wasInDialog)habitDetail(id);return;
  }
  const undo=event.target.closest("[data-habit-unrecord]");
  if(undo){
    const wasInDialog=!!undo.closest("dialog"),id=undo.dataset.habitUnrecord;
    const index=recurringHabits.findIndex(item=>item.id===undo.dataset.habitUnrecord);
    try {
      if(index<0||undo.dataset.recordDate!==selectedDate)throw new Error("Invalid context");
      recurringHabits[index]=MihwerHabitEngine.unrecord(recurringHabits[index],selectedDate);
    }catch(error){console.error("Habit record removal failed:",error);undo.closest(".habit-checkin-card")?.querySelector(".habit-error")?.replaceChildren(document.createTextNode(ht("error")));dialogContent.querySelector("[data-habit-record-error]")?.replaceChildren(document.createTextNode(ht("error")));return;}
    globalThis.MihwerSystemLog?.record("habits","undone",recurringHabits[index].name);
    render();if(wasInDialog)habitDetail(id);return;
  }
  const button=event.target.closest("[data-habit-open]");if(button)habitDetail(button.dataset.habitOpen);
});
document.addEventListener("submit",event=>{
  const form=event.target;
  if(form.matches("[data-habit-edit]")){
    event.preventDefault();
    const index=recurringHabits.findIndex(item=>item.id===form.dataset.habitEdit),data=new FormData(form);
    try {
      if(index<0||form.dataset.effective!==habitNextDay(zoneDate()))throw new Error("Invalid context");
      recurringHabits[index]=MihwerHabitEngine.revise(recurringHabits[index],{frequency:String(data.get("frequency")),days:data.getAll("days").map(Number),target:Number(data.get("target")),unit:String(data.get("unit")).trim()},zoneDate());
    } catch(error){console.error("Habit update failed:",error);form.querySelector(".habit-error").textContent=ht("error");return;}
    globalThis.MihwerSystemLog?.record("habits","updated",recurringHabits[index].name);
    render();habitDetail(recurringHabits[index].id);return;
  }
  if(form.matches("[data-habit-create]")){
    event.preventDefault();
    const data=new FormData(form),habit={id:crypto.randomUUID(),name:String(data.get("name")).trim(),pathId:String(data.get("path")),frequency:String(data.get("frequency")),days:data.getAll("days").map(Number),start:String(data.get("start")),end:String(data.get("end")),target:Number(data.get("target")),unit:String(data.get("unit")).trim(),records:{}};
    try {if(form.dataset.recordDate!==selectedDate||!lifePaths.some(path=>path.id===habit.pathId))throw new Error("Invalid context");MihwerHabitEngine.validate(habit);recurringHabits.push(habit);}
    catch(error){console.error("Habit creation failed:",error);form.querySelector(".habit-error").textContent=ht("error");return;}
    globalThis.MihwerSystemLog?.record("habits","added",habit.name);
    render();habitDetail(habit.id);return;
  }
  if(form.matches("[data-habit-record]")){
    event.preventDefault();
    const index=recurringHabits.findIndex(item=>item.id===form.dataset.habitRecord);
    try {if(index<0||form.dataset.recordDate!==selectedDate)throw new Error("Invalid context");const raw=form.elements.amount.value;recurringHabits[index]=MihwerHabitEngine.record(recurringHabits[index],selectedDate,zoneDate(),form.elements.status.value,raw===""?NaN:Number(raw));}
    catch(error){console.error("Habit recording failed:",error);form.querySelector(".habit-error").textContent=ht("error");return;}
    const savedHabit=recurringHabits[index],savedRecord=savedHabit.records[selectedDate];
    globalThis.MihwerSystemLog?.record("habits",savedRecord.status==="completed"?"completed":"recorded",`${savedHabit.name} · ${savedRecord.status} · ${savedRecord.amount} ${savedRecord.unit||savedHabit.unit}`);
    render();habitDetail(recurringHabits[index].id);
  }
});
render();
