"use strict";

(function attachMihwerDailySummary(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerDailySummary = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const { isDate, shiftDate } = globalThis.MihwerDataValidation || require("./data-validation");
  const labels = {
    ar: {
      title: "بداية اليوم", subtitle: "ملخص من مهامك المحفوظة", completed: "مكتمل",
      remaining: "متبقٍ", paused: "متوقف", plan: "أولويات مقترحة",
      planNote: "مرتبة حسب الأولوية المحفوظة، دون تغيير المهام.",
      empty: "لا توجد مهام نشطة لليوم.", edit: "تعديل", complete: "إنجاز",
      skip: "تجاوز مؤقتاً", skipped: "مستبعدة من الاقتراح", restore: "إعادة للاقتراح",
      skipNote: "التجاوز لهذا العرض فقط ولا يغير المهمة.",
      yesterday: "مراجعة أمس", yesterdayNote: "حالة مهام أمس الآن، وليست وقت إنجازها.",
      noneYesterday: "لا توجد مهام مسجلة لأمس.",
      allSkipped: "كل المهام النشطة مستبعدة من الاقتراح.",
      habits: "عادات اليوم", noHabits: "لا توجد عادات مجدولة لليوم.",
      notRecorded: "لم يُسجل", partial: "جزئي", habitSkipped: "متجاوز", habitsYesterday: "سجلات عادات أمس",
      completeHabit: "إنجاز", partialHabit: "جزئي", skipHabit: "تجاوز",
      events: "مواعيد اليوم", noEvents: "لا توجد مواعيد معروضة اليوم.", allDay: "طوال اليوم", ongoing: "مستمر من يوم سابق",
      editEvent: "تعديل الاسم", eventName: "اسم الموعد", saveEvent: "حفظ الاسم", cancelEvent: "إلغاء",
      recurringOriginal: "موعد متكرر · الأصل فقط",
      recurrenceNote: "تكرار المواعيد وتعديل أوقاتها وإعدادات العادات غير متصلة بعد.",
      remainingUnavailable: "التذكيرات لم تُربط بهذا الملخص بعد.",
      sourcesError: "تعذر تحميل العادات والمواعيد.", retry: "إعادة المحاولة",
      unavailable: "العادات والمواعيد غير متاحة في هذا الملخص حالياً.",
      prayer: "الصلاة القادمة", prayerSettings: "إعدادات الصلاة",
      prayerUnavailable: "اضبط الموقع وطريقة الصلاة والمنطقة الزمنية المطابقة للرحلة.",
      prayerError: "تعذر حساب الصلاة القادمة.", prayerDevice: "محسوبة من إعدادات هذا الجهاز."
    },
    en: {
      title: "Start your day", subtitle: "A summary of your saved tasks", completed: "Completed",
      remaining: "Remaining", paused: "Paused", plan: "Suggested priorities",
      planNote: "Ordered by saved priority without changing your tasks.",
      empty: "There are no active tasks today.", edit: "Edit", complete: "Complete",
      skip: "Skip for now", skipped: "Excluded from the suggestion", restore: "Restore suggestion",
      skipNote: "Skipping only changes this view, not the task.",
      yesterday: "Yesterday's review", yesterdayNote: "Current status of yesterday's tasks, not their completion time.",
      noneYesterday: "There are no tasks recorded for yesterday.",
      allSkipped: "All active tasks are excluded from this suggestion.",
      habits: "Today's habits", noHabits: "There are no habits scheduled today.",
      notRecorded: "Not recorded", partial: "Partial", habitSkipped: "Skipped", habitsYesterday: "Yesterday's habit records",
      completeHabit: "Complete", partialHabit: "Partial", skipHabit: "Skip",
      events: "Today's appointments", noEvents: "There are no appointments displayed today.", allDay: "All day", ongoing: "Continues from a previous day",
      editEvent: "Edit name", eventName: "Appointment name", saveEvent: "Save name", cancelEvent: "Cancel",
      recurringOriginal: "Recurring appointment · original only",
      recurrenceNote: "Recurrences, appointment times, and habit definitions are not editable here yet.",
      remainingUnavailable: "Reminders are not connected to this summary yet.",
      sourcesError: "Could not load habits and appointments.", retry: "Retry",
      unavailable: "Habits and appointments are not available in this summary right now.",
      prayer: "Next prayer", prayerSettings: "Prayer settings",
      prayerUnavailable: "Configure the location, prayer method, and a time zone matching the journey.",
      prayerError: "Could not calculate the next prayer.", prayerDevice: "Calculated from this device's settings."
    }
  };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function summarize({ today, tasks, skippedIds = [] }) {
    if (!isDate(today) || !Array.isArray(tasks) || !Array.isArray(skippedIds)) {
      throw new TypeError("invalid_daily_summary");
    }
    const skipped = new Set(skippedIds);
    const yesterday = shiftDate(today, -1);
    const todayTasks = tasks.filter(task => task.startDate === today && task.status !== "archived");
    const yesterdayTasks = tasks.filter(task => task.startDate === yesterday && task.status !== "archived");
    const count = (items, status) => items.filter(task => task.status === status).length;
    const active = todayTasks.filter(task => task.status === "active")
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
    return Object.freeze({
      today,
      yesterday,
      completed: count(todayTasks, "completed"),
      remaining: count(todayTasks, "active"),
      paused: count(todayTasks, "paused"),
      priorities: active.filter(task => !skipped.has(task.id)).slice(0, 3),
      skipped: active.filter(task => skipped.has(task.id)),
      yesterdayCount: yesterdayTasks.length,
      yesterdayCompleted: count(yesterdayTasks, "completed"),
      yesterdayRemaining: count(yesterdayTasks, "active"),
      yesterdayPaused: count(yesterdayTasks, "paused")
    });
  }

  function renderPrayer(prayer, language = "ar") {
    const t = labels[language] || labels.ar;
    if (prayer?.status === "ready") {
      return `<h3>${escape(t.prayer)}</h3><p>${escape(prayer.name)} · <bdi>${escape(prayer.time)} · ${escape(prayer.date)}</bdi></p><p class="muted">${escape(t.prayerDevice)}</p>`;
    }
    if (prayer?.status === "error") return `<p role="alert">${escape(t.prayerError)}</p>`;
    return `<h3>${escape(t.prayer)}</h3><p class="muted">${escape(t.prayerUnavailable)}</p><button class="secondary" type="button" data-utility="prayer-settings">${escape(t.prayerSettings)}</button>`;
  }

  function renderEventControls(event, language = "ar", busy = false, eventDraft = null, eventError = "", surface = "daily") {
    const t = labels[language] || labels.ar;
    if (event.recurring) return "";
    const disabled = busy ? "disabled" : "";
    if (eventDraft?.id === event.id && (eventDraft.surface || "daily") === surface) {
      return `<form data-daily-event-form><label class="field">${escape(t.eventName)}
        <input name="title" maxlength="200" required value="${escape(eventDraft.title)}" ${disabled}></label>
        ${eventError ? `<p class="backend-task-error" role="alert">${escape(eventError)}</p>` : ""}
        <div class="options"><button class="primary" type="submit" ${disabled}>${escape(t.saveEvent)}</button>
        <button class="secondary" type="button" data-daily-event-cancel ${disabled}>${escape(t.cancelEvent)}</button></div></form>`;
    }
    const attribute = surface === "timeline" ? "data-timeline-event-edit" : "data-daily-event-edit";
    return `<div class="options"><button class="secondary" type="button" ${attribute}="${escape(event.id)}" aria-label="${escape(`${t.editEvent} · ${event.title}`)}" ${busy || eventDraft ? "disabled" : ""}>${escape(t.editEvent)}</button></div>`;
  }

  function render(model, language = "ar", open = false, busy = false, sources = { status: "unavailable" },
    prayer = { status: "unavailable" }, eventDraft = null, eventError = "") {
    const t = labels[language] || labels.ar;
    const disabled = busy ? "disabled" : "";
    const priority = task => `<li class="daily-start-item">
      <span>${escape(task.title)}</span><div class="options">
        <button class="secondary" type="button" data-task-edit="${escape(task.id)}" ${disabled}>${escape(t.edit)}</button>
        <button class="secondary" type="button" data-task-toggle="${escape(task.id)}" ${disabled}>${escape(t.complete)}</button>
        <button class="secondary" type="button" data-daily-skip="${escape(task.id)}" ${disabled}>${escape(t.skip)}</button>
      </div></li>`;
    let sourceView;
    if (sources.status === "ready") {
      const { todayHabits, events, yesterdayHabits, timeZone } = sources.data;
      const habitStatus = record => !record ? t.notRecorded :
        record.status === "completed" ? t.completed : record.status === "partial" ? t.partial : t.habitSkipped;
      const formatTime = instant => new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", {
        timeZone, hour: "2-digit", minute: "2-digit"
      }).format(new Date(instant));
      const habitButton = (habit, status, label) =>
        `<button class="secondary" type="button" data-daily-habit="${escape(habit.id)}" data-habit-status="${status}" aria-label="${escape(`${label} · ${habit.name}`)}" ${busy || habit.record?.status === status ? "disabled" : ""}>${escape(label)}</button>`;
      const eventView = event => {
        const editor = renderEventControls(event, language, busy, eventDraft, eventError, "daily");
        return `<li class="daily-start-item">${escape(event.title)} · <bdi>${escape(event.allDay ? t.allDay : event.startsBeforeToday ? t.ongoing : formatTime(event.startAt))}</bdi>
          ${event.recurring ? `<span class="muted"> · ${escape(t.recurringOriginal)}</span>` : ""}${editor}</li>`;
      };
      sourceView = `<div class="daily-start-sources"><h3>${escape(t.habits)}</h3>
        ${todayHabits.length ? `<ul class="daily-start-list">${todayHabits.map(habit =>
          `<li class="daily-start-item"><span>${escape(habit.name)} · ${escape(habitStatus(habit.record))}</span>
            <div class="options">${habitButton(habit, "completed", t.completeHabit)}${habitButton(habit, "partial", t.partialHabit)}${habitButton(habit, "skipped", t.skipHabit)}</div></li>`
        ).join("")}</ul>` : `<p class="muted">${escape(t.noHabits)}</p>`}
        <h3>${escape(t.events)}</h3>
        ${events.length ? `<ul class="daily-start-list">${events.map(eventView).join("")}</ul>` : `<p class="muted">${escape(t.noEvents)}</p>`}
        ${yesterdayHabits.total ? `<p>${escape(t.habitsYesterday)}: ${escape(t.completed)} ${yesterdayHabits.completed} · ${escape(t.partial)} ${yesterdayHabits.partial} · ${escape(t.habitSkipped)} ${yesterdayHabits.skipped}</p>` : ""}
        <p class="muted">${escape(t.recurrenceNote)}</p><p class="muted">${escape(t.remainingUnavailable)}</p></div>`;
    } else if (sources.status === "error") {
      sourceView = `<p role="alert">${escape(t.sourcesError)} <button class="secondary" type="button" data-backend-retry ${disabled}>${escape(t.retry)}</button></p>`;
    } else {
      sourceView = `<p class="muted">${escape(t.unavailable)}</p>`;
    }
    return `<details class="panel daily-start" data-daily-start ${open ? "open" : ""}>
      <summary><span><strong>${escape(t.title)}</strong><small>${escape(t.subtitle)} · <bdi>${escape(model.today)}</bdi></small></span></summary>
      <div class="daily-start-counts">
        <span>${escape(t.completed)} <b>${model.completed}</b></span>
        <span>${escape(t.remaining)} <b>${model.remaining}</b></span>
        <span>${escape(t.paused)} <b>${model.paused}</b></span>
      </div>
      <h3>${escape(t.plan)}</h3><p class="muted">${escape(t.planNote)}</p>
      ${model.priorities.length ? `<ol class="daily-start-list">${model.priorities.map(priority).join("")}</ol>` : `<p class="muted">${escape(model.skipped.length ? t.allSkipped : t.empty)}</p>`}
      ${model.skipped.length ? `<h3>${escape(t.skipped)}</h3><ul class="daily-start-list">${model.skipped.map(task =>
        `<li class="daily-start-item"><span>${escape(task.title)}</span><button class="secondary" type="button" data-daily-restore="${escape(task.id)}" ${disabled}>${escape(t.restore)}</button></li>`
      ).join("")}</ul><p class="muted">${escape(t.skipNote)}</p>` : ""}
      <div class="daily-start-yesterday"><h3>${escape(t.yesterday)} · <bdi>${escape(model.yesterday)}</bdi></h3>
        ${model.yesterdayCount
          ? `<p>${escape(t.completed)}: ${model.yesterdayCompleted} · ${escape(t.remaining)}: ${model.yesterdayRemaining} · ${escape(t.paused)}: ${model.yesterdayPaused}</p><p class="muted">${escape(t.yesterdayNote)}</p>`
          : `<p class="muted">${escape(t.noneYesterday)}</p>`}
      </div>
      ${sourceView}
      <div class="daily-start-prayer" data-daily-prayer>${renderPrayer(prayer, language)}</div>
    </details>`;
  }

  return Object.freeze({ summarize, render, renderPrayer, renderEventControls });
});
