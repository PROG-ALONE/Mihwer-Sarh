"use strict";

const MihwerScenicJourney=Object.freeze({
  pointBetween(a,b,progress) {
    const t=Math.max(0,Math.min(1,progress)),u=1-t;
    return {x:a.x+(b.x-a.x)*(3*t*t-2*t*t*t),y:u*u*u*a.y+3*u*u*t*(a.y+(b.y-a.y)/2)+3*u*t*t*(b.y-(b.y-a.y)/2)+t*t*t*b.y};
  },
  pointOnPeriodPath(a,c1,c2,b,progress) {
    const t=Math.max(0,Math.min(1,progress)),u=1-t;
    return {
      x:u*u*u*a.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*b.x,
      y:u*u*u*a.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*b.y
    };
  },
  walkingDuration(distance) {
    return Math.min(4500,900+Math.max(0,distance)*320);
  },
  scheduleDelta(action,entryMinute,date,today,now) {
    if(action==="earlier")return -15;
    if(action==="later")return 15;
    if(action==="tomorrow")return 1440;
    if(action==="now")return Math.round((Date.parse(`${today}T12:00:00Z`)-Date.parse(`${date}T12:00:00Z`))/86400000)*1440+now-entryMinute;
    throw new Error("Unknown schedule action");
  },
  periodPosition(dates,date,minute) {
    if(!Array.isArray(dates)||!dates.length||!Number.isFinite(minute)||minute<0||minute>1440||
      dates.some(value=>typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)||
        !Number.isFinite(Date.parse(`${value}T00:00:00Z`))||new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)!==value)) {
      throw new Error("Invalid period position input");
    }
    if(typeof date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(date)||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`))||new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)!==date) {
      throw new Error("Invalid period target date");
    }
    if(dates.length===1)return 0;
    const instants=dates.map(value=>Date.parse(`${value}T00:00:00Z`));
    if(instants.some((value,index)=>index>0&&value<=instants[index-1]))throw new Error("Period dates must be ordered");
    const target=Date.parse(`${date}T00:00:00Z`)+minute*60000;
    if(!Number.isFinite(target))throw new Error("Invalid period target date");
    if(target<=instants[0])return 0;
    if(target>=instants.at(-1))return dates.length-1;
    const index=instants.findIndex((value,i)=>i<instants.length-1&&target>=value&&target<=instants[i+1]);
    return index+(target-instants[index])/(instants[index+1]-instants[index]);
  }
});
if(typeof module==="object"&&module.exports)module.exports=MihwerScenicJourney;

if(typeof document!=="undefined")(()=>{
  const copy={
    title:["رحلة على مهل","One step at a time"],
    note:["رحلة غامرة محاكية، بلا كاميرا أو واقع معزز ميداني. حصاد اليوم فقط يُحفظ على هذا الجهاز.","An immersive simulated journey, with no camera or physical-world AR. Only the daily reflection is saved on this device."],
    traveler:["شخصية الرحلة","Your traveler"],boy:["ولد","Boy"],girl:["بنت","Girl"],
    intention:["نيّة اليوم","Daily intention"],
    earlier:["تقديم ١٥ د","15 min earlier"],later:["تأجيل ١٥ د","15 min later"],
    tomorrow:["إلى الغد","Move to next day"],now:["إعادة الجدولة للآن","Reschedule to now"],
    missed:["فات الموعد؛ يمكنك إعادة الجدولة دون تسجيل إنجاز تلقائي.","The scheduled time has passed; reschedule without automatically completing it."],
    schedule:["تعديل الموعد","Adjust schedule"],finish:["إلى حصاد اليوم","Visit today's finish"],
    harvest:["حصاد الرحلة","Your journey, gathered"],harvestNote:["كل خطوة لها أثر. هذا ملخص ما سجّلته، وليس حكماً على يومك.","Every step matters. This reflects what you recorded, not the worth of your day."],
    openHarvest:["افتح ملخص اليوم","Open today's summary"],harvestInvite:["وصلت إلى نهاية الطريق؛ خذ لحظة لترى ما أنجزته.","You reached the end of the road. Take a moment to see what you accomplished."],
    celebrateNone:["حتى الخطوة الصغيرة تُحسب؛ ما زال بإمكانك اختيار ما يناسبك.","Even a small step counts; you can still choose what feels right for you."],
    celebrateSome:["تقدّم جميل، وكل ما أنجزته يستحق التقدير.","A meaningful step forward; what you completed deserves recognition."],
    celebrateMost:["إنجاز رائع؛ اقتربت من إكمال ما خططت له.","Wonderful progress; you came close to completing what you planned."],
    celebrateAll:["ما شاء الله، أتممت ما خططت له اليوم. أحسنت.","MashaAllah, you completed what you planned today. Well done."],
    emptyIntention:["لك أن تبدأ من جديد في كل خطوة.","Every step is a chance to begin again."],
    walking:["في الطريق إلى المحطة…","Walking to your moment…"],arrived:["وصلت إلى المحطة.","You have arrived."],
    habits:["العادات المنجزة","Habits completed"],prayers:["الصلوات المسجلة","Prayers recorded"],
    periodLivePosition:["موضع التاريخ والوقت الحاليين","Position at current date and time"],
    periodPreviewPosition:["موضع التاريخ والوقت المعروضين","Position at displayed date and time"],
    recordNote:["لا تُسجّل المهام أو الصلاة أو العادات بمجرد الوصول؛ سجّلها بنفسك من تفاصيل المحطة.","Arrival never completes tasks, prayers or habits; record them yourself in each moment's details."]
  };
  const text=key=>copy[key][language==="ar"?0:1];
  let travelerChoice="boy",position=0,anchors=[],walking=false,frame=0,movementFrame=0,periodTraveler=null,periodPosition=null,periodGeometry=null,periodTargetIndex=-1,periodTargetPosition=0,periodLastFrame=0,periodFrame=0,journeyGeneration=0,allowArrivalClick=false,resizeObserver=null,autoFollowTimer=0,savedRouteScrollTop=0,completionAudio=null;
  globalThis.MihwerJourneySettings={get traveler(){return travelerChoice;}};
  globalThis.MihwerScenicJourneyEffect=Object.freeze({flashCompletion,updatePeriodTraveler:()=>updatePeriodTraveler()});
  const travelerSvg=()=>`<svg viewBox="0 0 42 72" aria-hidden="true"><ellipse cx="21" cy="68" rx="13" ry="3" fill="#071b27" opacity=".45"/><g class="traveler-body"><path class="traveler-hair" d="M12 17Q9 1 21 2q14 0 10 18l3 13H9Z"/><circle cx="21" cy="13" r="8" fill="#d9a77f"/><path d="M13 10q8-11 17 0l-2-7-13 1Z" fill="#332722"/><path class="traveler-coat" d="m14 25 7-5 8 5 3 22H11Z"/><path class="traveler-skirt" d="m14 32-6 22h27l-7-22Z"/><path class="traveler-arm arm-left" d="m13 27-6 17" stroke="#d9a77f"/><path class="traveler-arm arm-right" d="m29 27 7 15" stroke="#d9a77f"/><path class="traveler-leg leg-left" d="m17 46-2 17-4 3" stroke="#243445"/><path class="traveler-leg leg-right" d="m26 46 2 17 5 3" stroke="#243445"/><path d="M17 25h8v14h-8Z" fill="#d5aa62"/><path d="m16 26-2 14m12-14 3 14" stroke="#f3d9a0" stroke-width="2"/></g></svg>`;
  function setChoice(value) {
    travelerChoice=value==="girl"?"girl":"boy";
    document.querySelectorAll("[data-traveler-choice]").forEach(select=>select.value=travelerChoice);
    document.querySelectorAll(".scenic-traveler").forEach(node=>{node.dataset.person=travelerChoice;node.setAttribute("aria-label",`${text("traveler")}: ${text(travelerChoice)}`);});
  }
  function roadSegment(index) {
    const end=anchors[index];if(!end)return "";
    if(index===0)return `M${end.x} ${Math.max(0,end.y-90)} L${end.x} ${end.y}`;
    const start=anchors[index-1],middle=(start.y+end.y)/2;
    return `M${start.x} ${start.y} C${start.x} ${middle} ${end.x} ${middle} ${end.x} ${end.y}`;
  }
  function drawRoad() {
    const route=document.querySelector(".day-route"),road=route?.querySelector(".scenic-road");
    if(!road)return;
    const bounds=route.getBoundingClientRect();
    anchors=[...route.querySelectorAll(".route-node")].map(node=>{
      const box=node.getBoundingClientRect();
      return {x:box.left-bounds.left+box.width/2,y:box.top-bounds.top+box.height/2};
    });
    if(!anchors.length)return;
    const width=bounds.width,height=route.scrollHeight;
    road.setAttribute("viewBox",`0 0 ${width} ${height}`);
    road.style.height=`${height}px`;
    let d=`M${anchors[0].x} ${Math.max(0,anchors[0].y-90)} L${anchors[0].x} ${anchors[0].y}`;
    for(let i=1;i<anchors.length;i++){
      const a=anchors[i-1],b=anchors[i],middle=(a.y+b.y)/2;
      d+=` C${a.x} ${middle} ${b.x} ${middle} ${b.x} ${b.y}`;
    }
    road.querySelectorAll("path:not(.scenic-road-progress)").forEach(path=>path.setAttribute("d",d));
    route.querySelectorAll(".route-row").forEach((row,index)=>{
      const card=row.querySelector(".route-card"),node=row.querySelector(".route-node"),connector=road.querySelector(`.scenic-card-connector[data-route-entry="${CSS.escape(row.dataset.entry)}"]`);
      if(!card||!node||!connector)return;
      const cardBox=card.getBoundingClientRect(),nodeBox=node.getBoundingClientRect();
      const cardOnRight=cardBox.left>nodeBox.left;
      const startX=(cardOnRight?nodeBox.right:nodeBox.left)-bounds.left;
      const endX=(cardOnRight?cardBox.left:cardBox.right)-bounds.left;
      const y=nodeBox.top-bounds.top+nodeBox.height/2;
      connector.setAttribute("d",`M${startX} ${y} L${endX} ${y}`);
      connector.classList.toggle("is-lit",row.classList.contains("is-complete"));
    });
    road.querySelectorAll(".scenic-road-progress").forEach(path=>{
      const row=route.querySelector(`[data-entry="${CSS.escape(path.dataset.routeEntry)}"]`);
      const index=Number(row?.dataset.routePosition);
      if(row?.classList.contains("is-complete")&&Number.isInteger(index)){
        path.setAttribute("d",roadSegment(index));path.style.strokeDashoffset="0";
        const flash=road.querySelector(`.scenic-road-flash[data-route-entry="${CSS.escape(path.dataset.routeEntry)}"]`);
        const point=anchors[index];
        if(flash&&point){flash.setAttribute("cx",String(point.x));flash.setAttribute("cy",String(point.y));}
      }
    });
    placeTraveler(position);
  }
  function flashCompletion(entryId) {
    const route=document.querySelector(".day-route"),row=route?.querySelector(`[data-entry="${CSS.escape(entryId)}"]`);
    const path=route?.querySelector(`.scenic-road-progress[data-route-entry="${CSS.escape(entryId)}"]`);
    const connector=route?.querySelector(`.scenic-card-connector[data-route-entry="${CSS.escape(entryId)}"]`);
    const flash=route?.querySelector(`.scenic-road-flash[data-route-entry="${CSS.escape(entryId)}"]`);
    const index=Number(row?.dataset.routePosition),point=anchors[index];
    if(!row||!path||!connector||!flash||!point)return;
    row.classList.remove("completion-sequence","completion-pending");void row.offsetWidth;row.classList.add("completion-sequence");
    if(!reduced.matches)row.classList.add("completion-pending");
    connector.classList.remove("is-lit");connector.classList.add("is-charging");
    path.setAttribute("d",roadSegment(index));path.style.strokeDashoffset="1";
    flash.setAttribute("cx",String(point.x));flash.setAttribute("cy",String(point.y));
    flash.classList.remove("is-flashing");void flash.getBoundingClientRect();
    const lightRoute=()=>requestAnimationFrame(()=>{connector.classList.remove("is-charging");connector.classList.add("is-lit");});
    const lightRoad=()=>requestAnimationFrame(()=>{path.style.strokeDashoffset="0";});
    if(reduced.matches){lightRoute();lightRoad();playCompletionChime();}
    else {
      setTimeout(lightRoute,420);
      setTimeout(lightRoad,980);
      prepareCompletionAudio();
      setTimeout(()=>{row.classList.remove("completion-pending");row.classList.add("completion-node-ready");if(flash.isConnected)flash.classList.add("is-flashing");playCompletionChime();},1450);
    }
    setTimeout(()=>row.classList.remove("completion-sequence","completion-node-ready"),2200);
    setTimeout(()=>flash.classList.remove("is-flashing"),2400);
  }
  function playCompletionChime() {
    if(!window.AudioContext)return;
    completionAudio??=new AudioContext();
    const play=()=>{
      const start=completionAudio.currentTime;
      [587.33,783.99].forEach((frequency,index)=>{
        const oscillator=completionAudio.createOscillator(),gain=completionAudio.createGain(),at=start+index*.085;
        oscillator.type="sine";oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.035,at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+.18);
        oscillator.connect(gain);gain.connect(completionAudio.destination);oscillator.start(at);oscillator.stop(at+.2);
      });
    };
    if(completionAudio.state==="suspended")completionAudio.resume().then(play,error=>console.warn("Completion sound could not start:",error));
    else play();
  }
  function prepareCompletionAudio() {
    if(!window.AudioContext)return;
    completionAudio??=new AudioContext();
    if(completionAudio.state==="suspended")completionAudio.resume().then(()=>{},error=>console.warn("Completion sound could not start:",error));
  }
  function placeTraveler(index) {
    if(!anchors.length)return;
    position=Math.max(0,Math.min(anchors.length-1,index));
    const base=Math.floor(position),point=MihwerScenicJourney.pointBetween(anchors[base],anchors[Math.min(base+1,anchors.length-1)],position-base);
    const traveler=document.querySelector(".scenic-traveler");
    if(traveler){traveler.style.left=`${point.x}px`;traveler.style.top=`${point.y-13}px`;}
  }
  function moveTravelerTo(index) {
    const to=Math.max(0,Math.min(anchors.length-1,index)),from=position;
    if(!anchors.length)return;
    cancelAnimationFrame(movementFrame);movementFrame=0;
    const traveler=document.querySelector(".scenic-traveler");
    if(reduced.matches||Math.abs(to-from)<.015){traveler?.classList.remove("is-walking");placeTraveler(to);return;}
    const started=performance.now(),duration=Math.min(2100,Math.max(620,Math.abs(to-from)*520));
    traveler?.classList.add("is-walking");
    const tick=now=>{
      const progress=Math.min(1,(now-started)/duration),eased=progress*progress*(3-2*progress);
      placeTraveler(from+(to-from)*eased);
      if(progress<1){movementFrame=requestAnimationFrame(tick);return;}
      movementFrame=0;traveler?.classList.remove("is-walking");
    };
    movementFrame=requestAnimationFrame(tick);
  }
  function updatePeriodTraveler() {
    if(!periodTraveler?.isConnected)return;
    const trail=periodTraveler.closest(".week-trail"),stops=[...trail.querySelectorAll(".week-stop")],dots=stops.map(stop=>stop.querySelector(".week-dot"));
    if(!dots.length)return;
    const trailBox=trail.getBoundingClientRect();
    const dates=stops.map(stop=>stop.querySelector("[data-period-date]")?.dataset.periodDate).filter(Boolean);
    if(dates.length!==stops.length)return;
    const points=dots.map(dot=>{const box=dot.getBoundingClientRect();return {x:box.left+box.width/2-trailBox.left,y:box.top+box.height/2-trailBox.top};});
    const cards=stops.map(stop=>{const card=stop.querySelector(".week-card,.week-stop-card,.period-card")||stop;const box=card.getBoundingClientRect();return {x:box.left+box.width/2-trailBox.left,y:box.top+box.height/2-trailBox.top};});
    periodGeometry={points,cards};
    const today=zoneDate();
    let targetDate=selectedDate,targetMinute=minuteForSelectedDay();
    const actualDateIsVisible=screen==="year"?today.slice(0,4)===selectedDate.slice(0,4):
      screen==="month"?today.slice(0,7)===selectedDate.slice(0,7):today>=dates[0]&&today<=dates.at(-1);
    if(scenePreviewMinute===null&&actualDateIsVisible){targetDate=today;targetMinute=zoneParts();}
    periodTargetPosition=MihwerScenicJourney.periodPosition(dates,targetDate,targetMinute);
    const targetIndex=Math.min(points.length-1,Math.round(periodTargetPosition));
    periodTraveler.setAttribute("aria-label",`${text(scenePreviewMinute===null&&actualDateIsVisible?"periodLivePosition":"periodPreviewPosition")}: ${targetDate} ${timeText(targetMinute)}`);
    trail.querySelectorAll(".week-stop").forEach((stop,index)=>{
      stop.classList.toggle("is-focused",index===targetIndex);
      stop.classList.toggle("is-traveled",index<=targetIndex);
    });
    periodTargetIndex=targetIndex;
    const place=()=>{
      const {points:routePoints,cards:routeCards}=periodGeometry;
      const routePosition=Math.max(0,Math.min(routePoints.length-1,periodPosition??periodTargetPosition));
      const index=Math.min(routePoints.length-2,Math.floor(routePosition));
      if(index<0){periodTraveler.style.left=`${routePoints[0].x}px`;periodTraveler.style.top=`${routePoints[0].y}px`;return;}
      const a=routePoints[index],b=routePoints[index+1],step=routePosition-index,dy=b.y-a.y;
      const point=MihwerScenicJourney.pointOnPeriodPath(a,{x:routeCards[index].x,y:a.y+dy*.34},{x:routeCards[index+1].x,y:a.y+dy*.66},b,step);
      periodTraveler.style.left=`${point.x}px`;periodTraveler.style.top=`${point.y}px`;
    };
    if(periodPosition===null||reduced.matches){
      periodPosition=periodTargetPosition;periodTargetIndex=targetIndex;place();
      periodTraveler.classList.remove("is-walking");
      return;
    }
    periodTraveler.classList.add("is-walking");
    if(periodFrame)return;
    periodLastFrame=performance.now();
    const tick=now=>{
      const elapsed=Math.min(80,now-periodLastFrame);periodLastFrame=now;
      const difference=periodTargetPosition-periodPosition,step=elapsed/3200;
      periodPosition+=Math.sign(difference)*Math.min(Math.abs(difference),step);
      place();
      if(Math.abs(periodTargetPosition-periodPosition)>.002){periodFrame=requestAnimationFrame(tick);return;}
      periodPosition=periodTargetPosition;periodFrame=0;place();periodTraveler.classList.remove("is-walking");
    };
    periodFrame=requestAnimationFrame(tick);
  }
  function stopWalking() {
    cancelAnimationFrame(frame);cancelAnimationFrame(movementFrame);frame=0;movementFrame=0;walking=false;
    document.querySelector(".scenic-traveler")?.classList.remove("is-walking");
    document.querySelector(".journey-viewport")?.removeAttribute("aria-busy");
  }
  function walkTo(index,onArrival) {
    stopWalking();
    const generation=journeyGeneration,date=selectedDate,from=position,to=index,started=performance.now();
    walking=true;routeManualFocus=true;routeScrollIntentUntil=0;
    const traveler=document.querySelector(".scenic-traveler");
    traveler?.classList.add("is-walking");
    document.querySelector(".journey-viewport")?.setAttribute("aria-busy","true");
    const status=document.querySelector("#scenic-status");if(status)status.textContent=text("walking");
    const duration=reduced.matches?0:MihwerScenicJourney.walkingDuration(Math.abs(to-from));
    function tick(now) {
      if(generation!==journeyGeneration||selectedDate!==date||screen!=="day"){stopWalking();return;}
      const progress=duration&&!reduced.matches?Math.min(1,(now-started)/duration):1;
      placeTraveler(from+(to-from)*(progress*progress*(3-2*progress)));
      if(!reduced.matches)traveler?.scrollIntoView({block:"center",behavior:"instant"});
      if(progress<1){frame=requestAnimationFrame(tick);return;}
      stopWalking();focusRoute(to,true);
      if(status)status.textContent=text("arrived");
      onArrival();
    }
    frame=requestAnimationFrame(tick);
  }
  function mountScenicJourney() {
    ++journeyGeneration;stopWalking();cancelAnimationFrame(periodFrame);periodFrame=0;periodTraveler=null;periodPosition=null;periodTargetIndex=-1;resizeObserver?.disconnect();
    if(!document.querySelector("#scenic-disclosure")){
      const notice=document.querySelector(".notice");
      notice?.insertAdjacentHTML("afterend",'<p id="scenic-disclosure" class="scenic-disclosure"></p>');
    }
    document.querySelector("#scenic-disclosure").textContent=text("note");
    if(screen==="day"){
      const viewport=document.querySelector(".journey-viewport"),route=viewport.querySelector(".day-route");
      const items=routeEntries();
      const sleepQuick=viewport.querySelector(".journey-sleep-quick");
      if(sleepQuick){
        const tools=document.createElement("div");tools.className="journey-route-tools";
        tools.append(sleepQuick);route.before(tools);
      }
      const dayHero=viewport.closest(".day-hero");
      const welcome=dayHero.querySelector(".hero-welcome");
      const prayer=dayHero.querySelector(".hero-prayer");
      const utility=document.querySelector(".journey-utility");
      if(prayer)viewport.prepend(prayer);
      if(welcome)viewport.prepend(welcome);
      if(utility)viewport.prepend(utility);
      route.insertAdjacentHTML("afterbegin",`<svg class="scenic-road" preserveAspectRatio="none" aria-hidden="true"><path class="scenic-road-verge"/><path class="scenic-road-edge"/><path class="scenic-road-asphalt"/><path class="scenic-road-lane"/>${items.map(item=>`<path class="scenic-card-connector" data-route-entry="${esc(item.id)}" pathLength="1"/><path class="scenic-road-progress" data-route-entry="${esc(item.id)}" pathLength="1"/><circle class="scenic-road-flash" data-route-entry="${esc(item.id)}" r="13"/>`).join("")}</svg><span class="scenic-traveler" role="img" data-person="${travelerChoice}">${travelerSvg()}</span>`);
      viewport.insertAdjacentHTML("beforeend",'<p id="scenic-status" class="sr-only" role="status"></p>');
      route.querySelectorAll(".route-row").forEach((row,index)=>{
        row.style.setProperty("--road-bend",`${Math.sin(index*1.6)*11}px`);
        const entry=items.find(item=>item.id===row.dataset.entry);
        if(!row.querySelector("[data-entry-drag]"))return;
        const overdue=entry.startMinute!==null&&(selectedDate<zoneDate()||selectedDate===zoneDate()&&entry.startMinute<zoneParts());
        row.querySelector(".route-card").insertAdjacentHTML("beforeend",`<details class="scenic-schedule"><summary>${text("schedule")}</summary>${overdue?`<p>${text("missed")}</p>`:""}<div class="options">${["earlier","later",...(overdue?["now"]:[]),"tomorrow"].map(action=>`<button type="button" class="secondary" data-scenic-reschedule="${action}" data-schedule-entry="${esc(entry.id)}">${text(action)}</button>`).join("")}</div><p role="alert"></p></details>`);
      });
      const tasks=items.filter(item=>["task","extendedTask","extendedSubtask"].includes(item.sourceType)&&!item.station?.habit);
      const habits=items.filter(item=>item.sourceType==="recurringHabit"||item.station?.habit);
      const progress=MihwerJourneyTimeline.summarize(items,selectedDate===zoneDate()?zoneParts():selectedDate<zoneDate()?1440:-1).progress;
      const percent=progress===null?"—":`${Math.round(progress*100)}%`;
      viewport.insertAdjacentHTML("beforeend",`<section class="journey-harvest" aria-label="${text("harvest")}"><p class="eyebrow">✦ ${esc(selectedDate)}</p><button type="button" class="harvest-open" data-journey-harvest aria-haspopup="dialog"><span class="harvest-open-copy"><strong>${text("harvest")}</strong><small>${text("harvestInvite")}</small><span class="harvest-cta">${text("openHarvest")} <span aria-hidden="true">↗</span></span></span><span class="harvest-progress" style="--progress:${progress===null?0:Math.round(progress*100)}%" aria-label="${percent}"><strong>${percent}</strong></span></button></section>`);
      const extended=document.querySelector(".extended-journey");
      if(extended)viewport.insertBefore(extended,viewport.querySelector(".journey-harvest"));
      setChoice(travelerChoice);
      position=Number(viewport.dataset.routeIndex)||0;
      drawRoad();
      resizeObserver=new ResizeObserver(drawRoad);resizeObserver.observe(route);
      viewport.addEventListener("scroll",()=>{savedRouteScrollTop=viewport.scrollTop;},{passive:true});
      viewport.scrollTop=savedRouteScrollTop;
    }else if(["week","month","year"].includes(screen)){
      const trail=document.querySelector(".week-trail");
      if(trail){
        trail.insertAdjacentHTML("beforeend",`<span class="scenic-traveler scenic-period-traveler" role="img" data-person="${travelerChoice}">${travelerSvg()}</span>`);
          periodTraveler=trail.querySelector(".scenic-period-traveler");periodPosition=null;periodTargetIndex=-1;periodTargetPosition=0;periodLastFrame=0;periodFrame=0;
        setChoice(travelerChoice);updatePeriodTraveler();
        resizeObserver=new ResizeObserver(updatePeriodTraveler);resizeObserver.observe(trail);
      }
    }
  }
  const baseMount=livingMount;
  livingMount=function(){baseMount();mountScenicJourney();};
  const baseFocus=focusRoute;
  focusRoute=function(index,manual=false){
    baseFocus(index,manual);
    if(!walking){if(manual)moveTravelerTo(Math.round(index));else{cancelAnimationFrame(movementFrame);movementFrame=0;placeTraveler(index);}}
  };
  function resumeTimedJourney() {
    clearTimeout(autoFollowTimer);
    autoFollowTimer=setTimeout(()=>{
      if(screen!=="day"||dialog.open||scenePreviewMinute!==null)return;
      routeManualFocus=false;
      routeScrollIntentUntil=0;
      focusRoute(routeProgressAt(preciseZoneMinute()));
    },3200);
  }
  function updateTimedJourneyFollow(target) {
    if(screen!=="day"||!target.closest(".journey-viewport"))return;
    if(target.closest(".scenic-schedule,.journey-harvest,.day-dashboard,.day-support,.extended-journey,.scenic-controls,.journey-utility,.hero-prayer,.hero-welcome,.time-controls")){
      clearTimeout(autoFollowTimer);
      return;
    }
    resumeTimedJourney();
  }
  document.addEventListener("wheel",event=>{
    updateTimedJourneyFollow(event.target);
  },{passive:true});
  document.addEventListener("touchend",event=>{
    updateTimedJourneyFollow(event.target);
  },{passive:true});
  document.addEventListener("click",event=>{
    const harvest=event.target.closest("[data-journey-harvest]");
    if(harvest){
      const items=routeEntries(),tasks=items.filter(item=>["task","extendedTask","extendedSubtask"].includes(item.sourceType)&&!item.station?.habit),habits=items.filter(item=>item.sourceType==="recurringHabit"||item.station?.habit);
      const progress=MihwerJourneyTimeline.summarize(items,selectedDate===zoneDate()?zoneParts():selectedDate<zoneDate()?1440:-1).progress;
      const percent=progress===null?null:Math.round(progress*100);
      const encouragement=text(percent===null?"celebrateNone":percent===100?"celebrateAll":percent>=60?"celebrateMost":percent>0?"celebrateSome":"celebrateNone");
      dialogTitle.textContent=text("harvest");
      const count=(entries,label)=>`<span><small>${label}</small><b dir="ltr">${entries.filter(item=>item.status==="completed").length} / ${entries.length}</b></span>`;
      const activities=items.filter(item=>item.sourceType==="activity"),prayers=items.filter(item=>item.sourceType==="prayer");
      const sleep=sleepSummary(stateForDate(selectedDate),selectedDate);
      const sleepTotal=sleep.error||sleep.total===null?lt("unrecorded"):sleepDurationText(sleep.total);
      dialogContent.innerHTML=`<div class="harvest-dialog"><p class="muted">${text("harvestNote")}</p><blockquote>${esc(livingState().dailyIntention||text("emptyIntention"))}</blockquote><p class="harvest-encouragement" role="status">${encouragement}</p>${daySummary(items)}<section class="harvest-records" aria-label="${text("harvest")}">${count(tasks,language==="ar"?"المهام":"Tasks")}${count(habits,text("habits"))}${count(activities,language==="ar"?"الأنشطة":"Activities")}${count(prayers,text("prayers"))}<span><small>${lt("sleepTab")}</small><b>${esc(sleepTotal)}</b></span></section><small>${text("recordNote")}</small>${typeof dailyReflectionView==="function"?dailyReflectionView():""}</div>`;
      dialog.showModal();
      return;
    }
    const reschedule=event.target.closest("[data-scenic-reschedule]");
    if(reschedule){
      const entry=routeEntries().find(item=>item.id===reschedule.dataset.scheduleEntry);
      try {
        stopWalking();
        const delta=MihwerScenicJourney.scheduleDelta(reschedule.dataset.scenicReschedule,entry.startMinute,selectedDate,zoneDate(),zoneParts());
        routeFocusEntryId=entry.id;routeManualFocus=true;
        if(delta)rescheduleEntryBy(entry.id,delta);
        document.querySelector(`[data-entry="${CSS.escape(entry.id)}"] .scenic-schedule`)?.setAttribute("open","");
      }catch(error){reschedule.closest("details").querySelector('[role="alert"]').textContent=lt("scheduleUnavailable");}
      return;
    }
  });
  document.addEventListener("change",event=>{
    if(event.target.matches("[data-traveler-choice]"))setChoice(event.target.value);
  });
  document.addEventListener("click",event=>{
    const finish=event.target.closest("[data-journey-finish]");
    const trigger=event.target.closest(".route-row .route-open,.route-row .route-node");
    if(trigger?.matches(".route-open")){
      if(walking)stopWalking();
      return;
    }
    if(!finish&&(!trigger||allowArrivalClick)){
      if(walking&&!allowArrivalClick)stopWalking();
      return;
    }
    if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
    event.preventDefault();event.stopImmediatePropagation();
    const index=finish?anchors.length-1:Number(trigger.closest(".route-row").dataset.routePosition);
    if(!anchors.length)return;
    walkTo(index,()=>{
      if(finish){
        const title=document.querySelector("#harvest-title");
        title?.scrollIntoView({block:"center",behavior:reduced.matches?"auto":"smooth"});title?.focus({preventScroll:true});
      }else if(trigger.isConnected){
        allowArrivalClick=true;
        try {trigger.click();}finally{allowArrivalClick=false;}
      }
    });
  },true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&walking)stopWalking();});
  for(const name of ["wheel","touchstart"])document.addEventListener(name,()=>{if(walking)stopWalking();},{passive:true});
  dialog.addEventListener("close",()=>{if(screen==="day")resumeTimedJourney();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stopWalking();});
  window.addEventListener("scroll",updatePeriodTraveler,{passive:true});
  render();
})();
