"use strict";

const lifePaths = [
  {id:"faith",icon:"☾",name:["الدين والروح","Faith and spirit"],desc:["مساحة لما تختاره من عبادة وقيم وتأمل.","Space for the worship, values and reflection you choose."],ideas:[["القرآن","Quran"],["الذكر","Remembrance"],["الصدقة","Charity"],["التعلم الشرعي","Religious learning"]]},
  {id:"health",icon:"✿",name:["الصحة","Health"],desc:["عادات العناية بالجسد والراحة والحركة دون أحكام طبية.","Your choices for movement, rest and care, without medical judgments."],ideas:[["المشي","Walking"],["شرب الماء","Drink water"],["الراحة","Rest"],["الحركة","Movement"]]},
  {id:"learning",icon:"✦",name:["التعلم والمعرفة","Learning and knowledge"],desc:["اهتماماتك ومهاراتك والمعرفة التي تتطور معك.","Interests, skills and knowledge that grow with you."],ideas:[["القراءة","Reading"],["تدوين فكرة","Note an idea"],["تعلم مهارة","Learn a skill"]]},
  {id:"work",icon:"◈",name:["العمل والمشاريع","Work and projects"],desc:["أفكارك ومشاريعك وخطواتك المهنية والشخصية.","Your ideas, projects and professional or personal steps."],ideas:[["خطوة للمشروع","Project step"],["التخطيط","Planning"],["المراجعة","Review"]]},
  {id:"relationships",icon:"♡",name:["العلاقات","Relationships"],desc:["الروابط التي تهمك وطرق العناية بها كما تختار.","The connections you value and how you choose to nurture them."],ideas:[["وقت للعائلة","Family time"],["التواصل","Keeping in touch"],["لفتة لطيفة","A kind gesture"]]},
  {id:"life",icon:"✧",name:["الحياة والذكريات","Life and memories"],desc:["لحظاتك وتجاربك وما تريد الاحتفاظ به من قصتك.","Your experiences and moments you choose to keep in your story."],ideas:[["توثيق لحظة","Document a moment"],["التأمل","Reflection"],["هواية","Hobby"]]}
];
const pathText = {
  sub:["خطواتك اليومية مرتبطة بجوانب حياتك؛ اختر ما يناسبك.","Daily steps connect to your life areas; choose what suits you."],
  selectedDay:["اليوم المختار","Selected day"], all:["الكل","All"], tasks:["المهام","Tasks"], habits:["العادات","Habits"],
  noItems:["لا توجد عناصر في هذا الاختيار.","No items in this selection."], path:["المسار","Path"], noData:["لا مهام مستحقة في هذا اليوم","No eligible tasks on this day"],
  evidence:["تفاصيل النسبة","Progress details"], evidenceNote:["المنجز ÷ المهام والعادات اليومية التقليدية المستحقة في اليوم المختار؛ الملغى والمؤجل مستبعدان. العادات المتكررة والمهام الممتدة منفصلة حالياً؛ النسبة ليست تقييماً لحياتك.","Completed ÷ eligible traditional daily tasks and habits on the selected day; cancelled and deferred are excluded. Recurring habits and extended tasks are currently separate; this is not a judgment of your life."],
  suggestions:["أفكار مقترحة — اختر ما يناسبك","Suggested ideas — choose what suits you"], add:["إضافة لليوم","Add to day"],
  quickAdd:["إضافة سريعة","Quick add"], quickAddHint:["أدخل الاسم والوقت، ثم اختر مهمة أو عادة لهذا اليوم. الخيارات المتقدمة اختيارية.","Add a name and time, then choose a task or habit for today. Advanced options are optional."],
  quickAdded:["تمت الإضافة لرحلتك.","Added to your journey."],
  archiveTask:["إخفاء بالسحب","Swipe to hide"], restoreTask:["تراجع","Undo"], archivedTask:["أُخفيت المهمة مؤقتاً.","Task hidden temporarily."],
  swipeHint:["اسحب البطاقة من اليسار إلى اليمين لإخفائها؛ يمكن استعادتها من قائمة المؤرشفة.","Swipe a card from left to right to archive it; restore it from the archive list."],
  selected:["اختر فكرة وأضفها كمهمة أو عادة في اليوم المختار.","Choose an idea and add it as a task or habit on the selected day."],
  name:["الاسم","Name"], time:["الوقت المخطط","Scheduled time"], kind:["النوع","Type"], save:["إضافة","Add"],
  linked:["العناصر المرتبطة","Linked items"], story:["قصة هذا المسار","This path's story"], storyNote:["الخط الزمني يعرض فقط الأيام المحمّلة في ذاكرة النموذج؛ لا ينشئ قصة أو استنتاجات تلقائية.","The timeline shows only days loaded in prototype memory; it does not invent a story or conclusions."],
  open:["فتح التفاصيل","Open details"], empty:["لا توجد عناصر مرتبطة بعد.","No linked items yet."],
  cancelled:["ملغاة","Cancelled"], completed:["منجزة","Completed"], pending:["متبقية","Remaining"], info:["ما الذي يمثله؟","What does this represent?"],
  error:["تعذر إضافة العنصر. تحقق من الاسم والوقت وحاول مجدداً.","Could not add the item. Check the name and time and try again."],
  prayerHint:["الصلاة تُحلّل منفصلة أدناه ولا تُخلط بنسبة المهام.","Prayer is analyzed separately below and is not mixed into task progress."],
  prayerProgress:["الصلاة المسجلة اليوم","Prayer recorded today"], noPrayer:["لا توجد صلاة مسجلة لهذا اليوم.","No prayer recorded for this day."],
  dates:["الأيام المحمّلة","Loaded days"], prayerLog:["تسجيل صلاة","Record a prayer"],
  noPrayerTime:["الوقت غير متاح","Time unavailable"], storyEntry:["أضف ملاحظة لهذا اليوم","Add a note for this day"],
  saveStory:["حفظ الملاحظة","Save note"], storyError:["تعذر حفظ الملاحظة؛ تحقق منها وحاول مجدداً.","Could not save the note; check it and try again."], previousSections:["الأقسام التوضيحية الأخرى","Other illustrative sections"],
  durationSummary:["الوقت المسجل للمنجز","Recorded time for completed"], measuredCount:["عناصر لها مدة مسجلة","items with recorded duration"], noTime:["لا توجد مدة مسجلة للمنجز","No duration recorded for completed items"],
  overview:["ملخص اليوم","Today at a glance"], allDone:["منجزة من المستحقة","completed of eligible"], stationLevel:["تقدم المحطة","Moment progress"], addActivity:["أضف من مساراتك","Add from your paths"], running:["القياس جارٍ","Timing"],
  quickComplete:["تسجيل إنجاز","Record completion"], openItem:["فتح التفاصيل","Open details"],
  addSubtask:["إضافة فرعية","Add subtask"], editSubtask:["تعديل","Edit"], deleteSubtask:["حذف","Delete"],
  subtasks:["المهام الفرعية","Subtasks"], subtaskProgress:["تقدم الفرعيات","Subtask progress"],
  cancelEdit:["إلغاء","Cancel"],
  subtaskEditError:["تعذر تحديث المهمة الفرعية. تحقق من الاسم وحاول مجدداً.","Could not update the subtask. Check its name and try again."],
  subtaskDeleteError:["تعذر حذف المهمة الفرعية.","Could not delete the subtask."],
  extended:["المهام الممتدة","Extended tasks"], addExtended:["مهمة ممتدة جديدة","New extended task"], extendedOpen:["جارية","In progress"], extendedClosed:["انتهت مدتها","Period ended"], overdue:["متأخرة","Overdue"],
  startDate:["تاريخ البداية","Start date"], endDate:["تاريخ النهاية (اختياري)","End date (optional)"], noEnd:["بلا تاريخ نهاية","No end date"],
  extendedHint:["تبقى مفتوحة خلال تاريخ النهاية، وتغلق بعده؛ بلا نهاية تبقى مفتوحة. إغلاق المدة لا يعني اكتمال المهمة.","Open through the end date, then closed; without an end date it remains open. A closed period does not mean the task was completed."],
  dailySubtasks:["مهام هذا اليوم الفرعية","Subtasks for this day"], noDailySubtasks:["لا مهام فرعية لهذا اليوم · لا توجد نسبة","No subtasks for this day · no percentage"],
  subtaskDate:["تاريخ المهمة الفرعية","Subtask date"], extendedError:["تعذر التحديث. تحقق من الاسم والتواريخ وحالة المهمة.","Could not update. Check the name, dates and task status."],
  extendedSeparate:["المهام الممتدة محسوبة منفصلة عن ملخص المهام أعلاه.","Extended tasks are shown separately from the task summary above."],
  addSubtaskHere:["أضف مهمة فرعية","Add subtask"],
  completionDateNote:["يُسجل الإنجاز بتاريخ اليوم الفعلي في المنطقة الزمنية المختارة، حتى عند فتح يوم آخر.","Completion is recorded on the actual current date in your selected time zone, even when viewing another day."],
  notStarted:["لم تبدأ مدة المهمة بعد.","The task period has not started yet."],
  editExtended:["تعديل المهمة الممتدة","Edit extended task"],
  updateExtended:["حفظ التعديل","Save changes"],
  extendedDatesError:["تعذر حفظ التعديل. تحقق من الاسم والتواريخ؛ يجب أن تشمل المدة تواريخ المهام الفرعية المسجلة وإنجازها.","Could not save changes. Check the name and dates; the period must include scheduled and completed subtask dates."],
  history:["سجل التغييرات","Change history"],
  historyEmpty:["لا توجد تغييرات مسجلة بعد.","No changes recorded yet."],
  historyCreated:["أُنشئت المهمة","Task created"],
  historyEdited:["عُدلت تفاصيل المهمة","Task details edited"],
  historySubAdded:["أُضيفت مهمة فرعية","Subtask added"],
  historySubDone:["أُنجزت مهمة فرعية","Subtask completed"],
  historySubReopened:["أُعيد فتح مهمة فرعية","Subtask reopened"],
  historyTemporary:["يسجل السجل التغييرات التي تحدث خلال هذه الجلسة فقط.","History records changes made in this session only."],
  archived:["المهام المحذوفة مؤقتاً","Temporarily deleted tasks"], archive:["حذف قابل للاستعادة","Delete (recoverable)"], unarchive:["استعادة المحذوفة","Restore deleted task"],
  archiveHint:["الحذف يخفي المهمة دون إزالة بياناتها خلال هذه الجلسة.","Deletion hides the task without removing its data during this session."],
  completeExtended:["إكمال المهمة","Complete task"], cancelExtended:["إلغاء المهمة","Cancel task"], restoreExtended:["استعادة المهمة الملغاة","Restore cancelled task"], reopenExtended:["إعادة فتح المهمة","Reopen task"],
  lifecycleError:["تعذر تغيير الحالة. تحقق من حالة المهمة ومن أن تاريخ اليوم ضمن مدتها.","Could not change status. Check the task state and that today falls within its period."],
  historyCompleted:["أُكملت المهمة","Task completed"], historyCancelled:["أُلغيت المهمة","Task cancelled"], historyRestored:["استُعيدت المهمة","Task restored"], historyReopened:["أُعيد فتح المهمة","Task reopened"], historyArchived:["حُذفت المهمة مؤقتاً","Task temporarily deleted"], historyUnarchived:["استُعيدت المهمة المحذوفة","Deleted task restored"],
  editSubtasks:["تعديل الفرعيات المعروضة","Edit shown subtasks"],   historySubEdited:["عُدلت مهمة فرعية","Subtask edited"],
  subtaskCancelled:["ملغاة","Cancelled"], subtaskArchived:["مؤرشفة","Archived"],
  cancelSubtask:["إلغاء الفرعية","Cancel subtask"], restoreSubtask:["استعادة الفرعية","Restore subtask"],
  archiveSubtask:["أرشفة الفرعية","Archive subtask"], restoreSubtaskArchive:["استعادة الفرعية المؤرشفة","Restore archived subtask"],
  historySubCancelled:["أُلغيت مهمة فرعية","Subtask cancelled"], historySubRestored:["استُعيدت مهمة فرعية","Subtask restored"],
  historySubArchived:["أُرشفت مهمة فرعية","Subtask archived"], historySubUnarchived:["استُعيدت مهمة فرعية مؤرشفة","Archived subtask restored"]
};
const pt = key=>pathText[key][language==="ar"?0:1];
let activityFilter="tasks";
const dailyReflectionStorageKey="mihwer.dailyReflections";
const dailyReflectionMoods=new Set(["great","good","okay","low"]);
const dailyReflections=new Map();
let dailyReflectionStorageError="";
try {
  const savedReflections=localStorage.getItem(dailyReflectionStorageKey);
  if(savedReflections){
    const records=JSON.parse(savedReflections);
    if(!Array.isArray(records))throw new TypeError("Saved daily reflections are not a list");
    for(const record of records){
      if(!Array.isArray(record)||record.length!==2||!/^\d{4}-\d{2}-\d{2}$/.test(record[0])||!record[1]||typeof record[1]!=="object"||!dailyReflectionMoods.has(record[1].mood)&&record[1].mood!==""||typeof record[1].note!=="string"){
        throw new TypeError("Saved daily reflection has an invalid shape");
      }
      dailyReflections.set(record[0],{mood:record[1].mood,note:record[1].note.slice(0,500)});
    }
  }
} catch(error) {
  console.error("Daily reflection load failed:",error);
  dailyReflectionStorageError=language==="ar"?"تعذر تحميل المراجعات المحفوظة من هذا الجهاز.":"Could not load saved reflections from this device.";
}
const expandedActivityTasks=new Set(),editingActivitySubtasks=new Set(),activityTaskErrors=new Map();
function saveDailyReflection(date,reflection){
  const next=new Map(dailyReflections);
  next.set(date,{mood:reflection.mood,note:reflection.note});
  try {
    localStorage.setItem(dailyReflectionStorageKey,JSON.stringify([...next]));
  } catch(error) {
    console.error("Daily reflection save failed:",error);
    dailyReflectionStorageError=language==="ar"?"تعذر الحفظ على هذا الجهاز. تحقق من مساحة التخزين وإعدادات الخصوصية ثم أعد المحاولة.":"Could not save on this device. Check storage space and privacy settings, then try again.";
    return false;
  }
  dailyReflections.set(date,{mood:reflection.mood,note:reflection.note});
  dailyReflectionStorageError="";
  return true;
}
function dailyReflectionView(){
  const reflection=dailyReflections.get(selectedDate)||{mood:"",note:""};
  const moods=language==="ar"?[["great","😄","ممتاز"],["good","🙂","جيد"],["okay","😐","عادي"],["low","😔","كان صعباً"]]:[["great","😄","Great"],["good","🙂","Good"],["okay","😐","Okay"],["low","😔","Difficult"]];
  return `<section class="daily-reflection" aria-labelledby="daily-reflection-title">
    <div class="daily-reflection-heading"><span class="daily-reflection-icon" aria-hidden="true">✦</span><div><p class="eyebrow"><bdi dir="ltr">${esc(selectedDate)}</bdi></p><h2 id="daily-reflection-title">${language==="ar"?"شعورك وملاحظاتك":"Your mood and notes"}</h2><p class="muted">${language==="ar"?"تُحفظ مراجعة اليوم على هذا الجهاز فقط.":"Your reflection is saved on this device only."}</p></div></div>
    ${dailyReflectionStorageError?`<p class="reflection-storage-error" role="alert">${esc(dailyReflectionStorageError)}</p>`:""}
    <div class="reflection-moods" role="group" aria-label="${language==="ar"?"اختر شعورك":"Choose your mood"}">${moods.map(([mood,icon,label])=>`<button type="button" class="reflection-mood ${reflection.mood===mood?"is-selected":""}" data-reflection-mood="${mood}" data-reflection-date="${esc(selectedDate)}" aria-label="${label}" aria-pressed="${reflection.mood===mood}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join("")}</div>
    <form data-daily-reflection data-record-date="${esc(selectedDate)}"><label class="field"><span>${language==="ar"?"ملاحظات اليوم":"Notes from today"}</span><textarea name="note" maxlength="500" rows="3" placeholder="${language==="ar"?"ما أجمل ما حدث؟ وما الذي تريد أن تتذكره؟":"What went well, and what do you want to remember?"}">${esc(reflection.note)}</textarea></label><div class="daily-reflection-footer"><span class="reflection-saved" role="status" aria-live="polite"></span><button class="secondary" type="submit">${language==="ar"?"حفظ الحصاد":"Save reflection"}</button></div></form>
  </section>`;
}
function renderTaskDetails(taskKey,focusSelector) {
  render();
  const toggle=[...document.querySelectorAll("[data-task-expand]")].find(element=>element.dataset.taskExpand===taskKey);
  const row=toggle?.closest(".activity-entry,.route-row");
  const target=focusSelector?row?.querySelector(focusSelector):toggle;
  target?.focus({preventScroll:true});
}
const extendedTasks=[];
globalThis.MihwerExtendedTasks=extendedTasks;

function extendedClosed(task) { return !!task.end&&zoneDate()>task.end; }
function extendedOnDay(task,date=selectedDate) { return date>=task.start&&(!task.end||date<=task.end); }
function extendedDaily(task,date=selectedDate) {
  const candidates=task.subtasks.filter(sub=>(sub.done?sub.completedDate:sub.date)===date);
  const eligible=task.archived||task.status==="cancelled"?[]:candidates.filter(sub=>!sub.archived&&sub.status!=="cancelled");
  const stats=MihwerProgressEngine.summarize(eligible.map(sub=>({id:sub.id,date,status:sub.done?"done":"pending"})));
  return {items:candidates,done:stats.complete,eligible:stats.eligible,ratio:stats.ratio};
}
function extendedStatus(task) {
  const state=MihwerExtendedLifecycle.stateAt(task,zoneDate());
  return pt(({archived:"archived",cancelled:"cancelled",completed:"completed",notStarted:"notStarted",overdue:"overdue",inProgress:"extendedOpen"})[state]);
}
function extendedCard(task) {
  const day=extendedDaily(task), status=extendedStatus(task);
  return `<button class="extended-card" data-extended-open="${esc(task.id)}"><span class="activity-icon" aria-hidden="true">◷</span><span class="activity-main"><strong>${esc(task.name)}</strong><small>${esc(pathName(task.pathId))} · ${status}</small><small>${priorityBadge(task.priority)}</small><small>${day.ratio===null?pt("noDailySubtasks"):`${pt("dailySubtasks")}: ${day.done}/${day.eligible} · ${Math.round(day.ratio*100)}%`}</small></span><span aria-hidden="true">›</span></button>`;
}
function extendedSection(pathId=null) {
  const matching=extendedTasks.filter(task=>(!pathId||task.pathId===pathId)&&(extendedOnDay(task)||(selectedDate===zoneDate()&&extendedClosed(task))));
  const items=matching.filter(task=>!task.archived), archived=matching.filter(task=>task.archived);
  if(!matching.length)return "";
  return `<section class="activity-group extended-section"><h3>${pt("extended")}</h3><div class="activity-list">${items.map(extendedCard).join("")}</div>${archived.length?`<details class="utility-details"><summary>${pt("archived")} (${archived.length})</summary><p>${pt("archiveHint")}</p><div class="activity-list">${archived.map(extendedCard).join("")}</div></details>`:""}<p class="muted">${pt("extendedSeparate")}</p></section>`;
}
function extendedFormFields(task) {
  return `<label class="field">${pt("name")}<input name="name" maxlength="100" required value="${esc(task.name)}"></label><label class="field">${pt("path")}<select name="path">${lifePaths.map(path=>`<option value="${esc(path.id)}" ${path.id===task.pathId?"selected":""}>${esc(pathName(path.id))}</option>`).join("")}</select></label>${priorityPicker(task.priority,'name="priority"')}<div class="dialog-fields"><label class="field">${pt("startDate")}<input name="start" type="date" value="${esc(task.start)}" required></label><label class="field">${pt("endDate")}<input name="end" type="date" value="${esc(task.end)}"></label></div>`;
}
function validExtendedFields(name,start,end,pathId) {
  return MihwerExtendedValidation.validFields(name,start,end,pathId,lifePaths.map(path=>path.id));
}
function recordExtendedChange(task,key,detail="") {
  task.history??=[];
  task.history.push({key,detail,at:Date.now()});
  const action=({historyCreated:"added",historyEdited:"updated",historyCompleted:"completed",historyCancelled:"cancelled",historyRestored:"restored",historyReopened:"reopened",historyArchived:"archived",historyUnarchived:"restored",historySubAdded:"added",historySubEdited:"updated",historySubDone:"completed",historySubReopened:"reopened",historySubCancelled:"cancelled",historySubRestored:"restored",historySubArchived:"archived",historySubUnarchived:"restored"})[key];
  if(action)globalThis.MihwerSystemLog?.record("extended",action,[task.name,key==="historyCreated"?"":detail].filter(Boolean).join(" · "));
}
function extendedCreate() {
  dialogTitle.textContent=pt("addExtended");
  dialogContent.innerHTML=`<form data-extended-form data-record-date="${esc(selectedDate)}">${extendedFormFields({name:"",pathId:lifePaths[0].id,start:selectedDate,end:""})}<details class="utility-details"><summary>${lt("details")}</summary><p>${pt("extendedHint")}</p></details><p role="alert" class="extended-error"></p><button class="primary" type="submit">${pt("save")}</button></form><p class="muted">${lt("temporary")}</p>`;
  if(!dialog.open)dialog.showModal();
}
function showExtended(id) {
  const task=extendedTasks.find(item=>item.id===id);if(!task)return;
  const day=extendedDaily(task),closed=extendedClosed(task),within=extendedOnDay(task),editable=!closed&&!task.archived&&(!task.status||task.status==="open");
  dialogTitle.textContent=task.name;
  dialogContent.innerHTML=`<div class="summary-card"><small>${esc(pathName(task.pathId))} · ${extendedStatus(task)}</small><strong><b dir="ltr">${esc(task.start)}</b> — ${task.end?`<b dir="ltr">${esc(task.end)}</b>`:pt("noEnd")}</strong><small>${task.createdAt?`${pt("historyCreated")}: ${esc(task.createdAt)}`:""}</small></div><h3>${pt("dailySubtasks")} · <b dir="ltr">${esc(selectedDate)}</b></h3><p>${day.ratio===null?pt("noDailySubtasks"):`${day.done}/${day.eligible} · ${Math.round(day.ratio*100)}%`}</p>${day.items.length?`<ul class="subtask-list">${day.items.map(sub=>{const subStatus=sub.archived?"subtaskArchived":sub.status==="cancelled"?"subtaskCancelled":sub.done?"done":"pending",disabled=closed||zoneDate()<task.start||!editable||sub.archived||sub.status==="cancelled";return `<li><span>${esc(sub.name)} · ${pt(subStatus)}</span><button class="secondary" data-extended-toggle="${esc(task.id)}" data-subtask-id="${esc(sub.id)}" ${disabled?"disabled":""}>${lt(sub.done?"reopenTask":"completeTask")}</button>${editable?(sub.archived?`<button class="secondary" data-extended-sub-action="restore-archive" data-extended-id="${esc(task.id)}" data-subtask-id="${esc(sub.id)}">${pt("restoreSubtaskArchive")}</button>`:sub.status==="cancelled"?`<button class="secondary" data-extended-sub-action="restore" data-extended-id="${esc(task.id)}" data-subtask-id="${esc(sub.id)}">${pt("restoreSubtask")}</button><button class="secondary" data-extended-sub-action="archive" data-extended-id="${esc(task.id)}" data-subtask-id="${esc(sub.id)}">${pt("archiveSubtask")}</button>`:`<button class="secondary" data-extended-sub-action="cancel" data-extended-id="${esc(task.id)}" data-subtask-id="${esc(sub.id)}">${pt("cancelSubtask")}</button><button class="secondary" data-extended-sub-action="archive" data-extended-id="${esc(task.id)}" data-subtask-id="${esc(sub.id)}">${pt("archiveSubtask")}</button>`):""}</li>`;}).join("")}</ul>`:""}${!closed&&within?`<details class="utility-details extended-add"><summary>＋ ${pt("addSubtaskHere")}</summary><form data-extended-subtask="${esc(task.id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("subtaskName")}<input name="name" maxlength="100" required></label><label class="field">${pt("subtaskDate")}<input type="date" name="date" value="${esc(selectedDate)}" min="${esc(task.start)}" ${task.end?`max="${esc(task.end)}"`:""} required></label><p role="alert" class="extended-error"></p><button class="secondary" type="submit">${pt("addSubtaskHere")}</button></form></details>`:""}<p class="muted">${pt("completionDateNote")}</p><details class="utility-details"><summary>${lt("details")}</summary><p>${pt("extendedHint")}</p><p>${lt("temporary")}</p></details><p role="alert" id="extended-action-error"></p>`;
  dialogContent.querySelector(".summary-card small").textContent=`${pathName(task.pathId)} · ${extendedStatus(task)}`;
  dialogContent.querySelectorAll("[data-extended-toggle]").forEach(button=>{if(!editable)button.disabled=true;});
  if(!editable)dialogContent.querySelector(".extended-add")?.remove();
  const state=task.status||"open", actions=task.archived?[["restore-archive","unarchive"]]:[...(state==="completed"?[["reopen","reopenExtended"]]:state==="cancelled"?[["restore","restoreExtended"]]:[...(!closed?[["complete","completeExtended"]]:[]),["cancel","cancelExtended"]]),["archive","archive"]];
  if(editable&&day.items.length)dialogContent.insertAdjacentHTML("beforeend",`<details class="utility-details"><summary>${pt("editSubtasks")}</summary>${day.items.map(sub=>`<form data-extended-sub-edit="${esc(task.id)}" data-subtask-id="${esc(sub.id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("subtaskName")}<input name="name" maxlength="100" required value="${esc(sub.name)}"></label><label class="field">${pt("subtaskDate")}<input type="date" name="date" value="${esc(sub.date)}" min="${esc(task.start)}" ${task.end?`max="${esc(task.end)}"`:""} required></label><p role="alert" class="extended-error"></p><button class="secondary" type="submit">${pt("updateExtended")}</button></form>`).join("")}</details>`);
  dialogContent.insertAdjacentHTML("beforeend",`<div class="options">${actions.map(([action,label])=>`<button class="secondary" data-extended-action="${action}" data-extended-id="${esc(task.id)}">${pt(label)}</button>`).join("")}</div><p class="muted">${pt("archiveHint")}</p>${!task.archived?`<details class="utility-details"><summary>${pt("editExtended")}</summary><form data-extended-edit="${esc(task.id)}" data-record-date="${esc(selectedDate)}">${extendedFormFields(task)}<p role="alert" class="extended-error"></p><button class="secondary" type="submit">${pt("updateExtended")}</button></form></details>`:""}<details class="utility-details"><summary>${pt("history")}</summary><p class="muted">${pt("historyTemporary")}</p>${task.history?.length?`<ul>${task.history.map(event=>`<li>${esc(recordedTime(event.at))} · ${pt(event.key)}${event.detail?` · ${esc(event.detail)}`:""}</li>`).join("")}</ul>`:`<p>${pt("historyEmpty")}</p>`}</details>`);
  if(!dialog.open)dialog.showModal();
}

function stationPath(station) {
  return station.pathId || ({read:"learning",project:"work",walk:"health",memory:"life"})[station.id] || "life";
}
function pathItems(state,id) {
  return (state.stations||[]).filter(s=>stationPath(s)===id).flatMap(s=>s.tasks.filter(task=>!task.archived).map(task=>({station:s,task})));
}
function pathStats(state,id,date=selectedDate) {
  const items=pathItems(state,id), stats=MihwerProgressEngine.summarize(items.map(x=>({id:x.task.id,date,status:x.task.status})));
  const ids=new Set(stats.evidence.filter(x=>x.status==="done"||x.status==="pending").map(x=>x.id));
  const eligible=items.filter(x=>ids.delete(x.task.id));
  return {items,eligible,done:stats.complete,cancelled:stats.cancelled,deferred:stats.deferred,ratio:stats.ratio};
}
function pathName(id) { const p=lifePaths.find(item=>item.id===id);return p?p.name[language==="ar"?0:1]:id; }
function statText(stats) { return stats.ratio===null?pt("noData"):`${stats.done}/${stats.eligible.length} · ${Math.round(stats.ratio*100)}%`; }
function activityWeekStrip(date) {
  const selected=new Date(`${date}T12:00:00Z`);
  selected.setUTCDate(selected.getUTCDate()-selected.getUTCDay());
  return `<nav class="activity-week-strip" aria-label="${pt("selectedDay")}">${Array.from({length:7},(_,index)=>{
    const day=new Date(selected);
    day.setUTCDate(selected.getUTCDate()+index);
    const value=day.toISOString().slice(0,10),locale=language==="ar"?"ar":"en";
    const weekday=new Intl.DateTimeFormat(locale,{weekday:"short",timeZone:"UTC"}).format(day);
    const number=new Intl.DateTimeFormat(locale,{day:"numeric",timeZone:"UTC"}).format(day);
    const label=new Intl.DateTimeFormat(locale,{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}).format(day);
    return `<button type="button" class="activity-week-day ${value===date?"is-selected":""}" data-period-date="${value}" data-period-screen="activities" aria-label="${esc(label)}" aria-pressed="${value===date}"><span>${esc(weekday)}</span><strong>${esc(number)}</strong></button>`;
  }).join("")}</nav>`;
}
function inlineTaskSubtasks(station,task) {
  const taskKey=`${station.id}:${task.id}`,expanded=expandedActivityTasks.has(taskKey);
  return `<section class="task-inline-details" id="task-subtasks-${esc(task.id)}" ${expanded?"":"hidden"} aria-label="${esc(pt("subtasks"))}">
    ${task.subtasks?.length?`<div class="task-inline-progress"><span>${pt("subtaskProgress")}</span><b dir="ltr">${task.subtasks.filter(sub=>sub.status==="done").length}/${task.subtasks.length}</b><progress max="${task.subtasks.length}" value="${task.subtasks.filter(sub=>sub.status==="done").length}"></progress></div>`:""}
    <ul class="task-inline-subtasks">${(task.subtasks||[]).map(sub=>{const editing=editingActivitySubtasks.has(`${taskKey}:${sub.id}`);return `<li class="task-inline-subtask ${sub.status==="done"?"is-done":""}">
      <button type="button" class="task-inline-subtask-check" data-inline-subtask-toggle="${esc(sub.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(station.id)}" aria-label="${esc(lt(sub.status==="done"?"reopenTask":"completeTask"))}: ${esc(sub.name)}" ${task.status!=="pending"?"disabled":""}>${sub.status==="done"?"✓":""}</button>
      ${editing?`<form class="task-inline-edit-form" data-inline-subtask-edit="${esc(sub.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(station.id)}" data-record-date="${esc(selectedDate)}"><input name="name" maxlength="100" required aria-label="${esc(lt("subtaskName"))}" value="${esc(sub.name)}"><button type="submit" class="task-inline-icon" aria-label="${esc(lt("saveSubtask"))}">✓</button><button type="button" class="task-inline-icon" data-inline-subtask-edit-cancel="${esc(sub.id)}" aria-label="${esc(pt("cancelEdit"))}">×</button></form>`:`<span class="task-inline-subtask-name">${esc(sub.name)}</span><button type="button" class="task-inline-icon" data-inline-subtask-edit-open="${esc(sub.id)}" data-task-key="${esc(taskKey)}" aria-label="${esc(pt("editSubtask"))}: ${esc(sub.name)}" ${task.status!=="pending"?"disabled":""}>✎</button>`}
      <button type="button" class="task-inline-icon task-inline-delete" data-inline-subtask-delete="${esc(sub.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(station.id)}" aria-label="${esc(pt("deleteSubtask"))}: ${esc(sub.name)}" ${task.status!=="pending"?"disabled":""}>×</button>
    </li>`;}).join("")}</ul>
    ${task.status==="pending"?`<form class="task-inline-add-form" data-inline-subtask-form="${esc(task.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(station.id)}" data-record-date="${esc(selectedDate)}"><input name="name" maxlength="100" required aria-label="${esc(lt("subtaskName"))}" placeholder="${esc(lt("subtaskName"))}"><button type="submit" class="task-inline-add">${pt("addSubtask")}</button></form>`:`<p class="task-inline-locked">${lt("subtaskLocked")}</p>`}
    <p class="task-inline-error" data-task-feedback="${esc(task.id)}" role="alert" tabindex="-1">${esc(activityTaskErrors.get(taskKey)||"")}</p>
  </section>`;
}
function activityRow({station,task}, quick=false) {
  const name=task.name[language==="ar"?0:1], status=task.status==="done"?lt("done"):task.status==="cancelled"?pt("cancelled"):task.startedAt!==undefined?pt("running"):lt("pending");
  const stateClass=task.status==="done"?"done":task.status==="cancelled"?"cancelled":"pending";
  const priority=taskPriority(task.priority);
  const taskKey=`${station.id}:${task.id}`,expanded=!station.habit&&expandedActivityTasks.has(taskKey);
  const details=station.habit
    ?`<span class="activity-main"><span class="activity-entry-heading"><span class="activity-icon" aria-hidden="true">${esc(station.icon||"◉")}</span><span class="activity-entry-copy"><strong>${esc(name)}</strong><small><bdi dir="ltr">${timeText(task.time)}</bdi></small></span></span><span class="activity-card-meta"><span class="activity-state state-${stateClass}">${status}</span></span></span>`
    :`<span class="activity-main"><span class="activity-entry-heading"><span class="activity-priority-swatch" role="img" aria-label="${esc(lt(priority))}" title="${esc(lt(priority))}"></span><span class="activity-entry-copy"><strong>${esc(name)}</strong><small><bdi dir="ltr">${timeText(task.time)}</bdi></small></span></span></span>`;
  const subtasks=station.habit?"":inlineTaskSubtasks(station,task);
  if(quick) return `<div class="activity-entry ${station.habit?"is-habit":"is-task"} status-${esc(task.status)} ${expanded?"is-expanded":""}" data-station-id="${esc(station.id)}" data-task-id="${esc(task.id)}" data-priority="${priority}"><button class="activity-entry-detail" ${station.habit?`data-activity-open="${esc(station.id)}"`:`data-task-expand="${esc(taskKey)}"`} ${station.habit?`data-activity-task="${esc(task.id)}"`:`aria-expanded="${expanded}" aria-controls="task-subtasks-${esc(task.id)}"`}>${details}</button><button class="activity-check ${station.habit?"is-habit-check":""}" ${station.habit?`style="--habit-value:${task.status==="done"?"100%":"0%"}"`:""} data-activity-check="${esc(station.id)}" data-activity-task="${esc(task.id)}" aria-label="${esc(task.status==="pending"?pt("quickComplete"):pt("openItem"))}: ${esc(name)}" title="${esc(status)}">${station.habit?`${task.status==="done"?"100":"0"}%`:task.status==="done"?"✓":task.status==="cancelled"?"–":""}</button>${station.habit?"":`<button type="button" class="activity-edit" data-task-edit="${esc(task.id)}" data-station-id="${esc(station.id)}" aria-label="${esc(lt("editTask"))}: ${esc(name)}" title="${esc(lt("editTask"))}">✎</button>${subtasks}`}</div>`;
  return `<button class="activity-card ${station.habit?"is-habit":"is-task"} status-${esc(task.status)}" data-priority="${priority}" data-activity-open="${esc(station.id)}" data-activity-task="${esc(task.id)}">${details}<span class="activity-status state-${stateClass}">${status}</span></button>`;
}
function activitiesView() {
  const state=livingState(), allItems=(state.stations||[]).flatMap(station=>station.tasks.map(task=>({station,task})));
  const archived=allItems.filter(item=>item.task.archived&&!!item.station.habit===(activityFilter==="habits")),items=allItems.filter(item=>!item.task.archived&&!!item.station.habit===(activityFilter==="habits"));
  const visible=items.sort((a,b)=>a.task.time-b.task.time);
  const stats=MihwerProgressEngine.summarize(visible.map(x=>({id:x.task.id,date:selectedDate,status:x.task.status}))), ids=new Set(stats.evidence.filter(x=>x.status==="done"||x.status==="pending").map(x=>x.id)), eligible=visible.filter(x=>ids.delete(x.task.id)), done=stats.complete;
  const percent=stats.ratio===null?0:Math.round(stats.ratio*100);
  const groups=[["tasks",visible.filter(x=>!x.station.habit)],["habits",visible.filter(x=>x.station.habit)]];
  const sectionName=activityFilter==="tasks"?"tasks":"habits";
  return `<div class="paths-page activities-page">${header("practices","pathsSub")}<section class="panel activity-panel"><div class="activity-heading"><h2>${pt(sectionName)}</h2><span class="activity-count" dir="ltr">${done}/${eligible.length}</span></div><div class="activity-overview"><div class="activity-overview-ring" style="--activity-value:${percent}%" role="img" aria-label="${language==="ar"?`${percent}% من العناصر اليومية مكتملة`:`${percent}% of daily items complete`}"><strong dir="ltr">${percent}%</strong></div><div><strong>${language==="ar"?`${done} من ${eligible.length} مكتملة`:`${done} of ${eligible.length} complete`}</strong><small>${language==="ar"?`ملخص ${activityFilter==="tasks"?"المهام":"العادات"} لليوم المختار`:`${activityFilter} summary for the selected day`}</small></div></div>${activityWeekStrip(selectedDate)}<div class="activity-filters" role="tablist" aria-label="${pt("tasks")}">${["tasks","habits"].map(f=>`<button type="button" role="tab" data-activity-filter="${f}" aria-selected="${activityFilter===f}" aria-pressed="${activityFilter===f}">${pt(f)}</button>`).join("")}</div><p class="activity-swipe-hint">${pt("swipeHint")}</p>${visible.length?groups.filter(([,entries])=>entries.length).map(([key,entries])=>`<section class="activity-group activity-group-${key}"><h3>${pt(key)} <small>${entries.length}</small></h3><div class="activity-list activity-route-list">${entries.map(entry=>activityRow(entry,true)).join("")}</div></section>`).join(""):`<p class="muted">${pt("noItems")}</p>`}${activityFilter==="habits"&&typeof recurringSection==="function"?recurringSection():''}${archived.length?`<details class="utility-details archived-tasks"><summary>${pt("archived")} (${archived.length})</summary><p>${pt("archiveHint")}</p><div class="activity-list">${archived.map(({station,task})=>`<div class="archived-task"><span>${esc(task.name[language==="ar"?0:1])}</span><button class="secondary" data-task-restore="${esc(station.id)}" data-task-id="${esc(task.id)}">${pt("restoreTask")}</button></div>`).join("")}</div></details>`:""}${activityFilter==="tasks"?extendedSection():""}<div class="activity-footer"><span>${lt("temporary")}</span></div></section></div>`;
}
document.addEventListener("click",event=>{
  const moodButton=event.target.closest("[data-reflection-mood]");
  if(!moodButton)return;
  if(moodButton.dataset.reflectionDate!==selectedDate)return;
  const reflection=dailyReflections.get(selectedDate)||{mood:"",note:""};
  const next={...reflection,mood:moodButton.dataset.reflectionMood};
  if(!saveDailyReflection(selectedDate,next)){
    const error=document.querySelector(".reflection-storage-error");
    if(error)error.textContent=dailyReflectionStorageError;
    else moodButton.closest(".daily-reflection")?.insertAdjacentHTML("afterbegin",`<p class="reflection-storage-error" role="alert">${esc(dailyReflectionStorageError)}</p>`);
    return;
  }
  moodButton.closest(".reflection-moods").querySelectorAll("[data-reflection-mood]").forEach(button=>{
    const selected=button===moodButton;
    button.classList.toggle("is-selected",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
  const status=moodButton.closest(".daily-reflection").querySelector(".reflection-saved");
  if(status)status.textContent=language==="ar"?"حُفظ شعورك على هذا الجهاز.":"Your mood was saved on this device.";
  globalThis.MihwerSystemLog?.record("daily","updated",language==="ar"?"تقييم المزاج":"Mood reflection");
});
document.addEventListener("submit",event=>{
  const form=event.target.closest("[data-daily-reflection]");
  if(!form)return;
  event.preventDefault();
  if(form.dataset.recordDate!==selectedDate){const status=form.querySelector(".reflection-saved");if(status)status.textContent=language==="ar"?"تغير اليوم المحدد؛ حدّث الصفحة قبل الحفظ.":"The selected day changed; refresh before saving.";return;}
  const reflection=dailyReflections.get(selectedDate)||{mood:"",note:""};
  const next={...reflection,note:new FormData(form).get("note").toString().trim()};
  if(!saveDailyReflection(selectedDate,next)){
    const error=form.closest(".daily-reflection").querySelector(".reflection-storage-error");
    if(error)error.textContent=dailyReflectionStorageError;
    else form.closest(".daily-reflection").insertAdjacentHTML("afterbegin",`<p class="reflection-storage-error" role="alert">${esc(dailyReflectionStorageError)}</p>`);
    return;
  }
  globalThis.MihwerSystemLog?.record("daily","updated",language==="ar"?"مراجعة اليوم":"Daily reflection");
  const status=form.querySelector(".reflection-saved");
  if(status)status.textContent=language==="ar"?"حُفظ الحصاد على هذا الجهاز.":"The reflection was saved on this device.";
});
function quickTaskCreate() {
  dialogTitle.textContent=pt("quickAdd");
  if(!dialog.open)dialog.showModal();
  dialogContent.innerHTML=`<p class="muted">${pt("quickAddHint")}</p><form data-quick-item data-record-date="${esc(selectedDate)}"><label class="field">${pt("name")}<input name="name" maxlength="100" required autofocus></label><div class="task-fields"><label class="field">${pt("time")}<input name="time" type="time" value="${timeText(livingMinute)}" required></label><label class="field">${pt("kind")}<select name="kind"><option value="task">${pt("tasks")}</option><option value="habit">${pt("habits")}</option></select></label></div><label class="field">${pt("path")}<select name="path">${lifePaths.map(path=>`<option value="${esc(path.id)}">${esc(pathName(path.id))}</option>`).join("")}</select></label>${priorityPicker("not-urgent-important",'name="priority"')}<p class="quick-item-status" role="status" aria-live="polite"></p><p class="quick-item-error" role="alert"></p><button class="primary" type="submit">${pt("save")}</button></form><div class="quick-item-options"><button type="button" class="secondary" data-action="new-extended-task">${pt("addExtended")}</button><button type="button" class="secondary" data-action="new-habit">${ht("create")}</button></div><p class="muted">${lt("temporary")}</p>`;
  dialogContent.querySelector('[name="name"]')?.focus();
}
let taskArchiveNoticeTimer=0;
function showTaskArchiveNotice(taskName,stationId,taskId) {
  let notice=document.querySelector("#task-archive-notice");
  if(!notice){notice=document.createElement("div");notice.id="task-archive-notice";notice.className="task-archive-notice";notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");document.body.append(notice);}
  notice.innerHTML=`<span>${esc(taskName)} · ${pt("archivedTask")}</span><button type="button" class="secondary" data-task-restore="${esc(stationId)}" data-task-id="${esc(taskId)}">${pt("restoreTask")}</button>`;
  notice.hidden=false;
  clearTimeout(taskArchiveNoticeTimer);
  taskArchiveNoticeTimer=setTimeout(()=>{notice.hidden=true;},7000);
}
function archiveStationTask(stationId,taskId) {
  const station=livingState().stations.find(item=>item.id===stationId),task=station?.tasks.find(item=>item.id===taskId);
  if(!station||!task||!MihwerStationTaskArchive.archive(task))return;
  const name=task.name[language==="ar"?0:1];
  globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","archived",name);
  if(dialog.open)dialog.close();
  render();
  showTaskArchiveNotice(name,stationId,taskId);
}
let activitySwipe=null,suppressActivityClick=false;
document.addEventListener("pointerdown",event=>{
  if(!(event.target instanceof Element))return;
  const row=event.target.closest(".activities-page .activity-entry");
  if(!row)return;
  activitySwipe={row,pointerId:event.pointerId,x:event.clientX,y:event.clientY};
},true);
document.addEventListener("pointermove",event=>{
  if(!activitySwipe||activitySwipe.pointerId!==event.pointerId)return;
  const dx=event.clientX-activitySwipe.x,dy=event.clientY-activitySwipe.y;
  if(Math.abs(dy)>Math.abs(dx)||dx<=0)return;
  activitySwipe.row.classList.add("is-swiping");
  activitySwipe.row.style.setProperty("--swipe-offset",`${Math.min(dx,88)}px`);
},true);
document.addEventListener("pointerup",event=>{
  if(!activitySwipe||activitySwipe.pointerId!==event.pointerId)return;
  const gesture=activitySwipe;activitySwipe=null;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  gesture.row.classList.remove("is-swiping");
  gesture.row.style.removeProperty("--swipe-offset");
  if(!gesture.row.isConnected)return;
  if(Math.abs(dx)>=20||Math.abs(dy)>=20){
    suppressActivityClick=true;
    setTimeout(()=>{suppressActivityClick=false;},0);
  }
  if(dx<64||dx<Math.abs(dy)*1.25)return;
  archiveStationTask(gesture.row.dataset.stationId,gesture.row.dataset.taskId);
},true);
document.addEventListener("pointercancel",()=>{
  activitySwipe?.row.classList.remove("is-swiping");
  activitySwipe?.row.style.removeProperty("--swipe-offset");
  activitySwipe=null;
},true);
document.addEventListener("click",event=>{
  if(!suppressActivityClick)return;
  event.preventDefault();event.stopImmediatePropagation();suppressActivityClick=false;
},true);
document.addEventListener("click",event=>{
  const archiveButton=event.target.closest("[data-task-archive]");
  if(archiveButton){archiveStationTask(archiveButton.dataset.taskArchive,archiveButton.dataset.taskId);return;}
  const restoreButton=event.target.closest("[data-task-restore]");
  if(restoreButton){
    const station=livingState().stations.find(item=>item.id===restoreButton.dataset.taskRestore),task=station?.tasks.find(item=>item.id===restoreButton.dataset.taskId);
    if(!station||!task||!MihwerStationTaskArchive.restore(task))return;
    const name=Array.isArray(task.name)?task.name[language==="ar"?0:1]:String(task.name||"");
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","restored",name);
    const notice=document.querySelector("#task-archive-notice");if(notice)notice.hidden=true;
    render();return;
  }
  if(event.target.closest("[data-quick-add-another]")){quickTaskCreate();return;}
});
pathsView = function() {
  const state=livingState();
  return `<div class="paths-page">${header("pathsTitle","pathsSub")}${journeyToolbar(false)}<p class="muted">${pt("evidenceNote")}</p><div class="life-path-grid">${lifePaths.map(path=>{const stats=pathStats(state,path.id);return `<button class="life-path-card" data-life-path="${path.id}"><span class="activity-icon">${path.icon}</span><strong>${esc(pathName(path.id))}</strong><small>${statText(stats)}</small>${stats.ratio===null?"":`<progress max="100" value="${Math.round(stats.ratio*100)}" aria-label="${esc(pathName(path.id))}"></progress>`}<span>${pt("open")} ←</span></button>`;}).join("")}</div><details class="utility-details"><summary>${pt("previousSections")}</summary><div class="path-suggestions">${["interests","learning","skills","projects","practices","achievements"].map(key=>`<button class="secondary" data-path="${key}">${t(key)}</button>`).join("")}</div><p>${t("pathDetail")}</p></details><p class="muted">${lt("temporary")}</p></div>`;
};
function pathDetail(id) {
  const path=lifePaths.find(p=>p.id===id);if(!path)return;
  const state=livingState(), stats=pathStats(state,id), records=[...days.entries()].filter(([,day])=>pathItems(day,id).length||day.pathNotes?.[id]).sort((a,b)=>b[0].localeCompare(a[0]));
  const prayerRecords=id==="faith"?Object.entries(state.prayerRecords||{}):[];
  const taskItems=stats.eligible.filter(x=>!x.station.habit), habitItems=stats.eligible.filter(x=>x.station.habit);
  const measured=stats.eligible.filter(x=>x.task.status==="done"&&x.task.elapsedMs!==undefined), seconds=Math.floor(measured.reduce((sum,x)=>sum+x.task.elapsedMs,0)/1000);
  const groupSummary=(label,items)=>{const result=MihwerProgressEngine.summarize(items.map(x=>({id:x.task.id,date:selectedDate,status:x.task.status})));return `${pt(label)}: ${result.complete}/${result.eligible}`;};
  const prayerView=id==="faith"?`<section class="path-section"><h3>${pt("prayerProgress")}</h3><p class="muted">${pt("prayerHint")}</p>${prayerRecords.length?prayerRecords.map(([key,record])=>{const p=prayerProgress(record);return `<p>${esc(lt(({fajr:"fajr",dhuhr:"dhuhr",asr:"asrPrayer",maghrib:"maghrib",isha:"isha"})[key]))} · ${p.done}/${p.total} · ${Math.round(p.ratio*100)}%</p>`;}).join(""):`<p>${pt("noPrayer")}</p>`}<div class="path-suggestions">${[["fajr","fajr"],["dhuhr","dhuhr"],["asr","asrPrayer"],["maghrib","maghrib"],["isha","isha"]].map(([key,label])=>`<button class="secondary" data-prayer-entry="${key}">${pt("prayerLog")} · ${lt(label)}</button>`).join("")}</div></section>`:"";
  dialogTitle.textContent=pathName(id);
  dialogContent.innerHTML=`<p class="eyebrow">${pt("info")}</p><p>${esc(path.desc[language==="ar"?0:1])}</p><section class="summary-card"><small>${pt("selectedDay")} · ${esc(selectedDate)}</small><strong>${statText(stats)}</strong><p class="muted">${pt("evidenceNote")}</p><p>${pt("completed")}: ${stats.done} · ${pt("pending")}: ${stats.eligible.length-stats.done} · ${pt("cancelled")}: ${stats.cancelled}</p><details class="utility-details"><summary>${pt("evidence")}</summary><p>${groupSummary("tasks",taskItems)} · ${groupSummary("habits",habitItems)}</p><p>${pt("durationSummary")}: ${measured.length?`<b dir="ltr">${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}</b> · ${measured.length} ${pt("measuredCount")}`:pt("noTime")}</p></details></section><section class="path-section"><h3>${pt("linked")}</h3>${stats.items.length?`<div class="activity-list">${stats.items.map(activityRow).join("")}</div>`:`<p class="muted">${pt("empty")}</p>`}</section>${prayerView}<section class="path-section"><h3>${pt("suggestions")}</h3><div class="path-suggestions">${path.ideas.map((idea,index)=>`<button class="secondary" data-path-idea="${path.id}" data-idea-index="${index}">＋ ${esc(idea[language==="ar"?0:1])}</button>`).join("")}</div></section><details class="utility-details" data-path-story><summary>${pt("story")}</summary><p>${pt("storyNote")}</p>${records.length?records.map(([date,day])=>`<p><b dir="ltr">${esc(date)}</b> · ${statText(pathStats(day,id))}${day.pathNotes?.[id]?`<br>${esc(day.pathNotes[id])}`:""}</p>`).join(""):`<p>${pt("empty")}</p>`}<form data-path-note="${id}" data-record-date="${esc(selectedDate)}"><label class="field">${pt("storyEntry")}<textarea name="note" maxlength="1000" required>${esc(state.pathNotes?.[id]||"")}</textarea></label><p role="alert" id="note-error"></p><button class="secondary" type="submit">${pt("saveStory")}</button></form></details><p class="muted">${lt("temporary")}</p>`;
  dialogContent.insertAdjacentHTML("beforeend",extendedSection(id));
  if(typeof recurringSection==="function")dialogContent.insertAdjacentHTML("beforeend",recurringSection(id));
  if(!dialog.open)dialog.showModal();
}
function ideaForm(id,index) {
  const path=lifePaths.find(p=>p.id===id), idea=path?.ideas[index];if(!idea)return;
  dialogTitle.textContent=pathName(id);
  dialogContent.innerHTML=`<p>${pt("selected")}</p><form data-idea-form="${esc(id)}" data-idea-index="${index}" data-record-date="${esc(selectedDate)}"><label class="field">${pt("name")}<input name="name" required maxlength="100" value="${esc(idea[language==="ar"?0:1])}"></label><label class="field">${pt("time")}<input name="time" type="time" value="09:00" required></label><label class="field">${pt("kind")}<select name="kind"><option value="task">${pt("tasks")}</option><option value="habit">${pt("habits")}</option></select></label><p role="alert" id="idea-error"></p><div class="options"><button class="primary" type="submit">${pt("save")}</button><button type="button" class="secondary" data-life-path="${esc(id)}">${t("back")}</button></div></form><p class="muted">${lt("temporary")}</p>`;
}
document.addEventListener("click",event=>{
  if(event.target.closest("[data-extended-create]")){extendedCreate();return;}
  const taskExpand=event.target.closest("[data-task-expand]");
  if(taskExpand){
    const key=taskExpand.dataset.taskExpand;
    if(expandedActivityTasks.has(key)){expandedActivityTasks.delete(key);activityTaskErrors.delete(key);}
    else expandedActivityTasks.add(key);
    renderTaskDetails(key);return;
  }
  const editSubtask=event.target.closest("[data-inline-subtask-edit-open]");
  if(editSubtask){const key=editSubtask.dataset.taskKey,subtask=editSubtask.dataset.inlineSubtaskEditOpen;editingActivitySubtasks.add(`${key}:${subtask}`);renderTaskDetails(key,`[data-inline-subtask-edit="${CSS.escape(subtask)}"] input[name="name"]`);return;}
  const cancelSubtaskEdit=event.target.closest("[data-inline-subtask-edit-cancel]");
  if(cancelSubtaskEdit){const key=cancelSubtaskEdit.closest(".activity-entry,.route-row")?.querySelector("[data-task-expand]")?.dataset.taskExpand,subtask=cancelSubtaskEdit.dataset.inlineSubtaskEditCancel;editingActivitySubtasks.delete(`${key}:${subtask}`);renderTaskDetails(key,`[data-inline-subtask-edit-open="${CSS.escape(subtask)}"]`);return;}
  const subtaskToggle=event.target.closest("[data-inline-subtask-toggle]");
  if(subtaskToggle){
    const station=livingState().stations.find(item=>item.id===subtaskToggle.dataset.parentStation),task=station?.tasks.find(item=>item.id===subtaskToggle.dataset.parentTask),subtask=task?.subtasks?.find(item=>item.id===subtaskToggle.dataset.inlineSubtaskToggle),key=`${station?.id}:${task?.id}`;
    if(!station||!task||task.status!=="pending"||!subtask){console.error("Subtask update failed: task or subtask not found or locked");activityTaskErrors.set(key,pt("subtaskEditError"));renderTaskDetails(key,".task-inline-error");return;}
    subtask.status=subtask.status==="done"?"pending":"done";
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks",subtask.status==="done"?"completed":"reopened",subtask.name);
    activityTaskErrors.delete(key);renderTaskDetails(key,`[data-inline-subtask-toggle="${CSS.escape(subtask.id)}"]`);return;
  }
  const deleteSubtask=event.target.closest("[data-inline-subtask-delete]");
  if(deleteSubtask){
    const station=livingState().stations.find(item=>item.id===deleteSubtask.dataset.parentStation),task=station?.tasks.find(item=>item.id===deleteSubtask.dataset.parentTask),subtaskId=deleteSubtask.dataset.inlineSubtaskDelete,key=`${station?.id}:${task?.id}`;
    if(!task||task.status!=="pending"||!task.subtasks?.some(item=>item.id===subtaskId)){console.error("Subtask deletion failed: task or subtask not found or locked");activityTaskErrors.set(key,pt("subtaskDeleteError"));renderTaskDetails(key,".task-inline-error");return;}
    const deletedName=task.subtasks.find(item=>item.id===subtaskId).name;
    task.subtasks=task.subtasks.filter(item=>item.id!==subtaskId);
    globalThis.MihwerSystemLog?.record(station?.habit?"habits":"tasks","deleted",deletedName);
    editingActivitySubtasks.delete(`${key}:${subtaskId}`);activityTaskErrors.delete(key);renderTaskDetails(key,'[data-inline-subtask-form] input[name="name"]');return;
  }
  const lifecycle=event.target.closest("[data-extended-action]");
  if(lifecycle){
    const task=extendedTasks.find(item=>item.id===lifecycle.dataset.extendedId),action=lifecycle.dataset.extendedAction;
    try {const updated=MihwerExtendedLifecycle.transition(task,action,zoneDate());Object.assign(task,updated);recordExtendedChange(task,({complete:"historyCompleted",cancel:"historyCancelled",restore:"historyRestored",reopen:"historyReopened",archive:"historyArchived","restore-archive":"historyUnarchived"})[action]);}
    catch(error){console.error("Extended task transition failed:",error);dialog.querySelector("#extended-action-error").textContent=pt("lifecycleError");return;}
    render();if(action==="complete")flashCompletedEntry(`extended:${task.id}`);showExtended(task.id);return;
  }
  const subtaskAction=event.target.closest("[data-extended-sub-action]");
  if(subtaskAction){
    const task=extendedTasks.find(item=>item.id===subtaskAction.dataset.extendedId),action=subtaskAction.dataset.extendedSubAction,sub=task?.subtasks.find(item=>item.id===subtaskAction.dataset.subtaskId);
    try {
      if(!task||!sub)throw new Error("Subtask not found");
      const updated=MihwerExtendedLifecycle.transitionSubtask(task,sub.id,action,zoneDate());
      Object.assign(task,updated);
      recordExtendedChange(task,({cancel:"historySubCancelled",restore:"historySubRestored",archive:"historySubArchived","restore-archive":"historySubUnarchived"})[action],sub.name);
    } catch(error) {
      console.error("Extended subtask transition failed:",error);
      dialog.querySelector("#extended-action-error").textContent=pt("extendedError");
      return;
    }
    render();showExtended(task.id);return;
  }
  const extendedOpen=event.target.closest("[data-extended-open]");if(extendedOpen){showExtended(extendedOpen.dataset.extendedOpen);return;}
  const extendedToggle=event.target.closest("[data-extended-toggle]");
  if(extendedToggle){
    const task=extendedTasks.find(item=>item.id===extendedToggle.dataset.extendedToggle),sub=task?.subtasks.find(item=>item.id===extendedToggle.dataset.subtaskId&&(item.done?item.completedDate:item.date)===selectedDate);
    if(!task||task.archived||(task.status&&task.status!=="open")||extendedClosed(task)||zoneDate()<task.start||!sub){dialog.querySelector("#extended-action-error").textContent=pt("extendedError");return;}
    try {
      const updated=MihwerExtendedLifecycle.toggleSubtask(task,sub.id,zoneDate());
      Object.assign(task,updated);
      const changed=task.subtasks.find(item=>item.id===sub.id);
      recordExtendedChange(task,changed.done?"historySubDone":"historySubReopened",changed.name);
      render();showExtended(task.id);
      if(changed.done)flashCompletedEntry(`extended-subtask:${task.id}:${sub.id}`);
      if(changed.done&&selectedDate!==changed.completedDate)dialog.querySelector("#extended-action-error").textContent=pt("completionDateNote");
    } catch(error) {
      console.error("Extended subtask completion failed:",error);
      dialog.querySelector("#extended-action-error").textContent=pt("extendedError");
    }
    return;
  }
  const filter=event.target.closest("[data-activity-filter]");if(filter){activityFilter=filter.dataset.activityFilter;render();return;}
  const check=event.target.closest("[data-activity-check]");if(check){
    const station=livingState().stations.find(item=>item.id===check.dataset.activityCheck),task=station?.tasks.find(item=>item.id===check.dataset.activityTask);
    if(!station||!task)return;
    if(task.status!=="pending"){showStation(station.id,null,task.id);return;}
    try {
      updateTaskAction(station,task.id,"toggle");
      renderTaskDetails(`${station.id}:${task.id}`);
      flashCompletedEntry(`task:${task.id}`);
    }catch(error){
      console.error("Quick task completion failed:",error);
      const taskKey=`${station.id}:${task.id}`;
      expandedActivityTasks.add(taskKey);
      activityTaskErrors.set(taskKey,task.subtasks?.some(subtask=>subtask.status!=="done")?lt("subtasksRequired"):lt("updateError"));
      renderTaskDetails(taskKey);
    }
    return;
  }
  const card=event.target.closest("[data-activity-open]");if(card){showStation(card.dataset.activityOpen,null,card.dataset.activityTask);return;}
  const path=event.target.closest("[data-life-path]");if(path){pathDetail(path.dataset.lifePath);return;}
  const idea=event.target.closest("[data-path-idea]");if(idea)ideaForm(idea.dataset.pathIdea,Number(idea.dataset.ideaIndex));
  const prayer=event.target.closest("[data-prayer-entry]");if(prayer){const labels={fajr:"fajr",dhuhr:"dhuhr",asr:"asrPrayer",maghrib:"maghrib",isha:"isha"},key=prayer.dataset.prayerEntry;if(!labels[key])return;const calculated=calculatePrayers().times?.find(item=>item.key===key);showPrayerRecord(calculated||{key,label:labels[key],time:pt("noPrayerTime")});}
});
document.addEventListener("submit",event=>{
  const form=event.target;
  if(form.matches("[data-inline-subtask-form],[data-inline-subtask-edit]")){
    event.preventDefault();
    const station=livingState().stations.find(item=>item.id===form.dataset.parentStation),task=station?.tasks.find(item=>item.id===form.dataset.parentTask||item.id===form.dataset.inlineSubtaskForm),name=form.elements.name.value.trim(),key=`${station?.id}:${task?.id}`;
    const fail=()=>{console.error("Subtask save failed: invalid date, task, status, or name");activityTaskErrors.set(key,pt("subtaskEditError"));renderTaskDetails(key,".task-inline-error");};
    if(form.dataset.recordDate!==selectedDate||!station||!task||task.status!=="pending"||!name||name.length>100){fail();return;}
    if(form.matches("[data-inline-subtask-edit]")){
      const subtask=task.subtasks?.find(item=>item.id===form.dataset.inlineSubtaskEdit);
      if(!subtask){fail();return;}
      subtask.name=name;editingActivitySubtasks.delete(`${key}:${subtask.id}`);
      globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","updated",name);
    }else{
      task.subtasks=[...(task.subtasks||[]),{id:crypto.randomUUID(),name,status:"pending"}];
      globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","added",name);
    }
    const wasAdd=form.matches("[data-inline-subtask-form]");
    expandedActivityTasks.add(key);activityTaskErrors.delete(key);
    renderTaskDetails(key,wasAdd?'[data-inline-subtask-form] input[name="name"]':`[data-inline-subtask-edit-open="${CSS.escape(form.dataset.inlineSubtaskEdit)}"]`);return;
  }
  if(form.matches("[data-quick-item]")){
    event.preventDefault();
    const name=form.elements.name.value.trim(),time=form.elements.time.value,kind=form.elements.kind.value,path=lifePaths.find(item=>item.id===form.elements.path.value),priority=form.elements.priority.value;
    const minutes=/^\d{2}:\d{2}$/.test(time)?Number(time.slice(0,2))*60+Number(time.slice(3,5)):NaN;
    if(form.dataset.recordDate!==selectedDate||!name||name.length>100||!Number.isInteger(minutes)||minutes<0||minutes>=1440||!path||!["task","habit"].includes(kind)||!MihwerTaskPriority.values.includes(priority)){form.querySelector(".quick-item-error").textContent=pt("error");return;}
    const id=`quick-${crypto.randomUUID()}`,label=[name,name];
    try {livingState().stations.push({id,pathId:path.id,custom:label,time:minutes,icon:path.icon,habit:kind==="habit",tasks:[{id:`${id}-task`,name:label,time:minutes,estimate:0,priority,status:"pending"}]});}
    catch(error){console.error("Quick item creation failed:",error);form.querySelector(".quick-item-error").textContent=pt("error");return;}
    globalThis.MihwerSystemLog?.record(kind==="habit"?"habits":"tasks","added",name);
    render();form.elements.name.value="";form.querySelector(".quick-item-error").textContent="";form.querySelector(".quick-item-status").textContent=pt("quickAdded");form.elements.name.focus();return;
  }
  if(form.matches("[data-extended-form]")){
    event.preventDefault();
    const name=form.elements.name.value.trim(),start=form.elements.start.value,end=form.elements.end.value,pathId=form.elements.path.value,priority=form.elements.priority.value;
    if(form.dataset.recordDate!==selectedDate||!validExtendedFields(name,start,end,pathId)||!MihwerTaskPriority.values.includes(priority)){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    const task={id:crypto.randomUUID(),name,pathId,start,end,priority,createdAt:new Date().toISOString(),subtasks:[],history:[]};
    if(!MihwerExtendedValidation.validCollection([...extendedTasks,task])){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    recordExtendedChange(task,"historyCreated",task.createdAt);extendedTasks.push(task);render();showExtended(task.id);return;
  }
  if(form.matches("[data-extended-edit]")){
    event.preventDefault();
    const task=extendedTasks.find(item=>item.id===form.dataset.extendedEdit),name=form.elements.name.value.trim(),start=form.elements.start.value,end=form.elements.end.value,pathId=form.elements.path.value,priority=form.elements.priority.value;
    const datesFit=task&&MihwerExtendedValidation.datesFit(task.subtasks,start,end);
    const updated=task&&{...task,name,start,end,pathId,priority};
    if(form.dataset.recordDate!==selectedDate||!task||task.archived||!validExtendedFields(name,start,end,pathId)||!MihwerTaskPriority.values.includes(priority)||!datesFit||!MihwerExtendedValidation.validCollection(extendedTasks.map(item=>item===task?updated:item))){form.querySelector(".extended-error").textContent=pt("extendedDatesError");return;}
    const periodChange=task.start!==start||task.end!==end;
    const previousPeriod=`${task.start}–${task.end||"open"}`;
    Object.assign(task,updated);recordExtendedChange(task,"historyEdited",periodChange?`${previousPeriod} → ${start}–${end||"open"}`:"");render();showExtended(task.id);return;
  }
  if(form.matches("[data-extended-sub-edit]")){
    event.preventDefault();
    const task=extendedTasks.find(item=>item.id===form.dataset.extendedSubEdit),sub=task?.subtasks.find(item=>item.id===form.dataset.subtaskId),name=form.elements.name.value.trim(),date=form.elements.date.value;
    if(form.dataset.recordDate!==selectedDate||!task||task.archived||(task.status&&task.status!=="open")||extendedClosed(task)||!sub||sub.archived||sub.status==="cancelled"||!name||name.length>100||!MihwerExtendedValidation.isDate(date)||!extendedOnDay(task,date)||!MihwerExtendedValidation.datesFit(task.subtasks.map(item=>item===sub?{...item,name,date}:item),task.start,task.end)){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    const updated={...sub,name,date};
    if(!MihwerExtendedValidation.validCollection(extendedTasks.map(item=>item===task?{...item,subtasks:task.subtasks.map(child=>child===sub?updated:child)}:item))){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    Object.assign(sub,updated);recordExtendedChange(task,"historySubEdited",name);render();showExtended(task.id);return;
  }
  if(form.matches("[data-extended-subtask]")){
    event.preventDefault();
    const task=extendedTasks.find(item=>item.id===form.dataset.extendedSubtask),name=form.elements.name.value.trim(),date=form.elements.date.value;
    if(form.dataset.recordDate!==selectedDate||!task||task.archived||(task.status&&task.status!=="open")||extendedClosed(task)||!name||name.length>100||!MihwerExtendedValidation.isDate(date)||!extendedOnDay(task,date)){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    const subtask={id:crypto.randomUUID(),name,date,done:false,status:"pending"};
    const updated={...task,subtasks:[...task.subtasks,subtask]};
    if(!MihwerExtendedValidation.validCollection(extendedTasks.map(item=>item===task?updated:item))){form.querySelector(".extended-error").textContent=pt("extendedError");return;}
    task.subtasks=updated.subtasks;recordExtendedChange(task,"historySubAdded",name);render();showExtended(task.id);return;
  }
  if(form.matches("[data-path-note]")){
    event.preventDefault();
    if(form.dataset.recordDate!==selectedDate){form.querySelector("#note-error").textContent=lt("dateChanged");return;}
    const id=form.dataset.pathNote, note=form.elements.note.value.trim();
    if(!lifePaths.some(p=>p.id===id)||!note||note.length>1000){form.querySelector("#note-error").textContent=pt("storyError");return;}
    try {const state=livingState();state.pathNotes={...state.pathNotes,[id]:note};}
    catch(error){console.error("Could not save path note:",error);form.querySelector("#note-error").textContent=pt("storyError");return;}
    globalThis.MihwerSystemLog?.record("paths","updated",pathName(id));
    pathDetail(id);dialogContent.querySelector("[data-path-story]").open=true;return;
  }
  if(!form.matches("[data-idea-form]"))return;
  event.preventDefault();
  if(form.dataset.recordDate!==selectedDate){form.querySelector("#idea-error").textContent=lt("dateChanged");return;}
  const path=lifePaths.find(p=>p.id===form.dataset.ideaForm), idea=path?.ideas[Number(form.dataset.ideaIndex)], name=form.elements.name.value.trim(), value=form.elements.time.value, kind=form.elements.kind.value;
  if(!path||!idea||!name||!/^\d{2}:\d{2}$/.test(value)||!["task","habit"].includes(kind)){form.querySelector("#idea-error").textContent=pt("error");return;}
  const [hours,minutes]=value.split(":").map(Number), id=`path-${crypto.randomUUID()}`, title=name===idea[language==="ar"?0:1]?idea:[name,name];
  try {livingState().stations.push({id,pathId:path.id,custom:title,time:hours*60+minutes,icon:path.icon,habit:kind==="habit",tasks:[{id:`${id}-task`,name:title,time:hours*60+minutes,estimate:0,status:"pending"}]});}
  catch(error){console.error("Could not add path item:",error);form.querySelector("#idea-error").textContent=pt("error");return;}
  globalThis.MihwerSystemLog?.record(kind==="habit"?"habits":"tasks","added",name);
  render();pathDetail(path.id);
});
render();
