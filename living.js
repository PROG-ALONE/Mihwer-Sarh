"use strict";

const livingText = {
  time:["وقت الرحلة","Journey time"], now:["الوقت الحالي","Current time"], back15:["− 15 دقيقة","− 15 min"], forward15:["+ 15 دقيقة","+ 15 min"],
  play:["تشغيل العرض","Play"], pause:["إيقاف العرض","Pause"], speed:["سرعة العرض","Playback speed"],
  sun:["الشمس: اسحب أو انقر","Sun: drag or click"], moon:["القمر: اسحب أو انقر","Moon: drag or click"],
  nearby:["أقرب محطة","Nearest moment"], go:["اذهب إلى المحطة","Go to moment"], clock:["الوقت المختار","Selected time"],
  scenePreview:["معاينة وقت اليوم","Preview day time"], previewTime:["معاينة","Preview"], backToNow:["العودة للآن","Back to now"],
  dragSchedule:["اسحب لتغيير الموعد","Drag to reschedule"], scheduleMoved:["تم تحديث الموعد محلياً","Schedule updated locally"],
  scheduleUnavailable:["لا يمكن نقل هذا العنصر إلى التاريخ المطلوب.","This item cannot be moved to that date."],
  journeyPosition:["المحطة","Moment"], journeyOf:["من","of"],
  journeyAutoNow:["أنت هنا الآن","You are here now"], journeyAutoHint:["الطريق يتقدم تلقائياً مع وقت يومك","The road moves automatically with your day"],
  historyView:["معاينة يوم سابق","Past-day preview"], futureView:["معاينة يوم قادم","Future-day preview"],
  previewHint:["موضع الرحلة يعرض وقتاً محاكياً، وليس موقعك الحالي.","The journey shows a simulated time, not your current position."],
  periodLivePosition:["موضع التاريخ والوقت الحاليين","Position at the current date and time"],
  periodPreviewPosition:["موضع التاريخ والوقت المعروضين","Position at the displayed date and time"],
  journeyManualHint:["توقفت المتابعة لتعديل هذه المحطة","Following paused while you edit this moment"], journeyResume:["متابعة الرحلة الآن","Resume live journey"],
  journeyEnd:["وصلت إلى نهاية محطات اليوم","You reached the last moment of the day"],
  pending:["لم يبدأ","Not started"], progress:["قيد الإنجاز","In progress"], done:["مكتملة","Completed"], noTasks:["بلا مهام مستحقة","No eligible tasks"],
  tasks:["المهام التجريبية","Example tasks"], completed:["مكتملة","completed"], remaining:["متبقية","remaining"],
  toggle:["تغيير حالة المهمة","Toggle task"], cancelTask:["إلغاء المهمة","Cancel task"], restoreTask:["إعادة المهمة","Restore task"],
  completeTask:["إنجاز","Complete"], reopenTask:["إعادة فتح","Reopen"],
  added:["محطة تجريبية جديدة","New example moment"], addStation:["أضف محطة تجريبية","Add example moment"],
  photoMarker:["تتضمن وسائط توضيحية","Contains example media"], noContent:["لا توجد ملاحظات أو وسائط فعلية في النموذج.","No real notes or media in this prototype."],
  dawn:["الفجر","Dawn"], sunrise:["الشروق","Sunrise"], morning:["الصباح","Morning"], noon:["الظهيرة","Noon"],
  afternoon:["العصر","Afternoon"], sunset:["الغروب","Sunset"], evening:["المساء","Evening"], night:["الليل","Night"],
  sleepWait:["سجّل قراءتين على الأقل لعرض متوسط النوم؛ هذه ملاحظات تنظيمية وليست نصيحة طبية.","Record at least two readings to see an average; these are planning observations, not medical advice."],
  sleepCount:["قراءة مسجلة","recorded readings"], sleepReady:["ملاحظة وصفية فقط؛ لا تشخيص أو هدف نوم هنا.","Descriptive only; no diagnosis or sleep target."],
  sleepWakeDate:["تاريخ الاستيقاظ","Wake-up date"],
  sleepInsightsTitle:["ملخص إيقاعك","Your rhythm summary"], sleepAverage:["متوسط النوم المسجل","Average recorded sleep"],
  sleepAverageWake:["متوسط وقت الاستيقاظ","Average wake time"], sleepEntryHint:["أدخل نوم الليلة السابقة بسرعة؛ التاريخ هو يوم الاستيقاظ. تُحفظ البيانات مؤقتاً في هذه الجلسة.","Quickly enter the previous night's sleep; the date is the wake-up day. Data is temporary for this session."],
  sleepNeedTasks:["سجّل بيانات النوم والمهام في أربعة أيام على الأقل لمقارنة النمط.","Record sleep and task data on at least four days to compare patterns."],
  sleepNeedVariation:["تختلف مدد النوم قليلاً فقط في هذه العينة؛ لا تكفي لفصل الأيام إلى مجموعتين.","Sleep durations vary too little in this sample to separate the days into two groups."],
  sleepNoTaskHistory:["لا توجد مهام مسجلة بما يكفي لمقارنة نمط الأيام.","There is not enough recorded task data to compare day patterns."],
  sleepShorter:["نوم أقصر في العينة","Shorter-sleep sample"], sleepLonger:["نوم أطول في العينة","Longer-sleep sample"],
  sleepComparison:["مقارنة وصفية بين أيام العينة","Descriptive comparison across recorded days"],
  sleepCorrelationCaution:["المقارنة لا تثبت علاقة سببية؛ استخدمها كملاحظة لتجربة ترتيب يومك.","This comparison does not establish cause; use it as an observation when experimenting with your schedule."],
  sleepSuggestionLonger:["يمكنك تجربة وضع المهمة الأهم في وقت يناسب إيقاعك المسجل، ثم ملاحظة النتيجة.","Try placing your most important task at a time that fits your recorded rhythm, then observe the result."],
  sleepSuggestionNeutral:["لم يظهر فرق ثابت في هذه العينة؛ جرّب ترتيباً يناسبك وسجّل عدة أيام أخرى.","No consistent difference appeared in this sample; try a schedule that suits you and record a few more days."],
  sleepSuggestionNeedData:["سجّل قراءات إضافية قبل استخلاص نمط للمهام.","Record more readings before drawing a task-pattern observation."],
  stage:["مرحلة اليوم","Day phase"], speedNormal:["عادي","Normal"], stopMotion:["العرض متوقف احتراماً لتفضيل تقليل الحركة.","Playback stopped to respect reduced motion."]
};
Object.assign(livingText,{
  subtasks:["المهام الفرعية","Subtasks"], subtaskName:["اسم المهمة الفرعية","Subtask name"], addSubtask:["إضافة مهمة فرعية","Add subtask"],
  editSubtask:["تعديل اسم المهمة الفرعية","Edit subtask name"], saveSubtask:["حفظ الاسم","Save name"],
  taskName:["اسم المهمة","Task name"], editTask:["تعديل المهمة","Edit task"], saveTaskEdit:["حفظ التعديلات","Save changes"], deleteTask:["حذف المهمة","Delete task"],
  taskEditInvalid:["تحقق من الاسم والوقت والمدة والأولوية.","Check the name, time, duration and priority."],
  subtasksRequired:["أكمل المهام الفرعية أولاً، ثم سجل إنجاز المهمة الرئيسية.","Complete the subtasks first, then record completion of the parent task."],
  subtaskLocked:["أعد فتح المهمة أو استعدها لتعديل مهامها الفرعية.","Reopen or restore the task to edit its subtasks."],
  subtaskError:["تعذر تحديث المهمة الفرعية. تحقق من الاسم والحالة وحاول مجدداً.","Could not update the subtask. Check its name and status and try again."],
  sleepTab:["إيقاع النوم","Sleep rhythm"], prayers:["الصلاة والتاريخ","Prayer and date"], settings:["الوقت والمنطقة","Time and zone"],
  currentDate:["تاريخ الرحلة المختار","Selected journey date"], gregorian:["الميلادي","Gregorian"], hijri:["الهجري","Hijri"],
  travelerSetting:["شخصية الرحلة","Journey traveler"], intentionSetting:["نيّة اليوم","Daily intention"], intentionHint:["يمكنك تعديلها متى شئت؛ تُحفظ مؤقتاً في هذه الصفحة.","You can change this anytime; it is kept temporarily on this page."],
  boy:["ولد","Boy"], girl:["بنت","Girl"],
  hijriNote:["تقويم أم القرى تقديري من المتصفح؛ قد يختلف عن الإعلان الرسمي في بلدك.","Browser Umm al-Qura calendar is indicative and may differ from your local official date."],
  zone:["المنطقة الزمنية","Time zone"], zoneNote:["تُختار المنطقة يدوياً في هذه التجربة وتبقى حتى تحديث الصفحة. لا يحدد إذن الموقع المنطقة الزمنية تلقائياً.","Select the time zone manually; it lasts until reload. Location permission does not automatically determine the time zone."],
  live:["يتبع الوقت الآن","Following current time"], manual:["استعراض يدوي","Manual preview"], liveNote:["يحسب المشهد موضع الشمس والقمر والشروق والغروب من الإحداثيات والتاريخ والوقت والمنطقة الزمنية، مستقلاً عن طريقة مواقيت الصلاة. دون موقع، لا يعرض موضعاً فلكياً ويستخدم الوقت المحلي لمعاينة الإضاءة فقط.","The scene calculates sun and moon positions and sunrise/sunset from coordinates, date, time and time zone, independently of the prayer calculation method. Without a location it shows no astronomical positions and uses local time only for a lighting preview."],
  locate:["السماح باستخدام موقعي","Allow location access"],       locationNote:["يُطلب الموقع عند الضغط فقط. يُستخدم في الحساب على الجهاز ويُحتفظ به مؤقتاً في ذاكرة الصفحة حتى مسحه أو تحديثها، ولا يرسله النموذج لخدمة. قد يستخدم الجهاز أو المتصفح خدمة موقع وفق إعداداته.","Location is requested only when pressed. It is calculated on this device and held in page memory until cleared or reloaded; this prototype does not send it to a service. Your device or browser may use a location service."],
  locationAvailable:["تم الحصول على الموقع مؤقتاً للحساب على الجهاز.","Location obtained temporarily for on-device calculation."],
  locationDenied:["تعذر الحصول على الموقع. تحقق من الإذن أو إعدادات المتصفح وأعد المحاولة.","Location unavailable. Check browser permission and settings, then retry."],
  locationUnavailable:["تعذر تحديد الموقع حالياً. تحقق من خدمات الموقع وأعد المحاولة.","Your location could not be determined. Check location services and try again."],
  locationTimeout:["انتهت مهلة طلب الموقع. أعد المحاولة.","The location request timed out. Try again."],
  locationUnsupported:["الموقع غير مدعوم أو يحتاج اتصالاً آمناً في هذا المتصفح.","Location is unsupported or requires a secure context in this browser."],
  locationPending:["بانتظار إذن الموقع…","Waiting for location permission…"],
  prayerBlocked:["هذه مواقيت حسابية تقريبية وليست جدولاً رسمياً؛ تحقق من مرجع بلدك قبل الاعتماد عليها. قد تختلف بسبب الموقع، والمنطقة الزمنية، والرؤية والتعديلات المحلية.","These calculated times are approximate, not an official timetable. Check your local authority before relying on them; location, time zone, moon sighting and local adjustments may differ."],
  country:["البلد (اختيار يدوي)","Country (selected manually)"], choose:["اختر","Select"], other:["بلد آخر","Other country"],
  countryNote:["لا يستنتج النموذج البلد من الموقع. عند اختيار بلد مدعوم تُقترح طريقة حساب قابلة للتغيير، وليست تحققاً من مرجعه الرسمي.","The prototype does not infer a country from location. Selecting a supported country suggests an editable calculation method, not a verified official authority."],
  method:["طريقة الحساب","Calculation method"], asr:["طريقة العصر","Asr method"], standard:["الظل الواحد (الجمهور)","Single shadow (standard)"], hanafi:["الظلّان (الحنفي)","Two shadows (Hanafi)"],
  ramadan:["هل التاريخ في رمضان بحسب مرجعك المحلي؟","Is this date in Ramadan according to your local authority?"], yes:["نعم","Yes"], no:["لا","No"],
  clearLocation:["مسح الموقع المؤقت","Clear temporary location"], cleared:["مُسح الموقع من ذاكرة الصفحة.","Location cleared from page memory."],
  prayerSetup:["اختر البلد وطريقة الحساب وطريقة العصر، ثم استخدم الموقع أو أدخل إحداثيات مدينة.","Choose a country, calculation method and Asr method, then use location access or enter city coordinates."],
  ramadanSetup:["حدد حالة رمضان من مرجعك المحلي لحساب العشاء بطريقة أم القرى.","Confirm Ramadan from your local authority to calculate Isha using Umm al-Qura."],
  latitudeLimit:["عند خط عرض يتجاوز 48°، تستخدم مكتبة الحساب قاعدة جزء من سبعة من الليل للفجر والعشاء؛ وقد تختلف عن طرق التقدير المحلية.","Above 48° latitude, the calculation library uses a one-seventh-night rule for Fajr and Isha; local high-latitude methods may differ."],
  highLatitudeRule:["تنبيه خطوط العرض العالية: تستخدم هذه المكتبة قاعدة جزء من سبعة من الليل للفجر والعشاء فوق 48°؛ قد تختلف عن طريقة الجهة المحلية.","High-latitude note: this library uses one-seventh of the night for Fajr and Isha above 48°; local authority methods may differ."],
  prayerUnavailable:["تعذر حساب المواقيت لهذا الموقع والتاريخ. تحقق من المنطقة الزمنية والاختيارات.","Could not calculate times for this location and date. Check the time zone and settings."],
  libraryUnavailable:["مكتبة الحساب المحلية غير متاحة. تحقق من تثبيت اعتمادات النموذج.","The local calculation library is unavailable. Check that the prototype dependencies are installed."],
  dateMismatch:["تنبيه: أحد المواقيت يقع في يوم مختلف وفق المنطقة المختارة. تحقق من تطابق المنطقة الزمنية مع موقعك ومن جدول الجهة المحلية.","Warning: a time falls on a different date in the selected zone. Verify the zone matches your location and check your local authority."],
  prayerZone:["منطقة العرض الزمنية","Display time zone"], prayerDate:["التاريخ الميلادي المختار","Selected Gregorian date"],
  fajr:["الفجر","Fajr"], sunrisePrayer:["الشروق","Sunrise"], dhuhr:["الظهر","Dhuhr"], asrPrayer:["العصر","Asr"], maghrib:["المغرب","Maghrib"], isha:["العشاء","Isha"]
});
const lt = key => livingText[key][language === "ar" ? 0 : 1];
Object.assign(livingText,{
  weekStrip:["أيام الرحلة","Journey days"], today:["اليوم","Today"], todayView:["التالي على المسار","Next on the path"],
  noUpcoming:["لا توجد محطات قادمة في هذا اليوم.","No upcoming moments remain today."],
  otherDay:["تعرض يوماً آخر؛ السماء تتبع الوقت الحالي في منطقتك.","Viewing another day; the sky follows the current time in your zone."],
  automatic:["يتحرك المشهد تلقائياً حسب وقت منطقتك","Scene follows your time zone automatically"],
  approxPrayer:["مواقيت تقريبية · تحقق من المرجع المحلي","Approximate times · check your local authority"],
  prayerMissing:["لإظهار الصلوات على المسار، أكمل إعدادات الحساب واستخدم الموقع أو إحداثيات مدينة.","To show prayers on the path, complete calculation settings and use location access or city coordinates."],
  planned:["الوقت المخطط","Scheduled time"], estimated:["المدة المقدرة","Estimated duration"], actual:["المدة المسجلة","Recorded duration"],
  unrecorded:["لم تُسجل","Not recorded"], minutes:["دقيقة","min"], task:["مهمة","Task"], habit:["عادة","Habit"],
  startTimer:["ابدأ قياس الوقت","Start timing"], stopTimer:["أوقف قياس الوقت","Stop timing"], running:["القياس جارٍ","Timing"],
  timerNote:["القياس يبدأ ويتوقف باختيارك ويحسب الزمن المنقضي بينهما، حتى عند إخفاء الصفحة، ولا يثبت العمل المتواصل. يبقى مؤقتاً؛ الإكمال دون تشغيله لا ينشئ مدة.","Timing starts and stops only when you choose and counts elapsed time, including while the page is hidden; it does not prove continuous work. It is temporary, and completing without timing does not create a duration."],
  timerOtherDay:["يمكن بدء القياس ليوم المنطقة الحالي فقط؛ يمكن إيقاف قياس بدأ سابقاً.","Timing can only start on the current date in your time zone; an existing timer can still be stopped."],
  actualStart:["أول بدء مسجل","First recorded start"], actualEnd:["آخر توقف مسجل","Last recorded stop"],
  examples:["أمثلة يومية قابلة للتجربة","Interactive daily examples"], stationProgress:["تقدم المحطة","Moment progress"],
  prayerDetail:["موعد حسابي تقريبي، وليس إثباتاً لأداء الصلاة. تحقق من جدول الجهة المحلية.","Approximate calculated time; not a record that prayer was performed. Check your local timetable."],
  emptyDate:["الوقت المخطط مطلوب لكل مهمة.","A scheduled time is required for every task."],
  noDuration:["مدة غير مسجلة","No duration recorded"]
});
Object.assign(livingText,{
  previousDay:["اليوم السابق","Previous day"], nextDay:["اليوم التالي","Next day"], dateTab:["التاريخ","Date"],
  settingsTab:["الإعدادات","Settings"], systemLog:["سجل النظام","System log"], systemLogHint:["الأحداث مرتبة حسب اليوم والقسم، وتُحفظ مؤقتاً حتى تحديث الصفحة.","Events are grouped by day and section, and remain temporary until the page is refreshed."], prayerSettings:["إعدادات الصلاة والموقع","Prayer and location settings"],
  showPrayer:["عرض المواقيت","View prayer times"], details:["تفاصيل وخصوصية","Details and privacy"],
  taskOptions:["خيارات المهمة","Task options"], taskTimingNotes:["الوقت والملاحظات","Timing and notes"],
  prayerShort:["مواقيت تقريبية، تحقق من المرجع المحلي.","Approximate times; check your local authority."],
  temporary:["تجريبي ومؤقت حتى تحديث الصفحة.","Temporary prototype data, lost on reload."],
  todayButton:["العودة لليوم","Back to today"],
  actualSleep:["وقت النوم الفعلي","Actual sleep start"], napEnd:["نهاية القيلولة","Nap end"],
  nightDuration:["النوم الليلي","Night sleep"], napDuration:["القيلولة","Nap"], sleepTotal:["مجموع النوم المسجل","Recorded sleep total"],
  sleepMissing:["أكمل الأوقات لحساب المدد.","Complete the times to calculate durations."],
  sleepInvalid:["تعذر الحساب: تحقق من الأوقات وعدم تداخلها. قد يكون الوقت غير موجود أو مكرراً عند تغيير التوقيت الصيفي.","Cannot calculate: check the times and overlaps. A time may be missing or ambiguous during a daylight-saving change."],
  sleepAssumption:["يوم الرحلة هو يوم الاستيقاظ. النوم الليلي لا يتجاوز ٢٤ ساعة، والقيلولة في اليوم نفسه. لا تُحسب القيلولة غير المسجلة صفراً.","The journey date is the wake day. Night sleep is under 24 hours and the nap is on that date. An unrecorded nap is not counted as zero."],
  celestialInfo:["الوقت ومرحلة اليوم","Current time and day phase"],
  sunInfo:["الشمس: الوقت والمرحلة الحالية","Sun: current time and phase"], moonInfo:["القمر: الوقت والمرحلة الحالية","Moon: current time and phase"],
  solarAltitude:["الارتفاع الظاهري","Apparent altitude"], solarAzimuth:["السمت","Azimuth"],
  lunarPhase:["طور القمر","Lunar phase"], lunarIllumination:["الإضاءة","Illumination"],
  moonRise:["طلوع القمر","Moonrise"], moonSet:["غروب القمر","Moonset"],
  celestialNoEvent:["لا يوجد عبور في هذا اليوم المحلي","No crossing in this local day"],
  celestialUnavailable:["لا تتوفر الحسابات الفلكية حتى تضبط الموقع والمنطقة الزمنية.","Celestial calculations are unavailable until the location and time zone are set."],
  celestialApproximation:["مواضع وأوقات محسوبة تقريبياً؛ لا تمثل رصداً مباشراً، وقد تتأثر أوقات الأفق بالطقس والتضاريس.","Positions and events are calculated approximations, not live observations; horizon times can vary with weather and terrain."],
  moonNew:["محاق","New Moon"], moonWaxingCrescent:["هلال متزايد","Waxing Crescent"],
  moonFirstQuarter:["التربيع الأول","First Quarter"], moonWaxingGibbous:["أحدب متزايد","Waxing Gibbous"],
  moonFull:["بدر","Full Moon"], moonWaningGibbous:["أحدب متناقص","Waning Gibbous"],
  moonLastQuarter:["التربيع الأخير","Last Quarter"], moonWaningCrescent:["هلال متناقص","Waning Crescent"],
  updateError:["تعذر تحديث المهمة؛ لم تتغير حالتها. أعد المحاولة.","Could not update the task; its state was not changed. Try again."],
  intelligence:["تحليلات اليوم","Day insights"], evidence:["مصدر المؤشر","Indicator evidence"],
  metricNote:["المنجز ÷ المهام غير الملغاة. هذه مؤشرات للأمثلة في اليوم المختار، وليست تقييماً لقيمة اليوم.","Completed ÷ non-cancelled tasks. These describe the selected day's examples, not the value of your day."],
  comparison:["المقدر مقابل المسجل","Estimated vs recorded"], comparisonNote:["للمهام المكتملة ذات المدة المسجلة يدوياً أو بالمؤقت؛ لا تدخل المهام بلا مدة.","Only completed tasks with a manually entered or timed duration; tasks without a duration are excluded."],
  noEvidence:["لا توجد مهام مكتملة بوقت مسجل بعد.","No completed tasks with recorded time yet."]
});
Object.assign(livingText,{
  completionDetails:["تسجيل الإنجاز","Record completion"], durationOptional:["المدة الفعلية بالدقائق (اختياري)","Actual duration in minutes (optional)"],
  durationHint:["اختياري؛ اتركه فارغاً للاحتفاظ بوقت المؤقت إن وُجد. الإدخال يستبدله.","Optional; leave blank to keep any timed duration. An entry replaces it."],
  taskNote:["ملاحظة المهمة (اختياري)","Task note (optional)"], saveTaskNote:["حفظ الملاحظة","Save note"], taskNoteError:["تعذر حفظ الملاحظة؛ لم تتغير المهمة.","Could not save the note; the task was not changed."],
  manualDuration:["مدخلة يدوياً","Entered manually"], timedDuration:["بالمؤقت","Timed"], mixedDuration:["مدخلة يدوياً مع وقت بالمؤقت","Manual entry plus timed duration"], dateChanged:["تغير اليوم أثناء فتح النافذة؛ أعد فتح البطاقة للتسجيل في اليوم الصحيح.","The day changed while this window was open; reopen the card to record the correct day."],
  saveCompletion:["تأكيد الإنجاز","Confirm completion"], backToTask:["العودة للمهمة","Back to task"],
  invalidDuration:["أدخل عدداً صحيحاً من ٠ إلى ١٤٤٠ دقيقة، أو اترك الحقل فارغاً.","Enter a whole number from 0 to 1440 minutes, or leave it blank."],
  prayerRecord:["تسجيل الصلاة يدوياً","Record prayer manually"], prayerFard:["الفرض","Obligatory prayer"],
  prayerBefore:["سنة أو نافلة قبلها","Voluntary prayer before"], prayerAfter:["سنة أو نافلة بعدها","Voluntary prayer after"],
  prayerRecordNote:["سجّل ما صليته، واختر هدف السنن لنفسك؛ لا يحدد النموذج السنن أو أحكامها. النسبة = الركعات المسجلة ÷ الهدف الذي اخترته شاملاً الفرض.","Record what you prayed and choose your voluntary prayer targets; this prototype does not determine religious rulings. Progress is recorded units divided by your chosen target including the obligatory prayer."],
  prayerTarget:["الهدف","Target"], prayerActual:["ما صليته","Prayed"], rakats:["ركعة","units"], prayerInvalid:["أدخل أعداداً صحيحة من ٠ إلى ٢٠، ولا تجعل ما صليته أكبر من الهدف. هدف الفرض ثابت في هذا النموذج.","Enter whole numbers from 0 to 20; prayed cannot exceed the target. The obligatory target is fixed in this prototype."],
  prayerNotRecorded:["لم يُسجّل الفرض","Obligatory prayer not recorded"], prayerRecorded:["سُجّل الفرض","Obligatory prayer recorded"],
  savePrayer:["حفظ التسجيل","Save record"], prayerUpdateError:["تعذر تحديث تسجيل الصلاة؛ لم تتغير حالتها.","Could not update the prayer record; its state was not changed."]
});
Object.assign(livingText,{
  dayMetrics:["ملخص اليوم","Today summary"], scheduleCount:["عناصر مجدولة","Scheduled items"], completedCount:["مكتمل","Completed"],
  remainingCount:["متبقٍ","Remaining"], overdueCount:["متأخر","Overdue"], plannedTime:["وقت مخطط","Planned time"],
  actualTime:["وقت فعلي","Actual time"], dayProgress:["تقدم اليوم","Day progress"], nextPrayer:["الصلاة القادمة","Next prayer"],
  dayProgressTitle:["تقدم رحلتك","Journey progress"], upcomingTitle:["المهام القادمة","Up next"], habitsTitle:["عاداتك","Your habits"],
  pathsTitle:["مساراتي","My paths"], emptyUpcoming:["لا توجد مهام قادمة مجدولة.","No upcoming tasks are scheduled."],
  emptyHabits:["لا توجد عادات مسجلة لهذا اليوم.","No habits are recorded for this day."], emptyPaths:["لا توجد مسارات مرتبطة بمهام محفوظة.","No paths are linked to saved tasks."],
  allItems:["كل محطات اليوم","All of today's moments"], seeDetails:["عرض التفاصيل","View details"],
  goodMorning:["صباح الخير","Good morning"], goodDay:["نهارك سعيد","Have a lovely day"], goodEvening:["مساء الخير","Good evening"],
  heroSub:["اختر محطة؛ تسير شخصيتك إليها، ثم تفتح تفاصيلها.","Choose a moment; your traveler walks there, then its details open."],
  countdown:["الوقت المتبقي","Time remaining"], liveCountdown:["المتبقي في الوقت الحقيقي","Live time remaining"], prayersUnavailable:["أدخل الموقع أو إحداثيات مدينة وطريقة الحساب لعرض المواقيت.","Enter a location or city coordinates and calculation method to show prayer times."], 
  prayersPassed:["انتهت مواقيت اليوم المحسوبة.","Today's calculated prayer times have passed."], allPrayers:["مواقيت الصلاة اليوم","Today's prayer times"],
  prayerUnconfigured:["تحتاج إعداد المواقيت","Time setup needed"],
  activityAdd:["إضافة مهمة أو نشاط","Add a task or activity"], activityName:["اسم النشاط","Activity name"], activityType:["Activity type","Activity type"],
  activityEdit:["تعديل النشاط","Edit activity"], edit:["تعديل","Edit"], momentTitle:["تفاصيل المحطة","Moment details"],
  activityHistoryEmpty:["لا توجد تغييرات مسجلة بعد.","No activity changes recorded yet."], noPrayerTime:["الوقت غير متاح","Time unavailable"],
  activityDate:["تاريخ النشاط","Activity date"],
  activityActionError:["تعذر تحديث النشاط؛ أعد المحاولة.","Could not update the activity; try again."],
  activitySummary:["ملخص قصير","Short summary"], activityNotes:["ملاحظات","Notes"], startTime:["وقت البداية","Start time"],
  endTime:["وقت النهاية","End time"], plannedDuration:["المدة المخططة","Planned duration"], actualDuration:["المدة الفعلية","Actual duration"],
  activityMeeting:["موعد أو اجتماع","Appointment or meeting"], activityWork:["عمل","Work"], activityStudy:["دراسة أو تعلم","Study or learning"],
  activityExercise:["تمرين","Exercise"], activityMeal:["وجبة","Meal"], activityRest:["راحة","Rest"], activityCustom:["نشاط مخصص","Custom activity"],
  activitySave:["حفظ في هذه الجلسة","Save in this session"], activityUpdate:["تحديث النشاط في هذه الجلسة","Update activity in this session"],
  activitySessionNote:["هذه النسخة لا تتصل بمخزن دائم؛ تبقى التغييرات في الذاكرة حتى ربط Supabase والمصادقة المعتمدين.","This build has no durable data service; changes stay in memory until the approved Supabase and authentication integration is available."],
  activityInvalid:["تحقق من الاسم والتاريخ والأوقات. يجب أن يكون الاسم واضحاً.","Check the name, date and times. A name is required."],
  activityOverlap:["يتداخل زمنياً مع عنصر آخر؛ لم يُخفَ أو يُنقل.","Overlaps another item; neither item is hidden or shifted."],
  overlapLabel:["تداخل زمني","Time overlap"],
  habitExempt:["مستثناة","Exempt"], habitUnrecorded:["لم تسجل","Not recorded"],
  activityUntimed:["لم يحدد وقت","Time not specified"], activityAllDay:["بلا وقت محدد","No time specified"],
  activityOpen:["مجدول","Scheduled"], activityRunning:["قيد التنفيذ","In progress"], activityDone:["مكتمل","Completed"],
  activityCancelled:["ملغي","Cancelled"], activityArchived:["مؤرشف","Archived"], activityOverdue:["متأخر","Overdue"],
  activityStartNow:["تسجيل البداية الآن","Record start now"], activityCompleteNow:["تسجيل الإنجاز الآن","Record completion now"],
  activityDelay:["تأجيل ١٥ دقيقة","Delay 15 minutes"], activityCancel:["إلغاء النشاط","Cancel activity"],
  activityArchive:["أرشفة","Archive"], activityRestore:["استعادة","Restore"], activityHistory:["سجل النشاط","Activity history"],
  activityCreated:["أُنشئ","Created"], activityEdited:["عُدّل","Edited"], activityStarted:["بدأ","Started"],
  activityCompleted:["اكتمل","Completed"], activityRescheduled:["أُعيدت جدولته","Rescheduled"],
  activityDeferred:["أُجّل","Deferred"], activityCancelledEvent:["أُلغي","Cancelled"], activityArchivedEvent:["أُرشف","Archived"],
  priority:["الأولوية","Priority"], priorityHint:["صنّف المهمة بحسب الاستعجال والأهمية؛ يبقى ترتيب وقتها كما هو.","Classify urgency and importance; the scheduled time order stays unchanged."],
  "urgent-important":["عاجل ومهم","Urgent and important"], "urgent-not-important":["عاجل وغير مهم","Urgent, not important"],
  "not-urgent-important":["غير عاجل ومهم","Important, not urgent"], "not-urgent-not-important":["غير عاجل وغير مهم","Neither urgent nor important"],
  actualStart:["البداية الفعلية","Actual start"], actualEnd:["النهاية الفعلية","Actual end"],
  cityName:["اسم المدينة (اختياري)","City name (optional)"], latitude:["خط العرض","Latitude"], longitude:["خط الطول","Longitude"],
  useCoordinates:["استخدام إحداثيات المدينة","Use city coordinates"], manualLocationInvalid:["أدخل إحداثيات صحيحة: خط العرض من ‎−90 إلى 90 وخط الطول من ‎−180 إلى 180؛ اسم المدينة اختياري.","Enter valid coordinates: latitude −90 to 90 and longitude −180 to 180; city name is optional."],
  manualLocationSet:["استُخدمت إحداثيات المدينة لهذه الجلسة.","City coordinates are in use for this session."],
  solarDataUnavailable:["يلزم موقع أو إحداثيات لربط الشروق والغروب بالمشهد.","A location or coordinates are needed to align sunrise and sunset with the scene."],
  timeZoneTransition:["هذا الوقت المحلي غير موجود أو يتكرر بسبب انتقال المنطقة الزمنية، لذلك لا يمكن ربطه بلحظة فلكية واحدة. اختر وقتاً آخر أو المنطقة UTC.","This local time is skipped or repeated during a time-zone transition, so it cannot map to one astronomical instant. Choose another time or UTC."],
  timeZoneTransitionShort:["وقت محلي ملتبس بسبب انتقال المنطقة الزمنية","Ambiguous local time during a time-zone transition"],
  solarDataAvailable:["يتغير المشهد وفق أوقات الشروق والغروب المحسوبة لهذا الموقع والتاريخ.","Scene transitions follow calculated sunrise and sunset for this location and date."],
  summaryUnknown:["—","—"], minuteUnit:["دقيقة","min"], hourUnit:["س","h"], phaseMidnight:["منتصف الليل","Midnight"]
});
livingText.wakeTime=words.wakeTime;
livingText.napTime=words.napTime;
let livingMinute = (()=>{const d=new Date();return d.getHours()*60+d.getMinutes();})();
let scenePreviewMinute=null;
let routeFocusEntryId=null;
let routeManualFocus=false;
let livingZone=Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", locationStatus="";
let followToday=true;
let locationRequest=0;
let prayerLocation=null, prayerCity="", prayerCountry="", prayerMethod="", prayerAsr="", prayerRamadan="", prayerRamadanDate="", prayerEditing=false;
let cachedPrayerKey="", cachedPrayerResult=null;
let cachedSceneSolarKey="",cachedSceneSolarEvents=null;
const prayerCountries={
  SA:{name:["السعودية","Saudi Arabia"],method:"UmmAlQura"}, EG:{name:["مصر","Egypt"],method:"Egyptian"},
  AE:{name:["الإمارات","United Arab Emirates"],method:"Dubai"}, QA:{name:["قطر","Qatar"],method:"Qatar"},
  KW:{name:["الكويت","Kuwait"],method:"Kuwait"}, OTHER:{name:["بلد آخر","Other country"],method:""}
};
const prayerMethods={
  UmmAlQura:["أم القرى","Umm al-Qura"], Egyptian:["الهيئة المصرية للمساحة","Egyptian General Authority of Survey"],
  Dubai:["دبي","Dubai"], Qatar:["قطر","Qatar"], Kuwait:["الكويت","Kuwait"],
  MuslimWorldLeague:["رابطة العالم الإسلامي","Muslim World League"], Karachi:["كراتشي","Karachi"],
  NorthAmerica:["أمريكا الشمالية","North America"], Singapore:["سنغافورة","Singapore"], Turkey:["تركيا (تقريبية)","Turkey (approximation)"]
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

function initialStations(first) {
  return [
    {id:"read",title:"pause",description:"pauseDesc",time:420,icon:"✦",tasks:[{id:"read-1",name:["قراءة","Read"],time:420,estimate:20,status:first?"done":"pending",priority:"not-urgent-important"},{id:"read-2",name:["تدوين فكرة","Note an idea"],time:450,estimate:10,status:"pending",priority:"not-urgent-not-important"}]},
    {id:"project",title:"craft",description:"craftDesc",time:540,icon:"◈",tasks:[{id:"project-1",name:["تحديد الخطوة","Define the step"],time:540,estimate:15,status:"pending",priority:"urgent-not-important"},{id:"project-2",name:["العمل عليها","Work on it"],time:555,estimate:45,status:"pending",priority:"urgent-important"}]},
    {id:"walk",title:"walk",description:"walkDesc",time:1080,icon:"☾",habit:true,tasks:[{id:"walk-1",name:["المشي","Walk"],time:1080,estimate:30,status:"pending"}]},
    {id:"memory",title:"memory",description:"memoryDesc",time:1320,icon:"✧",featured:true,media:true,tasks:[]}
  ];
}
function livingState() {
  const state=dayState();
  if (!state.stations) state.stations=initialStations(selectedDate==="2025-11-16");
  state.activities??=[];
  return state;
}
function stateForDate(date) {
  const prior=selectedDate;
  try {selectedDate=date;return dayState();}
  finally {selectedDate=prior;}
}
function progress(station) {
  return MihwerProgressEngine.summarize(station.tasks.filter(task=>!task.archived).map(task=>({id:task.id,date:selectedDate,status:task.status})));
}
function subtaskProgress(task) {
  const result=MihwerProgressEngine.summarize((task.subtasks||[]).map((sub,index)=>({id:sub.id||String(index),date:selectedDate,status:sub.status})));
  return {total:result.eligible,done:result.complete,ratio:result.ratio};
}
function taskPriority(value) {
  return MihwerTaskPriority.normalize(value);
}
function priorityPicker(value,attributes="") {
  const selected=taskPriority(value);
  return `<label class="field priority-field">${lt("priority")}<select ${attributes}>${MihwerTaskPriority.values.map(priority=>`<option value="${priority}" ${priority===selected?"selected":""}>${lt(priority)}</option>`).join("")}</select></label>`;
}
function priorityBadge(value,compact=false) {
  const priority=taskPriority(value);
  const shortLabels=language==="ar"?{"urgent-important":"عاجل+مهم","urgent-not-important":"عاجل","not-urgent-important":"مهم","not-urgent-not-important":"لاحق"}:{"urgent-important":"U+I","urgent-not-important":"Urgent","not-urgent-important":"Important","not-urgent-not-important":"Later"};
  const label=lt(priority);
  return `<span class="priority-badge priority-${priority}" title="${label}" aria-label="${label}">${compact?shortLabels[priority]:label}</span>`;
}
function flashCompletedEntry(entryId) {
  globalThis.MihwerScenicJourneyEffect?.flashCompletion(entryId);
}
function stationTitle(item) { return item.custom ? item.custom[language==="ar"?0:1] : t(item.title); }
function stationDesc(item) { return item.description?t(item.description):lt("noContent"); }
function timeText(value) {
  if(!Number.isFinite(value))return lt("noPrayerTime");
  const clock=((Math.floor(value)%1440)+1440)%1440, hour=Math.floor(clock/60), minute=clock%60;
  return `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;
}
function phase(value,solar=solarSceneState()) {
  if(solar?.sun)return MihwerCelestial.solarPhase(solar.sun);
  if(value<300)return "night"; if(value<360)return "dawn"; if(value<450)return "sunrise";
  if(value<660)return "morning"; if(value<840)return "noon"; if(value<1020)return "afternoon";
  if(value<1140)return "sunset"; if(value<1260)return "evening"; return "night";
}
function dayGreeting() {
  const time=phase(sceneMinute());
  return lt(["dawn","sunrise","morning"].includes(time)?"goodMorning":["noon","afternoon"].includes(time)?"goodDay":"goodEvening");
}
function zoneDate(date=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:livingZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function setJourneyDate(date) { selectedDate=date;followToday=date===zoneDate();routeFocusEntryId=null;routeManualFocus=false;scenePreviewMinute=null;render(); }
function elapsedMs(task) { return (task.elapsedMs||0)+(task.startedAt===undefined?0:Math.max(0,Date.now()-task.startedAt)); }
function elapsedText(task) {
  if(task.startedAt===undefined&&task.elapsedMs===undefined)return lt("unrecorded");
  const seconds=Math.floor(elapsedMs(task)/1000);
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
}
function durationSource(task) { return lt(task.durationSource==="mixed"?"mixedDuration":task.durationSource==="manual"?"manualDuration":"timedDuration"); }
function recordedTime(value) {
  return value===undefined?lt("unrecorded"):new Intl.DateTimeFormat(language==="ar"?"ar":"en",{timeZone:livingZone,year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
}
function scenePalette(value) {
  const keys=[[0,[12,21,48],[29,40,70]],[300,[54,78,123],[160,119,115]],[360,[112,157,209],[254,205,155]],[540,[91,145,205],[196,220,226]],[720,[73,137,199],[170,210,224]],[960,[91,115,157],[235,178,137]],[1080,[90,75,118],[227,130,103]],[1200,[30,33,65],[90,69,101]],[1440,[12,21,48],[29,40,70]]];
  if(!Number.isFinite(value))value=720;
  value=Math.max(0,Math.min(1440,value));
  const upper=keys.findIndex(x=>x[0]>=value), a=keys[Math.max(0,upper-1)], b=keys[Math.max(0,upper)];
  const f=(value-a[0])/(b[0]-a[0]||1);
  return [1,2].map(n=>`rgb(${a[n].map((v,i)=>Math.round(v+(b[n][i]-v)*f)).join(",")})`);
}
function shiftDate(date,days) {
  const value=new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate()+days);
  return value.toISOString().slice(0,10);
}
function sceneMinute() {
  const solar=solarSceneState();
  if(!solar||solar.sunrise===null||solar.sunset===null||solar.sunset<=solar.sunrise)return solar?.minute??(scenePreviewMinute??(selectedDate<zoneDate()?1439:selectedDate>zoneDate()?0:livingMinute));
  const {instant,sunrise,sunset}=solar;
  if(instant>=sunrise&&instant<=sunset)return 360+(instant-sunrise)/(sunset-sunrise)*720;
  return ((instant<sunrise?360-(sunrise-instant)/60000:1080+(instant-sunset)/60000)%1440+1440)%1440;
}
function solarSceneState() {
  const minute=scenePreviewMinute??(selectedDate===zoneDate()?preciseZoneMinute():selectedDate<zoneDate()?1439:0);
  const instant=scenePreviewMinute!==null?zonedInstant(selectedDate,timeText(minute)):
    selectedDate===zoneDate()?Date.now():zonedInstant(selectedDate,timeText(minute));
  if(instant===null)return null;
  if(!prayerLocation)return {instant,minute,sunrise:null,sunset:null,moonrise:null,moonset:null,sun:null,moon:null,progress:null};
  const {latitude,longitude}=prayerLocation;
  const cacheKey=JSON.stringify([selectedDate,livingZone,latitude,longitude]);
  if(cacheKey!==cachedSceneSolarKey){
    const start=zonedInstant(selectedDate,"00:00"),end=zonedInstant(shiftDate(selectedDate,1),"00:00");
    cachedSceneSolarKey=cacheKey;
    cachedSceneSolarEvents=start!==null&&end!==null?{
      ...MihwerCelestial.solarEvents(start,end,latitude,longitude),
      ...MihwerCelestial.lunarEvents(start,end,latitude,longitude)
    }:{sunrise:null,sunset:null,moonrise:null,moonset:null};
  }
  const events=cachedSceneSolarEvents||{sunrise:null,sunset:null,moonrise:null,moonset:null};
  const sunrise=events.sunrise?.getTime()??null,sunset=events.sunset?.getTime()??null;
  const moonrise=events.moonrise??null,moonset=events.moonset??null;
  return {instant,minute,sunrise,sunset,
    moonrise,moonset,
    sun:MihwerCelestial.sunPosition(new Date(instant),latitude,longitude),
    moon:MihwerCelestial.moonPosition(new Date(instant),latitude,longitude),
    progress:sunrise!==null&&sunset!==null&&sunset>sunrise?Math.max(0,Math.min(1,(instant-sunrise)/(sunset-sunrise))):null};
}
function moonPhaseKey(phaseValue) {
  const segment=Math.floor((phaseValue+Math.PI/8)/(Math.PI/4))%8;
  return ["moonNew","moonWaxingCrescent","moonFirstQuarter","moonWaxingGibbous","moonFull","moonWaningGibbous","moonLastQuarter","moonWaningCrescent"][segment];
}
function celestialEventText(instant) {
  if(!(instant instanceof Date))return lt("celestialNoEvent");
  return new Intl.DateTimeFormat(language==="ar"?"ar-EG":"en-GB",{
    timeZone:livingZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).format(instant);
}
function celestialInfoMarkup(kind,solar) {
  if(!solar||!solar[kind])return `<p class="muted">${lt("celestialUnavailable")}</p>`;
  const isMoon=kind==="moon",position=solar[kind];
  const details=[
    [lt("solarAltitude"),`${(position.apparentAltitude??position.altitude).toFixed(1)}°`],
    [lt("solarAzimuth"),`${position.azimuth.toFixed(1)}°`]
  ];
  if(isMoon){
    details.unshift([lt("lunarPhase"),lt(moonPhaseKey(position.phase))]);
    details.push(
      [lt("lunarIllumination"),`${Math.round(position.illumination*100)}%`],
      [lt("moonRise"),celestialEventText(solar.moonrise)],
      [lt("moonSet"),celestialEventText(solar.moonset)]
    );
  }
  return `<div class="summary-card"><small>${lt("celestialInfo")}</small><strong dir="auto">${timeText(solar.minute)} · ${lt(phase(solar.minute,solar))}</strong><dl class="celestial-readings">${details.map(([label,value])=>`<div><dt>${label}</dt><dd dir="auto">${value}</dd></div>`).join("")}</dl></div><p class="muted">${lt("celestialApproximation")}</p>`;
}
function solarSunOpacity(sceneTime,solar) {
  const fade=(value,start,end)=>Math.max(0,Math.min(1,(value-start)/(end-start)));
  if(solar?.sun)return fade(solar.sun.altitude,-1.7,-.3);
  return 0;
}
function sceneLighting(altitude) {
  return MihwerCelestial.sceneLighting(altitude);
}
function moonSceneOpacity(moon) {
  return moon?Math.max(0,Math.min(1,(moon.apparentAltitude+.4)/1.8))*Math.min(1,moon.illumination*5):0;
}
function moonPhaseSvgMarkup(clipId="moon-phase-icon-clip") {
  return `<svg class="moon-phase-icon" viewBox="-12 -12 24 24" aria-hidden="true"><defs><clipPath id="${clipId}"><circle r="11"/></clipPath></defs><circle class="moon-phase-disc" r="11"/><circle class="moon-phase-shadow" r="11" clip-path="url(#${clipId})"/></svg>`;
}
function celestialPoint(position,world) {
  const box=world?.getBoundingClientRect(),viewBox=world?.viewBox.baseVal;
  const visibleWidth=box&&viewBox?Math.min(viewBox.width,viewBox.height*box.width/box.height):1000;
  const visibleStart=viewBox?(viewBox.width-visibleWidth)/2:0;
  return MihwerCelestial.project(position,viewBox?.width||1000,viewBox?.height||800,330,visibleStart,visibleWidth);
}
function updatePrayerCountdown() {
  const name=document.querySelector("#next-prayer-name"), time=document.querySelector("#next-prayer-time"), countdown=document.querySelector("#prayer-countdown");
  if(!name||!time||!countdown)return;
  const next=nextPrayerResult();
  if(!next.prayer){name.textContent=next.error?lt("prayerUnconfigured"):selectedDate===zoneDate()?lt("prayersPassed"):lt("otherDay");time.textContent="—";countdown.textContent="";return;}
  name.textContent=lt(next.prayer.label);time.textContent=next.prayer.time;
  const seconds=Math.max(0,Math.floor((next.prayer.instant-Date.now())/1000));
  countdown.textContent=`${lt(scenePreviewMinute===null?"countdown":"liveCountdown")}: ${String(Math.floor(seconds/3600)).padStart(2,"0")}:${String(Math.floor(seconds%3600/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}
function nextPrayerResult(now=Date.now()) {
  if(selectedDate!==zoneDate())return {prayer:null,error:""};
  const today=calculatePrayers(zoneDate());
  if(today.error||today.differentDay)return {prayer:null,error:today.error||"prayerUnavailable"};
  const next=today.times.find(item=>item.instant>now);
  if(next)return {prayer:next,error:null};
  const tomorrow=calculatePrayers(shiftDate(zoneDate(),1));
  if(tomorrow.error)return {prayer:null,error:tomorrow.error};
  return {prayer:tomorrow.times[0]||null,error:null};
}
function zonedInstant(date,time) {
  const [year,month,day]=date.split("-").map(Number), [hour,minute]=time.split(":").map(Number);
  const local=Date.UTC(year,month-1,day,hour,minute);
  const fmt=new Intl.DateTimeFormat("en-US",{timeZone:livingZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const candidates=new Set();
  for(let delta=-48;delta<=48;delta+=6){
    const sample=local+delta*3600000, parts=Object.fromEntries(fmt.formatToParts(new Date(sample)).map(p=>[p.type,p.value]));
    const offset=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute))-sample;
    const candidate=local-offset, actual=Object.fromEntries(fmt.formatToParts(new Date(candidate)).map(p=>[p.type,p.value]));
    if(Number(actual.year)===year&&Number(actual.month)===month&&Number(actual.day)===day&&Number(actual.hour)===hour&&Number(actual.minute)===minute)candidates.add(candidate);
  }
  return candidates.size===1?[...candidates][0]:null;
}
function sleepSummary(state,date=selectedDate) {
  const result={night:null,nap:null,total:null,error:false};
  if(Boolean(state.nap)!==Boolean(state.napEnd))return {...result,error:true};
  if(state.sleep&&state.wake){
    if(state.sleep===state.wake)return {...result,error:true};
    const prior=new Date(`${date}T12:00:00Z`);
    if(state.sleep>state.wake)prior.setUTCDate(prior.getUTCDate()-1);
    const start=zonedInstant(prior.toISOString().slice(0,10),state.sleep), end=zonedInstant(date,state.wake);
    if(start===null||end===null||end<=start||end-start>86400000)return {...result,error:true};
    result.night=(end-start)/60000;result.nightStart=start;result.nightEnd=end;
  }
  if(state.nap&&state.napEnd){
    const start=zonedInstant(date,state.nap),end=zonedInstant(date,state.napEnd);
    if(start===null||end===null||end<=start||(result.nightEnd!==undefined&&start<result.nightEnd))return {...result,error:true};
    result.nap=(end-start)/60000;result.napEnd=end;
  }
  if(result.night!==null){
    if(result.nap!==null&&result.napEnd-result.nightStart>86400000)return {...result,error:true};
    result.total=result.night+(result.nap||0);
  }
  return result;
}
function sleepSummaryView(date=selectedDate) {
  const summary=sleepSummary(stateForDate(date),date);
  const value=minutes=>minutes===null?lt("unrecorded"):sleepDurationText(minutes);
  const message=summary.error?"sleepInvalid":summary.night===null?"sleepMissing":null;
  return `<div class="sleep-summary">${[["nightDuration",summary.night],["napDuration",summary.nap],["sleepTotal",summary.total]].map(([label,minutes])=>`<div class="summary-card"><small>${lt(label)}</small><strong aria-label="${esc(value(minutes))}">${minutes===null?"—":esc(value(minutes))}</strong></div>`).join("")}</div><p role="status" class="muted">${message?lt(message):""}</p>`;
}
function sleepQuickSummary(date=selectedDate) {
  const summary=sleepSummary(stateForDate(date),date);
  return summary.error?lt("sleepInvalid"):summary.total===null?lt("sleepMissing"):sleepDurationText(summary.total);
}
function sleepDurationText(minutes) {
  const total=Math.round(minutes),hours=Math.floor(total/60),remainder=total%60;
  return language==="ar"?`${hours} س ${remainder} د`:`${hours}h ${remainder}m`;
}
function sleepInsights(date=selectedDate) {
  const readings=[...days.entries()]
    .filter(([recordDate,state])=>recordDate<=date&&state.sleep&&state.wake)
    .map(([recordDate,state])=>{
      const summary=sleepSummary(state,recordDate);
      if(summary.error||summary.total===null)return null;
      const [hour,minute]=state.wake.split(":").map(Number);
      const tasks=(state.stations||[]).filter(station=>!station.habit).flatMap(station=>station.tasks||[]).filter(task=>["done","pending"].includes(task.status));
      return {date:recordDate,duration:summary.total,wake:hour*60+minute,done:tasks.filter(task=>task.status==="done").length,total:tasks.length};
    })
    .filter(Boolean)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(-14);
  const avgWake=()=>{
    const radians=readings.map(item=>item.wake/1440*Math.PI*2);
    const angle=Math.atan2(radians.reduce((sum,value)=>sum+Math.sin(value),0),radians.reduce((sum,value)=>sum+Math.cos(value),0));
    return Math.round((angle<0?angle+Math.PI*2:angle)/(Math.PI*2)*1440)%1440;
  };
  const average=readings.length>=2?`<p>${lt("sleepAverage")}: <strong dir="ltr">${sleepDurationText(Math.round(readings.reduce((sum,item)=>sum+item.duration,0)/readings.length))}</strong></p><p>${lt("sleepAverageWake")}: <strong dir="ltr">${timeText(avgWake())}</strong></p>`:`<p>${lt("sleepWait")} (${readings.length}/2)</p>`;
  const taskDays=readings.filter(item=>item.total>0);
  let taskPattern;
  if(taskDays.length<4)taskPattern=`<p class="muted">${taskDays.length?lt("sleepNeedTasks"):lt("sleepNoTaskHistory")} (${taskDays.length}/4)</p>`;
  else {
    const midpoint=(Math.min(...taskDays.map(item=>item.duration))+Math.max(...taskDays.map(item=>item.duration)))/2;
    const shorter=taskDays.filter(item=>item.duration<=midpoint),longer=taskDays.filter(item=>item.duration>midpoint);
    if(shorter.length<2||longer.length<2)taskPattern=`<p class="muted">${lt("sleepNeedVariation")} (${taskDays.length} ${lt("sleepCount")})</p>`;
    else {
      const rate=group=>Math.round(group.reduce((sum,item)=>sum+item.done,0)/group.reduce((sum,item)=>sum+item.total,0)*100);
      const shortRate=rate(shorter),longRate=rate(longer),sampleCount=taskDays.length;
      taskPattern=`<h4>${lt("sleepComparison")}</h4><div class="sleep-pattern-rates"><span>${lt("sleepShorter")}: <b dir="ltr">${shortRate}%</b></span><span>${lt("sleepLonger")}: <b dir="ltr">${longRate}%</b></span></div><p class="muted">${sampleCount} ${lt("sleepCount")}. ${lt("sleepCorrelationCaution")}</p><p>${lt(longRate>=shortRate+15?"sleepSuggestionLonger":"sleepSuggestionNeutral")}</p>`;
    }
  }
  return `<section class="sleep-insights"><h3>${lt("sleepInsightsTitle")}</h3><p class="muted">${readings.length} ${lt("sleepCount")}</p>${average}${taskPattern}<small>${lt("sleepReady")}</small></section>`;
}
side = function() {
  const stations=livingState().stations, tasks=stations.filter(s=>!s.habit).flatMap(s=>s.tasks), habits=stations.filter(s=>s.habit).flatMap(s=>s.tasks);
  const card=(label,items)=>{const stats=MihwerProgressEngine.summarize(items.map(task=>({id:task.id,date:selectedDate,status:task.status})));return `<div class="daily-counter"><span>${lt(label)}</span><strong>${stats.complete}<small> / ${stats.eligible}</small></strong><progress max="${stats.eligible||1}" value="${stats.complete}" aria-label="${lt(label)}"></progress></div>`;};
  return `<aside class="side"><section class="panel"><p class="eyebrow">${lt("examples")}</p><h3>${t("daySummary")}</h3><div class="daily-counters">${card("task",tasks)}${card("habit",habits)}</div><button class="secondary" data-utility="analytics">${lt("intelligence")}</button><p class="muted">${t("simulation")}</p></section><section class="panel"><h3>${t("storyNote")}</h3><p>${t("storyNoteDesc")}</p>${button("writeMoment","document")}</section></aside>`;
};
function analyticsPanel() {
  const stations=livingState().stations;
  const groups=[["task",stations.filter(s=>!s.habit)],["habit",stations.filter(s=>s.habit)]];
  const metric=([label,items])=>{const tasks=items.flatMap(s=>s.tasks),stats=MihwerProgressEngine.summarize(tasks.map(task=>({id:task.id,date:selectedDate,status:task.status}))),pct=stats.ratio===null?"—":`${Math.round(stats.ratio*100)}%`;
    return `<section class="summary-card progress-metric progress-metric-${label}"><small>${lt(label)}</small><strong>${pct} · ${stats.complete}/${stats.eligible}</strong><progress max="100" value="${stats.ratio===null?0:Math.round(stats.ratio*100)}" aria-label="${lt(label)}"></progress><details class="utility-details"><summary>${lt("evidence")}</summary><ul>${tasks.map(task=>`<li>${esc(task.name[language==="ar"?0:1])} · ${lt(task.status==="done"?"done":task.status==="cancelled"?"cancelTask":"pending")}</li>`).join("")}</ul></details></section>`;};
  const measured=stations.flatMap(s=>s.tasks).filter(task=>task.status==="done"&&task.elapsedMs!==undefined);
  return `<p class="muted">${lt("metricNote")}</p><div class="date-cards">${groups.map(metric).join("")}</div><section class="summary-card"><h3>${lt("comparison")}</h3><p class="muted">${lt("comparisonNote")}</p>${measured.length?`<ul>${measured.map(task=>`<li>${esc(task.name[language==="ar"?0:1])} · ${lt("estimated")}: ${task.estimate} ${lt("minutes")} · ${lt("actual")}: <b dir="ltr">${elapsedText(task)}</b> (${durationSource(task)})</li>`).join("")}</ul>`:`<p>${lt("noEvidence")}</p>`}</section><p class="muted">${lt("temporary")}</p>`;
}
function sleepPanel(date=selectedDate) {
  const state=stateForDate(date);
  return `<label class="field">${lt("sleepWakeDate")}<input id="sleep-date" type="date" value="${esc(date)}"></label><p class="muted">${lt("sleepEntryHint")}</p><div id="sleep-summary">${sleepSummaryView(date)}</div><div class="sleep-fields">${[["actualSleep","sleep"],["wakeTime","wake"],["napTime","nap"],["napEnd","napEnd"]].map(([label,key])=>`<label class="field mini-field">${lt(label)}<input type="time" data-sleep-record="${key}" data-record-date="${esc(date)}" value="${esc(state[key]||"")}"></label>`).join("")}</div><div id="sleep-analysis">${sleepInsights(date)}</div><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("sleepAssumption")}</p><p class="muted">${lt("temporary")}</p></details>`;
}
function zoneParts(date=new Date()) {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:livingZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  return Number(parts.find(p=>p.type==="hour").value)*60+Number(parts.find(p=>p.type==="minute").value);
}
function displayedMinute() {
  if(scenePreviewMinute!==null)return scenePreviewMinute;
  if(selectedDate<zoneDate())return 1439;
  if(selectedDate>zoneDate())return 0;
  return livingMinute;
}
function journeyTimeLabel() {
  if(scenePreviewMinute!==null)return `${lt("previewTime")} · ${timeText(scenePreviewMinute)}`;
  if(selectedDate<zoneDate())return `${lt("historyView")} · ${timeText(1439)}`;
  if(selectedDate>zoneDate())return `${lt("futureView")} · ${timeText(0)}`;
  return `${lt("journeyAutoNow")} · ${timeText(livingMinute)}`;
}
function journeyTimeHint() {
  return scenePreviewMinute!==null||selectedDate!==zoneDate()?lt("previewHint"):lt("journeyAutoHint");
}
function preciseZoneMinute(date=new Date()) {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:livingZone,hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
  return Number(parts.find(p=>p.type==="hour").value)*60+Number(parts.find(p=>p.type==="minute").value)+Number(parts.find(p=>p.type==="second").value)/60;
}
function calendarText(calendar) {
  const date=new Date(`${selectedDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(language==="ar"?"ar-SA":"en-US",{timeZone:"UTC",calendar,year:"numeric",month:"long",day:"numeric"}).format(date);
}
function journeyToolbar(showUtilities=true) {
  const base=new Date(`${selectedDate}T12:00:00Z`);
  const label=new Intl.DateTimeFormat(language==="ar"?"ar":"en",{timeZone:"UTC",weekday:"long",day:"numeric",month:"short"}).format(base);
  const dayLabel=`${esc(label)}${selectedDate===zoneDate()?` <small>· ${lt("today")}</small>`:""}`;
  return `<div class="journey-utility"><nav class="day-picker" aria-label="${lt("weekStrip")}">
    <button class="day-arrow" data-day-shift="-1" aria-label="${lt("previousDay")}" title="${lt("previousDay")}">${language==="ar"?"›":"‹"}</button>
    <span class="day-current ${showUtilities?"":"day-label"}" aria-label="${lt("currentDate")}: ${esc(label)}">${dayLabel}</span>
    <button class="day-arrow" data-day-shift="1" aria-label="${lt("nextDay")}" title="${lt("nextDay")}">${language==="ar"?"‹":"›"}</button>
    <button class="day-today" data-utility="today-direct">${lt("today")}</button></nav>${showUtilities?`<div class="journey-utility-actions"><button class="secondary" data-utility="sleep">${lt("sleepTab")}</button><button class="secondary" data-utility="prayers">${lt("prayers")}</button></div>`:""}</div>`;
}
function datePanel() {
  return `<div class="date-cards"><div class="summary-card"><small>${lt("gregorian")}</small><strong>${esc(calendarText("gregory"))}</strong></div><div class="summary-card"><small>${lt("hijri")}</small><strong>${esc(calendarText("islamic-umalqura"))}</strong></div></div>
    <p class="muted">${lt("hijriNote")}</p><label class="field">${lt("currentDate")}<input id="journey-date-input" type="date" value="${esc(selectedDate)}"></label><button class="secondary" data-utility="today">${lt("todayButton")}</button>`;
}
function progressHeatmapModel(){
  const taskSlice=globalThis.MihwarTaskSlice;
  if(taskSlice){
    const days=new Map();
    if(taskSlice.state?.auth==="authenticated"){
      for(const task of taskSlice.state.tasks||[]){
        if(!task||task.status==="archived"||!MihwerExtendedValidation.isDate(task.startDate))continue;
        if(!days.has(task.startDate))days.set(task.startDate,{date:task.startDate,stations:[],activities:[]});
        days.get(task.startDate).stations.push({id:`server-tasks-${task.startDate}`,habit:false,tasks:[{
          id:task.id,name:task.title,status:task.status==="completed"?"done":"pending"
        }]});
      }
    }
    const sources=taskSlice.state?.dailySources;
    const habits=taskSlice.state?.auth==="authenticated"&&sources?.status==="ready"?sources.data.heatmapHabits:[];
    const model=globalThis.MihwerProgressHeatmap.build({today:taskSlice.state?.loadedToday||zoneDate(),days:[...days.values()],extendedTasks:[],habits});
    model.source=taskSlice.state?.auth==="authenticated"&&sources?.status==="ready"?"server-tasks-habits":"server-tasks";
    return model;
  }
  return globalThis.MihwerProgressHeatmap.build({
    today:zoneDate(),
    days:[...days.entries()].map(([date,state])=>({date,...state})),
    extendedTasks:globalThis.MihwerExtendedTasks||[],
    habits:globalThis.MihwerRecurringHabits||[]
  });
}
function clockPanel() {
  const available=typeof Intl.supportedValuesOf==="function"?Intl.supportedValuesOf("timeZone"):[];
  const zones=[...new Set([livingZone,"UTC",...available])];
  const themes={dark:["داكن","Dark"],light:["فاتح","Light"],blue:["أزرق","Blue"],maroon:["عنابي","Maroon"]};
  const traveler=globalThis.MihwerJourneySettings?.traveler||"boy";
  const controls=screen==="day"?timeControls():"";
  const heatmapModel=progressHeatmapModel();
  return `<div class="prayer-settings"><label class="field mini-field">${t("language")}<select id="language"><option value="ar" ${language==="ar"?"selected":""}>العربية</option><option value="en" ${language==="en"?"selected":""}>English</option></select></label>
    <label class="field mini-field">${t("theme")}<select id="theme">${Object.entries(themes).map(([id,label])=>`<option value="${id}" ${id===(document.body.dataset.theme||"dark")?"selected":""}>${label[language==="ar"?0:1]}</option>`).join("")}</select></label></div>
    <label class="field mini-field">${lt("zone")}<select id="living-zone">${zones.map(zone=>`<option value="${esc(zone)}" ${zone===livingZone?"selected":""}>${esc(zone)}</option>`).join("")}</select></label>
    <section class="journey-settings"><h3>${lt("dateTab")}</h3><div class="date-cards"><div class="summary-card"><small>${lt("gregorian")}</small><strong>${esc(calendarText("gregory"))}</strong></div><div class="summary-card"><small>${lt("hijri")}</small><strong>${esc(calendarText("islamic-umalqura"))}</strong></div></div><p class="muted">${lt("hijriNote")}</p><label class="field">${lt("currentDate")}<input id="journey-date-input" type="date" value="${esc(selectedDate)}"></label><button class="secondary" data-utility="today">${lt("todayButton")}</button></section>
    <label class="field mini-field">${t("compareTitle")}<select id="living-direction">${["flow","map","density"].map(id=>`<option value="${id}" ${id===direction?"selected":""}>${t(id)}</option>`).join("")}</select></label>
    <section class="journey-settings"><h3>${lt("settings")}</h3><label class="field">${lt("travelerSetting")}<select data-traveler-choice><option value="boy" ${traveler==="boy"?"selected":""}>${lt("boy")}</option><option value="girl" ${traveler==="girl"?"selected":""}>${lt("girl")}</option></select></label><label class="field">${lt("intentionSetting")}<textarea data-intention-setting rows="2" maxlength="180">${esc(livingState().dailyIntention||"")}</textarea></label><p class="muted">${lt("intentionHint")}</p></section>
    ${globalThis.MihwerProgressHeatmap.render(heatmapModel,language)}
    ${controls}
    <div class="options"><button class="secondary" data-utility="prayer-settings">${lt("prayerSettings")}</button></div><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("zoneNote")}</p><p>${lt("liveNote")}</p><p>${t("compareDesc")}</p><p>${t(direction==="flow"?"flowCaption":direction==="map"?"mapCaption":"densityCaption")}</p></details>
    <details class="utility-details settings-system-log"><summary>${lt("systemLog")} · ${globalThis.MihwerSystemLog?.entries.length||0}</summary><p>${lt("systemLogHint")}</p>${globalThis.MihwerSystemLog?.view()||""}</details>`;
}
function timeControls() {
  const minute=displayedMinute(),live=scenePreviewMinute===null&&selectedDate===zoneDate();
  return `<section class="time-controls journey-settings-time" aria-label="${lt("settings")}"><div class="time-display"><strong id="clock-value"><span id="clock-label">${lt(live?"now":"previewTime")}</span>: <bdi id="clock-time">${timeText(minute)}</bdi><span class="clock-zone-separator"> · </span><bdi id="clock-zone">${esc(livingZone)}</bdi></strong> · <span id="clock-mode">${lt(live?"automatic":"previewTime")}</span></div><p id="near-label" class="muted"></p><label class="scene-scrubber"><span>${lt("scenePreview")}</span><input id="scene-time-scrubber" type="range" min="0" max="1439" step="5" value="${minute}" aria-label="${lt("scenePreview")}" aria-describedby="time-zone-status"><span id="scene-time-value" dir="ltr">${timeText(minute)}</span></label><p id="time-zone-status" role="status" aria-live="polite" hidden></p><button type="button" class="scene-now" data-scene-now ${scenePreviewMinute===null?"hidden":""}>${lt("backToNow")}</button><p id="schedule-announcement" role="status" aria-live="polite"></p><p class="muted">${lt(prayerLocation?"solarDataAvailable":"solarDataUnavailable")}</p><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("liveNote")}</p></details></section>`;
}
function prayerPanel() {
  const options=(items,selected)=>`<option value="">${lt("choose")}</option>`+Object.entries(items).map(([id,label])=>`<option value="${id}" ${id===selected?"selected":""}>${esc(label[language==="ar"?0:1])}</option>`).join("");
  const countries=Object.fromEntries(Object.entries(prayerCountries).map(([id,value])=>[id,value.name]));
  const asr={standard:livingText.standard,hanafi:livingText.hanafi}, ramadan={yes:livingText.yes,no:livingText.no};
  if(!prayerEditing)return `<p class="muted">${lt("prayerShort")}</p><div id="prayer-results" role="status" aria-live="polite">${prayerResults()}</div><button class="secondary" data-utility="prayer-settings">${lt("prayerSettings")}</button><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("prayerBlocked")}</p><p>${lt("hijriNote")}</p></details>`;
  return `<p class="muted">${lt("prayerShort")}</p><div class="prayer-settings"><label class="field mini-field">${lt("country")}<select id="prayer-country">${options(countries,prayerCountry)}</select></label>
    <label class="field">${lt("method")}<select id="prayer-method">${options(prayerMethods,prayerMethod)}</select></label>
    <label class="field">${lt("asr")}<select id="prayer-asr">${options(asr,prayerAsr)}</select></label>
    ${prayerMethod==="UmmAlQura"?`<label class="field">${lt("ramadan")}<select id="prayer-ramadan">${options(ramadan,prayerRamadanDate===selectedDate?prayerRamadan:"")}</select></label>`:""}</div>
    <p class="muted">${lt("locationNote")}</p>
    <div class="prayer-settings"><label class="field">${lt("cityName")}<input id="prayer-city" maxlength="100" value="${esc(prayerCity)}"></label><label class="field">${lt("latitude")}<input id="prayer-latitude" inputmode="decimal" type="number" min="-90" max="90" step="any" value="${prayerLocation?.source==="manual"?esc(prayerLocation.latitude):""}"></label><label class="field">${lt("longitude")}<input id="prayer-longitude" inputmode="decimal" type="number" min="-180" max="180" step="any" value="${prayerLocation?.source==="manual"?esc(prayerLocation.longitude):""}"></label></div>
    <div class="options"><button class="secondary" data-utility="manual-location">${lt("useCoordinates")}</button><button class="secondary" data-utility="locate">${lt("locate")}</button><button class="secondary" data-utility="clear-location">${lt("clearLocation")}</button><button class="secondary" data-utility="prayer-view">${lt("showPrayer")}</button></div>
    <p id="location-status" role="status" aria-live="polite">${locationStatus?lt(locationStatus):""}</p>
    <div id="prayer-results" role="status" aria-live="polite">${prayerResults()}</div><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("prayerBlocked")}</p><p>${lt("countryNote")}</p><p>${lt("hijriNote")}</p></details>`;
}
function calculatePrayers(forDate=selectedDate) {
  const cacheKey=JSON.stringify([forDate,livingZone,prayerLocation,prayerCountry,prayerMethod,prayerAsr,prayerRamadan,prayerRamadanDate]);
  if(cacheKey===cachedPrayerKey&&cachedPrayerResult)return cachedPrayerResult;
  const finish=result=>{cachedPrayerKey=cacheKey;cachedPrayerResult=result;return result;};
  if(!prayerLocation||!prayerCountry||!prayerMethod||!prayerAsr)return finish({error:"prayerSetup"});
  if(prayerMethod==="UmmAlQura"&&(!prayerRamadan||prayerRamadanDate!==forDate))return finish({error:"ramadanSetup"});
  if(!window.adhan)return finish({error:"libraryUnavailable"});
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(forDate);
  if(!match)return finish({error:"prayerUnavailable"});
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12);
  if(date.getFullYear()!==Number(match[1])||date.getMonth()!==Number(match[2])-1||date.getDate()!==Number(match[3]))return finish({error:"prayerUnavailable"});
  try {
    const params=adhan.CalculationMethod[prayerMethod]();
    params.madhab=prayerAsr==="hanafi"?adhan.Madhab.Hanafi:adhan.Madhab.Shafi;
    params.highLatitudeRule=adhan.HighLatitudeRule.recommended(new adhan.Coordinates(prayerLocation.latitude,prayerLocation.longitude));
    if(prayerMethod==="UmmAlQura"&&prayerRamadan==="yes"&&prayerRamadanDate===forDate)params.adjustments.isha=30;
    const calculated=new adhan.PrayerTimes(new adhan.Coordinates(prayerLocation.latitude,prayerLocation.longitude),date,params);
    const times=[["fajr","fajr"],["sunrise","sunrisePrayer"],["dhuhr","dhuhr"],["asr","asrPrayer"],["maghrib","maghrib"],["isha","isha"]];
    if(times.some(([key])=>!(calculated[key] instanceof Date)||!Number.isFinite(calculated[key].getTime())))return finish({error:"prayerUnavailable"});
    const dateFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:livingZone,year:"numeric",month:"2-digit",day:"2-digit"});
    const normalizeTime=(key,label,value)=>{
      const instant=value.getTime();
      if(!Number.isFinite(instant))return null;
      const dateValue=new Date(instant);
      const parts=Object.fromEntries(dateFormatter.formatToParts(dateValue).map(part=>[part.type,part.value]));
      const time=new Intl.DateTimeFormat("en-GB",{timeZone:livingZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(dateValue);
      return {key,label,time,minute:MihwerJourneyTimeline.parseClock(time),instant,date:`${parts.year}-${parts.month}-${parts.day}`};
    };
    const normalized=times.map(([key,label])=>normalizeTime(key,label,calculated[key]));
    if(normalized.some(item=>!item))return finish({error:"prayerUnavailable"});
    const byKey=Object.fromEntries(normalized.map(item=>[item.key,item]));
    const solarSunset=normalizeTime("sunset","sunset",calculated.sunset);
    if(!solarSunset)return finish({error:"prayerUnavailable"});
    return finish({
      differentDay:normalized.some(item=>item.date!==forDate),
      times:normalized.filter(item=>item.key!=="sunrise"),
      sunrise:byKey.sunrise,
      sunset:solarSunset,
      solarNoon:byKey.dhuhr
    });
  } catch(error) {
    console.error("Prayer calculation failed:",error);
    return finish({error:"prayerUnavailable"});
  }
}
globalThis.MihwerPrayerInputs=()=>({configuredZone:livingZone,calculate:calculatePrayers,translate:lt});
function prayerResults() {
  const result=calculatePrayers();
  if(result.error)return `<p>${lt(result.error)}</p>`;
  const highLatitudeNote=Math.abs(prayerLocation.latitude)>48?`<p class="muted">${lt("highLatitudeRule")}</p>`:"";
  return `<p>${lt("prayerDate")}: <b>${esc(selectedDate)}</b> · ${lt("prayerZone")}: <b dir="ltr">${esc(livingZone)}</b></p>
    <ul class="prayer-times">${result.times.map(item=>`<li><span>${lt(item.label)}</span><b dir="ltr">${item.time}</b></li>`).join("")}</ul>
    ${result.differentDay?`<p>${lt("dateMismatch")}</p>`:""}${highLatitudeNote}`;
}
const obligatoryUnits={fajr:2,dhuhr:4,asr:4,maghrib:3,isha:4};
function prayerProgress(record) {
  const total=record.targetFard+record.targetBefore+record.targetAfter;
  const done=record.fard+record.before+record.after;
  return {total,done,ratio:done/total};
}
function prayerStatus(key) {
  const record=livingState().prayerRecords?.[key];
  if(!record)return "scheduled";
  const progress=prayerProgress(record);
  return progress.ratio>=1?"completed":progress.done?"inProgress":"scheduled";
}
function activityKindLabel(kind) {
  const labels={meeting:"activityMeeting",work:"activityWork",study:"activityStudy",exercise:"activityExercise",meal:"activityMeal",rest:"activityRest",custom:"activityCustom"};
  return lt(labels[kind]||"activityCustom");
}
function recordActivityHistory(activity,key) {
  activity.history??=[];
  activity.history.push({key,at:new Date().toISOString()});
}
function routeEntries() {
  const events=[];
  const add=event=>events.push(event);
  for(const station of livingState().stations){
    const activeTasks=station.tasks.filter(task=>!task.archived);
    if(activeTasks.length){
      for(const task of activeTasks){
        const duration=Number.isFinite(task.estimate)?task.estimate:null;
        const status=task.status==="done"?"completed":task.status==="cancelled"?"cancelled":task.startedAt!==undefined?"inProgress":"scheduled";
        add({id:`task:${task.id}`,title:task.name[language==="ar"?0:1],kind:station.habit?"habit":"task",
          sourceType:"task",sourceId:task.id,station,task,startMinute:task.time,
          endMinute:Number.isFinite(task.time)&&duration!==null?task.time+duration:task.time,
          durationMinutes:duration,actualMinutes:task.elapsedMs!==undefined||task.startedAt!==undefined?elapsedMs(task)/60000:null,
          actualStart:task.firstStart??null,actualEnd:task.lastStop??null,status,priority:task.priority||"not-urgent-important",summary:stationTitle(station),notes:task.notes||""});
      }
    }else{
      add({id:`station:${station.id}`,title:stationTitle(station),kind:"station",sourceType:"station",sourceId:station.id,
        station,startMinute:station.time,endMinute:station.time,durationMinutes:null,actualMinutes:null,
        status:"scheduled",summary:stationDesc(station),notes:station.notes||""});
    }
  }
  for(const activity of livingState().activities){
    const startMinute=MihwerJourneyTimeline.parseClock(activity.startTime);
    const duration=MihwerJourneyTimeline.durationBetween(activity.startTime,activity.endTime);
    const status=activity.status==="completed"?"completed":activity.status==="cancelled"?"cancelled":
      activity.status==="archived"?"archived":activity.status==="inProgress"?"inProgress":"scheduled";
    add({id:`activity:${activity.id}`,title:activity.title,kind:activity.kind||"custom",sourceType:"activity",
      sourceId:activity.id,activity,startMinute,endMinute:startMinute===null?null:duration===null?startMinute:startMinute+duration,
      durationMinutes:duration,actualMinutes:Number.isFinite(activity.actualDurationMinutes)?activity.actualDurationMinutes:null,
      status,priority:activity.priority||"not-urgent-important",summary:activity.summary||"",notes:activity.notes||""});
  }
  for(const habit of globalThis.MihwerRecurringHabits||[]){
    if(!MihwerHabitEngine.scheduled(habit,selectedDate))continue;
    const record=habit.records[selectedDate],definition=MihwerHabitEngine.definitionAt(habit,selectedDate);
    const status=record?.status==="completed"?"completed":record?.status==="exempt"?"exempt":"scheduled";
    add({id:`habit:${habit.id}:${selectedDate}`,title:habit.name,kind:"habit",sourceType:"recurringHabit",
      sourceId:habit.id,habit,startMinute:null,endMinute:null,durationMinutes:null,actualMinutes:null,status,
      summary:record?`${record.amount??""} / ${definition.target} ${definition.unit}`:`${lt("habitUnrecorded")} · ${definition.target} ${definition.unit}`,
      notes:""});
  }
  const sleepState=livingState(),sleep=sleepSummary(sleepState);
  if(sleepState.sleep&&sleepState.wake&&!sleep.error&&sleep.nightStart!==undefined){
    const start=Number(sleepState.sleep.slice(0,2))*60+Number(sleepState.sleep.slice(3,5));
    const end=Number(sleepState.wake.slice(0,2))*60+Number(sleepState.wake.slice(3,5));
    add({id:`sleep:${selectedDate}`,title:lt("sleepTab"),kind:"sleep",sourceType:"sleep",sourceId:selectedDate,
      startMinute:start>end?start-1440:start,endMinute:end,durationMinutes:sleep.night,actualMinutes:sleep.night,
      status:"completed",summary:"",notes:""});
  }
  const prayerResult=calculatePrayers();
  const prayerKeys=[["fajr","fajr"],["dhuhr","dhuhr"],["asr","asrPrayer"],["maghrib","maghrib"],["isha","isha"]];
  if(!prayerResult.error&&!prayerResult.differentDay){
    for(const prayer of prayerResult.times){
      const currentStatus=prayerStatus(prayer.key);
      add({id:`prayer:${prayer.key}`,title:lt(prayer.label),kind:"prayer",sourceType:"prayer",sourceId:prayer.key,
        prayer,startMinute:prayer.minute,endMinute:prayer.minute,durationMinutes:null,actualMinutes:null,
        status:currentStatus,summary:prayer.time,notes:""});
    }
  }else{
    for(const [key,label] of prayerKeys){
      add({id:`prayer:${key}`,title:lt(label),kind:"prayer",sourceType:"prayer",sourceId:key,
        prayer:null,startMinute:null,endMinute:null,durationMinutes:null,actualMinutes:null,status:"unconfigured",
        summary:"",notes:""});
    }
  }
  for(const task of globalThis.MihwerExtendedTasks||[]){
    if(task.archived||task.status==="cancelled"||!extendedOnDay(task,selectedDate))continue;
    const parentStatus=task.status==="completed"?"completed":"scheduled";
    add({id:`extended:${task.id}`,title:task.name,kind:"extendedTask",sourceType:"extendedTask",sourceId:task.id,
      extended:task,priority:task.priority||"not-urgent-important",startMinute:null,endMinute:null,durationMinutes:null,actualMinutes:null,status:parentStatus,
      summary:pathName(task.pathId),notes:""});
    for(const subtask of task.subtasks.filter(item=>(item.done?item.completedDate:item.date)===selectedDate&&!item.archived&&item.status!=="cancelled")){
      add({id:`extended-subtask:${task.id}:${subtask.id}`,title:subtask.name,kind:"extendedSubtask",sourceType:"extendedSubtask",
        sourceId:subtask.id,parentId:task.id,extended:task,priority:task.priority||"not-urgent-important",startMinute:null,endMinute:null,durationMinutes:null,actualMinutes:null,
        status:subtask.done?"completed":"scheduled",summary:task.name,notes:""});
    }
  }
  return MihwerJourneyTimeline.order(events);
}
function minuteForSelectedDay() {
  if(scenePreviewMinute!==null)return scenePreviewMinute;
  if(selectedDate<zoneDate())return 1440;
  if(selectedDate>zoneDate())return 0;
  return preciseZoneMinute();
}
function nearestEntry() {
  if(selectedDate!==zoneDate())return null;
  const entries=routeEntries();
  const minute=minuteForSelectedDay();
  return entries.find(entry=>entry.startMinute!==null&&entry.startMinute>=minute)||null;
}
scenery = function() {
  return `<section class="living-scene" aria-label="${lt("stage")}"><div class="sky" id="sky">
    <div class="stars" aria-hidden="true">✦　·　　　✧　　　　　·　　✦　　　　·</div><div class="cloud cloud-a" aria-hidden="true"></div><div class="cloud cloud-b" aria-hidden="true"></div>
    <svg class="sky-birds" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="M170 44q13-12 26 0 13-15 27 0m21 18q10-10 20 0 10-13 21 0m480-16q12-11 24 0 12-14 25 0m21 17q9-9 18 0 9-12 18 0"/></svg><span class="night-breeze" aria-hidden="true"></span>
    <button class="celestial sun" data-celestial-info="sun" aria-label="${lt("sunInfo")}">☀</button>
    <button class="celestial moon" data-celestial-info="moon" aria-label="${lt("moonInfo")}">${moonPhaseSvgMarkup("moon-button-clip")}</button>
    <svg class="sky-mountains" viewBox="0 0 1000 210" preserveAspectRatio="none" aria-hidden="true">
      <path class="mountain-far" d="M0 125 86 83 145 99 230 54 304 108 403 24 490 96 575 42 657 110 753 52 842 107 925 67 1000 97 1000 210 0 210Z"/>
      <path class="mountain-mid" d="M0 147 105 111 180 136 291 86 370 131 477 70 568 136 660 94 750 150 850 91 927 129 1000 108 1000 210 0 210Z"/>
      <path class="mountain-near" d="M0 159 88 135 170 158 267 119 365 154 461 116 555 159 647 126 741 168 833 123 919 161 1000 139 1000 210 0 210Z"/>
      <path class="valley-front" d="M0 175 Q120 145 244 177 T485 175 T720 178 T1000 166 L1000 210 0 210Z"/>
      <g class="skyline"><path d="M790 160v-38h10v38h9v-53l4-16 4 16v53h15v-25l15-14 15 14v25h11v-45h8v45h10v-59l4-17 4 17v59h13v-32h11v-18l5-10 5 10v50h13v-41l17-18 17 18v41h12v-67l4-19 4 19v67h14v-35h9v-16l5-8 5 8v51h12v-46l14-13 14 13v46h8v50H790Z"/></g>
      <path class="tree-line" d="M0 128q18-45 33 0-20-19-33 0m3 13q28-69 53 0-31-30-53 0m-2 17q17-42 34 0-20-18-34 0m936-21q20-48 38 0-22-21-38 0m25 15q15-37 30 0-17-16-30 0"/>
    </svg>
    <span id="phase" class="sky-phase"></span></div></section>`;
};
function formatMinutes(value) {
  if(!Number.isFinite(value))return lt("summaryUnknown");
  const minutes=Math.round(value);
  return minutes>=60?`${Math.floor(minutes/60)} ${lt("hourUnit")} ${minutes%60} ${lt("minuteUnit")}`:`${minutes} ${lt("minuteUnit")}`;
}
function prayerSummary(items) {
  const result=calculatePrayers();
  const times=!result.error&&!result.differentDay?[...result.times].sort((a,b)=>a.minute-b.minute):[];
  const next=nextPrayerResult(),upcoming=next.prayer;
  const noTime=next.error?lt("prayersUnavailable"):upcoming?"":selectedDate===zoneDate()?lt("prayersPassed"):lt("otherDay");
  return `<section class="prayer-summary" aria-label="${lt("allPrayers")}"><div class="prayer-next"><small>${lt("nextPrayer")}</small><strong id="next-prayer-name">${upcoming?lt(upcoming.label):next.error?lt("prayerUnconfigured"):noTime}</strong>${upcoming?`<span dir="ltr" id="next-prayer-time">${upcoming.time}</span>`:""}<span id="prayer-countdown" aria-live="polite">${upcoming?lt("countdown"):""}</span></div><h2 class="prayer-order-title">${lt("allPrayers")}</h2>${times.length?`<ol class="prayer-list" aria-label="${lt("allPrayers")}">${times.map(item=>`<li><span>${lt(item.label)}</span><b dir="ltr">${item.time}</b></li>`).join("")}</ol>`:`<p class="muted prayer-order-empty">${noTime||lt("prayerBlocked")}</p>`}<p class="muted prayer-order-note">${lt("prayerBlocked")}</p></section>`;
}
function daySummary(items) {
  const currentDate=zoneDate(), nowMinute=selectedDate===currentDate?zoneParts():selectedDate<currentDate?1440:-1;
  const summary=MihwerJourneyTimeline.summarize(items,nowMinute);
  const percent=summary.progress===null?"—":`${Math.round(summary.progress*100)}%`;
  const progress=summary.progress===null?0:Math.round(summary.progress*100);
  return `<section class="day-summary"><div class="summary-progress" style="--progress:${progress}%" aria-label="${percent}"><strong>${percent}</strong></div><h2>${lt("dayMetrics")}</h2><div class="day-summary-grid">
    ${[["scheduleCount",summary.scheduled],["completedCount",summary.completed],["remainingCount",summary.remaining],["overdueCount",summary.overdue],["plannedTime",formatMinutes(summary.plannedMinutes)],["actualTime",formatMinutes(summary.actualMinutes)],["dayProgress",percent]].map(([label,value])=>`<div class="summary-card"><small>${lt(label)}</small><strong>${esc(value)}</strong></div>`).join("")}
    </div></section>`;
}
function dayDashboard(items) {
  const currentDate=zoneDate(),nowMinute=selectedDate===currentDate?zoneParts():selectedDate<currentDate?1440:-1;
  const summary=MihwerJourneyTimeline.summarize(items,nowMinute),progress=summary.progress===null?0:Math.round(summary.progress*100);
  const unfinished=items.filter(item=>!["completed","cancelled","archived","exempt"].includes(item.status));
  const upcoming=unfinished.filter(item=>(item.task||item.sourceType==="activity"||item.sourceType==="extendedTask"||item.sourceType==="extendedSubtask")&&(item.startMinute===null||item.startMinute>=nowMinute)).slice(0,2);
  const habits=items.filter(item=>item.sourceType==="recurringHabit"||item.station?.habit);
  const pathIds=[...new Set((globalThis.MihwerExtendedTasks||[]).filter(task=>!task.archived&&task.status!=="cancelled"&&task.pathId&&task.pathId!=="finance").map(task=>task.pathId))];
  const entryAction=item=>item.station?`data-living-open="${esc(item.station.id)}"`:
    item.sourceType==="activity"?`data-activity-open="${esc(item.sourceId)}"`:
    item.sourceType==="extendedTask"||item.sourceType==="extendedSubtask"?`data-extended-open="${esc(item.parentId||item.sourceId)}"`:
    item.sourceType==="recurringHabit"?`data-habit-open="${esc(item.sourceId)}"`:"";
  const entries=upcoming.length?upcoming.map(item=>`<button class="dashboard-entry" ${entryAction(item)}><span><strong>${esc(item.title)}</strong><small>${item.startMinute===null?lt("activityUntimed"):timeText(item.startMinute)} · ${lt(item.status==="inProgress"?"activityRunning":"activityOpen")}</small></span><i aria-hidden="true">›</i></button>`).join(""):`<p class="dashboard-empty">${lt("emptyUpcoming")}</p>`;
  const habitMarks=habits.length?`<div class="habit-marks">${habits.slice(0,6).map(item=>`<span class="${item.status==="completed"?"marked":""}" aria-label="${esc(item.title)}">${item.status==="completed"?"✓":"·"}</span>`).join("")}</div><p class="dashboard-caption">${habits.filter(item=>item.status==="completed").length} / ${habits.length} · ${lt("habitsTitle")}</p>`:`<p class="dashboard-empty">${lt("emptyHabits")}</p>`;
  const pathNames=pathIds.length?pathIds.slice(0,2).map(id=>`<button class="dashboard-path" data-path="${esc(id)}"><span>${esc(typeof pathName==="function"?pathName(id):id)}</span><small>${lt("seeDetails")} ›</small></button>`).join(""):`<p class="dashboard-empty">${lt("emptyPaths")}</p>`;
  return `<section class="day-dashboard-grid" aria-label="${lt("dayMetrics")}">
    <article class="dashboard-card progress-card"><h2>${lt("dayProgressTitle")} <span aria-hidden="true">↗</span></h2><div class="progress-ring" style="--progress:${progress}%"><strong>${summary.progress===null?"—":`${progress}%`}</strong></div><p>${summary.completed} / ${summary.scheduled} · ${lt("completedCount")}</p></article>
    <article class="dashboard-card upcoming-card"><h2>${lt("upcomingTitle")} <span aria-hidden="true">☑</span></h2><div class="dashboard-list">${entries}</div><button class="dashboard-more" data-scroll-route>${lt("allItems")} ←</button></article>
    <article class="dashboard-card habits-card"><h2>${lt("habitsTitle")} <span aria-hidden="true">◌</span></h2>${habitMarks}</article>
    <article class="dashboard-card paths-card"><h2>${lt("pathsTitle")} <span aria-hidden="true">✧</span></h2><div class="dashboard-list">${pathNames}</div></article>
  </section>`;
}
function activityForm(activity=null) {
    const values=activity||{};
    return `<form data-activity-form="${esc(activity?.id||"new")}" data-record-date="${esc(selectedDate)}">
      <label class="field">${lt("activityName")}<input name="title" maxlength="120" required value="${esc(values.title||"")}"></label>
      <label class="field">${lt("activityType")}<select name="kind">${["meeting","work","study","exercise","meal","rest","custom"].map(kind=>`<option value="${kind}" ${kind===(values.kind||"custom")?"selected":""}>${activityKindLabel(kind)}</option>`).join("")}</select></label>
      ${priorityPicker(values.priority,'name="priority"')}
      <div class="prayer-settings"><label class="field">${lt("activityDate")}<input type="date" name="date" value="${esc(selectedDate)}" required></label><label class="field">${lt("startTime")}<input type="time" name="startTime" value="${esc(values.startTime||"")}"></label><label class="field">${lt("endTime")}<input type="time" name="endTime" value="${esc(values.endTime||"")}"></label><label class="field">${lt("actualDuration")}<input type="number" name="actualDuration" min="0" max="1440" step="1" value="${Number.isFinite(values.actualDurationMinutes)?values.actualDurationMinutes:""}"></label></div>
      <label class="field">${lt("activitySummary")}<input name="summary" maxlength="240" value="${esc(values.summary||"")}"></label>
      <label class="field">${lt("activityNotes")}<textarea name="notes" rows="3" maxlength="2000">${esc(values.notes||"")}</textarea></label>
      <p class="muted">${lt("activitySessionNote")}</p><p class="activity-form-error" role="alert"></p>
      <button class="primary" type="submit">${lt(activity?"activityUpdate":"activitySave")}</button></form>`;
}
function showActivityForm(id=null) {
    const activity=id?livingState().activities.find(item=>item.id===id):null;
    if(id&&!activity)return;
    showActivityDialog(activity?"activityEdit":"activityAdd",activityForm(activity));
}
function showActivityDialog(title,content) {
    if(dialog.open){dialogTitle.textContent=lt(title);dialogContent.innerHTML=content;return;}
    openDialog("momentTitle",content);dialogTitle.textContent=lt(title);
}
function showActivity(id) {
    const activity=livingState().activities.find(item=>item.id===id);
    if(!activity)return;
    const status=activity.status==="completed"?"activityDone":activity.status==="inProgress"?"activityRunning":activity.status==="cancelled"?"activityCancelled":activity.status==="archived"?"activityArchived":"activityOpen";
    const actions=activity.status==="archived"?`<button class="secondary" data-activity-action="restore" data-activity-id="${esc(id)}">${lt("activityRestore")}</button>`:
      activity.status==="cancelled"?`<button class="secondary" data-activity-action="restore" data-activity-id="${esc(id)}">${lt("activityRestore")}</button>`:
      `<button class="secondary" data-activity-action="start" data-activity-id="${esc(id)}" ${activity.status==="inProgress"||activity.status==="completed"?"disabled":""}>${lt("activityStartNow")}</button><button class="secondary" data-activity-action="complete" data-activity-id="${esc(id)}" ${activity.status==="completed"?"disabled":""}>${lt("activityCompleteNow")}</button>${activity.startTime?`<button class="secondary" data-activity-action="delay" data-activity-id="${esc(id)}">${lt("activityDelay")}</button>`:""}<button class="secondary" data-activity-action="cancel" data-activity-id="${esc(id)}">${lt("activityCancel")}</button><button class="secondary" data-activity-action="archive" data-activity-id="${esc(id)}">${lt("activityArchive")}</button>`;
    const history=activity.history||[];
    showActivityDialog("momentTitle",`<div class="summary-card"><small>${activityKindLabel(activity.kind)} · ${lt(status)}</small><strong>${esc(activity.title)}</strong><span dir="ltr">${activity.startTime?esc(activity.startTime):lt("activityUntimed")}${activity.endTime?` – ${esc(activity.endTime)}`:""}</span>${priorityBadge(activity.priority)}${activity.summary?`<p>${esc(activity.summary)}</p>`:""}</div>
      <p>${activity.notes?esc(activity.notes):lt("noContent")}</p><div class="summary-card"><small>${lt("actualStart")}</small><strong>${activity.actualStartAt?esc(recordedTime(activity.actualStartAt)):"—"}</strong><small>${lt("actualEnd")}</small><strong>${activity.actualEndAt?esc(recordedTime(activity.actualEndAt)):"—"}</strong><small>${lt("actualDuration")}</small><strong>${formatMinutes(activity.actualDurationMinutes)}</strong></div>
      <div class="options">${actions}<button class="secondary" data-activity-edit="${esc(id)}">${lt("edit")}</button></div><p id="activity-action-error" role="alert"></p>
      <details class="utility-details"><summary>${lt("activityHistory")}</summary>${history.length?`<ul>${history.map(item=>`<li>${esc(recordedTime(item.at))} · ${lt(item.key)}</li>`).join("")}</ul>`:`<p>${lt("activityHistoryEmpty")}</p>`}</details>`);
}
function applyActivityAction(activity,action) {
    const now=new Date().toISOString();
    const events={start:"activityStarted",complete:"activityCompleted",delay:"activityDeferred",cancel:"activityCancelledEvent",archive:"activityArchivedEvent",restore:"activityEdited"};
    if(!events[action])throw new Error("Unsupported activity action");
    if(action==="start"){activity.actualStartAt??=now;activity.status="inProgress";}
    if(action==="complete"){activity.actualEndAt=now;if(activity.actualStartAt)activity.actualDurationMinutes=Math.max(0,Math.round((Date.parse(now)-Date.parse(activity.actualStartAt))/60000));activity.status="completed";}
    if(action==="delay"){
      const shift=value=>{const minute=MihwerJourneyTimeline.parseClock(value);if(minute===null)return value;const shifted=(minute+15)%1440;return `${String(Math.floor(shifted/60)).padStart(2,"0")}:${String(shifted%60).padStart(2,"0")}`;};
      if(!activity.startTime)throw new Error("Cannot delay an untimed activity");
      const crossedMidnight=MihwerJourneyTimeline.parseClock(activity.startTime)+15>=1440;
      if(crossedMidnight){
        const source=stateForDate(selectedDate),targetDate=shiftDate(selectedDate,1),target=stateForDate(targetDate),index=source.activities.indexOf(activity);
        if(index<0||target.activities.some(item=>item.id===activity.id))throw new Error("Activity date conflict");
        source.activities.splice(index,1);target.activities.push(activity);selectedDate=targetDate;followToday=selectedDate===zoneDate();
        recordActivityHistory(activity,"activityRescheduled");
      }
      activity.startTime=shift(activity.startTime);if(activity.endTime)activity.endTime=shift(activity.endTime);
    }
    if(action==="cancel"){activity.previousStatus=activity.status;activity.status="cancelled";}
    if(action==="archive"){activity.previousStatus=activity.status;activity.status="archived";}
    if(action==="restore"){activity.status=activity.previousStatus||"scheduled";delete activity.previousStatus;}
    recordActivityHistory(activity,events[action]);
    const logAction=({start:"started",complete:"completed",delay:"rescheduled",cancel:"cancelled",archive:"archived",restore:"restored"})[action];
    if(logAction)globalThis.MihwerSystemLog?.record("activities",logAction,activity.title);
}
function dayStations() {
  const items=routeEntries();
  const routeMinute=minuteForSelectedDay();
  const next=selectedDate===zoneDate()?items.find(entry=>entry.startMinute!==null&&entry.startMinute>=routeMinute):null;
  const requestedIndex=items.findIndex(entry=>entry.id===routeFocusEntryId);
  const focusIndex=Math.max(0,requestedIndex>=0?requestedIndex:next?items.findIndex(entry=>entry.id===next.id):items.length-1);
  const statusLabel={scheduled:"activityOpen",pending:"pending",inProgress:"activityRunning",completed:"activityDone",cancelled:"activityCancelled",archived:"activityArchived",unconfigured:"prayerUnconfigured",exempt:"habitExempt"};
  const titleOf=item=>item.prayer?lt(item.prayer.label):item.task?item.task.name[language==="ar"?0:1]:item.station?stationTitle(item.station):item.activity?item.activity.title:item.title;
  return `<section class="journey-viewport" tabindex="0" aria-label="${t("dayTitle")}" data-route-index="${focusIndex}">
    <div class="journey-route-hud"><div class="journey-position" aria-live="polite"><strong>${routeManualFocus?`${lt("journeyPosition")} ${focusIndex+1} ${lt("journeyOf")} ${items.length}`:journeyTimeLabel()}</strong><small>${routeManualFocus?lt("journeyManualHint"):journeyTimeHint()}</small></div><button type="button" class="journey-resume" data-scene-now ${routeManualFocus?"":"hidden"}>${lt("journeyResume")}</button></div>
    <div class="journey-photo" aria-hidden="true"></div>
    <svg class="journey-world" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="journey-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--scene-top,#667f88)"/><stop offset=".62" stop-color="var(--journey-horizon,#edc38a)"/><stop offset="1" stop-color="#d5c59f"/></linearGradient>
        <linearGradient id="journey-haze" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff2cc" stop-opacity=".7"/><stop offset=".48" stop-color="#dce8df" stop-opacity=".22"/><stop offset="1" stop-color="#f8dfa0" stop-opacity="0"/></linearGradient>
        <linearGradient id="journey-road" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#384249"/><stop offset=".46" stop-color="#202c33"/><stop offset="1" stop-color="#171f25"/></linearGradient>
        <linearGradient id="journey-edge" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f4e3bd"/><stop offset=".5" stop-color="#fff3d4"/><stop offset="1" stop-color="#d7ddcb"/></linearGradient>
        <linearGradient id="journey-water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#82999a"/><stop offset=".5" stop-color="#607f83"/><stop offset="1" stop-color="#405b62"/></linearGradient>
        <linearGradient id="journey-mountain-far" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#596b70"/><stop offset=".56" stop-color="#35464d"/><stop offset="1" stop-color="#28383e"/></linearGradient>
        <linearGradient id="journey-mountain-near" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3d5148"/><stop offset=".5" stop-color="#263b36"/><stop offset="1" stop-color="#1b2b29"/></linearGradient>
        <linearGradient id="journey-ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#465b48"/><stop offset=".48" stop-color="#2b4137"/><stop offset="1" stop-color="#172a27"/></linearGradient>
        <radialGradient id="journey-sunlight"><stop stop-color="#fffbd7" stop-opacity=".95"/><stop offset=".12" stop-color="#ffe6a4" stop-opacity=".58"/><stop offset="1" stop-color="#ffc76c" stop-opacity="0"/></radialGradient>
        <radialGradient id="journey-traveler-fill" cx=".35" cy=".28" r=".8"><stop stop-color="#fff9e7"/><stop offset=".24" stop-color="#ffe2a1"/><stop offset=".68" stop-color="#d6a35c"/><stop offset="1" stop-color="#5a4432"/></radialGradient>
        <filter id="journey-light" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="18"/></filter>
        <filter id="journey-road-shadow" x="-50%" y="-30%" width="200%" height="170%"><feGaussianBlur stdDeviation="16"/></filter>
      </defs>
      <path class="world-sky" d="M0 0h1000v800H0Z"/>
      <g id="journey-stars" class="world-stars" aria-hidden="true">
        <circle class="world-star" cx="82" cy="74" r="1.7"/><circle class="world-star" cx="166" cy="184" r="1.2"/>
        <circle class="world-star" cx="231" cy="113" r="1.5"/><circle class="world-star" cx="306" cy="55" r="1.1"/>
        <circle class="world-star" cx="372" cy="214" r="1.7"/><circle class="world-star" cx="431" cy="104" r="1.2"/>
        <circle class="world-star" cx="562" cy="72" r="1.5"/><circle class="world-star" cx="621" cy="188" r="1.2"/>
        <circle class="world-star" cx="704" cy="117" r="1.8"/><circle class="world-star" cx="786" cy="62" r="1.2"/>
        <circle class="world-star" cx="866" cy="208" r="1.6"/><circle class="world-star" cx="941" cy="110" r="1.2"/>
        <circle class="world-star world-star-bright" cx="132" cy="126" r="2.1"/><circle class="world-star world-star-bright" cx="505" cy="226" r="2"/>
        <circle class="world-star world-star-bright" cx="815" cy="155" r="2.1"/>
      </g>
      <path class="world-water" d="M290 178q155-30 310 0t400-4v150H0V214q150-44 290-36Z"/>
      <path class="world-mountain world-mountain-far" d="M0 0 195 92q55 36 113 58l118 64-106-11q-96 6-171 52L0 301Zm1000 0L808 83q-66 37-113 69l-126 65 124-14q94 5 170 53l137 45Z"/>
      <path class="world-mountain world-mountain-near" d="M0 222q75-18 140 7t123 49q-96-16-263 63Zm1000 0q-78-14-143 12t-124 49q99-16 267 67Z"/>
      <path class="world-ground" d="M0 305q142-38 282 1t225 9q111-44 238-4t255-16v505H0Z"/>
      <path class="world-ground-shadow" d="M0 440q150-51 300-9t226-3q111-50 235 1t239-15v386H0Z"/>
      <path class="world-haze" d="M0 240q180-38 355 0t332-2 313 4v170H0Z"/>
      <g class="world-pines" aria-hidden="true">
        <path d="M34 535 76 442l-24 5 39-82 40 82-25-5 49 104Zm168-71 30-70-19 4 28-58 30 58-18-4 34 70Zm-68 185 50-117-31 6 46-95 46 95-30-6 55 117Zm686-170 37-85-23 4 34-73 35 73-22-4 41 85Zm-142 153 46-109-29 5 43-88 42 88-28-5 49 109Zm207-93 30-69-18 4 27-57 27 57-18-4 32 69Z"/>
        <path class="world-pine-light" d="M76 442l15-77 40 82-25-5 49 104-74-104 18-4Zm388 48 31-73-19 3 28-60 29 60-19-3 36 73Zm412-106 28-65 34 73-22-4 41 85-62-84 16-4Z"/>
      </g>
      <g class="world-grass" aria-hidden="true"><path d="M12 765q14-62 30 0m28 22q16-68 32 0m-9-67q13-50 27 0m790 43q15-67 31 0m28 25q14-58 29 0m-87-75q13-52 27 0M183 786q14-48 27 0m578-4q14-53 29 0"/></g>
      <circle class="world-sun-glow" id="journey-sun-glow" cx="500" cy="155" r="180"/>
      <circle class="world-sun" id="journey-sun" cx="500" cy="155" r="29"/>
      <g class="world-moon" id="journey-moon" transform="translate(740 150)">
        <defs><clipPath id="journey-moon-disc-clip"><circle r="27"/></clipPath></defs>
        <circle class="world-moon-disc" r="27"/>
        <circle class="world-moon-shadow" id="journey-moon-shadow" r="27" clip-path="url(#journey-moon-disc-clip)"/>
      </g>
      <g class="journey-road">
        <path class="journey-road-shadow road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-shadow road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-shadow road-far" d="M390 260C430 190 550 205 500 150"/>
        <path class="journey-road-glow road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-glow road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-glow road-far" d="M390 260C430 190 550 205 500 150"/>
        <path class="journey-road-amber road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-amber road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-amber road-far" d="M390 260C430 190 550 205 500 150"/>
        <path class="journey-road-edge road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-edge road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-edge road-far" d="M390 260C430 190 550 205 500 150"/>
        <path class="journey-road-surface road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-surface road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-surface road-far" d="M390 260C430 190 550 205 500 150"/>
        <path class="journey-road-mark road-near" d="M500 820C510 760 715 735 680 650"/>
        <path class="journey-road-mark road-middle" d="M680 650C645 570 330 630 350 530S760 495 710 390 340 360 390 260"/>
        <path class="journey-road-mark road-far" d="M390 260C430 190 550 205 500 150"/>
      </g>
      <path id="journey-route-track" class="journey-route-track" d="M500 820C510 760 715 735 680 650S330 630 350 530 760 495 710 390 340 360 390 260 550 205 500 150"/>
      <g class="journey-traveler" aria-hidden="true">
        <circle class="journey-traveler-halo" cx="510" cy="820" r="23"/>
        <circle class="journey-traveler-core" cx="510" cy="820" r="13"/>
        <circle class="journey-traveler-spark" cx="510" cy="820" r="3"/>
      </g>
    </svg>
    <button type="button" class="journey-sleep-quick" data-utility="sleep" aria-label="${lt("sleepTab")}"><span class="journey-sleep-icon" aria-hidden="true">◒</span><span class="journey-sleep-copy"><strong>${lt("sleepTab")}</strong><small id="journey-sleep-summary">${esc(sleepQuickSummary())}</small></span><span class="journey-sleep-arrow" aria-hidden="true">↗</span></button>
    <div class="day-route" role="list" tabindex="0" aria-label="${t("journey")}">${items.map((item,index)=>{
    const station=item.station, task=item.task, completed=item.status==="completed", current=next?.id===item.id;
    const action=item.sourceType==="prayer"?(item.prayer?`data-prayer-open="${esc(item.sourceId)}"`:`data-utility="prayer-settings"`):
      station?`data-living-open="${esc(station.id)}"`:item.sourceType==="activity"?`data-activity-open="${esc(item.sourceId)}"`:
      item.sourceType==="extendedTask"||item.sourceType==="extendedSubtask"?`data-extended-open="${esc(item.parentId||item.sourceId)}"`:
      item.sourceType==="recurringHabit"?`data-habit-open="${esc(item.sourceId)}"`:
      item.sourceType==="sleep"?`data-utility="sleep"`:"";
    const start=item.startMinute===null?lt("activityUntimed"):timeText(item.startMinute);
    const end=item.endMinute!==null&&item.endMinute!==item.startMinute?` – ${timeText(item.endMinute)}`:"";
    const state=lt(statusLabel[item.status]||"activityOpen");
    const title=titleOf(item), icon=item.sourceType==="prayer"?"☾":station?.icon||(item.sourceType==="sleep"?"◒":item.sourceType==="activity"?"◦":"·");
    const hasPriority=["task","activity","extendedTask","extendedSubtask"].includes(item.sourceType);
    const priorityKey=hasPriority?taskPriority(item.priority):"";
    const priority=hasPriority?priorityBadge(priorityKey,true):"";
    const priorityAttributes=hasPriority?`data-priority="${priorityKey}"`:"";
      const canReschedule=(item.sourceType==="activity"&&item.startMinute!==null&&["scheduled","inProgress"].includes(item.status))||
        (item.sourceType==="task"&&item.startMinute!==null&&item.task?.status==="pending");
      return `<div class="route-row ${completed?"is-complete":""} ${current?"is-current":""} ${index===focusIndex?"is-focused":""} ${item.overlap?"is-overlapping":""}" data-entry="${esc(item.id)}" data-route-position="${index}" data-route-minute="${item.startMinute??""}" ${priorityAttributes} role="listitem" aria-hidden="false" ${station?`data-station="${esc(station.id)}"`:""}>
        <svg class="route-segment" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 C50 25 50 35 50 50"/>${index<items.length-1?`<path d="M50 50 C50 65 50 75 50 100"/>`:""}</svg>
        <div class="route-card"><button class="route-open" dir="${language==="ar"?"rtl":"ltr"}" ${action}><span class="route-card-heading"><span class="node-icon" aria-hidden="true">${icon}</span><strong>${esc(title)}</strong>${priority}</span><small class="route-time-status"><b dir="ltr">${esc(start)}${end}</b><span class="route-item-status" data-status="${esc(item.status)}">${lt(statusLabel[item.status]||"activityOpen")}</span></small></button>${canReschedule?`<button type="button" class="route-drag" data-entry-drag="${esc(item.id)}" aria-label="${lt("dragSchedule")}" title="${lt("dragSchedule")}">↕</button>`:""}</div>
        <span class="route-connector" aria-hidden="true"><i></i></span><button class="route-node" ${action} aria-label="${esc(title)}: ${state}">${completed?"✓":""}</button></div>`;
  }).join("")}</div><div class="journey-route-actions"><p class="journey-end-note" hidden>${lt("journeyEnd")}</p></div></section>`;
}
function rescheduleEntryBy(entryId,deltaMinutes) {
  if(!Number.isInteger(deltaMinutes)||!deltaMinutes)return;
  const entry=routeEntries().find(item=>item.id===entryId);
  if(!entry||entry.startMinute===null)throw new Error("Timeline entry is not reschedulable");
  const shifted=MihwerJourneyTimeline.shiftMinute(entry.startMinute,deltaMinutes);
  const sourceDate=selectedDate,targetDate=shiftDate(sourceDate,shifted.dayOffset);
  if(entry.sourceType==="activity"){
    const source=stateForDate(sourceDate),activity=source.activities?.find(item=>item.id===entry.sourceId);
    if(!activity||!["scheduled","inProgress"].includes(activity.status))throw new Error("Activity cannot be rescheduled");
    const target=stateForDate(targetDate);
    target.activities??=[];
    if(targetDate!==sourceDate&&target.activities.some(item=>item.id===activity.id))throw new Error("Activity date conflict");
    const duration=activity.endTime?MihwerJourneyTimeline.durationBetween(activity.startTime,activity.endTime):null;
    if(targetDate!==sourceDate){
      const index=source.activities.indexOf(activity);
      if(index<0)throw new Error("Activity source missing");
      source.activities.splice(index,1);
      target.activities.push(activity);
    }
    activity.startTime=timeText(shifted.minute);
    if(duration!==null)activity.endTime=timeText(MihwerJourneyTimeline.shiftMinute(shifted.minute,duration).minute);
    recordActivityHistory(activity,"activityRescheduled");
  }else if(entry.sourceType==="task"){
    const source=stateForDate(sourceDate),sourceStation=source.stations?.find(item=>item.id===entry.station.id);
    const task=sourceStation?.tasks.find(item=>item.id===entry.task.id);
    if(!sourceStation||!task||task.status!=="pending")throw new Error("Task cannot be rescheduled");
    if(targetDate===sourceDate){
      task.time=shifted.minute;
    }else{
      const target=stateForDate(targetDate);
      target.stations??=[];
      if(target.stations.some(item=>item.tasks?.some(existing=>existing.id===task.id)))throw new Error("Task date conflict");
      let targetStation=target.stations.find(item=>item.id===sourceStation.id);
      if(!targetStation){
        targetStation={...sourceStation,tasks:[]};
        target.stations.push(targetStation);
      }
      const index=sourceStation.tasks.indexOf(task);
      if(index<0)throw new Error("Task source missing");
      sourceStation.tasks.splice(index,1);
      task.time=shifted.minute;
      targetStation.tasks.push(task);
    }
    task.scheduleHistory??=[];
    task.scheduleHistory.push({from:sourceDate,to:targetDate,at:new Date().toISOString(),deltaMinutes});
    globalThis.MihwerSystemLog?.record("tasks","rescheduled",Array.isArray(task.name)?task.name[language==="ar"?0:1]:task.name,targetDate);
  }else{
    throw new Error("Unsupported timeline entry type");
  }
  selectedDate=targetDate;
  followToday=selectedDate===zoneDate();
  render();
  const announcement=document.querySelector("#schedule-announcement");
  if(announcement)announcement.textContent=lt("scheduleMoved");
}
let activeRouteDrag=null;
function clearRouteDrag() {
  if(activeRouteDrag?.card)activeRouteDrag.card.style.removeProperty("--drag-y");
  activeRouteDrag=null;
}
document.addEventListener("pointerdown",event=>{
  const handle=event.target.closest("[data-entry-drag]");
  if(!handle)return;
  if(event.button!==0)return;
  const row=handle.closest(".route-row"),card=handle.closest(".route-card");
  if(!row||!card)return;
  activeRouteDrag={entryId:handle.dataset.entryDrag,pointerId:event.pointerId,startY:event.clientY,card,handle};
  handle.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});
document.addEventListener("pointermove",event=>{
  if(!activeRouteDrag||event.pointerId!==activeRouteDrag.pointerId)return;
  if(activeRouteDrag.swipe)return;
  const delta=event.clientY-activeRouteDrag.startY;
  activeRouteDrag.card.style.setProperty("--drag-y",`${delta}px`);
});
document.addEventListener("pointerup",event=>{
  if(!activeRouteDrag||event.pointerId!==activeRouteDrag.pointerId)return;
  const drag=activeRouteDrag,delta=event.clientY-drag.startY;
  clearRouteDrag();
  const minutes=Math.round(delta/5)*5;
  if(Math.abs(minutes)<5)return;
  try{rescheduleEntryBy(drag.entryId,minutes);}
  catch(error){
    console.error("Timeline reschedule failed:",error);
    const announcement=document.querySelector("#schedule-announcement");
    if(announcement)announcement.textContent=lt("scheduleUnavailable");
  }
});
document.addEventListener("pointercancel",event=>{
  if(activeRouteDrag?.pointerId===event.pointerId)clearRouteDrag();
});
document.addEventListener("keydown",event=>{
  const handle=event.target.closest?.("[data-entry-drag]");
  if(!handle||!["ArrowUp","ArrowDown"].includes(event.key))return;
  event.preventDefault();
  try{
    rescheduleEntryBy(handle.dataset.entryDrag,event.key==="ArrowDown"?15:-15);
    document.querySelector(`[data-entry-drag="${CSS.escape(handle.dataset.entryDrag)}"]`)?.focus();
  }catch(error){
    console.error("Timeline reschedule failed:",error);
    const announcement=document.querySelector("#schedule-announcement");
    if(announcement)announcement.textContent=lt("scheduleUnavailable");
  }
});
let routeScrollIntentUntil=0,routeTouchStartY=null;
function browseRouteBy(step) {
  const viewport=document.querySelector(".journey-viewport");
  if(screen!=="day"||!viewport)return;
  const current=Number(viewport.dataset.routeIndex)||0;
  const length=viewport.querySelectorAll(".route-row").length;
  if(!length)return;
  const index=MihwerJourneyTimeline.stepPosition(current,step,length);
  focusRoute(index,true);
  viewport.querySelectorAll(".route-row")[index]?.scrollIntoView({block:"center",behavior:reduced.matches?"auto":"smooth"});
}
document.addEventListener("wheel",event=>{
  if(screen==="day"&&event.target.closest(".journey-viewport"))routeScrollIntentUntil=Date.now()+1600;
},{passive:true});
document.addEventListener("touchstart",event=>{
  if(screen==="day"&&event.target.closest(".journey-viewport")&&event.touches.length===1){
    routeTouchStartY=event.touches[0].clientY;
    routeScrollIntentUntil=Date.now()+2400;
  }
},{passive:true});
document.addEventListener("touchend",event=>{
  if(routeTouchStartY===null)return;
  const touch=event.changedTouches[0];
  if(touch&&Math.abs(touch.clientY-routeTouchStartY)>12)routeScrollIntentUntil=Date.now()+1600;
  routeTouchStartY=null;
},{passive:true});
window.addEventListener("scroll",()=>{
  if(screen!=="day"||Date.now()>routeScrollIntentUntil)return;
  const rows=[...document.querySelectorAll(".journey-viewport .route-row")];
  if(!rows.length)return;
  const center=window.innerHeight/2;
  let closest=0,smallest=Infinity;
  rows.forEach((row,index)=>{
    const bounds=row.getBoundingClientRect();
    const distance=Math.abs((bounds.top+bounds.bottom)/2-center);
    if(distance<smallest){smallest=distance;closest=index;}
  });
  focusRoute(closest,true);
});
document.addEventListener("keydown",event=>{
  if(!event.target.closest?.(".journey-viewport")||!["ArrowUp","ArrowDown"].includes(event.key)||
    event.target.closest("button,input,select,textarea"))return;
  event.preventDefault();
  browseRouteBy(event.key==="ArrowDown"?1:-1);
});
function updateScene() {
  const sceneTime=sceneMinute();
  const wallMinute=displayedMinute(),live=scenePreviewMinute===null&&selectedDate===zoneDate();
  const solar=solarSceneState();
  const [top,bottom]=solar?.sun?scenePalette(sceneTime):["rgb(28,48,56)","rgb(22,35,58)"];
  const daylightProgress=solar?.progress??Math.max(0,Math.min(1,(sceneTime-360)/720));
  const daylightOpacity=solarSunOpacity(sceneTime,solar);
  const altitude=solar?.sun?.altitude;
  const lighting=sceneLighting(altitude);
  const scenePhase=solar?.sun?phase(sceneTime,solar):null;
  document.body.dataset.scenePreview=String(scenePreviewMinute!==null);
  document.body.style.setProperty("--scene-top",top);
  document.body.style.setProperty("--scene-bottom",bottom);
  document.body.style.setProperty("--journey-glow",lighting.glow);
  document.body.style.setProperty("--journey-light",lighting.light);
  document.body.dataset.scenePhase=scenePhase??"unavailable";
  const globalSky=document.querySelector(".global-atmosphere");
  if(globalSky){
    globalSky.dataset.phase=scenePhase??"unavailable";
    globalSky.style.setProperty("--celestial-progress",String(sceneTime/1440));
    const sunOpacity=daylightOpacity;
    const moonOpacity=moonSceneOpacity(solar?.moon);
    const sun=globalSky.querySelector(".journey-celestial-sun"),moon=globalSky.querySelector(".journey-celestial-moon"),clock=document.querySelector(".journey-celestial-time");
    const sunPoint=solar?.sun?celestialPoint(solar.sun,null):null;
    const moonPoint=solar?.moon?celestialPoint(solar.moon,null):null;
    const shadow=solar?.moon?MihwerCelestial.moonShadowVector(solar.moon.illumination,solar.moon.brightLimbAngle,11):{x:0,y:0};
    if(sun){sun.style.left=`${sunPoint?sunPoint.x/10:18+64*daylightProgress}%`;sun.style.top=`${sunPoint?sunPoint.y/8:57-34*Math.sin(Math.PI*daylightProgress)}%`;sun.style.opacity=String(sunOpacity);}
    if(moon){if(!moon.querySelector("svg"))moon.innerHTML=moonPhaseSvgMarkup();moon.style.left=`${moonPoint?moonPoint.x/10:50}%`;moon.style.top=`${moonPoint?moonPoint.y/8:50}%`;moon.style.opacity=String(moonOpacity);moon.querySelector(".moon-phase-shadow")?.setAttribute("cx",String(shadow.x));moon.querySelector(".moon-phase-shadow")?.setAttribute("cy",String(shadow.y));}
    if(clock)clock.textContent=`${sunOpacity>.15?"☀":moonOpacity>.15?"☾":"✦"} ${timeText(wallMinute)} · ${lt(solar===null&&scenePreviewMinute!==null?"timeZoneTransitionShort":scenePhase??"solarDataUnavailable")}`;
  }
  if(screen!=="day"){globalThis.MihwerScenicJourneyEffect?.updatePeriodTraveler();return;}
  const sky=document.querySelector("#sky");if(!sky)return;
  sky.style.setProperty("--sky-top",top);sky.style.setProperty("--sky-bottom",bottom);
  const photo=document.querySelector(".journey-photo");
  if(photo){
    photo.style.setProperty("--journey-photo-top",lighting.top);
    photo.style.setProperty("--journey-photo-mid",lighting.mid);
    photo.style.setProperty("--journey-photo-bottom",lighting.bottom);
    photo.style.setProperty("--journey-photo-filter",lighting.filter);
  }
  const sun=document.querySelector(".sun"), moon=document.querySelector(".moon");
  sun.style.left=`${solar?.sun?celestialPoint(solar.sun,null).x/10:18.5+62*daylightProgress}%`;
  sun.style.top=`${solar?.sun?celestialPoint(solar.sun,null).y/8:68-52*Math.sin(Math.PI*daylightProgress)}%`;
  moon.style.left=solar?.moon?`${celestialPoint(solar.moon,null).x/10}%`:"50%";
  moon.style.top=solar?.moon?`${celestialPoint(solar.moon,null).y/8}%`:"50%";
  const sunOpacity=daylightOpacity;
  const moonOpacity=moonSceneOpacity(solar?.moon);
  const world=document.querySelector(".journey-world");
  const sunPoint=solar?.sun?celestialPoint(solar.sun,world):null;
  const moonPoint=solar?.moon?celestialPoint(solar.moon,world):null;
  const drawnSunX=sunPoint?.x??(120+760*daylightProgress),drawnSunY=sunPoint?.y??(330-220*Math.sin(Math.PI*daylightProgress));
  const drawnSun=document.querySelector("#journey-sun"),drawnSunGlow=document.querySelector("#journey-sun-glow");
  const drawnMoon=document.querySelector("#journey-moon"),moonShadow=document.querySelector("#journey-moon-shadow");
  const moonButtonShadow=document.querySelector(".moon-phase-icon .moon-phase-shadow");
  const shadow=solar?.moon?MihwerCelestial.moonShadowVector(solar.moon.illumination,solar.moon.brightLimbAngle,11):{x:0,y:0};
  if(drawnSun){drawnSun.style.cx=`${drawnSunX}px`;drawnSun.style.cy=`${drawnSunY}px`;drawnSun.style.opacity=String(sunOpacity);}
  if(drawnSunGlow){drawnSunGlow.style.cx=`${drawnSunX}px`;drawnSunGlow.style.cy=`${drawnSunY}px`;drawnSunGlow.style.opacity=String(sunOpacity*.72);}
  if(drawnMoon){drawnMoon.setAttribute("transform",`translate(${moonPoint?.x??500} ${moonPoint?.y??330})`);drawnMoon.style.opacity=String(moonOpacity);}
  if(moonShadow){const worldShadow=solar?.moon?MihwerCelestial.moonShadowVector(solar.moon.illumination,solar.moon.brightLimbAngle,27):{x:0,y:0};moonShadow.setAttribute("cx",String(worldShadow.x));moonShadow.setAttribute("cy",String(worldShadow.y));}
  if(moonButtonShadow){moonButtonShadow.setAttribute("cx",String(shadow.x));moonButtonShadow.setAttribute("cy",String(shadow.y));}
  sky.style.setProperty("--mountain-brightness",String(.72+sunOpacity*.42));
  const fade=(value,start,end)=>Math.max(0,Math.min(1,(value-start)/(end-start)));
  sky.style.setProperty("--birds",String(Math.max(fade(sceneTime,330,390)*(1-fade(sceneTime,620,700)),fade(sceneTime,960,1030)*(1-fade(sceneTime,1120,1170))*.5)));
  for(const [element,opacity] of [[sun,sunOpacity],[moon,moonOpacity]]){element.style.opacity=String(opacity);element.disabled=opacity<.15;element.setAttribute("aria-hidden",opacity<.15?"true":"false");}
  const starVisibility=MihwerCelestial.stellarVisibility(altitude);
  sky.style.setProperty("--stars",String(starVisibility));
  const journeyStars=document.querySelector("#journey-stars");
  if(journeyStars)journeyStars.style.opacity=String(starVisibility);
  sky.style.setProperty("--night-breeze",String(starVisibility));
  const clockLabel=document.querySelector("#clock-label");
  if(clockLabel)clockLabel.textContent=lt(live?"now":"previewTime");
  const clockTime=document.querySelector("#clock-time");
  if(clockTime)clockTime.textContent=timeText(wallMinute);
  const clockZone=document.querySelector("#clock-zone");
  if(clockZone)clockZone.textContent=livingZone;
  const scrubber=document.querySelector("#scene-time-scrubber");
  if(scrubber&&document.activeElement!==scrubber)scrubber.value=String(wallMinute);
  const sceneTimeValue=document.querySelector("#scene-time-value");
  if(sceneTimeValue)sceneTimeValue.textContent=timeText(wallMinute);
  const clockMode=document.querySelector("#clock-mode");
  if(clockMode)clockMode.textContent=lt(live?"automatic":"previewTime");
  const greeting=document.querySelector(".hero-welcome h1");
  if(greeting)greeting.textContent=dayGreeting();
  const backToNow=document.querySelector(".scene-now");
  if(backToNow)backToNow.hidden=scenePreviewMinute===null&&!routeManualFocus;
  const phaseLabel=document.querySelector("#phase");
  if(phaseLabel)phaseLabel.textContent=lt(solar===null&&scenePreviewMinute!==null?"timeZoneTransitionShort":scenePhase??"solarDataUnavailable");
  const timeZoneStatus=document.querySelector("#time-zone-status");
  if(timeZoneStatus){timeZoneStatus.hidden=solar!==null||scenePreviewMinute===null;if(!timeZoneStatus.hidden)timeZoneStatus.textContent=lt("timeZoneTransition");}
  const next=nearestEntry(), label=next?(next.prayer?lt(next.prayer.label):next.task?next.task.name[language==="ar"?0:1]:next.station?stationTitle(next.station):next.activity?next.activity.title:next.title):"";
  const nearLabel=document.querySelector("#near-label");
  if(nearLabel)nearLabel.textContent=next?`${lt("todayView")}: ${label} · ${timeText(next.startMinute)}`:lt(selectedDate===zoneDate()?"noUpcoming":"otherDay");
  document.querySelectorAll(".route-row").forEach(row=>row.classList.toggle("is-current",row.dataset.entry===next?.id));
  const timedRoutePosition=routeProgressAt(minuteForSelectedDay());
  if(!routeManualFocus)focusRoute(timedRoutePosition);
  updatePrayerCountdown();
}
function livingMount() {
  if(!document.querySelector(".global-atmosphere")){
    document.body.insertAdjacentHTML("afterbegin",`<div class="global-atmosphere" aria-hidden="true"><svg class="ambient-road-world" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice"><path class="ambient-ridge ambient-ridge-far" d="M0 338 130 260 238 314 355 218 480 302 600 230 735 306 858 225 1000 302v198H0Z"/><path class="ambient-ridge ambient-ridge-near" d="M0 414 130 326 236 394 358 290 478 385 610 300 742 398 870 311 1000 380v210H0Z"/><path class="ambient-ground" d="M0 430q170-52 320-4t300 0 380-20v394H0Z"/><path class="ambient-road-glow" d="M500 820C500 735 685 690 600 610S350 530 490 455 680 374 510 310 420 237 500 185"/><path class="ambient-road-edge" d="M500 820C500 735 685 690 600 610S350 530 490 455 680 374 510 310 420 237 500 185"/><path class="ambient-road-surface" d="M500 820C500 735 685 690 600 610S350 530 490 455 680 374 510 310 420 237 500 185"/><path class="ambient-road-mark" d="M500 820C500 735 685 690 600 610S350 530 490 455 680 374 510 310 420 237 500 185"/></svg><span class="journey-celestial-sun"></span><span class="journey-celestial-moon">☾</span><span class="ambient-cloud ambient-cloud-a"></span><span class="ambient-cloud ambient-cloud-b"></span><svg class="ambient-birds" viewBox="0 0 360 70"><path d="M15 38q12-12 24 0 12-15 24 0m55 13q10-10 20 0 10-13 20 0m112-20q12-12 24 0 12-15 24 0"/></svg><span class="ambient-breeze"></span></div><span class="journey-celestial-time"></span>`);
  }
  if(["day","week","month","year"].includes(screen))view.insertAdjacentHTML("afterbegin",journeyToolbar());
  if(screen==="day"){livingMinute=zoneParts();updateScene();}
  else updateScene();
}
function focusRoute(index,manual=false) {
  const rows=[...document.querySelectorAll(".route-row")];
  if(!rows.length)return;
  const selected=Math.max(0,Math.min(rows.length-1,manual?Math.round(index):index));
  const activeIndex=Math.round(selected),chosen=rows[activeIndex];
  routeFocusEntryId=chosen.dataset.entry;
  routeManualFocus=manual;
  rows.forEach((row,rowIndex)=>{
    const focused=rowIndex===activeIndex;
    row.classList.toggle("is-focused",focused);
    row.classList.toggle("is-traveled",rowIndex<=activeIndex);
  });
  const photo=document.querySelector(".journey-photo");
  if(photo){
    const progress=rows.length>1?activeIndex/(rows.length-1):0;
    photo.style.setProperty("--journey-pan-y",`${43+progress*20}%`);
    photo.style.setProperty("--journey-photo-zoom",`${112+progress*10}%`);
    document.body.style.setProperty("--journey-progress",String(progress));
    document.body.style.setProperty("--journey-pan-shift",`${-progress*12}%`);
    document.body.style.setProperty("--journey-scale",String(1+progress*.08));
  }
  const viewport=document.querySelector(".journey-viewport");
  if(viewport){
    const previousAutoIndex=Number(viewport.dataset.autoRouteIndex);
    viewport.dataset.routeIndex=String(Math.round(selected));
    const progress=routeProgressAt(minuteForSelectedDay());
    viewport.dataset.routeProgress=String(progress);
    if(manual){
      delete viewport.dataset.autoRouteIndex;
    }else{
      viewport.dataset.autoRouteIndex=String(activeIndex);
      if(Number.isFinite(previousAutoIndex)&&previousAutoIndex!==activeIndex){
        requestAnimationFrame(()=>{
          if(screen==="day"&&!routeManualFocus&&chosen.isConnected)chosen.scrollIntoView({block:"center",behavior:reduced.matches?"auto":"smooth"});
        });
      }
    }
  }
  const position=document.querySelector(".journey-position strong");
  if(position)position.textContent=routeManualFocus?`${lt("journeyPosition")} ${Math.round(selected)+1} ${lt("journeyOf")} ${rows.length}`:journeyTimeLabel();
  const resume=document.querySelector(".journey-resume");
  if(resume)resume.hidden=!routeManualFocus;
  const autoHint=document.querySelector(".journey-position small");
  if(autoHint)autoHint.textContent=routeManualFocus?lt("journeyManualHint"):journeyTimeHint();
  const end=document.querySelector(".journey-end-note");
  if(end)end.hidden=selected<rows.length-1;
}
function routeProgressAt(minute) {
  const rows=[...document.querySelectorAll(".route-row")];
  return MihwerJourneyTimeline.positionAtMinute(rows.map(row=>({
    startMinute:row.dataset.routeMinute===""?null:Number(row.dataset.routeMinute)
  })),minute);
}
window.addEventListener("resize",()=>{
  const viewport=document.querySelector(".journey-viewport");
  if(screen==="day"&&viewport)focusRoute(Number(viewport.dataset.routeIndex),routeManualFocus);
});
function focusStation(id,open=true,entryId) {
  const row=[...document.querySelectorAll(".route-row")].find(x=>entryId?x.dataset.entry===entryId:x.dataset.station===id);
  if(!row)return;
  const index=Number(row.dataset.routePosition);
  if(Number.isInteger(index))focusRoute(index,true);
  row.classList.add("focused");setTimeout(()=>row.classList.remove("focused"),1800);
  if(open)showStation(id,null,entryId?.startsWith("task:")?entryId.slice(5):null);
}
let stationFocusReturn=null;
function showStation(id,completingId=null,focusTaskId=null) {
  const item=livingState().stations.find(s=>s.id===id);if(!item)return;
  if(!dialog.open){
    const trigger=document.activeElement;
    const attribute=["data-living-open","data-activity-open","data-activity-check"].find(name=>trigger?.hasAttribute(name));
    stationFocusReturn=attribute?{screen,date:selectedDate,attribute,value:trigger.getAttribute(attribute),task:trigger.getAttribute("data-activity-task"),entry:trigger.closest(".route-row")?.dataset.entry,node:trigger.classList.contains("route-node")}:null;
  }
  if(completingId){
    const task=item.tasks.find(entry=>entry.id===completingId);
    if(!task||task.status!=="pending")return;
    if(task.subtasks?.some(subtask=>subtask.status!=="done")){showStation(id,null,task.id);dialog.querySelector("#task-update-error").textContent=lt("subtasksRequired");dialog.querySelector(`[data-subtask-details="${CSS.escape(task.id)}"]`).open=true;return;}
    openDialog("momentTitle",`<p class="eyebrow">${lt("completionDetails")}</p><h3>${esc(task.name[language==="ar"?0:1])}</h3><p>${lt("actual")}: <b dir="ltr" data-elapsed="${esc(task.id)}">${elapsedText(task)}</b></p><form class="completion-form" data-complete-task="${esc(task.id)}" data-station-id="${esc(id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("durationOptional")}<input name="duration" type="number" min="0" max="1440" step="1" inputmode="numeric" aria-describedby="duration-hint"></label><p id="duration-hint" class="muted">${lt("durationHint")}</p><p id="task-update-error" role="alert"></p><div class="options"><button type="submit" class="primary">${lt("saveCompletion")}</button><button type="button" class="secondary" data-station-back="${esc(id)}">${lt("backToTask")}</button></div></form><p class="muted">${lt("temporary")}</p>`);
    dialog.classList.add("station-drawer");
    dialog.querySelector('[name="duration"]')?.focus();return;
  }
  const p=progress(item);
  const activeTasks=item.tasks.filter(task=>!task.archived);
  const visibleTasks=focusTaskId?activeTasks.filter(task=>task.id===focusTaskId):activeTasks;
  const list=visibleTasks.map(task=>`<li tabindex="-1" data-task-detail="${esc(task.id)}" data-priority="${taskPriority(task.priority)}" class="task-detail-card"><div class="task-title-line"><strong>${esc(task.name[language==="ar"?0:1])}</strong>${priorityBadge(task.priority,true)}</div><small class="task-detail-status"><b dir="ltr">${timeText(task.time)}</b><span>${task.status==="done"?lt("done"):task.status==="cancelled"?lt("cancelTask"):task.startedAt!==undefined?lt("running"):lt("pending")}</span></small>
  <div class="options task-quick-actions"><button class="primary" data-task="${esc(task.id)}" data-station-id="${esc(id)}" data-task-action="toggle" ${task.status==="cancelled"?"disabled":""}>${task.status==="done"?lt("reopenTask"):lt("completeTask")}</button><button class="secondary" data-task-edit="${esc(task.id)}" data-station-id="${esc(id)}">${lt("editTask")}</button>${task.status!=="done"&&task.status!=="cancelled"?`<button class="secondary" data-task-completion-details="${esc(task.id)}" data-station-id="${esc(id)}">${lt("durationOptional")}</button>`:""}<button class="secondary" data-task="${esc(task.id)}" data-station-id="${esc(id)}" data-task-action="timer" ${task.status!=="pending"||(task.startedAt===undefined&&selectedDate!==zoneDate())?"disabled":""}>${lt(task.startedAt===undefined?"startTimer":"stopTimer")}</button><button class="secondary task-archive-action" data-task-archive="${esc(id)}" data-task-id="${esc(task.id)}">${lt("deleteTask")}</button></div>
  <details class="utility-details task-subtasks" data-subtask-details="${esc(task.id)}"><summary>${lt("subtasks")} ${subtaskProgress(task).total?`(${subtaskProgress(task).done}/${subtaskProgress(task).total} · ${Math.round(subtaskProgress(task).ratio*100)}%)`:""}</summary>${task.subtasks?.length?`<ul class="subtask-list">${task.subtasks.map(sub=>`<li><span>${esc(sub.name)} · ${lt(sub.status==="done"?"done":"pending")}</span><button type="button" class="secondary" data-subtask-toggle="${esc(sub.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(id)}" ${task.status!=="pending"?"disabled":""}>${lt(sub.status==="done"?"reopenTask":"completeTask")}</button>${task.status==="pending"?`<details class="utility-details"><summary>${lt("editSubtask")}</summary><form data-subtask-edit="${esc(sub.id)}" data-parent-task="${esc(task.id)}" data-parent-station="${esc(id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("subtaskName")}<input name="name" maxlength="100" required value="${esc(sub.name)}"></label><p role="alert" class="subtask-error"></p><button type="submit" class="secondary">${lt("saveSubtask")}</button></form></details>`:""}</li>`).join("")}</ul>`:""}${task.status!=="pending"?`<p class="muted">${lt("subtaskLocked")}</p>`:`<form data-subtask-form="${esc(task.id)}" data-parent-station="${esc(id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("subtaskName")}<input name="name" maxlength="100" required></label><p role="alert" class="subtask-error"></p><button class="secondary" type="submit">${lt("addSubtask")}</button></form>`}</details>
  <details class="utility-details task-extra" data-task-info="${esc(task.id)}"><summary>${lt("taskTimingNotes")}</summary><p>${lt("actual")}: <b dir="ltr" data-elapsed="${esc(task.id)}">${elapsedText(task)}</b>${task.elapsedMs!==undefined||task.startedAt!==undefined?` · ${durationSource(task)}`:""}</p><div class="task-fields"><label class="field">${lt("planned")}<input type="time" required data-task-time="${esc(task.id)}" data-station-id="${esc(id)}" value="${timeText(task.time)}"></label><label class="field">${lt("estimated")} (${lt("minutes")})<input type="number" min="0" max="1440" step="1" data-task-estimate="${esc(task.id)}" data-station-id="${esc(id)}" value="${task.estimate}"></label>${priorityPicker(task.priority,`data-task-priority="${esc(task.id)}" data-station-id="${esc(id)}"`)}</div><p>${lt("actualStart")}: ${esc(recordedTime(task.firstStart))}<br>${lt("actualEnd")}: ${esc(recordedTime(task.lastStop))}</p></details></li>`).join("");
  openDialog("momentTitle",`<p class="task-station-progress">${p.ratio===null?lt("noTasks"):`${p.complete}/${p.eligible} ${lt("completed")}`}</p><p id="task-update-error" role="alert"></p><ul class="living-tasks">${list}</ul>${focusTaskId?"":`<details class="utility-details"><summary>${lt("details")}</summary><p>${lt("timerNote")} ${lt("timerOtherDay")}</p><p>${lt("noContent")}</p><div class="options">${button("writeMoment","document","primary")}</div></details>`}`);
  dialogTitle.textContent=focusTaskId?visibleTasks[0]?.name[language==="ar"?0:1]||stationTitle(item):stationTitle(item);
  dialog.classList.toggle("station-drawer",!focusTaskId);
  if(focusTaskId)dialog.querySelector(`[data-task-detail="${CSS.escape(focusTaskId)}"]`)?.focus();
}
function showTaskEditor(stationId,taskId) {
  const station=livingState().stations.find(item=>item.id===stationId),task=station?.tasks.find(item=>item.id===taskId);
  if(!station||!task||task.archived)return;
  const index=language==="ar"?0:1,name=Array.isArray(task.name)?task.name[index]||task.name[0]||"":String(task.name||"");
  openDialog("momentTitle",`<form class="task-edit-form" data-task-editor="${esc(task.id)}" data-station-id="${esc(station.id)}" data-record-date="${esc(selectedDate)}"><label class="field">${lt("taskName")}<input name="name" maxlength="100" required value="${esc(name)}"></label><div class="task-fields"><label class="field">${lt("planned")}<input name="time" type="time" required value="${timeText(task.time)}"></label><label class="field">${lt("estimated")} (${lt("minutes")})<input name="estimate" type="number" min="0" max="1440" step="1" value="${Number.isInteger(task.estimate)?task.estimate:0}"></label>${priorityPicker(task.priority,'name="priority"')}</div><label class="field">${lt("taskNote")}<textarea name="notes" rows="2" maxlength="1000">${esc(task.notes||"")}</textarea></label><p class="task-edit-error" role="alert"></p><div class="options"><button class="primary" type="submit">${lt("saveTaskEdit")}</button><button class="secondary" type="button" data-task-editor-cancel="${esc(station.id)}" data-task-id="${esc(task.id)}">${lt("backToTask")}</button></div></form>`);
  dialogTitle.textContent=lt("editTask");
}
function showPrayerRecord(prayer) {
  const record=livingState().prayerRecords?.[prayer.key]||{fard:0,before:0,after:0,targetFard:obligatoryUnits[prayer.key],targetBefore:0,targetAfter:0};
  openDialog("momentTitle",`<h3>${lt(prayer.label)} · <b dir="ltr">${prayer.time}</b></h3><p>${lt("prayerDetail")}</p><form class="prayer-record" data-prayer-record="${esc(prayer.key)}" data-record-date="${esc(selectedDate)}"><h4>${lt("prayerRecord")}</h4>${[["fard","targetFard","prayerFard"],["before","targetBefore","prayerBefore"],["after","targetAfter","prayerAfter"]].map(([key,target,label])=>`<fieldset class="prayer-units"><legend>${lt(label)}</legend><label>${lt("prayerTarget")} <input type="number" name="${target}" min="${key==="fard"?record.targetFard:0}" max="${key==="fard"?record.targetFard:20}" step="1" value="${record[target]}" ${key==="fard"?"readonly":""} required></label><label>${lt("prayerActual")} <input type="number" name="${key}" min="0" max="20" step="1" value="${record[key]}" required></label></fieldset>`).join("")}<p class="muted">${lt("prayerRecordNote")}</p><p role="alert" id="prayer-update-error"></p><button class="primary" type="submit">${lt("savePrayer")}</button></form><details class="utility-details"><summary>${lt("details")}</summary><p>${lt("prayerBlocked")}</p><p>${lt("temporary")}</p></details>`);
}
function updateTaskAction(station,taskId,action,manualMinutes=null) {
  const index=station.tasks.findIndex(task=>task.id===taskId);
  if(index<0||!["toggle","cancel","timer"].includes(action))throw new Error("Invalid task action");
  const task={...station.tasks[index]};
  const timerWasRunning=task.startedAt!==undefined;
  if(!["pending","done","cancelled"].includes(task.status))throw new Error("Invalid task status");
  if(action==="timer"&&(task.status!=="pending"||(task.startedAt===undefined&&selectedDate!==zoneDate())))throw new Error("Timer unavailable");
  if(action==="toggle"&&task.status==="cancelled")throw new Error("Cancelled task cannot be completed");
  if(action==="toggle"&&task.status==="pending"&&task.subtasks?.some(subtask=>subtask.status!=="done"))throw new Error("Incomplete subtasks");
  if(manualMinutes!==null&&(!Number.isInteger(manualMinutes)||manualMinutes<0||manualMinutes>1440||action!=="toggle"||task.status!=="pending"))throw new Error("Invalid duration");
  if(task.startedAt!==undefined){task.elapsedMs=elapsedMs(task);task.lastStop=Date.now();delete task.startedAt;}
  else if(action==="timer"){task.startedAt=Date.now();task.firstStart??=task.startedAt;task.durationSource=task.durationSource==="manual"?"mixed":task.durationSource||"timer";}
  if(manualMinutes!==null){task.elapsedMs=manualMinutes*60000;task.durationSource="manual";}
  if(action==="cancel")task.status=task.status==="cancelled"?"pending":"cancelled";
  if(action==="toggle")task.status=task.status==="done"?"pending":"done";
  station.tasks[index]=task;
  const category=station.habit?"habits":"tasks";
  const logAction=action==="toggle"?(task.status==="done"?"completed":"reopened"):action==="cancel"?(task.status==="cancelled"?"cancelled":"restored"):timerWasRunning?"stopped":"started";
  const name=Array.isArray(task.name)?task.name[language==="ar"?0:1]:String(task.name||"");
  globalThis.MihwerSystemLog?.record(category,logAction,name);
  return task;
}
document.addEventListener("click",event=>{
  const focusedRow=event.target.closest(".route-row");
  if(focusedRow&&!event.target.closest("[data-entry-drag], [data-living-open]"))focusRoute(Number(focusedRow.dataset.routePosition),true);
  if(event.target.closest("[data-scene-now]")){
    routeScrollIntentUntil=0;
    routeTouchStartY=null;
    scenePreviewMinute=null;
    routeFocusEntryId=null;
    routeManualFocus=false;
    render();
    return;
  }
  if(event.target.closest("[data-scroll-route]")){document.querySelector(".day-route")?.scrollIntoView({behavior:reduced.matches?"auto":"smooth",block:"center"});return;}
  const progressDay=event.target.closest("[data-progress-day]");
  if(progressDay){
    const model=progressHeatmapModel();
    dialogTitle.textContent=language==="ar"?"سجل الإنجاز":"Achievement record";
    dialogContent.innerHTML=MihwerProgressHeatmap.renderDay(model,progressDay.dataset.progressDay,globalThis.MihwerSystemLog?.entriesForDate(progressDay.dataset.progressDay)||[],language);
    if(!dialog.open)dialog.showModal();
    MihwerProgressHeatmap.animate(dialogContent,language);
    return;
  }
  const subtaskButton=event.target.closest("[data-subtask-toggle]");
  if(subtaskButton){
    const station=livingState().stations.find(item=>item.id===subtaskButton.dataset.parentStation),task=station?.tasks.find(item=>item.id===subtaskButton.dataset.parentTask),subtask=task?.subtasks?.find(item=>item.id===subtaskButton.dataset.subtaskToggle);
    if(!station||!task||task.status!=="pending"||!subtask){dialog.querySelector("#task-update-error").textContent=lt("subtaskError");return;}
    subtask.status=subtask.status==="done"?"pending":"done";
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks",subtask.status==="done"?"completed":"reopened",subtask.name);
    render();showStation(station.id,null,task.id);dialog.querySelector(`[data-subtask-details="${CSS.escape(task.id)}"]`).open=true;return;
  }
  const activityAddButton=event.target.closest("[data-activity-add]");
  if(activityAddButton){showActivityForm();return;}
  const activityOpen=event.target.closest("[data-activity-open]");
  if(activityOpen){showActivity(activityOpen.dataset.activityOpen);return;}
  const activityEdit=event.target.closest("[data-activity-edit]");
  if(activityEdit){showActivityForm(activityEdit.dataset.activityEdit);return;}
  const activityAction=event.target.closest("[data-activity-action]");
  if(activityAction){
    const activity=livingState().activities.find(item=>item.id===activityAction.dataset.activityId);
    const wasCompleted=activity?.status==="completed";
    try {if(!activity)throw new Error("Activity not found");applyActivityAction(activity,activityAction.dataset.activityAction);}
    catch(error){console.error("Activity update failed:",error);const output=document.querySelector("#activity-action-error");if(output)output.textContent=lt("activityActionError");return;}
    render();if(!wasCompleted&&activity.status==="completed")flashCompletedEntry(`activity:${activity.id}`);showActivity(activity.id);return;
  }
  const dayShift=event.target.closest("[data-day-shift]");
  if(dayShift){const date=new Date(`${selectedDate}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+Number(dayShift.dataset.dayShift));const iso=date.toISOString().slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(iso)){setJourneyDate(iso);document.querySelector(`[data-day-shift="${dayShift.dataset.dayShift}"]`)?.focus();}return;}
  const utility=event.target.closest("[data-utility]")?.dataset.utility;
  if(utility==="sleep"){openDialog("sleepRhythm",sleepPanel());return;}
  if(utility==="analytics"){dialogTitle.textContent=lt("intelligence");dialogContent.innerHTML=analyticsPanel();dialog.showModal();return;}
  if(utility==="date"){dialogTitle.textContent=lt("dateTab");dialogContent.innerHTML=datePanel();dialog.showModal();return;}
  if(utility==="today-direct"){setJourneyDate(zoneDate());return;}
  if(utility==="today"){setJourneyDate(zoneDate());dialogContent.innerHTML=datePanel();return;}
  if(utility==="settings"){dialogTitle.textContent=lt("settingsTab");dialogContent.innerHTML=clockPanel();if(!dialog.open)dialog.showModal();MihwerProgressHeatmap.animate(dialogContent,language);updateScene();return;}
  if(utility==="prayers"){prayerEditing=false;dialogTitle.textContent=lt("prayers");dialogContent.innerHTML=prayerPanel();dialog.showModal();return;}
  if(utility==="prayer-settings"){prayerEditing=true;dialogTitle.textContent=lt("prayerSettings");dialogContent.innerHTML=prayerPanel();if(!dialog.open)dialog.showModal();return;}
  if(utility==="prayer-view"){prayerEditing=false;dialogTitle.textContent=lt("prayers");dialogContent.innerHTML=prayerPanel();return;}
  if(utility==="clear-location"){++locationRequest;prayerLocation=null;prayerCity="";locationStatus="cleared";cachedPrayerKey="";dialogContent.innerHTML=prayerPanel();render();return;}
  if(utility==="manual-location"){
    const city=document.querySelector("#prayer-city")?.value.trim();
    const latitudeInput=document.querySelector("#prayer-latitude")?.value.trim();
    const longitudeInput=document.querySelector("#prayer-longitude")?.value.trim();
    const latitude=Number(latitudeInput),longitude=Number(longitudeInput);
    if(!latitudeInput||!longitudeInput||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180){
      const output=document.querySelector("#location-status");if(output)output.textContent=lt("manualLocationInvalid");return;
    }
    ++locationRequest;prayerCity=city;prayerLocation={latitude,longitude,source:"manual",label:city};
    locationStatus="manualLocationSet";cachedPrayerKey="";dialogContent.innerHTML=prayerPanel();render();return;
  }
  if(utility==="locate"){
    const status=document.querySelector("#location-status");
    const request=++locationRequest;locationStatus="locationPending";
    if(status)status.textContent=lt(locationStatus);
    if(!navigator.geolocation){locationStatus="locationUnsupported";if(status)status.textContent=lt(locationStatus);return;}
    navigator.geolocation.getCurrentPosition(
      position=>{if(request!==locationRequest)return;prayerLocation={latitude:position.coords.latitude,longitude:position.coords.longitude,source:"device",label:prayerCity};locationStatus="locationAvailable";cachedPrayerKey="";const output=document.querySelector("#location-status");if(output)output.textContent=lt(locationStatus);const results=document.querySelector("#prayer-results");if(results)results.innerHTML=prayerResults();render();},
      error=>{if(request!==locationRequest)return;console.error("Location unavailable:",error.code,error.message);locationStatus=error.code===2?"locationUnavailable":error.code===3?"locationTimeout":"locationDenied";const output=document.querySelector("#location-status");if(output)output.textContent=lt(locationStatus);else if(document.querySelector("#prayer-results"))document.querySelector("#prayer-results").insertAdjacentHTML("beforebegin",`<p role="status">${lt(locationStatus)}</p>`);},
      {enableHighAccuracy:false,timeout:10000,maximumAge:0}
    );return;
  }
  const celestial=event.target.closest("[data-celestial-info]");
  if(celestial){openDialog("momentTitle",celestialInfoMarkup(celestial.dataset.celestialInfo,solarSceneState()));return;}
  const prayerButton=event.target.closest("[data-prayer-open]");if(prayerButton){const prayer=calculatePrayers().times?.find(item=>item.key===prayerButton.dataset.prayerOpen);if(prayer)showPrayerRecord(prayer);return;}
  const open=event.target.closest("[data-living-open]");if(open){focusStation(open.dataset.livingOpen,true,open.closest(".route-row")?.dataset.entry);return;}
  const back=event.target.closest("[data-station-back]");if(back){showStation(back.dataset.stationBack);return;}
  const taskEditorCancel=event.target.closest("[data-task-editor-cancel]");if(taskEditorCancel){showStation(taskEditorCancel.dataset.taskEditorCancel,null,taskEditorCancel.dataset.taskId);return;}
  const taskEdit=event.target.closest("[data-task-edit][data-station-id]");if(taskEdit){showTaskEditor(taskEdit.dataset.stationId,taskEdit.dataset.taskEdit);return;}
  const completionDetails=event.target.closest("[data-task-completion-details]");
  if(completionDetails){showStation(completionDetails.dataset.stationId,completionDetails.dataset.taskCompletionDetails);return;}
  const taskButton=event.target.closest("[data-task]");if(taskButton){
    const item=livingState().stations.find(s=>s.id===taskButton.dataset.stationId);
    const action=taskButton.dataset.taskAction;
    const selectedTask=item?.tasks.find(task=>task.id===taskButton.dataset.task);
    let task;
    try {if(!item)throw new Error("Station not found");task=updateTaskAction(item,taskButton.dataset.task,action);}
    catch(error){
      console.error("Task update failed:",error);
      if(item&&selectedTask?.subtasks?.some(subtask=>subtask.status!=="done")){showStation(item.id,null,selectedTask.id);dialog.querySelector(`[data-subtask-details="${CSS.escape(selectedTask.id)}"]`).open=true;dialog.querySelector("#task-update-error").textContent=lt("subtasksRequired");}
      else {const output=document.querySelector("#task-update-error");if(output)output.textContent=lt("updateError");}
      return;
    }
    const complete=action==="toggle"&&task.status==="done";dialog.close();render();
    if(action==="timer")showStation(item.id);
    if(complete){document.querySelector(`[data-entry="task:${CSS.escape(task.id)}"]`)?.classList.add("changed");flashCompletedEntry(`task:${task.id}`);}
    return;
  }
  const action=event.target.closest("[data-living]")?.dataset.living;if(!action)return;
  if(action==="add")showActivityForm();
});
document.addEventListener("submit",event=>{
  const form=event.target;
  if(form.matches("[data-task-editor]")){
    event.preventDefault();
    const station=livingState().stations.find(item=>item.id===form.dataset.stationId),task=station?.tasks.find(item=>item.id===form.dataset.taskEditor);
    const name=String(form.elements.name.value||"").trim(),time=String(form.elements.time.value||""),estimate=Number(form.elements.estimate.value),priority=String(form.elements.priority.value||""),notes=String(form.elements.notes.value||"").trim();
    const minutes=/^\d{2}:\d{2}$/.test(time)?Number(time.slice(0,2))*60+Number(time.slice(3,5)):NaN;
    if(form.dataset.recordDate!==selectedDate||!station||!task||task.archived||!name||name.length>100||!Number.isInteger(minutes)||minutes<0||minutes>=1440||!Number.isInteger(estimate)||estimate<0||estimate>1440||!MihwerTaskPriority.values.includes(priority)){
      form.querySelector(".task-edit-error").textContent=lt("taskEditInvalid");return;
    }
    if(Array.isArray(task.name)){const translated=[...task.name];translated[language==="ar"?0:1]=name;task.name=translated;}else task.name=[name,name];
    task.time=minutes;task.estimate=estimate;task.priority=priority;
    if(notes)task.notes=notes;else delete task.notes;
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","updated",name);
    render();showStation(station.id,null,task.id);return;
  }
  if(form.matches("[data-activity-form]")){
    event.preventDefault();
    if(form.dataset.recordDate!==selectedDate){form.querySelector(".activity-form-error").textContent=lt("dateChanged");return;}
    const data=new FormData(form),title=String(data.get("title")||"").trim(),kind=String(data.get("kind")||"custom");
    const targetDate=String(data.get("date")||"");
    const startTime=String(data.get("startTime")||""),endTime=String(data.get("endTime")||""),summary=String(data.get("summary")||"").trim(),notes=String(data.get("notes")||"").trim();
    const priority=String(data.get("priority")||"not-urgent-important");
    const durationValue=String(data.get("actualDuration")||"");
    const actualDurationMinutes=durationValue===""?null:Number(durationValue);
    if(!title||title.length>120||!MihwerExtendedValidation.isDate(targetDate)||!["meeting","work","study","exercise","meal","rest","custom"].includes(kind)||
      startTime&&!Number.isInteger(MihwerJourneyTimeline.parseClock(startTime))||
      endTime&&!Number.isInteger(MihwerJourneyTimeline.parseClock(endTime))||
      endTime&&!startTime||startTime&&endTime&&MihwerJourneyTimeline.durationBetween(startTime,endTime)===0||
      actualDurationMinutes!==null&&(!Number.isInteger(actualDurationMinutes)||actualDurationMinutes<0||actualDurationMinutes>1440)||
      !MihwerTaskPriority.values.includes(priority)){
      form.querySelector(".activity-form-error").textContent=lt("activityInvalid");return;
    }
    const id=form.dataset.activityForm;
    let activity,targetState=stateForDate(targetDate);
    if(id==="new"){
      activity={id:`activity-${crypto.randomUUID()}`,title,kind,startTime,endTime,summary,notes,priority,status:"scheduled",actualDurationMinutes,history:[]};
      targetState.activities.push(activity);recordActivityHistory(activity,"activityCreated");
      globalThis.MihwerSystemLog?.record("activities","added",title,targetDate);
    }else{
      activity=livingState().activities.find(item=>item.id===id);
      if(!activity){form.querySelector(".activity-form-error").textContent=lt("activityInvalid");return;}
      if(targetDate!==selectedDate){
        const index=livingState().activities.indexOf(activity);
        if(index<0||targetState.activities.some(item=>item.id===id)){form.querySelector(".activity-form-error").textContent=lt("activityInvalid");return;}
        livingState().activities.splice(index,1);targetState.activities.push(activity);
        recordActivityHistory(activity,"activityRescheduled");
        globalThis.MihwerSystemLog?.record("activities","rescheduled",title,targetDate);
      }else{
        globalThis.MihwerSystemLog?.record("activities","updated",title,targetDate);
      }
      Object.assign(activity,{title,kind,startTime,endTime,summary,notes,priority,actualDurationMinutes});
      recordActivityHistory(activity,"activityEdited");
    }
    selectedDate=targetDate;followToday=selectedDate===zoneDate();
    render();showActivity(activity.id);return;
  }
  if(form.matches("[data-subtask-edit]")){
    event.preventDefault();
    const station=livingState().stations.find(item=>item.id===form.dataset.parentStation),task=station?.tasks.find(item=>item.id===form.dataset.parentTask),subtask=task?.subtasks?.find(item=>item.id===form.dataset.subtaskEdit),name=form.elements.name.value.trim();
    if(form.dataset.recordDate!==selectedDate||!station||!task||task.status!=="pending"||!subtask||!name||name.length>100){form.querySelector(".subtask-error").textContent=lt("subtaskError");return;}
    subtask.name=name;
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","updated",name);
    render();showStation(station.id,null,task.id);dialog.querySelector(`[data-subtask-details="${CSS.escape(task.id)}"]`).open=true;return;
  }
  if(form.matches("[data-subtask-form]")){
    event.preventDefault();
    const station=livingState().stations.find(item=>item.id===form.dataset.parentStation),task=station?.tasks.find(item=>item.id===form.dataset.subtaskForm),name=form.elements.name.value.trim();
    if(form.dataset.recordDate!==selectedDate||!station||!task||task.status!=="pending"||!name||name.length>100){form.querySelector(".subtask-error").textContent=lt("subtaskError");return;}
    task.subtasks=[...(task.subtasks||[]),{id:crypto.randomUUID(),name,status:"pending"}];
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","added",name);
    render();showStation(station.id,null,task.id);dialog.querySelector(`[data-subtask-details="${CSS.escape(task.id)}"]`).open=true;return;
  }
  if(form.matches("[data-task-note]")){
    event.preventDefault();
    const station=livingState().stations.find(item=>item.id===form.dataset.stationId),task=station?.tasks.find(item=>item.id===form.dataset.taskNote),note=form.elements.notes.value.trim();
    if(form.dataset.recordDate!==selectedDate){form.querySelector(".task-note-error").textContent=lt("dateChanged");return;}
    if(!station||!task){console.error("Task note save failed: task not found");form.querySelector(".task-note-error").textContent=lt("taskNoteError");return;}
    if(note)task.notes=note;else delete task.notes;
    globalThis.MihwerSystemLog?.record(station.habit?"habits":"tasks","updated",Array.isArray(task.name)?task.name[language==="ar"?0:1]:task.name);
    render();showStation(station.id,null,task.id);dialog.querySelector(`[data-task-info="${CSS.escape(task.id)}"]`).open=true;return;
  }
  if(form.matches("[data-complete-task]")){
    event.preventDefault();
    if(form.dataset.recordDate!==selectedDate){form.querySelector("#task-update-error").textContent=lt("dateChanged");return;}
    const input=form.elements.duration, raw=input.value.trim(), minutes=raw===""?null:Number(raw);
    if(minutes!==null&&(!Number.isInteger(minutes)||minutes<0||minutes>1440)){input.setCustomValidity(lt("invalidDuration"));input.reportValidity();input.setCustomValidity("");return;}
    const station=livingState().stations.find(item=>item.id===form.dataset.stationId);
    try {if(!station)throw new Error("Station not found");updateTaskAction(station,form.dataset.completeTask,"toggle",minutes);}
    catch(error){console.error("Task update failed:",error);form.querySelector("#task-update-error").textContent=lt("updateError");return;}
    const entryId=`task:${form.dataset.completeTask}`;dialog.close();render();document.querySelector(`[data-entry="${CSS.escape(entryId)}"]`)?.classList.add("changed");flashCompletedEntry(entryId);return;
  }
  if(form.matches("[data-prayer-record]")){
    event.preventDefault();
    if(form.dataset.recordDate!==selectedDate){form.querySelector("#prayer-update-error").textContent=lt("dateChanged");return;}
    const key=form.dataset.prayerRecord, state=livingState();
    const record=Object.fromEntries(["fard","before","after","targetFard","targetBefore","targetAfter"].map(name=>[name,Number(form.elements[name].value)]));
    if(!Object.values(record).every(value=>Number.isInteger(value)&&value>=0&&value<=20)||record.targetFard!==obligatoryUnits[key]||record.fard>record.targetFard||record.before>record.targetBefore||record.after>record.targetAfter){form.querySelector("#prayer-update-error").textContent=lt("prayerInvalid");return;}
    const previous=state.prayerRecords?.[key], previousRatio=previous?prayerProgress(previous).ratio:0;
    try {if(!Object.hasOwn(obligatoryUnits,key))throw new Error("Invalid prayer");state.prayerRecords={...state.prayerRecords,[key]:record};}
    catch(error){console.error("Prayer update failed:",error);form.querySelector("#prayer-update-error").textContent=lt("prayerUpdateError");return;}
    globalThis.MihwerSystemLog?.record("prayer","recorded",lt(({fajr:"fajr",dhuhr:"dhuhr",asr:"asrPrayer",maghrib:"maghrib",isha:"isha"})[key]));
    dialog.close();render();if(prayerProgress(record).ratio>previousRatio)document.querySelector(`[data-entry="${CSS.escape(`prayer:${key}`)}"]`)?.classList.add("changed");if(previousRatio<1&&prayerProgress(record).ratio>=1)flashCompletedEntry(`prayer:${key}`);
  }
});
document.addEventListener("input",event=>{
  if(event.target.id==="scene-time-scrubber"){
    const minute=Number(event.target.value);
    if(Number.isInteger(minute)&&minute>=0&&minute<1440){
      scenePreviewMinute=minute;
      routeFocusEntryId=null;
      routeManualFocus=false;
      updateScene();
    }
  }
  if(event.target.matches("[data-intention-setting]"))livingState().dailyIntention=event.target.value;
  if(event.target.matches("[data-sleep-record]")){
    const date=event.target.dataset.recordDate,key=event.target.dataset.sleepRecord;
    if(!date||!["sleep","wake","nap","napEnd"].includes(key))return;
    stateForDate(date)[key]=event.target.value;
    const output=document.querySelector("#sleep-analysis");if(output)output.innerHTML=sleepInsights(date);
    const summary=document.querySelector("#sleep-summary");if(summary)summary.innerHTML=sleepSummaryView(date);
    if(date===selectedDate){const quickSummary=document.querySelector("#journey-sleep-summary");if(quickSummary)quickSummary.textContent=sleepQuickSummary(date);}
  }
});
document.addEventListener("pointermove",event=>{
  const sky=event.target.closest("#sky");
  if(!sky||event.pointerType!=="mouse"||reduced.matches)return;
  const bounds=sky.getBoundingClientRect();
  sky.style.setProperty("--mountain-parallax",`${((event.clientX-bounds.left)/bounds.width-.5)*8}px`);
});
document.addEventListener("pointerout",event=>{
  const sky=event.target.closest("#sky");
  if(sky&&!(event.relatedTarget instanceof Node&&sky.contains(event.relatedTarget)))sky.style.removeProperty("--mountain-parallax");
});
document.addEventListener("change",event=>{
  if(event.target.id==="language" && dialog.open){dialogTitle.textContent=lt("settingsTab");dialogContent.innerHTML=clockPanel();MihwerProgressHeatmap.animate(dialogContent,language);document.querySelector("#language")?.focus({preventScroll:true});updateScene();}
  if(event.target.id==="living-direction"){direction=event.target.value;render();dialogContent.innerHTML=clockPanel();MihwerProgressHeatmap.animate(dialogContent,language);document.querySelector("#living-direction")?.focus();updateScene();}
  if(event.target.id==="prayer-country"){prayerCountry=event.target.value;prayerMethod=prayerCountries[prayerCountry]?.method||"";prayerRamadan="";prayerRamadanDate="";dialogContent.innerHTML=prayerPanel();render();}
  if(event.target.id==="prayer-method"){prayerMethod=event.target.value;prayerRamadan="";prayerRamadanDate="";dialogContent.innerHTML=prayerPanel();render();}
  if(event.target.id==="prayer-asr"){prayerAsr=event.target.value;dialogContent.innerHTML=prayerPanel();render();}
  if(event.target.id==="prayer-ramadan"){prayerRamadan=event.target.value;prayerRamadanDate=selectedDate;dialogContent.innerHTML=prayerPanel();render();}
  if(event.target.dataset.taskPriority){
    const item=livingState().stations.find(station=>station.id===event.target.dataset.stationId);
    const task=item?.tasks.find(entry=>entry.id===event.target.dataset.taskPriority);
    if(!item||!task||!MihwerTaskPriority.values.includes(event.target.value))return;
    task.priority=event.target.value;render();showStation(item.id,null,task.id);return;
  }
  if(event.target.dataset.taskTime||event.target.dataset.taskEstimate){
    const item=livingState().stations.find(s=>s.id===event.target.dataset.stationId), task=item?.tasks.find(x=>x.id===(event.target.dataset.taskTime||event.target.dataset.taskEstimate));
    if(!task)return;
    if(event.target.dataset.taskTime){if(!event.target.value){event.target.setCustomValidity(lt("emptyDate"));event.target.reportValidity();event.target.value=timeText(task.time);event.target.setCustomValidity("");return;}const [hours,minutes]=event.target.value.split(":").map(Number);task.time=hours*60+minutes;}
    else {const value=Number(event.target.value);if(!event.target.value||!Number.isInteger(value)||value<0||value>1440){event.target.reportValidity();event.target.value=task.estimate;return;}task.estimate=value;}
    render();return;
  }
  if(event.target.id==="selected-date" && event.target.value)followToday=event.target.value===zoneDate();
  if(event.target.matches("[data-intention-setting]"))globalThis.MihwerSystemLog?.record("daily","updated",language==="ar"?"نية اليوم":"Daily intention");
  if(event.target.matches("[data-sleep-record]"))globalThis.MihwerSystemLog?.record("daily","updated",language==="ar"?"تسجيل النوم":"Sleep record",event.target.dataset.recordDate);
  if(event.target.id==="journey-date-input" && event.target.value){setJourneyDate(event.target.value);dialogContent.innerHTML=datePanel();}
  if(event.target.id==="sleep-date" && /^\d{4}-\d{2}-\d{2}$/.test(event.target.value)){
    const detailsOpen=Boolean(dialogContent.querySelector(".utility-details[open]"));
    dialogContent.innerHTML=sleepPanel(event.target.value);
    if(detailsOpen)dialogContent.querySelector(".utility-details")?.setAttribute("open","");
    dialogContent.querySelector("#sleep-date")?.focus({preventScroll:true});
  }
  if(event.target.id==="living-zone"){
    livingZone=event.target.value;if(followToday)selectedDate=zoneDate();livingMinute=zoneParts();render();if(dialog.open){dialogTitle.textContent=lt("settingsTab");dialogContent.innerHTML=clockPanel();MihwerProgressHeatmap.animate(dialogContent,language);document.querySelector("#living-zone")?.focus({preventScroll:true});updateScene();}
  }
});
document.addEventListener("visibilitychange",()=>{
  document.querySelectorAll(".route-segment").forEach(svg=>document.hidden?svg.pauseAnimations():svg.unpauseAnimations());
  if(!document.hidden){const previous=selectedDate;if(followToday)selectedDate=zoneDate();livingMinute=zoneParts();render();if(previous!==selectedDate&&dialog.open&&document.querySelector("#prayer-results"))dialogContent.innerHTML=prayerPanel();else if(previous!==selectedDate&&dialog.open&&document.querySelector("#journey-date-input"))dialogContent.innerHTML=datePanel();}
});
dialog.addEventListener("click",event=>{
  if(event.target===dialog)dialog.close();
});
dialog.addEventListener("close",()=>{
  if(!dialog.open){
    dialog.classList.remove("station-drawer");
    if(stationFocusReturn&&screen===stationFocusReturn.screen&&selectedDate===stationFocusReturn.date&&(dialog.contains(document.activeElement)||document.activeElement===document.body)){
      const {attribute,value,task,entry,node}=stationFocusReturn;
      const scope=entry?[...document.querySelectorAll(".route-row")].find(row=>row.dataset.entry===entry):document;
      const selector=`${node?".route-node":""}[${attribute}="${CSS.escape(value)}"]${task?`[data-activity-task="${CSS.escape(task)}"]`:""}`;
      scope?.querySelector(selector)?.focus({preventScroll:true});
    }
    stationFocusReturn=null;
  }
  locationRequest++;if(locationStatus==="locationPending")locationStatus="";
});
let lastObservedZoneDate=zoneDate();
let lastSceneMotionAt=0;
setInterval(()=>{
  if(!document.hidden){
    const currentDate=zoneDate();
    if(currentDate!==lastObservedZoneDate){lastObservedZoneDate=currentDate;if(followToday)selectedDate=currentDate;render();if(dialog.open&&document.querySelector("#prayer-results"))dialogContent.innerHTML=prayerPanel();else if(dialog.open&&document.querySelector("#journey-date-input"))dialogContent.innerHTML=datePanel();}
    const now=zoneParts();if(now!==livingMinute){livingMinute=now;updateScene();lastSceneMotionAt=Date.now();}
    else {updatePrayerCountdown();if(Date.now()-lastSceneMotionAt>=5000){updateScene();lastSceneMotionAt=Date.now();}}
    const tasks=livingState().stations.flatMap(s=>s.tasks);
    document.querySelectorAll("[data-elapsed]").forEach(node=>{const task=tasks.find(item=>item.id===node.dataset.elapsed);if(task)node.textContent=elapsedText(task);});
  }
},1000);
setInterval(()=>{
  if(screen==="day"&&!routeManualFocus&&scenePreviewMinute===null)focusRoute(routeProgressAt(minuteForSelectedDay()));
},250);
selectedDate=zoneDate();
render();
