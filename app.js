"use strict";

const words = {
  journey:["رحلتي","My journey"], paths:["مساراتي","My paths"], goals:["أهدافي","My goals"], sharing:["المشاركة","Sharing"], organizerTitle:["المشتريات والاشتراكات","Shopping and subscriptions"], organizerNav:["شراء واشتراكات","Shop & subs"], organizerSubtitle:["قوائمك اليومية ومواعيد التجديد القادمة.","Your everyday lists and upcoming renewal dates."], navLabel:["التنقل بين التصاميم","Design navigation"],
  language:["اللغة","Language"], theme:["المظهر","Theme"], settingsLabel:["الإعدادات","Settings"], search:["البحث","Search"], voice:["الصوت","Voice"], add:["إضافة","Add"], close:["إغلاق","Close"],
  prototypeNotice:["نموذج ببيانات توضيحية • حصاد اليوم يُحفظ على هذا الجهاز فقط؛ لا رفع أو مشاركة فعلية","Example data only • today's reflection is saved on this device; no uploads or real sharing"],
  designLab:["استوديو التصميم · نموذج للمراجعة","DESIGN LAB · REVIEW PROTOTYPE"], journeyTitle:["رحلة تشبهك","A journey that's yours"],
  journeySub:["محطاتك، بتفاصيلها الصغيرة ومعانيها الكبيرة.","Your moments, small details and larger meaning."],
  fictional:["بيانات توضيحية","Fictional example"], day:["اليوم","Day"], week:["الأسبوع","Week"], month:["الشهر","Month"], year:["السنة","Year"],
  dayTitle:["خارطة اليوم","A day in motion"], daySub:["الأحد · 16 نوفمبر 2025","Sunday · November 16, 2025"],
  weekTitle:["أسبوع من المحطات","A week of moments"], weekSub:["اختر يوماً من الأسبوع المحيط بالتاريخ المحدد","Choose a day around the selected date"],
  weekNoData:["لا بيانات مهام يومية محملة","No daily task data loaded"], weekNoTasks:["لا مهام يومية مستحقة","No eligible daily tasks"], weekProgress:["العناصر اليومية التقليدية المنجزة","Completed traditional daily items"], weekFuture:["يوم مستقبلي؛ لا يُحسب في الإنجاز","Future day; excluded from progress"],
  periodComplete:["مكتمل","Complete"], periodPartial:["إنجاز جزئي","Partially complete"], periodPending:["لم يُسجّل إنجاز بعد","No completion recorded"], periodEmpty:["لا مهام مستحقة","No eligible tasks"], periodNoData:["لا بيانات لهذا اليوم","No data for this day"], periodNoDataRange:["لا توجد بيانات محمّلة لهذه الفترة","No data loaded for this period"],
  periodSource:["المهام والعادات التقليدية من الأيام المحمّلة في الذاكرة فقط؛ المستقبل والملغى والمؤجل مستبعدون. العادات المتكررة من سجلاتها منفصلة، والمهام الممتدة غير مشمولة.","Traditional tasks and habits use loaded days only; future, cancelled and deferred items are excluded. Recurring habits use their records separately; extended tasks are not included."],
  periodLoaded:["أيام محمّلة","Loaded days"], periodTasks:["المهام اليومية","Daily tasks"], periodHabits:["العادات اليومية التقليدية","Traditional daily habits"],
  monthTitle:["شهر تتشكل فيه الأفكار","A month taking shape"], monthSub:["اختر يوماً من الشهر المحدد","Choose a day in the selected month"],
  yearTitle:["سنة من التغير","A year of change"], yearSub:["اختر شهراً من السنة المحددة","Choose a month in the selected year"],
  pause:["القراءة والتعلم","Reading and learning"], pauseDesc:["صباح هادئ مع فكرة جديدة","A quiet morning and a new idea"],
  craft:["العمل على المشروع","Working on a project"], craftDesc:["خطوة صغيرة نحو شيء أكبر","A small step toward something bigger"],
  walk:["مشي المساء","An evening walk"], walkDesc:["وقت للتأمل واستعادة الهدوء","Time to reflect and recharge"],
  memory:["ذكرى تستحق التوثيق","A moment worth keeping"], memoryDesc:["صورة وحكاية من هذا اليوم","A picture and a story from today"],
  complete:["مكتملة","Completed"], current:["الحالية","Current"], upcoming:["قادمة","Upcoming"], featured:["محطة مميزة","Featured moment"],
  daySummary:["لمحة اليوم","Today at a glance"], sampleProgress:["١ من ٣ أنشطة مثال مكتملة","1 of 3 example activities complete"],
  openMoment:["افتح المحطة","Open moment"], momentTitle:["تفاصيل المحطة","Moment details"], writeMoment:["توثيق المحطة","Document moment"],
  storyNote:["كل محطة تحتفظ بحكايتها","Every moment holds a story"], storyNoteDesc:["افتح محطة لتوثيقها أو عرض تفاصيلها. البيانات هنا مثال فقط.","Open a moment to document it or view its details. All data here is fictional."],
  compareTitle:["قارن أشكال المسار","Compare journey shapes"], compareDesc:["اختر اتجاهاً لعرضه على خارطة اليوم. التوصية: المسار الانسيابي لأنه واضح على الهاتف ويترك مجالاً للمحتوى.","Choose a direction to preview on the day map. Recommended: the flowing path, readable on mobile and spacious enough for content."],
  simulation:["تجربة تفاعلية فقط: تغيير الإنجاز يضيء المسار مؤقتاً ولا يُحفظ.","Interactive simulation only: completing a step lights the path temporarily and is not saved."],
  markDone:["إكمال تجريبي","Simulate completion"], undoDone:["إلغاء الإنجاز التجريبي","Undo simulated completion"],
  selectDate:["اختر اليوم","Choose a day"], sleepRhythm:["إيقاع نومك","Your sleep rhythm"],
  sleepTime:["وقت النوم","Bedtime"], wakeTime:["وقت الاستيقاظ","Wake-up time"], napTime:["وقت القيلولة","Nap time"],
  sleepHint:["قيم تجريبية منفصلة لكل يوم، تبقى في هذه الصفحة فقط وتُفقد عند تحديثها. المحطات المعروضة أمثلة توضيحية.","Example values are separate for each day, stay on this page only and are lost on reload. The displayed moments are illustrative."],
  dawn:["الشروق","Sunrise"], night:["المساء والنوم","Night and sleep"],
  flow:["مسار انسيابي","Flowing path"], map:["خريطة معالم","Landmark map"], density:["مسار متغير","Adaptive path"],
  mapCaption:["المسار يحيط بالمحطات كنقاط استكشاف.","The route frames moments as landmarks."], densityCaption:["مسار أوسع قرب تجمع المحطات؛ الكثافة هنا توضيحية.","A wider path near clustered moments; density is illustrative."], flowCaption:["انحناءات هادئة تربط المحطات دون إخفاء المحتوى.","Gentle curves connect moments without hiding content."],
  week1:["الأحد · بداية هادئة","Sunday · A quiet beginning"], week2:["الاثنين · مساحة للتعلم","Monday · Room to learn"], week3:["الأربعاء · خطوة للمشروع","Wednesday · A project step"], week4:["السبت · وقت للعائلة","Saturday · Time together"],
  selectDay:["افتح خارطة اليوم","Open day map"], selectMonth:["افتح خارطة الشهر","Open month map"], monthOverview:["لمحات الشهر","Month highlights"],
  project:["مشروع شخصي","A personal project"], projectDesc:["فكرة تتقدم على مهل","An idea moving at its own pace"], learning:["التعلم","Learning"], learningDesc:["ثلاث لحظات للاكتشاف","Three moments of discovery"], achievement:["إنجاز صغير","A small achievement"], achievementDesc:["خطوة تستحق الاحتفاء","A step worth celebrating"],
  yearOverview:["محطات السنة","Year highlights"], yearNote:["من اهتمام جديد إلى مشروع يكتسب شكله.","From a new interest to a project taking shape."],
  jan:["يناير","Jan"], feb:["فبراير","Feb"], mar:["مارس","Mar"], apr:["أبريل","Apr"], may:["مايو","May"], jun:["يونيو","Jun"], jul:["يوليو","Jul"], aug:["أغسطس","Aug"], sep:["سبتمبر","Sep"], oct:["أكتوبر","Oct"], nov:["نوفمبر","Nov"], dec:["ديسمبر","Dec"],
  documentTitle:["وثّق لحظتك","Document a moment"], documentSub:["المهم أولاً، والتفاصيل حين تحتاجها.","The essentials first, more detail when you need it."],
  title:["العنوان","Title"], description:["الحكاية","The story"], date:["التاريخ","Date"], exact:["دقيق","Exact"], approx:["تقريبي","Approximate"], period:["فترة","Period"], unknown:["غير معروف","Unknown"],
  media:["وسائط المحطة","Moment media"], photo:["صور","Photos"], video:["فيديو","Video"], audio:["صوت","Audio"], files:["ملفات","Files"], mediaNote:["أزرار توضيحية فقط؛ لا تفتح ملفاتك ولا ترفع محتوى.","Illustrative controls only; no files are opened or uploaded."],
  optional:["تفاصيل اختيارية","Optional details"], notes:["ملاحظات خاصة","Private notes"], links:["الروابط والعلاقات والوسوم","Links, relationships and tags"], docNotice:["التعديلات مؤقتة داخل النموذج فقط ولا تُحفظ.","Edits are temporary in this prototype and are not saved."], preview:["معاينة","Preview"], back:["العودة للرحلة","Back to journey"],
  sharingTitle:["أنت تختار ما تشاركه","You choose what to share"], sharingSub:["معاينة تصور الخصوصية قبل أي نشر فعلي.","Preview the privacy concept before any real publishing."], audience:["من يمكنه المشاهدة؟","Who can view?"], private:["خاص","Private"], linkOnly:["برابط","By link"], public:["عام","Public"], invited:["مدعوون","Invited people"],
  fields:["ما الذي يظهر؟","What is included?"], showTitle:["العنوان والوصف","Title and description"], showDate:["التاريخ","Date"], showPhotos:["الصور","Photos"], showVideo:["الفيديو","Video"], showNotes:["الملاحظات","Notes"], showFiles:["الملفات","Files"], showComments:["التعليقات","Comments"], showLocation:["الموقع","Location"], showPeople:["أسماء الأشخاص","Names"],
  privacyNote:["خيارات تجريبية لا تنشئ رابطاً ولا تغير صلاحيات حقيقية. المحتوى الخاص غير مشمول افتراضياً.","These controls do not create a link or change permissions. Private content is excluded by default."],
  previewShare:["معاينة صفحة الرحلة","Preview journey page"], actionsNote:["إبطال الرابط، مدة الصلاحية، الإلغاء والدعوات تعتمد سياسة وهوية معتمدتين؛ ليست مفعّلة هنا.","Link revocation, expiry, cancellation and invitations depend on approved policy and identity; they are not active here."],
  shareTitle:["قصة رحلة صغيرة","A small journey"], shareIntro:["بعض اللحظات التي اخترت مشاركتها من رحلتي.","A few moments I chose to share from my journey."], shareMock:["معاينة خاصة داخل النموذج؛ ليست صفحة منشورة.","Private preview inside the prototype; not a published page."],
  shareMoment:["لحظة للتعلم","A moment to learn"], shareMomentDesc:["بدأت فكرة بسيطة تتحول إلى عادة جميلة.","A simple idea began to become a lovely habit."], shareMoment2:["خطوة نحو مشروع","A step toward a project"], shareMoment2Desc:["تقدمت خطوة واحدة، وهذا يكفي لليوم.","One step forward was enough for today."], excluded:["هذا الجزء غير محدد للمعاينة.","This field is not selected for preview."],
  pathsTitle:["مسارات تنمو معك","Paths that grow with you"], pathsSub:["الأشياء التي تتعلمها وتبنيها وتتغير معك، متصلة برحلتك.","What you learn, build and change, connected to your journey."],
  interests:["الاهتمامات","Interests"], skills:["المهارات","Skills"], projects:["المشاريع والأهداف","Projects & goals"], practices:["المهام والعادات","Tasks & habits"], achievements:["الإنجازات","Achievements"],
  interestsDesc:["ما يجذبك وكيف يتغير","What draws you and how it changes"], skillsDesc:["معرفة ومهارات تنمو","Knowledge and skills in motion"], projectsDesc:["الأفكار التي تمنحها وقتك","Ideas you make time for"], practicesDesc:["أدوات تدعم رحلتك","Tools that support your journey"], achievementsDesc:["نتائج تستحق التذكر","Results worth remembering"],
  pathDetail:["هذا القسم يربط محتواه بمحطات الرحلة؛ المحتوى هنا توضيحي فقط.","This area connects its content to journey moments; content here is illustrative."],
  searchDesc:["بحث تجريبي في الشاشات ومحطات ومهام الأيام الموجودة في ذاكرة النموذج فقط.","Searches screens and moments and tasks already in this prototype's memory only."], searchPlaceholder:["اكتب اسم محطة أو مهمة…","Search a moment or task…"], noResults:["لا توجد نتائج مطابقة.","No matching results."],
  voiceDesc:["الصوت غير متصل في هذا النموذج؛ لا يُطلب إذن الميكروفون.","Voice is not connected in this prototype; microphone permission is not requested."],
  addDesc:["أضف مهمة أو عادة بسرعة، أو اختر مهمة ممتدة.","Quickly add a task or habit, or choose an extended task."], fakeAction:["هذه معاينة شكلية فقط. لم يُفتح ملف ولم تُرسل بيانات.","Illustrative preview only. No file was opened and no data was sent."],
  chooseDates:["التاريخ والفترة في هذا النموذج للعرض فقط.","Date and period in this prototype are illustrative."], previewSettings:["إعدادات المعاينة","Preview settings"]
};
let language = "ar";
const appScreens = new Set(["day","week","month","year","activities","paths","organizer","document","sharing","preview"]);
function screenFromHash(hash) {
  const requested=hash.replace(/^#/,"");
  return appScreens.has(requested)?requested:"day";
}
let screen = screenFromHash(window.location.hash);
const screenScrollPositions = new Map();
let direction = "flow";
let privacy = "private";
const initialTimeZone=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
const initialDateParts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:initialTimeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(part=>[part.type,part.value]));
let selectedDate = `${initialDateParts.year}-${initialDateParts.month}-${initialDateParts.day}`;
const days = new Map([["2025-11-16",{completed:[true,false,false],sleep:"",wake:"",nap:""}]]);
function dayState() {
  if (!days.has(selectedDate)) days.set(selectedDate,{completed:[false,false,false],sleep:"",wake:"",nap:"",activities:[]});
  const state=days.get(selectedDate);
  state.activities??=[];
  return state;
}
const shown = new Set(["showTitle", "showDate"]);
let titleValue = "", storyValue = "", noteValue = "";
const t = key => (words[key] || [key,key])[language === "ar" ? 0 : 1];
const esc = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const view = document.querySelector("#view");
const dialog = document.querySelector("#dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogContent = document.querySelector("#dialog-content");
let screenTransitionTimer=0;
const button = (label, action, cls="secondary") => `<button class="${cls}" data-action="${action}">${t(label)}</button>`;
const header = (title, sub) => `<div class="page-head"><div><p class="eyebrow">${t("designLab")}</p><h1>${t(title)}</h1><p class="sub">${t(sub)}</p></div><span class="tag">${t("fictional")}</span></div>`;
const levels = () => `<div class="levels" aria-label="${t("journey")}">${["day","week","month","year"].map(id=>`<button data-screen="${id}" class="${screen===id?"active":""}" ${screen===id?'aria-current="page"':""}>${t(id)}</button>`).join("")}</div>`;
const roadPaths = {flow:"M 500 0 C 720 70 280 150 500 210 S 720 310 500 390 S 280 490 500 560",map:"M 500 0 C 250 65 250 160 500 210 S 750 345 500 390 S 250 500 500 560",density:"M 500 0 C 650 70 350 140 500 210 C 780 250 220 340 500 390 C 650 440 350 510 500 560"};
function road() { return `<svg class="road" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true"><path d="${roadPaths[direction]}"/><path class="trail" pathLength="1000" d="${roadPaths[direction]}"/></svg>`; }
function station(key, desc, icon, cls, action) { return `<div class="station-row"><button class="station ${cls}" data-action="${action}"><span class="node-icon">${icon}</span><strong>${t(key)}</strong><small>${t(desc)}</small></button></div>`; }
function side() {
  const state=dayState(), count=state.completed.filter(Boolean).length;
  return `<aside class="side"><section class="panel"><p class="eyebrow">${t("fictional")}</p><h3>${t("daySummary")}</h3><div class="mini-stat"><div class="ring">${count}/3</div><p>${language==="ar"?`${count} من 3 أنشطة مثال مكتملة`:`${count} of 3 example activities complete`}</p></div><div class="divider"></div><div class="legend"><span><i class="dot green"></i>${t("complete")}</span><span><i class="dot"></i>${t("current")}</span><span><i class="dot gold"></i>${t("featured")}</span></div></section><section class="panel"><h3>${t("sleepRhythm")}</h3><label class="field">${t("selectDate")}<input id="selected-date" type="date" value="${esc(selectedDate)}"></label>${[["sleepTime","sleep"],["wakeTime","wake"],["napTime","nap"]].map(([label,key])=>`<label class="field">${t(label)}<input type="time" data-sleep="${key}" value="${esc(state[key])}"></label>`).join("")}<p>${t("sleepHint")}</p></section><section class="panel"><h3>${t("storyNote")}</h3><p>${t("storyNoteDesc")}</p>${button("writeMoment","document")}</section></aside>`;
}
function dayStations() {
  const completed=dayState().completed;
  const items=[["pause","pauseDesc","✦"],["craft","craftDesc","◈"],["walk","walkDesc","☾"],["memory","memoryDesc","✧"]];
  const bend=direction==="flow"?18:direction==="map"?27:36;
  return `<div class="day-route">${items.map(([name,desc,icon],i)=>{
    const done=i<3&&completed[i];
    const next=i<2&&completed[i+1];
    const curve=i%2===0?bend:-bend;
    return `<div class="route-row ${done?"is-complete":""} ${i===3?"is-featured":""}">
      <svg class="route-segment" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${i>0?`<path class="${done?"lit":""}" d="M50 0 C${50-curve} 16 ${50-curve} 34 50 50"/>`:""}
        ${i<items.length-1?`<path class="${next?"lit":""}" d="M50 50 C${50-curve} 66 ${50-curve} 84 50 100"/>`:""}
      </svg>
      <div class="route-card"><button class="route-open" data-action="moment"><span class="node-icon">${icon}</span><strong>${t(name)}</strong><small>${t(desc)}</small></button>${i<3?`<button class="completion" data-complete="${i}" aria-pressed="${done}">${t(done?"undoDone":"markDone")}</button>`:""}</div>
      <span class="route-connector" aria-hidden="true"></span><span class="route-node" aria-hidden="true">${done?"✓":i===3?"✦":""}</span>
    </div>`;
  }).join("")}</div>`;
}
function scenery() {
  return `<div class="landscape" aria-hidden="true"><div class="horizon-sun"></div><svg viewBox="0 0 1000 135" preserveAspectRatio="none"><path class="mountain-far" d="M0 114 L150 66 242 91 405 17 510 74 615 48 745 101 862 50 1000 96 1000 135 0 135Z"/><path class="mountain-near" d="M0 122 L115 98 215 110 340 67 455 111 570 79 706 117 835 76 1000 118 1000 135 0 135Z"/></svg><span class="sun-label">${t("dawn")}</span></div>`;
}
function loadedPeriodSummary(start,end) {
  const loaded=[...days.entries()].filter(([,day])=>Array.isArray(day.stations)).map(([date,day])=>({date,stations:day.stations}));
  const result=MihwerProgressEngine.summarizeLoadedDays(loaded,{start,end,today:zoneDate()});
  const line=(key,stats)=>`<p>${t(key)}: ${stats.ratio===null?t("weekNoTasks"):`<b dir="ltr">${stats.complete}/${stats.eligible} · ${Math.round(stats.ratio*100)}%</b>`}</p>`;
  const recurring=typeof recurringPeriodSummary==="function"?recurringPeriodSummary(start,end):"";
  return `<section class="summary-card" data-period-summary><p>${t("periodLoaded")}: ${result.loadedDays}</p>${line("periodTasks",result.tasks)}${line("periodHabits",result.traditionalHabits)}${recurring}<details class="utility-details"><summary>${language==="ar"?"مصدر النسبة":"Progress source"}</summary><p>${t("periodSource")}</p></details></section>`;
}
function periodDayState(date) {
  if(date>zoneDate())return {state:"future",label:"weekFuture"};
  const tasks=days.get(date)?.stations?.flatMap(station=>station.tasks);
  if(!tasks)return {state:"no-data",label:"periodNoData"};
  const stats=MihwerProgressEngine.summarize(tasks.map(task=>({id:task.id,date,status:task.status})));
  if(stats.ratio===null)return {state:"empty",label:"periodEmpty"};
  if(stats.ratio>=1)return {state:"complete",label:"periodComplete"};
  if(stats.complete>0)return {state:"partial",label:"periodPartial"};
  return {state:"pending",label:"periodPending"};
}
function periodRangeState(start,end) {
  const loaded=[...days.entries()].filter(([,day])=>Array.isArray(day.stations)).map(([date,day])=>({date,stations:day.stations}));
  const result=MihwerProgressEngine.summarizeLoadedDays(loaded,{start,end,today:zoneDate()});
  if(!result.loadedDays)return "no-data";
  const summary=result.tasks;
  return summary.ratio===null?"empty":summary.ratio>=1?"complete":summary.complete>0?"partial":"pending";
}
function periodTrailStop({date,screen,label,state,detail="",extra="",actionText,selected=false},index) {
  const stateKey=state==="future"?"weekFuture":state==="no-data"?screen==="month"?"periodNoDataRange":"periodNoData":state==="empty"?"periodEmpty":`period${state[0].toUpperCase()+state.slice(1)}`;
  const curve=index%2?70:30;
  return `<div class="week-stop period-day-${state} ${selected?"selected-period":""}"><svg class="week-segment" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 C${curve} 16 ${curve} 34 50 50 C${curve} 66 ${curve} 84 50 100"/></svg><button class="week-card" data-period-date="${date}" data-period-screen="${screen}" title="${t(stateKey)}" aria-label="${esc(label)} · ${t(stateKey)}"><strong>${esc(label)}</strong>${detail?`<span class="period-stop-detail">${detail}</span>`:""}<small class="period-completion-label">${t(stateKey)}</small>${extra}<small>${actionText}</small></button><span class="week-dot" aria-hidden="true"></span></div>`;
}
function periodExperience({eyebrow,title,subtitle,trail,legend="",summary=""}) {
  const routeLabel=language==="ar"?"المسار":"Journey";
  return `<div class="day-experience period-experience period-experience-${screen}"><section class="day-hero period-hero">
    <div class="period-scenery" aria-hidden="true"></div>
    <div class="hero-welcome period-welcome"><p class="eyebrow">${esc(eyebrow)} · ${t("fictional")}</p><h1>${title}</h1><p>${subtitle}</p></div>
    <section class="period-route-panel" aria-label="${routeLabel}">
      <div class="period-route-heading"><span>${routeLabel}</span><span class="period-route-count">${trail.length}</span></div>
      <div class="week-trail period-trail">${trail.join("")}</div>
      ${legend?`<p class="muted period-legend">${legend}</p>`:""}
      ${summary}
    </section>
  </section></div>`;
}
function journey() {
  let content = "";
  if (screen === "day") {
    const items=typeof routeEntries==="function"?routeEntries():[];
    content = `<div class="day-experience"><section class="day-hero" aria-label="${t("dayTitle")}">
      ${scenery()}<div class="hero-welcome"><p class="eyebrow">${esc(selectedDate)} · ${t("fictional")}</p><h1>${typeof dayGreeting==="function"?dayGreeting():t("dayTitle")}</h1><p>${typeof lt==="function"?lt("heroSub"):t("journeySub")}</p></div>
      ${typeof prayerSummary==="function"?`<div class="hero-prayer">${prayerSummary(items)}</div>`:""}${dayStations()}
      </section></div>${typeof extendedSection==="function"?`<div class="extended-journey">${extendedSection()}</div>`:""}`;
  } else if (screen === "week") {
    const date=new Date(`${selectedDate}T12:00:00Z`);
    const weekDates=Array.from({length:7},(_,i)=>{
      const d=new Date(date);d.setUTCDate(d.getUTCDate()+i-3);
      return d.toISOString().slice(0,10);
    });
    const week=weekDates.map((iso,i)=>{
      const d=new Date(`${iso}T12:00:00Z`),label=new Intl.DateTimeFormat(language==="ar"?"ar":"en",{timeZone:"UTC",weekday:"long",month:"short",day:"numeric"}).format(d);
      const tasks=days.get(iso)?.stations?.flatMap(station=>station.tasks);
      const stats=tasks?MihwerProgressEngine.summarize(tasks.map(task=>({id:task.id,date:iso,status:task.status}))):null;
      const completion=periodDayState(iso);
      const detail=iso>zoneDate()?t("weekFuture"):stats?.eligible?`${t("weekProgress")}: <b dir="ltr">${stats.complete}/${stats.eligible} · ${Math.round(stats.ratio*100)}%</b>`:tasks?t("weekNoTasks"):t("weekNoData");
      return periodTrailStop({date:iso,screen:"day",label,state:completion.state,detail,extra:typeof recurringWeekDetail==="function"?recurringWeekDetail(iso):"",actionText:t("selectDay"),selected:iso===selectedDate},i);
    });
    content = periodExperience({eyebrow:selectedDate,title:t("weekTitle"),subtitle:t("weekSub"),trail:week,legend:typeof recurringWeekDetail==="function"?ht("weekHabitNote"):"",summary:loadedPeriodSummary(weekDates[0],weekDates[6])});
  } else if (screen === "month") {
    const [year,month]=selectedDate.split("-").map(Number), count=new Date(Date.UTC(year,month,0)).getUTCDate();
    const label=new Intl.DateTimeFormat(language==="ar"?"ar":"en",{timeZone:"UTC",month:"long",year:"numeric"}).format(new Date(Date.UTC(year,month-1,15)));
    const start=`${year}-${String(month).padStart(2,"0")}-01`,end=`${year}-${String(month).padStart(2,"0")}-${count}`;
    const stops=Array.from({length:count},(_,i)=>{
      const iso=`${year}-${String(month).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`,day=new Date(Date.UTC(year,month-1,i+1));
      const dayLabel=new Intl.DateTimeFormat(language==="ar"?"ar":"en",{timeZone:"UTC",weekday:"long",day:"numeric"}).format(day);
      const completion=periodDayState(iso),tasks=days.get(iso)?.stations?.flatMap(station=>station.tasks);
      const stats=tasks?MihwerProgressEngine.summarize(tasks.map(task=>({id:task.id,date:iso,status:task.status}))):null;
      const detail=stats?.eligible?`${t("weekProgress")}: <b dir="ltr">${stats.complete}/${stats.eligible} · ${Math.round(stats.ratio*100)}%</b>`:"";
      return periodTrailStop({date:iso,screen:"day",label:dayLabel,state:completion.state,detail,actionText:t("selectDay"),selected:iso===selectedDate},i);
    });
    content = periodExperience({eyebrow:label,title:t("monthTitle"),subtitle:t("monthSub"),trail:stops,legend:`${t("periodComplete")} · ${t("periodPartial")} · ${t("periodPending")}`,summary:loadedPeriodSummary(start,end)});
  } else {
    const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const year=selectedDate.slice(0,4);
    const stops=months.map((monthName,i)=>{
      const month=String(i+1).padStart(2,"0"),monthStart=`${year}-${month}-01`;
      const monthEnd=`${year}-${month}-${String(new Date(Date.UTC(Number(year),i+1,0)).getUTCDate()).padStart(2,"0")}`;
      const state=periodRangeState(monthStart,monthEnd);
      return periodTrailStop({date:monthStart,screen:"month",label:t(monthName),state,actionText:t("selectMonth")},i);
    });
    content = periodExperience({eyebrow:year,title:t("yearTitle"),subtitle:t("yearSub"),trail:stops,legend:`${t("periodComplete")} · ${t("periodPartial")} · ${t("periodPending")}`,summary:loadedPeriodSummary(`${year}-01-01`,`${year}-12-31`)});
  }
  return levels()+content;
}
function documentView() {
  return header("documentTitle","documentSub")+`<div class="content-grid"><section class="panel"><div class="cover"><p>✦ &nbsp; ${t("fictional")}</p></div><label class="field">${t("title")}<input id="moment-title" value="${esc(titleValue)}" placeholder="${t("shareMoment")}"></label><label class="field">${t("description")}<textarea id="moment-story" placeholder="${t("shareMomentDesc")}">${esc(storyValue)}</textarea></label><label class="field">${t("date")}<select id="date-kind">${["exact","approx","period","unknown"].map(k=>`<option>${t(k)}</option>`).join("")}</select></label><p class="disabled-note">${t("chooseDates")}</p><details><summary>${t("optional")}</summary><label class="field">${t("notes")}<textarea id="moment-note">${esc(noteValue)}</textarea></label><label class="field">${t("links")}<input></label></details><p class="disabled-note">${t("docNotice")}</p><div class="options">${button("back","day")}${button("previewShare","preview","primary")}</div></section><aside class="side"><section class="panel"><h3>${t("media")}</h3><p>${t("mediaNote")}</p><div class="media-grid">${["photo","video","audio","files"].map(k=>button(k,"fake")).join("")}</div></section><section class="panel"><h3>${t("storyNote")}</h3><p>${t("documentSub")}</p></section></aside></div>`;
}
function sharingView() {
  const fields=["showTitle","showDate","showPhotos","showVideo","showNotes","showFiles","showComments","showLocation","showPeople"];
  return header("sharingTitle","sharingSub")+`<div class="content-grid"><section class="panel"><h2>${t("audience")}</h2><div class="privacy-grid">${["private","linkOnly","public","invited"].map(k=>`<label><input type="radio" name="privacy" value="${k}" ${privacy===k?"checked":""}> <span>${t(k)}</span></label>`).join("")}</div><div class="divider"></div><h2>${t("fields")}</h2><div class="checkboxes">${fields.map(k=>`<label><input type="checkbox" data-field="${k}" ${shown.has(k)?"checked":""}> ${t(k)}</label>`).join("")}</div><p class="disabled-note">${t("privacyNote")}</p><div class="options">${button("previewShare","preview","primary")}</div></section><aside class="side"><section class="panel"><h3>${t("previewSettings")}</h3><p>${t("actionsNote")}</p><p>${t("privacyNote")}</p></section></aside></div>`;
}
function previewView() {
  return `<div class="story">${header("shareTitle","shareMock")}<div class="cover"><div><p>✦ &nbsp; ${t("fictional")}</p><h1>${shown.has("showTitle")?t("shareTitle"):t("excluded")}</h1></div></div><section class="panel" style="margin-top:16px"><p class="eyebrow">${t("shareMock")}</p><p>${shown.has("showTitle")?t("shareIntro"):t("excluded")}</p><div class="story-line">${["shareMoment","shareMoment2"].map((k,i)=>`<article><p class="eyebrow">${shown.has("showDate")?(i===0?"16 NOV 2025":"22 NOV 2025"):""}</p><h3>${shown.has("showTitle")?t(k):t("excluded")}</h3>${shown.has("showTitle")?`<p>${t(k+"Desc")}</p>`:""}</article>`).join("")}</div><p class="disabled-note">${t("privacyNote")}</p>${button("sharing","sharing")}</section></div>`;
}
function pathsView() {
  let data=[["interests","interestsDesc","✳"],["learning","learningDesc","✦"],["skills","skillsDesc","◌"],["projects","projectsDesc","◈"],["practices","practicesDesc","✓"],["achievements","achievementsDesc","✧"]];
  return header("pathsTitle","pathsSub")+`<div class="grid">${data.map(([name,desc,icon])=>`<button class="tile" data-path="${name}"><span class="big">${icon}</span><h3>${t(name)}</h3><small>${t(desc)}</small></button>`).join("")}</div><div class="divider"></div><section class="panel"><h3>${t("storyNote")}</h3><p class="muted">${t("pathDetail")}</p>${button("journey","day")}</section>`;
}
function render() {
  const taskSlice=window.MihwarTaskSlice;
  const serverScreen=Boolean(taskSlice&&screen==="activities");
  document.documentElement.lang=language; document.documentElement.dir=language==="ar"?"rtl":"ltr";
  document.body.classList.toggle("journey-day",screen==="day"&&!serverScreen);
  document.body.classList.toggle("journey-period",["week","month","year"].includes(screen));
  document.body.classList.add("journey-worldwide");
  document.querySelectorAll("[data-text]").forEach(el=>el.textContent=t(el.dataset.text));
  document.querySelectorAll("[data-text-aria]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.textAria)));
  document.querySelectorAll(".main-nav [data-screen],.mobile-nav [data-screen]").forEach(el=>el.classList.toggle("active",el.dataset.screen===(["day","week","month","year","document"].includes(screen)?"day":screen==="preview"?"sharing":screen)));
  document.querySelector(".topbar")?.removeAttribute("inert");
  document.querySelector(".mobile-nav")?.removeAttribute("inert");
  document.querySelectorAll(".main-nav button,.mobile-nav button").forEach(control=>{control.disabled=false;});
  document.querySelectorAll(".top-actions button").forEach(control=>{control.disabled=serverScreen;});
  document.querySelectorAll(".notice,#scenic-disclosure").forEach(el=>{el.style.display=serverScreen?"none":"";});
  if(serverScreen){
    view.innerHTML=`<div data-backend-task-slice>${taskSlice.render()}</div><section class="progress-settings-entry"><button type="button" class="secondary" data-utility="settings">${language==="ar"?"الإعدادات والإحصائيات":"Settings & progress"}</button></section>`;
  }else{
    const preview=taskSlice?`<p class="disabled-note" data-journey-preview role="status">${language==="ar"?"معاينة محلية للواجهة الأصلية؛ عناصرها ليست بيانات محفوظة في الخادم.":"Local preview of the original interface; its items are not server-saved data."} <button class="secondary" data-screen="activities">${language==="ar"?"المهام والعادات المحفوظة":"Saved tasks and habits"}</button></p>`:"";
    view.innerHTML = preview+(["day","week","month","year"].includes(screen)?journey():screen==="document"?documentView():screen==="sharing"?sharingView():screen==="preview"?previewView():screen==="activities"&&typeof activitiesView==="function"?activitiesView():screen==="organizer"&&typeof organizerView==="function"?organizerView():pathsView());
    if (typeof livingMount === "function") livingMount();
    const route=scrollRouteForCurrentScreen();
    if(route&&!route.root.matches(".journey-viewport")&&!route.items.some(item=>item.classList.contains("is-focused"))){
      focusScrollRoute(route,scrollRouteIndex(route),false);
    }
  }
}
const scrollRouteTypes=[
  {root:".journey-viewport",item:".route-row"},
  {root:".week-trail",item:".week-stop"},
  {root:".calendar",item:"[data-period-date]"},
  {root:".year-grid",item:"[data-period-date]"},
  {root:".life-path-grid",item:".life-path-card"},
  {root:"#view .grid",item:".tile"},
  {root:"#view .content-grid",item:".panel"},
  {root:".activity-list",item:".activity-entry,.activity-card,.extended-card"}
];
const routeWheelGate=new MihwerWheelGestureGate();
let routeNativeScrollIntentUntil=0,routeNativeTouchStartY=null;
function scrollRouteAt(target) {
  if(target.closest("dialog"))return null;
  for(const type of scrollRouteTypes){
    const root=target.closest(type.root);
    if(!root)continue;
    const item=target.closest(type.item);
    const items=[...root.querySelectorAll(type.item)];
    if(items.length&&(!item||root.contains(item)))return {root,item,type,items};
  }
  return null;
}
function scrollRouteForCurrentScreen() {
  const rootByScreen={
    day:".journey-viewport",week:".week-trail",month:".week-trail",year:".week-trail",
    activities:".activity-list",paths:".life-path-grid",sharing:"#view .content-grid",
    document:"#view .content-grid",preview:"#view .content-grid"
  };
  const selector=rootByScreen[screen];
  if(!selector)return null;
  const type=scrollRouteTypes.find(candidate=>candidate.root===selector);
  const root=document.querySelector(selector);
  const items=type&&root?[...root.querySelectorAll(type.item)]:[];
  return root&&items.length?{root,item:null,type,items}:null;
}
function scrollRouteIndex(route) {
  const focused=route.items.findIndex(item=>item.classList.contains("is-focused"));
  if(focused>=0)return focused;
  const selected=route.items.findIndex(item=>item.classList.contains("selected-period")||item.classList.contains("marked")||item.classList.contains("is-current"));
  if(selected>=0)return selected;
  const center=innerHeight/2;
  return route.items.reduce((best,item,index)=>{
    const bounds=item.getBoundingClientRect(),distance=Math.abs((bounds.top+bounds.bottom)/2-center);
    return distance<best.distance?{index,distance}:best;
  },{index:0,distance:Infinity}).index;
}
function focusScrollRoute(route,index,scroll=true) {
  if(!route?.items.length)return;
  const selected=Math.max(0,Math.min(route.items.length-1,index));
  if(route.root.matches(".journey-viewport")&&typeof focusRoute==="function"){
    focusRoute(selected,true);
    if(scroll)route.items[selected].scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }else{
    route.items.forEach((item,itemIndex)=>{
      item.classList.toggle("is-focused",itemIndex===selected);
      item.classList.toggle("is-traveled",itemIndex<=selected);
      if(itemIndex===selected&&scroll)item.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    });
    route.root.dataset.scrollRouteIndex=String(selected);
    const progress=route.items.length>1?selected/(route.items.length-1):0;
    document.body.style.setProperty("--journey-progress",String(progress));
    document.body.style.setProperty("--journey-pan-shift",`${-progress*12}%`);
    document.body.style.setProperty("--journey-scale",String(1+progress*.08));
    const photo=document.querySelector(".journey-photo");
    if(photo){photo.style.setProperty("--journey-pan-y",`${43+progress*20}%`);photo.style.setProperty("--journey-photo-zoom",`${112+progress*10}%`);}
  }
}
function stepScrollRoute(route,delta) {
  if(!route?.items.length)return false;
  if(route.root.matches(".journey-viewport")&&route.root.dataset.scrollAtFinish==="true"&&delta<0){
    delete route.root.dataset.scrollAtFinish;
    focusScrollRoute(route,route.items.length-1);
    return true;
  }
  const current=Number(route.root.dataset.routeIndex??route.root.dataset.scrollRouteIndex);
  const index=Number.isInteger(current)?current:scrollRouteIndex(route);
  const next=index+(delta>0?1:-1);
  if(route.root.matches(".journey-viewport")&&next>=route.items.length&&delta>0){
    route.root.dataset.scrollAtFinish="true";
    document.querySelector("#harvest-title")?.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    return true;
  }
  if(next<0||next>=route.items.length)return route.root.matches(".journey-viewport");
  delete route.root.dataset.scrollAtFinish;
  focusScrollRoute(route,next);
  return true;
}
document.addEventListener("wheel",event=>{
  const blocked=event.target.closest("dialog,input,textarea,select,[contenteditable='true'],[data-no-route-scroll],[data-entry-drag],.topbar,.mobile-nav,.levels,.journey-utility");
  const dayViewport=event.target.closest(".journey-viewport");
  if(screen==="day"&&dayViewport?.dataset.scrollAtFinish==="true"&&event.deltaY>0)return;
  const route=scrollRouteAt(event.target);
  if(!route||event.ctrlKey||Math.abs(event.deltaY)<1||blocked)return;
  if(!MihwerScrollGesture.isDiscreteWheel(event)){
    if(route.root.matches(".journey-viewport"))routeNativeScrollIntentUntil=Date.now()+500;
    return;
  }
  const now=Date.now();
  if(!routeWheelGate.shouldAdvance(route.root,now)){event.preventDefault();return;}
  event.preventDefault();
  stepScrollRoute(route,event.deltaY);
},{passive:false});
document.addEventListener("touchstart",event=>{
  if(event.touches.length===1&&event.target.closest(".journey-viewport")){
    routeNativeTouchStartY=event.touches[0].clientY;
  }else routeNativeTouchStartY=null;
},{passive:true});
document.addEventListener("touchmove",event=>{
  if(routeNativeTouchStartY===null||event.touches.length!==1)return;
  if(Math.abs(routeNativeTouchStartY-event.touches[0].clientY)>8)routeNativeScrollIntentUntil=Date.now()+700;
},{passive:true});
document.addEventListener("touchend",()=>{routeNativeTouchStartY=null;},{passive:true});
document.addEventListener("touchcancel",()=>{routeNativeTouchStartY=null;},{passive:true});
let routeScrollSyncQueued=false;
document.addEventListener("scroll",event=>{
  const viewport=event.target;
  if(screen!=="day"||Date.now()>routeNativeScrollIntentUntil||!viewport.matches?.(".journey-viewport")||routeScrollSyncQueued)return;
  routeScrollSyncQueued=true;
  requestAnimationFrame(()=>{
    routeScrollSyncQueued=false;
    if(screen!=="day"||!viewport.isConnected)return;
    const rows=[...viewport.querySelectorAll(".route-row")];
    if(!rows.length)return;
    const center=viewport.getBoundingClientRect().top+viewport.clientHeight/2;
    let closest=0,smallest=Infinity;
    rows.forEach((row,index)=>{
      const bounds=row.getBoundingClientRect(),distance=Math.abs((bounds.top+bounds.bottom)/2-center);
      if(distance<smallest){smallest=distance;closest=index;}
    });
    if(!rows[closest].classList.contains("is-focused"))focusRoute(closest,true);
  });
},{passive:true,capture:true});
document.addEventListener("keydown",event=>{
  if(!["ArrowUp","ArrowDown","PageUp","PageDown"].includes(event.key)||
    event.target.closest("button,input,select,textarea,[contenteditable='true']"))return;
  const route=scrollRouteAt(event.target);
  if(!route||route.root.matches(".journey-viewport"))return;
  event.preventDefault();
  stepScrollRoute(route,event.key==="ArrowUp"||event.key==="PageUp"?-1:1);
});
function go(next,updateHistory=true) {
  if(screen!=="day")screenScrollPositions.set(screen,window.scrollY);
  routeWheelGate.reset();
  routeNativeScrollIntentUntil=0;routeNativeTouchStartY=null;
  screen=appScreens.has(next)?next:"day";
  if(updateHistory&&window.location.hash!==`#${screen}`)window.history.pushState(null,"",`#${screen}`);
  document.body.classList.remove("screen-arrive");
  render();
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.body.classList.add("screen-arrive");
    clearTimeout(screenTransitionTimer);
    screenTransitionTimer=setTimeout(()=>document.body.classList.remove("screen-arrive"),520);
  }
  window.scrollTo(0,next==="day"?0:screenScrollPositions.get(next)||0);
}
function restoreHashScreen() {
  const next=screenFromHash(window.location.hash);
  if(next===screen)return;
  if(dialog.open)dialog.close();
  go(next,false);
}
window.addEventListener("hashchange",restoreHashScreen);
window.addEventListener("popstate",restoreHashScreen);
function openDialog(title, html) { dialogTitle.textContent=t(title); dialogContent.innerHTML=html; if(!dialog.open)dialog.showModal(); }
document.addEventListener("click", event => {
  const target=event.target.closest("[data-screen],[data-action],[data-direction],[data-path],[data-complete],[data-period-date]");
  if (!target) return;
  if(target.dataset.periodDate){selectedDate=target.dataset.periodDate;followToday=selectedDate===zoneDate();go(target.dataset.periodScreen);return;}
  if (target.dataset.screen) { event.preventDefault(); if(dialog.open)dialog.close(); go(target.dataset.screen); }
  if (target.dataset.direction) { direction=target.dataset.direction; render(); }
  if (target.dataset.complete !== undefined) {
    const index=Number(target.dataset.complete);
    dayState().completed[index]=!dayState().completed[index];
    render();
    const updated=document.querySelector(`[data-complete="${index}"]`);
    updated.closest(".route-row").classList.add("changed");
    updated.focus({preventScroll:true});
  }
  if (target.dataset.path) openDialog(target.dataset.path,`<p class="sub">${t("pathDetail")}</p><div class="options">${button("journey","day")}</div>`);
  if (target.dataset.action) {
    let action=target.dataset.action;
    if (action==="moment") openDialog("momentTitle",`<p class="eyebrow">${t("fictional")}</p><h3>${t("shareMoment")}</h3><p class="sub">${t("shareMomentDesc")}</p><div class="divider"></div><div class="options">${button("writeMoment","document","primary")}${button("previewShare","preview")}</div>`);
    else if(action==="fake") openDialog("media",`<p>${t("fakeAction")}</p>`);
    else if(action==="new-task"){quickTaskCreate();return;}
    else if(action==="new-extended-task"){extendedCreate();return;}
    else if(action==="new-habit"){habitCreate();return;}
    else { if(dialog.open)dialog.close(); go(action); }
  }
});
document.addEventListener("change", event => {
  if(event.target.id==="language"){language=event.target.value;render();}
  if(event.target.id==="theme")document.body.dataset.theme=event.target.value;
  if(event.target.id==="selected-date" && event.target.value){selectedDate=event.target.value;render();}
  if(event.target.name==="privacy")privacy=event.target.value;
  if(event.target.dataset.field)event.target.checked?shown.add(event.target.dataset.field):shown.delete(event.target.dataset.field);
});
document.addEventListener("input",event=> {
  if(event.target.dataset.sleep)dayState()[event.target.dataset.sleep]=event.target.value;
  if(event.target.id==="moment-title")titleValue=event.target.value;
  if(event.target.id==="moment-story")storyValue=event.target.value;
  if(event.target.id==="moment-note")noteValue=event.target.value;
  if(event.target.id==="design-search"){
    const term=event.target.value.trim().toLocaleLowerCase();
    const matches=term?["day","week","month","year","document","preview","sharing","paths","activities"].filter(k=>(t(k==="activities"?"practices":k)+" "+t(k==="document"?"documentTitle":k==="preview"?"shareTitle":k==="activities"?"practices":k)).toLocaleLowerCase().includes(term)):[];
    const records=[];
    if(term)for(const [date,state] of days)for(const station of state.stations||[]){
      const title=stationTitle(station);
      if(title.toLocaleLowerCase().includes(term))records.push({date,id:station.id,title,type:language==="ar"?"محطة":"Moment"});
      for(const task of station.tasks){if(task.archived)continue;const name=task.name[language==="ar"?0:1];if(name.toLocaleLowerCase().includes(term))records.push({date,id:station.id,title:name,type:language==="ar"?"مهمة":"Task"});}
    }
    document.querySelector("#search-results").innerHTML=matches.length||records.length?matches.map(k=>`<button class="secondary" data-screen="${k}">${esc(t(k==="document"?"documentTitle":k==="preview"?"shareTitle":k==="activities"?"practices":k))}</button>`).join("")+records.map(record=>`<button class="secondary" data-search-date="${esc(record.date)}" data-search-station="${esc(record.id)}">${esc(record.title)} · ${record.type} · ${esc(record.date)}</button>`).join(""):term?`<p>${t("noResults")}</p>`:"";
  }
});
document.addEventListener("click",event=>{
  const result=event.target.closest("[data-search-station]");if(!result)return;
  selectedDate=result.dataset.searchDate;followToday=selectedDate===zoneDate();dialog.close();go("day");focusStation(result.dataset.searchStation);
});
document.querySelector("#open-search").addEventListener("click",()=>openDialog("search",`<p class="sub">${t("searchDesc")}</p><label class="field">${t("search")}<input id="design-search" placeholder="${t("searchPlaceholder")}"></label><div id="search-results" class="dialog-list"></div>`));
document.querySelector("#open-voice").addEventListener("click",()=>openDialog("voice",`<p>${t("voiceDesc")}</p>`));
document.querySelector("#open-add").addEventListener("click",()=>quickTaskCreate());
document.querySelector("#dialog-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();dialog.close();}});
document.addEventListener("DOMContentLoaded",render,{once:true});
