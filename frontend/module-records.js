"use strict";

(function attachMihwerModuleRecords(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerModuleRecords = api;
})(typeof globalThis !== "undefined" ? globalThis : this, root => {
  const { ApiError } = root.MihwerApiClient || require("./api-client");

  const STATUS = ["active", "paused", "completed", "archived"];
  const CURRENCY = { name: "currency", type: "text", required: true, pattern: "^[A-Z]{3}$", max: 3, initial: "SAR" };
  const opt = (values, ar, en) => values.map((value, index) => ({ value, ar: ar[index], en: en[index] }));
  const statusOptions = opt(STATUS, ["نشط", "متوقف مؤقتاً", "مكتمل", "مؤرشف"], ["Active", "Paused", "Completed", "Archived"]);
  const RRULES = opt(["", "FREQ=DAILY", "FREQ=WEEKLY", "FREQ=MONTHLY", "FREQ=YEARLY"],
    ["بلا تكرار", "يومي", "أسبوعي", "شهري", "سنوي"], ["No repeat", "Daily", "Weekly", "Monthly", "Yearly"]);
  const WEEKDAYS = { ar: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };

  const L = {
    title: ["title", "العنوان", "Title"], description: ["description", "الوصف", "Description"],
    start_date: ["start_date", "تاريخ البدء", "Start date"], target_date: ["target_date", "التاريخ المستهدف", "Target date"],
    end_date: ["end_date", "تاريخ الانتهاء", "End date"], status: ["status", "الحالة", "Status"], name: ["name", "الاسم", "Name"],
    notes: ["notes", "ملاحظات", "Notes"], started_at: ["started_at", "البداية", "Start"], ended_at: ["ended_at", "النهاية", "End"]
  };
  const label = key => ({ ar: L[key][1], en: L[key][2] });
  const field = (name, type, extra = {}) => ({ name, type, label: L[name] ? label(name) : extra.label, ...extra });

  const MODULES = Object.freeze([
    { key: "daily-reflections", group: "day", resource: "daily-reflections", journey: true, editable: true, uniqueDate: "local_date",
      ar: "سجل بداية اليوم", en: "Start-of-day record", dateField: "local_date", range: "date", timeline: true,
      fields: [
        field("local_date", "date", { required: true, label: { ar: "اليوم", en: "Day" }, initial: ctx => ctx.today }),
        field("intention", "textarea", { max: 1000, label: { ar: "نية اليوم", en: "Intention" } }),
        field("mood", "select", { label: { ar: "الحالة", en: "Mood" }, options: opt(["", "great", "good", "neutral", "low", "difficult"],
          ["—", "ممتاز", "جيد", "محايد", "منخفض", "صعب"], ["—", "Great", "Good", "Neutral", "Low", "Difficult"]) }),
        field("note", "textarea", { max: 5000, label: { ar: "ملاحظة", en: "Note" } })
      ], summary: r => r.intention || r.note || r.mood || "" },
    { key: "habits", group: "day", resource: "habits", journey: true, editable: true, ar: "تعريف العادات", en: "Habit definitions",
      dateField: "start_date", habit: true,
      fields: [
        field("name", "text", { required: true, max: 160 }),
        field("start_date", "date", { required: true, createOnly: true, initial: ctx => ctx.today }),
        field("end_date", "date"),
        field("status", "select", { options: opt(["active", "paused", "archived"], ["نشطة", "متوقفة", "مؤرشفة"], ["Active", "Paused", "Archived"]) }),
        field("frequency", "select", { schedule: true, label: { ar: "التكرار", en: "Frequency" },
          options: opt(["daily", "weekly", "custom"], ["يومي", "أسبوعي", "مخصص"], ["Daily", "Weekly", "Custom"]) }),
        field("days", "days", { schedule: true, label: { ar: "الأيام", en: "Days" } }),
        field("target", "number", { schedule: true, required: true, min: 0.01, step: "0.01", initial: 1, label: { ar: "الهدف", en: "Target" } }),
        field("unit", "text", { schedule: true, required: true, max: 40, initial: "times", label: { ar: "الوحدة", en: "Unit" } }),
        field("effective_date", "date", { scheduleDate: true, label: { ar: "يسري تغيير الجدول من", en: "Schedule change effective" }, initial: ctx => ctx.today })
      ], summary: r => `${r.target} ${r.unit} · ${r.frequency}` },
    { key: "calendar-events", group: "day", resource: "calendar-events", journey: true, editable: true, ar: "المواعيد", en: "Appointments",
      dateField: "start_at", zone: true,
      fields: [
        field("title", "text", { required: true, max: 200 }),
        field("details", "textarea", { label: { ar: "التفاصيل", en: "Details" } }),
        field("start_at", "datetime", { required: true, timed: true, label: { ar: "يبدأ", en: "Starts" } }),
        field("end_at", "datetime", { required: true, timed: true, label: { ar: "ينتهي", en: "Ends" } }),
        field("recurrence_rule", "select", { label: { ar: "التكرار", en: "Repeat" }, options: RRULES, nullable: true })
      ], summary: r => r.recurrence_rule || "" },
    { key: "projects", group: "plan", resource: "projects", journey: true, editable: true, ar: "المشاريع", en: "Projects", dateField: "target_date",
      fields: [field("title", "text", { required: true, max: 200 }), field("description", "textarea"),
        field("start_date", "date"), field("target_date", "date"), field("status", "select", { options: statusOptions })],
      summary: r => r.status },
    { key: "goals", group: "plan", resource: "goals", editable: true, ar: "الأهداف", en: "Goals", dateField: "target_date",
      fields: [field("title", "text", { required: true, max: 200 }), field("description", "textarea"),
        field("time_horizon", "select", { required: true, label: { ar: "المدى", en: "Horizon" },
          options: opt(["short", "medium", "long"], ["قصير", "متوسط", "طويل"], ["Short", "Medium", "Long"]) }),
        field("start_date", "date", { required: true, initial: ctx => ctx.today }), field("target_date", "date"),
        field("status", "select", { options: statusOptions })], summary: r => `${r.time_horizon} · ${r.status}` },
    { key: "study-courses", group: "study", resource: "study-courses", journey: true, editable: true, ar: "المقررات", en: "Courses",
      fields: [field("title", "text", { required: true, max: 200 }), field("provider", "text", { label: { ar: "الجهة", en: "Provider" } }),
        field("status", "select", { options: statusOptions })], summary: r => r.provider || r.status },
    { key: "study-sessions", group: "study", resource: "study-sessions", journey: true, editable: false, zone: true, timeline: true,
      ar: "جلسات الدراسة والعمل", en: "Study and work sessions", dateField: "started_at", range: "timestamp",
      fields: [field("started_at", "datetime", { required: true }), field("ended_at", "datetime"),
        field("focus_minutes", "number", { min: 1, max: 10080, step: "1", label: { ar: "دقائق التركيز", en: "Focus minutes" } }),
        field("notes", "textarea", { max: 5000 })], summary: r => r.focus_minutes ? `${r.focus_minutes}′` : "" },
    { key: "activity-sessions", group: "health", resource: "activity-sessions", journey: true, editable: false, zone: true, consent: "health",
      timeline: true, ar: "الأنشطة والتمارين", en: "Activities and exercise", dateField: "started_at", range: "timestamp",
      fields: [field("activity_type", "text", { required: true, max: 80, label: { ar: "النشاط", en: "Activity" } }),
        field("started_at", "datetime", { required: true }), field("ended_at", "datetime"),
        field("duration_minutes", "number", { min: 1, max: 10080, step: "1", label: { ar: "المدة بالدقائق", en: "Minutes" } }),
        field("notes", "textarea", { max: 5000 })], title: r => r.activity_type, summary: r => r.duration_minutes ? `${r.duration_minutes}′` : "" },
    { key: "sleep-records", group: "health", resource: "sleep-records", journey: true, editable: true, zone: true, consent: "health",
      timeline: true, ar: "النوم والراحة", en: "Sleep and rest", dateField: "wake_local_date", range: "date",
      fields: [field("wake_local_date", "date", { required: true, label: { ar: "يوم الاستيقاظ", en: "Wake day" }, initial: ctx => ctx.today }),
        field("sleep_start_at", "datetime", { required: true, label: { ar: "وقت النوم", en: "Slept at" } }),
        field("wake_at", "datetime", { required: true, label: { ar: "وقت الاستيقاظ", en: "Woke at" } }),
        field("notes", "textarea", { max: 5000 })], title: () => ({ ar: "نوم", en: "Sleep" }) },
    { key: "meal-logs", group: "health", resource: "meal-logs", journey: true, editable: true, zone: true, consent: "health", timeline: true,
      ar: "الوجبات", en: "Meals", dateField: "occurred_at", range: "timestamp",
      fields: [field("occurred_at", "datetime", { required: true, label: { ar: "الوقت", en: "Time" } }),
        field("meal_type", "select", { required: true, label: { ar: "النوع", en: "Type" }, options: opt(["breakfast", "lunch", "dinner", "snack", "other"],
          ["فطور", "غداء", "عشاء", "وجبة خفيفة", "أخرى"], ["Breakfast", "Lunch", "Dinner", "Snack", "Other"]) }),
        field("description", "textarea", { required: true, max: 2000 })], title: r => r.description },
    { key: "prayer-records", group: "health", resource: "prayer-records", journey: true, editable: true, zone: true, consent: "prayer",
      timeline: true, ar: "سجل الصلاة (اختياري)", en: "Prayer log (optional)", dateField: "local_date", range: "date",
      fields: [field("local_date", "date", { required: true, label: { ar: "اليوم", en: "Day" }, initial: ctx => ctx.today }),
        field("prayer_key", "select", { required: true, label: { ar: "الصلاة", en: "Prayer" }, options: opt(["fajr", "dhuhr", "asr", "maghrib", "isha"],
          ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"], ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]) }),
        field("fard_units", "number", { min: 0, max: 20, step: "1", initial: 0, label: { ar: "ركعات الفرض المؤداة", en: "Fard units done" } }),
        field("target_fard", "number", { min: 0, max: 20, step: "1", initial: 2, label: { ar: "ركعات الفرض", en: "Fard units" } }),
        field("before_units", "number", { min: 0, max: 20, step: "1", initial: 0, label: { ar: "السنة القبلية المؤداة", en: "Before done" } }),
        field("target_before", "number", { min: 0, max: 20, step: "1", initial: 0, label: { ar: "السنة القبلية", en: "Before target" } }),
        field("after_units", "number", { min: 0, max: 20, step: "1", initial: 0, label: { ar: "السنة البعدية المؤداة", en: "After done" } }),
        field("target_after", "number", { min: 0, max: 20, step: "1", initial: 0, label: { ar: "السنة البعدية", en: "After target" } })
      ], title: r => r.prayer_key, summary: r => `${r.fard_units}/${r.target_fard}` },
    { key: "notes", group: "notes", resource: "notes", journey: true, editable: true, ar: "الملاحظات والأفكار", en: "Notes and ideas",
      dateField: "note_date",
      fields: [field("kind", "select", { required: true, label: { ar: "النوع", en: "Kind" }, options: opt(["note", "idea", "link"], ["ملاحظة", "فكرة", "رابط"], ["Note", "Idea", "Link"]) }),
        field("title", "text", { max: 200 }), field("body", "textarea", { required: true, max: 50000, label: { ar: "النص", en: "Text" } }),
        field("url", "url", { label: { ar: "الرابط", en: "URL" } }), field("note_date", "date", { label: { ar: "التاريخ", en: "Date" } })],
      title: r => r.title || r.body, summary: r => r.kind },
    { key: "financial-accounts", group: "finance", resource: "financial-accounts", editable: true, ar: "الحسابات", en: "Accounts",
      fields: [field("name", "text", { required: true, max: 160 }), { ...CURRENCY, label: { ar: "العملة", en: "Currency" } },
        field("opening_balance", "number", { step: "0.01", initial: 0, label: { ar: "الرصيد الافتتاحي", en: "Opening balance" } }),
        field("status", "select", { options: opt(["active", "archived"], ["نشط", "مؤرشف"], ["Active", "Archived"]) })],
      summary: r => `${r.opening_balance} ${r.currency}` },
    { key: "finance-categories", group: "finance", resource: "finance-categories", editable: true, ar: "التصنيفات", en: "Categories",
      fields: [field("name", "text", { required: true, max: 100 }),
        field("transaction_kind", "select", { required: true, label: { ar: "النوع", en: "Kind" }, options: opt(["expense", "income", "transfer"], ["مصروف", "دخل", "تحويل"], ["Expense", "Income", "Transfer"]) })],
      summary: r => r.transaction_kind },
    { key: "budgets", group: "finance", resource: "budgets", editable: true, ar: "الميزانيات", en: "Budgets", dateField: "start_date",
      fields: [field("name", "text", { required: true, max: 160 }), { ...CURRENCY, label: { ar: "العملة", en: "Currency" } },
        field("period_kind", "select", { required: true, label: { ar: "الفترة", en: "Period" }, options: opt(["monthly", "weekly", "yearly", "custom"], ["شهرية", "أسبوعية", "سنوية", "مخصصة"], ["Monthly", "Weekly", "Yearly", "Custom"]) }),
        field("start_date", "date", { required: true, initial: ctx => ctx.today }), field("end_date", "date")], summary: r => r.period_kind },
    { key: "subscriptions", group: "finance", resource: "subscriptions", editable: true, ar: "الاشتراكات", en: "Subscriptions", dateField: "next_due_date",
      fields: [field("name", "text", { required: true, max: 200 }),
        field("amount", "number", { required: true, min: 0, step: "0.01", label: { ar: "المبلغ", en: "Amount" } }), { ...CURRENCY, label: { ar: "العملة", en: "Currency" } },
        field("cadence", "select", { required: true, label: { ar: "الدورة", en: "Cadence" }, options: opt(["monthly", "weekly", "quarterly", "yearly"], ["شهري", "أسبوعي", "ربع سنوي", "سنوي"], ["Monthly", "Weekly", "Quarterly", "Yearly"]) }),
        field("next_due_date", "date", { required: true, label: { ar: "الاستحقاق التالي", en: "Next due" }, initial: ctx => ctx.today }),
        field("status", "select", { options: opt(["active", "paused", "cancelled"], ["نشط", "متوقف", "ملغى"], ["Active", "Paused", "Cancelled"]) })],
      summary: r => `${r.amount} ${r.currency} · ${r.cadence}` },
    { key: "shopping-lists", group: "finance", resource: "shopping-lists", editable: true, ar: "قوائم المشتريات", en: "Shopping lists",
      fields: [field("title", "text", { required: true, max: 160 }),
        field("status", "select", { options: opt(["active", "archived"], ["نشطة", "مؤرشفة"], ["Active", "Archived"]) })], summary: r => r.status },
    { key: "financial-transactions", group: "finance", resource: "financial-transactions", editable: false, readOnly: true,
      ar: "المعاملات (عرض فقط)", en: "Transactions (read only)", dateField: "occurred_at", fields: [],
      title: r => `${r.kind} · ${r.amount} ${r.currency}` },
    { key: "user-preferences", group: "settings", resource: "user-preferences", editable: true, single: true, ar: "الإعدادات", en: "Settings",
      fields: [
        field("locale", "select", { label: { ar: "اللغة", en: "Language" }, options: opt(["ar", "en"], ["العربية", "English"], ["Arabic", "English"]) }),
        field("time_zone", "text", { required: true, max: 64, label: { ar: "المنطقة الزمنية", en: "Time zone" }, initial: ctx => ctx.timeZone }),
        field("week_starts_on", "select", { label: { ar: "بداية الأسبوع", en: "Week starts" }, integer: true,
          options: [0, 1, 2, 3, 4, 5, 6].map(day => ({ value: String(day), ar: WEEKDAYS.ar[day], en: WEEKDAYS.en[day] })) }),
        field("calendar_kind", "select", { label: { ar: "التقويم", en: "Calendar" }, options: opt(["gregorian", "hijri"], ["ميلادي", "هجري"], ["Gregorian", "Hijri"]) }),
        field("asr_method", "select", { nullable: true, label: { ar: "حساب العصر", en: "Asr method" }, options: opt(["", "standard", "hanafi"], ["—", "الجمهور", "الحنفي"], ["—", "Standard", "Hanafi"]) }),
        field("health_data_consent_at", "consent", { label: { ar: "أوافق على حفظ بيانات النشاط والنوم والوجبات", en: "I consent to saving activity, sleep and meal data" } }),
        field("prayer_recording_consent_at", "consent", { label: { ar: "أوافق على حفظ سجل الصلاة (اختياري وخاص)", en: "I consent to saving my prayer log (optional and private)" } })
      ] }
  ]);
  const BY_KEY = new Map(MODULES.map(definition => [definition.key, definition]));
  const GROUPS = [
    ["day", "اليوم والمواعيد", "Day and appointments"], ["plan", "المشاريع والأهداف", "Projects and goals"],
    ["study", "الدراسة والعمل", "Study and work"], ["health", "النشاط والنوم والصلاة", "Activity, sleep and prayer"],
    ["notes", "الملاحظات", "Notes"], ["finance", "المالية", "Finance"], ["settings", "الإعدادات", "Settings"]
  ];

  const messages = {
    ar: {
      heading: "وحدات مِحوَر المحفوظة", intro: "كل سجل يُقرأ ويُحفظ في مصدره الأصلي على الخادم.",
      loading: "جارٍ التحميل من الخادم…", empty: "لا توجد سجلات محفوظة بعد.", error: "تعذر تحميل السجلات من الخادم.",
      offline: "تعذر الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة.", retry: "إعادة المحاولة", add: "إضافة", edit: "تعديل",
      save: "حفظ على الخادم", saving: "جارٍ الحفظ…", cancel: "إلغاء", saved: "أكد الخادم حفظ السجل.", updated: "أكد الخادم تحديث السجل.",
      conflict: "تغير السجل على الخادم. أُعيد تحميله؛ راجع المسودة ثم احفظ مجدداً.", validation: "تحقق من الحقول المطلوبة وصيغتها.",
      rejected: "رفض الخادم الطلب. تحقق من القيم أو من عدم تكرار السجل.", forbidden: "لا تملك صلاحية تنفيذ هذا الإجراء.",
      consentHealth: "يتطلب هذا القسم موافقتك على حفظ بيانات الصحة من تبويب الإعدادات.",
      consentPrayer: "سجل الصلاة اختياري؛ فعّل الموافقة عليه من تبويب الإعدادات إن رغبت.",
      readOnly: "للعرض فقط؛ لا تُنشأ المعاملات المالية من الواجهة دون مسار محاسبي ذري.",
      appendOnly: "سجل إلحاقي: يُضاف ولا يُعدّل.", limit: "يعرض أحدث ١٠٠ سجل.", journeyHeading: "من الوحدات الأصلية ضمن الفترة",
      journeyEmpty: "لا توجد سجلات من الوحدات ضمن الفترة.", sourceEdit: "تعديل في المصدر",
      allDayEvent: "موعد طوال اليوم: يمكن تعديل العنوان والتفاصيل والتكرار فقط.",
      scheduleNote: "تغيير التكرار أو الأيام أو الهدف يُحفظ كمراجعة جديدة دون تغيير السجلات السابقة.",
      revisionExists: "توجد مراجعة جدول بهذا التاريخ. اختر تاريخ سريان لاحقاً.", dayExists: "سجل هذا اليوم موجود وفُتح للتعديل بدلاً من إنشاء نسخة ثانية.",
      noPreferences: "لم تُنشأ إعداداتك على الخادم بعد. احفظ النموذج لإنشائها.", consentGiven: "مفعلة منذ", sessionEnded: "انتهت الجلسة."
    },
    en: {
      heading: "Saved Mihwar modules", intro: "Every record is read from and saved to its original server source.",
      loading: "Loading from the server…", empty: "No saved records yet.", error: "Could not load records from the server.",
      offline: "Could not reach the server. Check the connection and retry.", retry: "Retry", add: "Add", edit: "Edit",
      save: "Save to server", saving: "Saving…", cancel: "Cancel", saved: "The server confirmed the record was saved.", updated: "The server confirmed the update.",
      conflict: "The record changed on the server. It was reloaded; review the draft and save again.", validation: "Check the required fields and formats.",
      rejected: "The server rejected the request. Check the values or duplicates.", forbidden: "You are not allowed to perform this action.",
      consentHealth: "This section requires health data consent in Settings.",
      consentPrayer: "The prayer log is optional; enable its consent in Settings if you wish.",
      readOnly: "Read only; transactions are not created from the interface without an atomic ledger flow.",
      appendOnly: "Append-only log: entries are added, not edited.", limit: "Shows the latest 100 records.", journeyHeading: "From original modules in this period",
      journeyEmpty: "No module records in this period.", sourceEdit: "Edit at source",
      allDayEvent: "All-day appointment: only title, details and repeat can be edited.",
      scheduleNote: "Frequency, day or target changes are saved as a new revision without altering earlier records.",
      revisionExists: "A schedule revision already exists on that date. Choose a later effective date.", dayExists: "This day's record exists and was opened for editing instead of creating a duplicate.",
      noPreferences: "Your settings are not on the server yet. Save the form to create them.", consentGiven: "Enabled since", sessionEnded: "Session ended."
    }
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function zoneParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(date);
    return Object.fromEntries(parts.map(part => [part.type, part.value]));
  }

  function utcToZonedLocal(iso, timeZone) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) return "";
    const p = zoneParts(date, timeZone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function zonedLocalToUtc(local, timeZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local || "");
    if (!match) return null;
    const [, y, mo, d, h, mi] = match.map(Number);
    const wanted = Date.UTC(y, mo - 1, d, h, mi);
    let guess = wanted;
    for (let i = 0; i < 3; i += 1) {
      const p = zoneParts(new Date(guess), timeZone);
      const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
      guess += wanted - shown;
    }
    const check = zoneParts(new Date(guess), timeZone);
    if (`${check.year}-${check.month}-${check.day}T${check.hour}:${check.minute}` !== local) return null;
    return new Date(guess).toISOString();
  }

  function addDays(date, days) {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  function localDateOf(record, definition, timeZone) {
    const value = record?.[definition.dateField];
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return utcToZonedLocal(value, timeZone).slice(0, 10);
  }

  function initialValue(definition, item, ctx) {
    return typeof item.initial === "function" ? item.initial(ctx) : item.initial ?? (item.type === "select" && !item.nullable ? item.options[0].value : "");
  }

  function recordToDraft(definition, record, ctx) {
    const draft = {};
    for (const item of definition.fields) {
      if (item.scheduleDate) { draft[item.name] = ctx.today; continue; }
      const value = record ? record[item.name] : initialValue(definition, item, ctx);
      if (item.type === "datetime") draft[item.name] = record ? utcToZonedLocal(value, record.time_zone || ctx.timeZone) : value || "";
      else if (item.type === "days") draft[item.name] = Array.isArray(value) ? value.map(Number) : [0, 1, 2, 3, 4, 5, 6];
      else if (item.type === "consent") draft[item.name] = Boolean(value);
      else draft[item.name] = value === null || value === undefined ? "" : String(value);
    }
    return draft;
  }

  function formToDraft(definition, form) {
    const draft = {};
    for (const item of definition.fields) {
      if (item.type === "days") {
        draft[item.name] = [...form.querySelectorAll(`[name="${item.name}"]`)].filter(input => input.checked).map(input => Number(input.value));
      } else if (item.type === "consent") {
        draft[item.name] = Boolean(form.elements[item.name]?.checked);
      } else {
        draft[item.name] = String(form.elements[item.name]?.value ?? "");
      }
    }
    return draft;
  }

  function buildPayload(definition, draft, { record, ctx }) {
    const payload = {};
    const zone = record?.time_zone || ctx.timeZone;
    const allDay = definition.key === "calendar-events" && record?.all_day_start;
    for (const item of definition.fields) {
      if (item.scheduleDate || (record && item.createOnly) || (allDay && item.timed)) continue;
      const raw = draft[item.name];
      let value;
      if (item.type === "days") {
        if (!raw.length || raw.some(day => !Number.isInteger(day) || day < 0 || day > 6)) return { error: item.name };
        value = [...new Set(raw)].sort();
      } else if (item.type === "consent") {
        const previous = record?.[item.name] || null;
        value = raw ? previous || new Date().toISOString() : null;
      } else {
        const text = raw.trim();
        if (!text) {
          if (item.required) return { error: item.name };
          if (!record && !item.nullable) continue;
          value = null;
        } else if (item.type === "number") {
          value = Number(text);
          if (!Number.isFinite(value) || item.min !== undefined && value < item.min || item.max !== undefined && value > item.max ||
              item.step === "1" && !Number.isInteger(value)) return { error: item.name };
        } else if (item.type === "datetime") {
          value = zonedLocalToUtc(text, zone);
          if (!value) return { error: item.name };
        } else if (item.type === "date") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: item.name };
          value = text;
        } else if (item.type === "url") {
          try { if (!/^https?:$/.test(new URL(text).protocol)) return { error: item.name }; } catch { return { error: item.name }; }
          value = text;
        } else {
          if (item.max && text.length > item.max || item.pattern && !new RegExp(item.pattern).test(text)) return { error: item.name };
          value = item.integer ? Number(text) : text;
        }
      }
      if (record && JSON.stringify(record[item.name] ?? null) === JSON.stringify(value ?? null)) continue;
      payload[item.name] = value;
    }
    if (definition.key === "calendar-events" && !allDay) {
      const start = payload.start_at || record?.start_at;
      const end = payload.end_at || record?.end_at;
      if (!start || !end || Date.parse(end) <= Date.parse(start)) return { error: "end_at" };
    }
    if (definition.key === "sleep-records") {
      const start = payload.sleep_start_at || record?.sleep_start_at;
      const end = payload.wake_at || record?.wake_at;
      if (Date.parse(end) <= Date.parse(start)) return { error: "wake_at" };
    }
    if (["study-sessions", "activity-sessions"].includes(definition.key) && payload.ended_at && Date.parse(payload.ended_at) <= Date.parse(payload.started_at)) {
      return { error: "ended_at" };
    }
    if (definition.key === "notes" && (payload.kind ?? record?.kind) === "link" && !(payload.url ?? record?.url)) return { error: "url" };
    if (definition.key === "prayer-records") {
      for (const [done, target] of [["fard_units", "target_fard"], ["before_units", "target_before"], ["after_units", "target_after"]]) {
        if (Number(payload[done] ?? record?.[done] ?? 0) > Number(payload[target] ?? record?.[target] ?? 0)) return { error: done };
      }
    }
    for (const [from, to] of [["start_date", "target_date"], ["start_date", "end_date"]]) {
      const a = payload[from] ?? record?.[from];
      const b = payload[to] ?? record?.[to];
      if (a && b && b < a && definition.fields.some(item => item.name === to)) return { error: to };
    }
    if (!record) {
      if (definition.journey) payload.journey_id = ctx.journeyId;
      if (definition.zone) payload.time_zone = ctx.timeZone;
    }
    return { payload };
  }

  function createModuleRecordsRepository(client) {
    const request = (...args) => client().request(...args);
    return Object.freeze({
      async list(definition, { journeyId, range, signal } = {}) {
        const query = { limit: 100 };
        if (definition.journey) query.journey_id = journeyId;
        if (range) Object.assign(query, range);
        const rows = await request(definition.resource, { query, signal });
        if (!Array.isArray(rows)) throw new ApiError("invalid_response", 502);
        return rows;
      },
      async create(definition, payload, { signal } = {}) {
        const rows = await request(definition.resource, { method: "POST", body: payload, signal });
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) throw new ApiError("invalid_response", 502);
        return row;
      },
      async update(definition, record, payload, { signal } = {}) {
        const rows = await request(definition.resource, {
          method: "PATCH", query: definition.single ? {} : { id: record.id }, expectedVersion: record.version, body: payload, signal
        });
        const row = Array.isArray(rows) ? rows[0] : rows;
        if (!row) throw new ApiError("version_conflict", 409);
        return row;
      },
      async addHabitRevision(habit, schedule, effectiveDate, { signal } = {}) {
        const rows = await request("habit-revisions", {
          method: "POST", body: { habit_id: habit.id, effective_date: effectiveDate, ...schedule }, signal
        });
        return Array.isArray(rows) ? rows[0] : rows;
      }
    });
  }

  function rangeQuery(definition, range, timeZone) {
    if (definition.range === "date") return { range_from: range.start, range_to: range.end };
    const from = zonedLocalToUtc(`${range.start}T00:00`, timeZone);
    const to = zonedLocalToUtc(`${addDays(range.end, 1)}T00:00`, timeZone);
    return from && to ? { range_from: from, range_to: to } : null;
  }

  function createModuleRecordsController({ getClient, notify = () => {} }) {
    const repository = createModuleRecordsRepository(getClient);
    let epoch = 0;
    let controller = null;
    let language = "ar";
    let ctx = null;
    const state = {
      active: "daily-reflections", lists: new Map(), preferences: { status: "idle", row: null },
      editing: null, busy: false, notice: "", error: "", journey: { key: "", status: "idle", items: [] }
    };
    const text = key => messages[language]?.[key] || messages.ar[key] || key;
    const name = definition => definition[language] || definition.ar;
    const localized = value => value && typeof value === "object" ? value[language] || value.ar : value;

    function reset() {
      epoch += 1;
      controller?.abort();
      controller = null;
      ctx = null;
      state.lists = new Map();
      state.preferences = { status: "idle", row: null };
      state.editing = null;
      state.busy = false;
      state.notice = "";
      state.error = "";
      state.journey = { key: "", status: "idle", items: [] };
    }

    function errorCode(error) {
      if (error?.code === "version_conflict") return "conflict";
      if (error?.status === 401 || error?.code === "unauthenticated") return "sessionEnded";
      if (error?.status === 403) return "forbidden";
      if (error?.status === 0 || error?.code === "network_error" || error?.code === "request_timeout") return "offline";
      if (error?.status === 400) return "rejected";
      return "error";
    }

    function consentMissing(definition) {
      if (!definition.consent) return false;
      const row = state.preferences.row;
      return definition.consent === "health" ? !row?.health_data_consent_at : !row?.prayer_recording_consent_at;
    }

    let preferencesPromise = null;
    function loadPreferences(current) {
      if (state.preferences.status === "ready") return Promise.resolve();
      if (preferencesPromise && state.preferences.status === "loading") return preferencesPromise;
      state.preferences = { status: "loading", row: null };
      preferencesPromise = (async () => {
        try {
          const rows = await repository.list(BY_KEY.get("user-preferences"), {});
          if (current !== epoch) return;
          state.preferences = { status: "ready", row: rows[0] || null };
        } catch (error) {
          if (current !== epoch) return;
          state.preferences = { status: "error", row: null, error: errorCode(error) };
        }
      })();
      return preferencesPromise;
    }

    async function loadList(key, { force = false } = {}) {
      const definition = BY_KEY.get(key);
      if (!definition || !ctx) return;
      const existing = state.lists.get(key);
      if (!force && existing && existing.status !== "error") return;
      const current = epoch;
      state.lists.set(key, { status: "loading", rows: existing?.rows || [] });
      notify();
      try {
        await loadPreferences(current);
        if (current !== epoch) return;
        if (definition.single) {
          state.lists.set(key, { status: "ready", rows: state.preferences.row ? [state.preferences.row] : [] });
        } else if (consentMissing(definition)) {
          state.lists.set(key, { status: "consent", rows: [] });
        } else {
          const range = definition.range ? rangeQuery(definition, { start: addDays(ctx.today, -365), end: addDays(ctx.today, 1) }, ctx.timeZone) : null;
          const rows = await repository.list(definition, { journeyId: ctx.journeyId, range, signal: undefined });
          if (current !== epoch) return;
          if (definition.habit && rows.length) {
            const revisions = await getClient().request("habit-revisions", {
              query: { journey_id: ctx.journeyId, effective_date_to: ctx.today, limit: 100 }
            });
            if (current !== epoch) return;
            const latest = new Map();
            for (const revision of Array.isArray(revisions) ? revisions : []) {
              const previous = latest.get(revision.habit_id);
              if (!previous || revision.effective_date > previous.effective_date) latest.set(revision.habit_id, revision);
            }
            for (const [index, row] of rows.entries()) {
              const revision = latest.get(row.id);
              if (revision) rows[index] = { ...row, frequency: revision.frequency, days: revision.days, target: revision.target, unit: revision.unit };
            }
          }
          const sorted = [...rows].sort((a, b) => String(b[definition.dateField] || b.updated_at || b.created_at || "").localeCompare(String(a[definition.dateField] || a.updated_at || a.created_at || "")));
          state.lists.set(key, { status: "ready", rows: sorted });
        }
      } catch (error) {
        if (current !== epoch) return;
        state.lists.set(key, { status: "error", rows: [], error: errorCode(error) });
      }
      notify();
    }

    async function loadJourney(range) {
      if (!ctx) return;
      const key = `${ctx.journeyId}:${range.start}:${range.end}`;
      if (state.journey.key === key && state.journey.status !== "error") return;
      const current = epoch;
      state.journey = { key, status: "loading", items: [] };
      try {
        await loadPreferences(current);
        if (current !== epoch) return;
        const sources = MODULES.filter(definition => definition.timeline && !consentMissing(definition));
        const results = await Promise.all(sources.map(async definition => {
          const query = rangeQuery(definition, range, ctx.timeZone);
          if (!query) return [];
          const rows = await repository.list(definition, { journeyId: ctx.journeyId, range: query });
          return rows.map(record => ({ definition, record, date: localDateOf(record, definition, record.time_zone || ctx.timeZone) }));
        }));
        if (current !== epoch || state.journey.key !== key) return;
        const items = results.flat().filter(item => item.date >= range.start && item.date <= range.end)
          .sort((a, b) => a.date.localeCompare(b.date) || String(a.record[a.definition.dateField]).localeCompare(String(b.record[b.definition.dateField])));
        state.journey = { key, status: "ready", items };
      } catch (error) {
        if (current !== epoch || state.journey.key !== key) return;
        state.journey = { key, status: "error", items: [], error: errorCode(error) };
      }
      notify();
    }

    function recordTitle(definition, record) {
      const value = definition.title ? definition.title(record) : record.title || record.name;
      const option = definition.fields.find(item => item.name === "prayer_key")?.options.find(o => o.value === value);
      return localized(option ? option : value) || name(definition);
    }

    function recordRow(definition, record) {
      const date = localDateOf(record, definition, record.time_zone || ctx?.timeZone);
      const time = definition.dateField && /T/.test(record[definition.dateField] || "")
        ? utcToZonedLocal(record[definition.dateField], record.time_zone || ctx.timeZone).slice(11) : "";
      const summary = definition.summary ? definition.summary(record) : "";
      return `<article class="panel backend-task module-record" data-module-record="${escapeHtml(record.id || "preferences")}">
        <h3>${escapeHtml(String(recordTitle(definition, record)).slice(0, 160))}</h3>
        <p class="muted">${escapeHtml([date, time, summary].filter(Boolean).join(" · "))}</p>
        ${definition.editable ? `<div class="options"><button class="secondary" type="button" data-module-edit="${escapeHtml(definition.key)}" data-record-id="${escapeHtml(record.id || "")}" ${state.busy ? "disabled" : ""}>${escapeHtml(text("edit"))}</button></div>` : ""}
      </article>`;
    }

    function fieldView(definition, item, draft, record) {
      const labelText = escapeHtml(localized(item.label) || item.name);
      if (record && item.createOnly) return "";
      if (item.scheduleDate && !record) return "";
      if (definition.key === "calendar-events" && record?.all_day_start && item.timed) return "";
      const value = draft[item.name];
      if (item.type === "days") {
        return `<fieldset class="field"><legend>${labelText}</legend><div class="options">${WEEKDAYS[language].map((day, index) =>
          `<label><input type="checkbox" name="${item.name}" value="${index}" ${value.includes(index) ? "checked" : ""}> ${escapeHtml(day)}</label>`).join("")}</div></fieldset>`;
      }
      if (item.type === "consent") {
        const since = record?.[item.name] ? ` <span class="muted">${escapeHtml(text("consentGiven"))} ${escapeHtml(String(record[item.name]).slice(0, 10))}</span>` : "";
        return `<label class="field"><span><input type="checkbox" name="${item.name}" ${value ? "checked" : ""}> ${labelText}</span>${since}</label>`;
      }
      if (item.type === "select") {
        return `<label class="field">${labelText}<select name="${item.name}" ${item.required ? "required" : ""}>${item.options.map(option =>
          `<option value="${escapeHtml(option.value)}" ${String(value) === option.value ? "selected" : ""}>${escapeHtml(option[language] || option.ar)}</option>`).join("")}</select></label>`;
      }
      if (item.type === "textarea") {
        return `<label class="field">${labelText}<textarea name="${item.name}" ${item.max ? `maxlength="${item.max}"` : ""} ${item.required ? "required" : ""}>${escapeHtml(value)}</textarea></label>`;
      }
      const type = item.type === "datetime" ? "datetime-local" : item.type;
      const attrs = [item.required ? "required" : "", item.max && item.type !== "number" ? `maxlength="${item.max}"` : "",
        item.min !== undefined ? `min="${item.min}"` : "", item.max !== undefined && item.type === "number" ? `max="${item.max}"` : "",
        item.step ? `step="${item.step}"` : "", item.pattern ? `pattern="${item.pattern}"` : ""].filter(Boolean).join(" ");
      return `<label class="field">${labelText}<input name="${item.name}" type="${type}" ${attrs} value="${escapeHtml(value)}"></label>`;
    }

    function formView() {
      const { key, record, draft } = state.editing;
      const definition = BY_KEY.get(key);
      const notes = [definition.habit && record ? text("scheduleNote") : "", definition.key === "calendar-events" && record?.all_day_start ? text("allDayEvent") : ""].filter(Boolean);
      return `<form class="panel backend-task-form" data-module-form="${escapeHtml(key)}">
        <h3>${escapeHtml(name(definition))} · ${escapeHtml(record ? text("edit") : text("add"))}</h3>
        ${notes.map(note => `<p class="muted">${escapeHtml(note)}</p>`).join("")}
        ${definition.fields.map(item => fieldView(definition, item, draft, record)).join("")}
        <p class="backend-task-error" role="alert">${escapeHtml(state.error ? text(state.error) : "")}</p>
        <div class="options"><button class="primary" type="submit" ${state.busy ? "disabled" : ""}>${escapeHtml(state.busy ? text("saving") : text("save"))}</button>
        <button class="secondary" type="button" data-module-cancel ${state.busy ? "disabled" : ""}>${escapeHtml(text("cancel"))}</button></div>
      </form>`;
    }

    function listView(definition) {
      const list = state.lists.get(definition.key) || { status: "loading", rows: [] };
      const canCreate = !definition.readOnly && !(definition.single && list.rows.length);
      const head = `<div class="options">${canCreate && list.status === "ready" ? `<button class="primary" type="button" data-module-new="${escapeHtml(definition.key)}" ${state.busy || state.editing ? "disabled" : ""}>${escapeHtml(text(definition.single ? "save" : "add"))}</button>` : ""}
        <button class="secondary" type="button" data-module-retry="${escapeHtml(definition.key)}" ${state.busy ? "disabled" : ""}>${escapeHtml(text("retry"))}</button></div>`;
      const notes = [definition.readOnly ? text("readOnly") : "", !definition.editable && !definition.readOnly ? text("appendOnly") : "",
        definition.single && list.status === "ready" && !list.rows.length ? text("noPreferences") : "",
        list.rows.length >= 100 ? text("limit") : ""].filter(Boolean);
      let body;
      if (list.status === "loading") body = `<p class="muted" role="status">${escapeHtml(text("loading"))}</p>`;
      else if (list.status === "error") body = `<p class="backend-task-error" role="alert">${escapeHtml(text(list.error || "error"))}</p>`;
      else if (list.status === "consent") body = `<p class="muted" role="status">${escapeHtml(text(definition.consent === "prayer" ? "consentPrayer" : "consentHealth"))}</p>`;
      else body = list.rows.map(record => recordRow(definition, record)).join("") || `<p class="muted">${escapeHtml(text("empty"))}</p>`;
      return `${head}${notes.map(note => `<p class="muted">${escapeHtml(note)}</p>`).join("")}<div class="backend-task-list">${body}</div>`;
    }

    function render(context) {
      language = context.language === "en" ? "en" : "ar";
      const key = `${context.journeyId}|${context.timeZone}`;
      if (!ctx || ctx.key !== key) {
        reset();
        ctx = { ...context, key };
      } else ctx = { ...ctx, ...context, key };
      const definition = BY_KEY.get(state.active);
      if (!state.lists.has(definition.key)) queueMicrotask(() => loadList(definition.key));
      const tabs = GROUPS.map(([group, ar, en]) => {
        const items = MODULES.filter(item => item.group === group);
        return `<div class="module-group"><p class="eyebrow">${escapeHtml(language === "en" ? en : ar)}</p><div class="levels">${items.map(item =>
          `<button type="button" data-module-tab="${escapeHtml(item.key)}" class="${item.key === state.active ? "active" : ""}" ${item.key === state.active ? 'aria-current="page"' : ""} ${state.busy || state.editing ? "disabled" : ""}>${escapeHtml(name(item))}</button>`).join("")}</div></div>`;
      }).join("");
      return `<section class="module-records" data-module-records aria-labelledby="module-records-heading">
        <h2 id="module-records-heading">${escapeHtml(text("heading"))}</h2><p class="sub">${escapeHtml(text("intro"))}</p>
        ${tabs}
        ${state.notice ? `<p class="backend-task-notice" role="status">${escapeHtml(state.notice)}</p>` : ""}
        ${state.error && !state.editing ? `<p class="backend-task-error" role="alert">${escapeHtml(text(state.error))}</p>` : ""}
        ${state.editing ? formView() : ""}
        <h3>${escapeHtml(name(definition))}</h3>
        ${listView(definition)}
      </section>`;
    }

    function renderJourney(context, range) {
      if (!ctx) render(context);
      const key = `${ctx.journeyId}:${range.start}:${range.end}`;
      if (state.journey.key !== key) queueMicrotask(() => loadJourney(range));
      const journey = state.journey.key === key ? state.journey : { status: "loading", items: [] };
      const body = journey.status === "loading" ? `<p class="muted" role="status">${escapeHtml(text("loading"))}</p>` :
        journey.status === "error" ? `<p class="backend-task-error" role="alert">${escapeHtml(text(journey.error || "error"))}</p>` :
        journey.items.map(({ definition, record, date }) => `<article class="panel backend-task" data-journey-source="${escapeHtml(definition.key)}">
          <p class="eyebrow">${escapeHtml(name(definition))}</p><h3>${escapeHtml(String(recordTitle(definition, record)).slice(0, 160))}</h3>
          <p class="muted">${escapeHtml(date)}${definition.dateField && /T/.test(record[definition.dateField] || "") ? ` · ${escapeHtml(utcToZonedLocal(record[definition.dateField], record.time_zone || ctx.timeZone).slice(11))}` : ""}${definition.summary && definition.summary(record) ? ` · ${escapeHtml(String(definition.summary(record)).slice(0, 160))}` : ""}</p>
          ${definition.editable ? `<button class="secondary" type="button" data-module-source-edit="${escapeHtml(definition.key)}" data-record-id="${escapeHtml(record.id)}" ${state.busy ? "disabled" : ""}>${escapeHtml(text("sourceEdit"))}</button>` : ""}
        </article>`).join("") || `<p class="muted">${escapeHtml(text("journeyEmpty"))}</p>`;
      return `<section class="module-journey" data-module-records><h2>${escapeHtml(text("journeyHeading"))}</h2><div class="backend-timeline">${body}</div></section>`;
    }

    function findRecord(key, id) {
      const definition = BY_KEY.get(key);
      if (definition?.single) return state.lists.get(key)?.rows[0] || null;
      return state.lists.get(key)?.rows.find(row => row.id === id) ||
        state.journey.items.find(item => item.definition.key === key && item.record.id === id)?.record || null;
    }

    function openEditor(key, record) {
      state.active = key;
      state.error = "";
      state.notice = "";
      state.editing = { key, record, draft: recordToDraft(BY_KEY.get(key), record, ctx) };
      notify();
    }

    async function save(form) {
      if (state.busy || !state.editing) return;
      const { key, record } = state.editing;
      const definition = BY_KEY.get(key);
      state.editing.draft = formToDraft(definition, form);
      const built = buildPayload(definition, state.editing.draft, { record, ctx });
      if (built.error) { state.error = "validation"; notify(); return; }
      const current = epoch;
      state.busy = true;
      state.error = "";
      state.notice = "";
      notify();
      try {
        let existing = record;
        if (!existing && definition.uniqueDate) {
          const date = built.payload[definition.uniqueDate];
          const rows = await repository.list(definition, { journeyId: ctx.journeyId, range: { range_from: date, range_to: date } });
          if (current !== epoch) return;
          if (rows[0]) {
            state.editing = { key, record: rows[0], draft: state.editing.draft };
            state.notice = text("dayExists");
            existing = rows[0];
          }
        }
        if (definition.habit && existing) {
          const scheduleKeys = definition.fields.filter(item => item.schedule).map(item => item.name);
          const schedule = {};
          const fields = {};
          for (const [field, value] of Object.entries(buildPayload(definition, state.editing.draft, { record: existing, ctx }).payload || {})) {
            (scheduleKeys.includes(field) ? schedule : fields)[field] = value;
          }
          if (Object.keys(schedule).length) {
            const effective = state.editing.draft.effective_date;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(effective) || effective < existing.start_date) throw new ApiError("validation_failed", 400);
            const full = Object.fromEntries(scheduleKeys.map(field => [field, schedule[field] ?? existing[field]]));
            try { await repository.addHabitRevision(existing, full, effective); }
            catch (error) { if (error?.status === 400) throw Object.assign(new ApiError("revision_exists", 400), { revision: true }); throw error; }
          }
          if (Object.keys(fields).length) await repository.update(definition, existing, fields);
        } else if (existing) {
          const payload = buildPayload(definition, state.editing.draft, { record: existing, ctx });
          if (payload.error) throw new ApiError("validation_failed", 400);
          if (Object.keys(payload.payload).length) await repository.update(definition, existing, payload.payload);
        } else {
          await repository.create(definition, built.payload);
        }
        if (current !== epoch) return;
        const dayNotice = state.notice;
        state.editing = null;
        state.notice = dayNotice ? `${dayNotice} ${text("updated")}` : text(record ? "updated" : "saved");
        if (definition.single || definition.key === "user-preferences") state.preferences = { status: "idle", row: null };
        state.lists.delete(key);
        if (definition.single) state.lists.clear();
        state.journey = { key: "", status: "idle", items: [] };
        state.busy = false;
        await loadList(key, { force: true });
        if (definition.key === "calendar-events" || definition.habit || definition.key === "daily-reflections") root.MihwarTaskSlice?.refresh?.();
      } catch (error) {
        if (current !== epoch) return;
        state.error = error?.revision ? "revisionExists" : error?.code === "validation_failed" ? "validation" : errorCode(error);
        if (state.error === "conflict") {
          state.lists.delete(key);
          await loadList(key, { force: true });
          const fresh = record && findRecord(key, record.id);
          if (fresh && state.editing) state.editing.record = fresh;
        }
      } finally {
        if (current === epoch) {
          state.busy = false;
          notify();
        }
      }
    }

    function bind(doc = root.document) {
      if (!doc) return;
      doc.addEventListener("input", event => {
        const form = event.target.closest?.("[data-module-form]");
        if (form && state.editing && form.dataset.moduleForm === state.editing.key) {
          state.editing.draft = formToDraft(BY_KEY.get(state.editing.key), form);
        }
      });
      doc.addEventListener("change", event => {
        const form = event.target.closest?.("[data-module-form]");
        if (form && state.editing && form.dataset.moduleForm === state.editing.key) {
          state.editing.draft = formToDraft(BY_KEY.get(state.editing.key), form);
        }
      });
      doc.addEventListener("submit", event => {
        const form = event.target.closest?.("[data-module-form]");
        if (!form) return;
        event.preventDefault();
        save(form);
      });
      doc.addEventListener("click", event => {
        const target = event.target.closest?.("[data-module-tab],[data-module-new],[data-module-edit],[data-module-cancel],[data-module-retry],[data-module-source-edit]");
        if (!target || !target.closest("[data-module-records]") || state.busy || !ctx) return;
        if (target.matches("[data-module-tab]")) {
          if (state.editing) return;
          state.active = target.dataset.moduleTab;
          state.notice = "";
          state.error = "";
          notify();
          loadList(state.active);
        } else if (target.matches("[data-module-new]")) {
          openEditor(target.dataset.moduleNew, null);
        } else if (target.matches("[data-module-edit],[data-module-source-edit]")) {
          const key = target.dataset.moduleEdit || target.dataset.moduleSourceEdit;
          const record = findRecord(key, target.dataset.recordId);
          if (record) openEditor(key, record);
          if (target.matches("[data-module-source-edit]")) {
            root.document?.querySelector?.("[data-module-records] form")?.scrollIntoView?.({ block: "center" });
          }
        } else if (target.matches("[data-module-cancel]")) {
          state.editing = null;
          state.error = "";
          notify();
        } else if (target.matches("[data-module-retry]")) {
          state.error = "";
          if (BY_KEY.get(target.dataset.moduleRetry)?.single || BY_KEY.get(target.dataset.moduleRetry)?.consent) state.preferences = { status: "idle", row: null };
          loadList(target.dataset.moduleRetry, { force: true });
        }
      });
    }

    return Object.freeze({ state, render, renderJourney, reset, bind, loadList, save, openEditor, findRecord });
  }

  return Object.freeze({
    MODULES, createModuleRecordsRepository, createModuleRecordsController,
    buildPayload, recordToDraft, zonedLocalToUtc, utcToZonedLocal, rangeQuery
  });
});
