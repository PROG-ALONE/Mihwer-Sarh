"use strict";

(function attachMihwerTaskSlice(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwarTaskSlice = api;
})(typeof globalThis !== "undefined" ? globalThis : this, root => {
  const { ApiError, createApiClient } = root.MihwerApiClient || require("./api-client");
  const { createTaskRepository, toTimelineEvent } = root.MihwerTaskRepository || require("./task-repository");
  const state = {
    auth: "loading",
    busy: false,
    error: "",
    notice: "",
    access: null,
    journey: null,
    tasks: [],
    editing: null,
    draft: null,
    journeyDraft: "",
    period: "day",
    selectedDate: null,
    loadedToday: null
  };
  const messages = {
    ar: {
      title: "مهامك المحفوظة", intro: "تُحمّل المهام من الخادم، ويعرض المسار عناصرها مباشرة من مصدرها الأصلي.",
      loading: "جارٍ التحقق من الجلسة وتحميل المهام…", unauthenticated: "يلزم تسجيل الدخول عبر صَرح لعرض البيانات المحفوظة. لم تُعرض بيانات المثال.",
      expired: "انتهت الجلسة. سجّل الدخول مجدداً عبر صَرح.", unavailable: "خدمة الهوية أو الخلفية غير متاحة حالياً. لا تُعرض بيانات تجريبية.",
      error: "تعذر تحميل بيانات الخادم. أعد المحاولة.", retry: "إعادة المحاولة", empty: "لا توجد مهام محفوظة بعد.",
      noJourney: "لا توجد رحلة نشطة في الحساب. أنشئ رحلة أولاً لحفظ المهام.",
      createJourney: "إنشاء رحلة", journeyName: "اسم الرحلة",
      day: "اليوم", week: "الأسبوع", month: "الشهر", year: "السنة",
      previous: "السابق", next: "التالي", selectDate: "اختر التاريخ",
      add: "إضافة مهمة", name: "اسم المهمة", date: "تاريخ المهمة", estimate: "المدة المقدرة بالدقائق",
      priority: "الأولوية", priorities: ["غير محددة", "منخفضة", "عادية", "متوسطة", "عالية", "عاجلة"],
      save: "حفظ على الخادم", cancel: "إلغاء", complete: "إنجاز", reopen: "إعادة فتح", edit: "تعديل",
      archive: "أرشفة", saved: "أكد الخادم حفظ المهمة.", updated: "أكد الخادم تحديث المهمة.",
      archived: "أكد الخادم أرشفة المهمة.", saving: "جارٍ الحفظ…", conflict: "تغيرت المهمة على الخادم. حدّث القائمة ثم أعد المحاولة.",
      validation: "تحقق من الاسم والتاريخ والمدة.", timeline: "المسار الزمني · من المهام الأصلية",
      status: "حالة الاتصال", dateRequired: "اختر التاريخ.", network: "تعذر الاتصال بالخادم.",
      expiredNotice: "رفض الخادم الجلسة؛ أعد تسجيل الدخول.",
      trialNotStarted: "ابدأ تجربتك المجانية الآن. ستستمر 72 ساعة كاملة من وقت الخادم.",
      trialActive: "التجربة المجانية نشطة.", trialExpired: "انتهت التجربة. أدخل كود تفعيل لاستعادة الوصول.",
      activated: "حسابك مفعل.", suspended: "الحساب موقوف. تواصل مع الإدارة.",
      startTrial: "بدء التجربة المجانية", redeem: "تفعيل", activationCode: "كود التفعيل",
      accessError: "تعذر التحقق من صلاحية الوصول.",
      activationRejected: "الكود غير صالح أو منتهي أو بلغ حد الاستخدام."
    },
    en: {
      title: "Your saved tasks", intro: "Tasks load from the server; the timeline reads the original task records.",
      loading: "Checking session and loading tasks…", unauthenticated: "Sign in through Sarh to view saved data. Example data is hidden.",
      expired: "Your session expired. Sign in through Sarh again.", unavailable: "Identity or backend service is unavailable. Example data is hidden.",
      error: "Could not load server data. Try again.", retry: "Retry", empty: "No saved tasks yet.",
      noJourney: "There is no active journey in this account. A journey is required before creating tasks.",
      add: "Add task", name: "Task name", date: "Task date", estimate: "Estimated minutes",
      priority: "Priority", priorities: ["Unspecified", "Low", "Normal", "Medium", "High", "Urgent"],
      save: "Save to server", cancel: "Cancel", complete: "Complete", reopen: "Reopen", edit: "Edit",
      archive: "Archive", saved: "The server confirmed the task was saved.", updated: "The server confirmed the task update.",
      archived: "The server confirmed the task was archived.", saving: "Saving…", conflict: "The task changed on the server. Refresh and retry.",
      validation: "Check the name, date, and estimate.", timeline: "Timeline · derived from original tasks",
      createJourney: "Create a journey", journeyName: "Journey name",
      day: "Day", week: "Week", month: "Month", year: "Year",
      previous: "Previous", next: "Next", selectDate: "Choose date",
      status: "Connection status", dateRequired: "Choose a date.", network: "Could not reach the server.",
      expiredNotice: "The server rejected the session; sign in again.",
      trialNotStarted: "Start your free trial now. It lasts exactly 72 hours according to server time.",
      trialActive: "Your free trial is active.", trialExpired: "Your trial has ended. Enter an activation code to restore access.",
      activated: "Your account is activated.", suspended: "This account is suspended. Contact the administrator.",
      startTrial: "Start free trial", redeem: "Activate", activationCode: "Activation code",
      accessError: "Could not verify access status.",
      activationRejected: "This code is invalid, expired, disabled, or fully redeemed."
    }
  };

  let language = "ar";
  let client = createApiClient({
    onAuthStateChange(status) {
      if (status === "expired" || status === "unauthenticated" || status === "unavailable") setAuth(status);
    }
  });
  let repository = createTaskRepository(client);
  let sessionProvider = null;
  let refreshController = null;
  let actionController = null;
  let identityEpoch = 0;
  let started = false;

  function text(key) {
    return messages[language]?.[key] || messages.ar[key] || key;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function setAuth(status) {
    if (status === "expired" || status === "unauthenticated") {
      identityEpoch += 1;
      clearPrivateState();
    }
    state.auth = status;
    state.busy = status === "loading";
    notifyRender();
  }

  function notifyRender() {
    if (typeof root.render === "function") root.render();
    else if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent("mihwer:task-state"));
  }

  function clearPrivateState() {
    refreshController?.abort();
    refreshController = null;
    actionController?.abort();
    actionController = null;
    state.tasks = [];
    state.journey = null;
    state.access = null;
    state.selectedDate = null;
    state.loadedToday = null;
    state.editing = null;
    state.draft = null;
    state.journeyDraft = "";
  }

  function beginAction() {
    actionController?.abort();
    actionController = new AbortController();
    return actionController;
  }

  function finishAction(controller) {
    if (actionController === controller) actionController = null;
  }

  function configureSessionProvider(provider) {
    identityEpoch += 1;
    clearPrivateState();
    sessionProvider = provider;
    client.setSessionProvider(provider);
    if (typeof provider?.subscribe === "function") {
      provider.subscribe(session => {
        identityEpoch += 1;
        clearPrivateState();
        if (!session) {
          state.auth = "unauthenticated";
          state.busy = false;
          notifyRender();
          return;
        }
        refresh();
      });
    }
    return refresh();
  }

  function configureApiClient(options) {
    client = createApiClient(options);
    repository = createTaskRepository(client);
    sessionProvider = options?.sessionProvider || null;
    return client;
  }

  function guessSessionProvider() {
    const provider = sessionProvider || root.MihwarSession;
    return provider && typeof provider.getAccessToken === "function" ? provider : null;
  }

  async function refresh() {
    refreshController?.abort();
    const controller = new AbortController();
    refreshController = controller;
    const isCurrent = () => refreshController === controller && !controller.signal.aborted;
    state.auth = "loading";
    state.busy = true;
    state.error = "";
    state.notice = "";
    notifyRender();
    try {
      const tokenProvider = guessSessionProvider();
      if (tokenProvider) client.setSessionProvider(tokenProvider);
      let token = null;
      try {
        token = tokenProvider ? await tokenProvider.getAccessToken() : null;
      } catch {
        if (!isCurrent()) return;
        state.auth = "unavailable";
        state.error = "session_unavailable";
        return;
      }
      if (!isCurrent()) return;
      if (!token) {
        state.auth = "unauthenticated";
        state.access = null;
        state.journey = null;
        state.tasks = [];
        state.selectedDate = null;
        state.loadedToday = null;
        state.editing = null;
        state.draft = null;
        return;
      }
      const access = await client.request("access", {
        query: { action: "status" },
        signal: controller.signal
      });
      if (!isCurrent()) return;
      if (!["trial_not_started", "trial_active", "trial_expired", "activated", "suspended"].includes(access?.status)) {
        throw new ApiError("invalid_access_status", 502);
      }
      state.access = access;
      if (access.status === "trial_not_started" || access.status === "trial_expired" || access.status === "suspended") {
        state.auth = access.status;
        state.journey = null;
        state.tasks = [];
        state.selectedDate = null;
        state.loadedToday = null;
        state.editing = null;
        state.draft = null;
        return;
      }
      const journeys = await repository.listJourneys({ signal: controller.signal });
      if (!isCurrent()) return;
      const journey = journeys[0] || null;
      const selectedDate = state.selectedDate || (journey ? currentDate(journey.timeZone) : currentDate());
      const loaded = journey
        ? await loadTaskWindows(journey, selectedDate, state.period, controller.signal)
        : { tasks: [], today: null };
      if (!isCurrent()) return;
      state.journey = journey;
      state.selectedDate = selectedDate;
      state.tasks = loaded.tasks;
      state.loadedToday = loaded.today;
      state.auth = "authenticated";
    } catch (error) {
      if (!isCurrent()) return;
      state.tasks = [];
      state.journey = null;
      state.selectedDate = null;
      state.loadedToday = null;
      state.error = error instanceof ApiError ? error.code : "backend_error";
      if (error?.status === 401 || error?.code === "unauthenticated") state.auth = "expired";
      else if (error?.status === 503 || error?.code === "session_unavailable") state.auth = "unavailable";
      else state.auth = "error";
    } finally {
      if (isCurrent()) {
        state.busy = false;
        notifyRender();
      }
    }
  }

  function authView() {
    if (state.auth === "trial_not_started") {
      return `<section class="panel" role="status"><h1>${escapeHtml(text("title"))}</h1>
        <p>${escapeHtml(text("trialNotStarted"))}</p>
        ${state.error ? `<p class="backend-task-error" role="alert">${escapeHtml(text("accessError"))}</p>` : ""}
        <button class="primary" type="button" data-access-start ${state.busy ? "disabled" : ""}>${escapeHtml(text("startTrial"))}</button></section>`;
    }
    if (state.auth === "trial_expired") {
      return `<section class="panel" role="status"><h1>${escapeHtml(text("title"))}</h1>
        <p>${escapeHtml(text("trialExpired"))}</p>
        <form data-activation-form><label class="field">${escapeHtml(text("activationCode"))}
        <input name="code" autocomplete="one-time-code" maxlength="64" required></label>
        <p class="backend-task-error" role="alert">${escapeHtml(state.error ? text(state.error === "activation_code_rejected" ? "activationRejected" : "accessError") : "")}</p>
        <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>${escapeHtml(text("redeem"))}</button></form></section>`;
    }
    if (state.auth === "suspended") {
      return `<section class="panel" role="status"><h1>${escapeHtml(text("title"))}</h1><p>${escapeHtml(text("suspended"))}</p></section>`;
    }
    const key = state.auth === "loading" ? "loading" :
      state.auth === "unauthenticated" ? "unauthenticated" :
      state.auth === "expired" ? "expired" :
      state.auth === "unavailable" ? "unavailable" : "error";
    return `<section class="panel" role="status" aria-live="polite">
      <p class="eyebrow">${escapeHtml(text("status"))}</p>
      <h1>${escapeHtml(text("title"))}</h1>
      <p>${escapeHtml(text(key))}</p>
      ${state.auth === "loading" ? "" : `<button class="primary" type="button" data-backend-retry>${escapeHtml(text("retry"))}</button>`}
    </section>`;
  }

  function taskRow(task) {
    const status = task.status === "completed" ? text("reopen") : text("complete");
    return `<article class="panel backend-task" data-task-id="${escapeHtml(task.id)}">
      <h3>${escapeHtml(task.title)}</h3>
      <p class="muted">${escapeHtml(task.startDate)} · ${task.estimateMinutes ?? "—"} ${language === "ar" ? "دقيقة" : "min"}</p>
      <div class="options">
        <button class="secondary" type="button" data-task-edit="${escapeHtml(task.id)}" ${state.busy ? "disabled" : ""}>${escapeHtml(text("edit"))}</button>
        <button class="secondary" type="button" data-task-toggle="${escapeHtml(task.id)}" ${state.busy ? "disabled" : ""}>${escapeHtml(status)}</button>
        <button class="secondary" type="button" data-task-archive="${escapeHtml(task.id)}" ${state.busy ? "disabled" : ""}>${escapeHtml(text("archive"))}</button>
      </div>
    </article>`;
  }

  function formView(task = null) {
    const draft = state.draft || {
      title: task?.title || "",
      date: task?.startDate || state.selectedDate || currentDate(state.journey?.timeZone),
      estimate: task?.estimateMinutes ?? "",
      priority: task?.priority ?? 2
    };
    return `<form class="panel backend-task-form" data-backend-task-form="${task ? "edit" : "create"}" data-task-id="${escapeHtml(task?.id || "")}">
      <label class="field">${escapeHtml(text("name"))}<input name="title" maxlength="200" required value="${escapeHtml(draft.title)}"></label>
      <label class="field">${escapeHtml(text("date"))}<input name="date" type="date" required value="${escapeHtml(draft.date)}"></label>
      <label class="field">${escapeHtml(text("estimate"))}<input name="estimate" type="number" min="1" max="10080" step="1" value="${escapeHtml(draft.estimate)}"></label>
      <label class="field">${escapeHtml(text("priority"))}<select name="priority">${text("priorities").map((label, value) =>
        `<option value="${value}" ${Number(draft.priority) === value ? "selected" : ""}>${escapeHtml(label)}</option>`
      ).join("")}</select></label>
      <p class="backend-task-error" role="alert">${escapeHtml(state.error ? text(state.error === "version_conflict" ? "conflict" : state.error === "validation_failed" ? "validation" : "error") : "")}</p>
      <p class="backend-task-notice" role="status" aria-live="polite">${escapeHtml(state.notice)}</p>
      <div class="options"><button class="primary" type="submit" ${state.busy ? "disabled" : ""}>${escapeHtml(state.busy ? text("saving") : text("save"))}</button>
      <button class="secondary" type="button" data-task-cancel>${escapeHtml(text("cancel"))}</button></div>
    </form>`;
  }

  function currentDate(timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  async function loadTaskWindows(journey, date, period, signal) {
    const today = currentDate(journey.timeZone);
    const firstRecent = new Date(`${today}T00:00:00.000Z`);
    firstRecent.setUTCDate(firstRecent.getUTCDate() - 29);
    const recent = { start: firstRecent.toISOString().slice(0, 10), end: today };
    const visible = periodRange(date, period);
    const ranges = visible.start <= recent.end && recent.start <= visible.end
      ? [{ start: visible.start < recent.start ? visible.start : recent.start, end: visible.end > recent.end ? visible.end : recent.end }]
      : [visible, recent];
    const pages = await Promise.all(ranges.map(range => repository.list(journey.id, {
      fromDate: range.start, toDate: range.end, signal
    })));
    return { tasks: pages.flat(), today };
  }

  function periodRange(date, period) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") ||
        !["day", "week", "month", "year"].includes(period)) {
      throw new TypeError("invalid_period");
    }
    const first = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(first.valueOf()) || first.toISOString().slice(0, 10) !== date) {
      throw new TypeError("invalid_period_date");
    }
    const last = new Date(first);
    if (period === "week") {
      first.setUTCDate(first.getUTCDate() - 3);
      last.setUTCDate(last.getUTCDate() + 3);
    } else if (period === "month") {
      first.setUTCDate(1);
      last.setUTCMonth(last.getUTCMonth() + 1, 0);
    } else if (period === "year") {
      first.setUTCMonth(0, 1);
      last.setUTCMonth(11, 31);
    }
    return Object.freeze({ start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) });
  }

  function shiftPeriodDate(date, period, direction) {
    if (![-1, 1].includes(direction)) throw new TypeError("invalid_period_direction");
    const shifted = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(shifted.valueOf()) || shifted.toISOString().slice(0, 10) !== date) {
      throw new TypeError("invalid_period_date");
    }
    if (period === "day") shifted.setUTCDate(shifted.getUTCDate() + direction);
    else if (period === "week") shifted.setUTCDate(shifted.getUTCDate() + 7 * direction);
    else if (period === "month" || period === "year") {
      const desiredDay = shifted.getUTCDate();
      const targetMonth = shifted.getUTCMonth() + (period === "month" ? direction : direction * 12);
      shifted.setUTCDate(1);
      shifted.setUTCMonth(targetMonth);
      const lastDay = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate();
      shifted.setUTCDate(Math.min(desiredDay, lastDay));
    } else throw new TypeError("invalid_period");
    return shifted.toISOString().slice(0, 10);
  }

  function timelineEvents() {
    return state.tasks.filter(task => task.status !== "archived").map(toTimelineEvent);
  }

  function render() {
    language = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ar";
    if (state.auth !== "authenticated") return authView();
    if (!state.journey) {
      return `<section class="panel" role="status"><h1>${escapeHtml(text("title"))}</h1><p>${escapeHtml(text("noJourney"))}</p>
        <form class="backend-task-form" data-backend-journey-form><label class="field">${escapeHtml(text("journeyName"))}<input name="title" maxlength="160" required value="${escapeHtml(state.journeyDraft)}"></label>
        <p class="backend-task-error" role="alert">${escapeHtml(state.error ? text("error") : "")}</p><button class="primary" type="submit" ${state.busy ? "disabled" : ""}>${escapeHtml(text("createJourney"))}</button></form>
        <button class="secondary" type="button" data-backend-retry>${escapeHtml(text("retry"))}</button></section>`;
    }
    const selectedDate = state.selectedDate || currentDate(state.journey.timeZone);
    const range = periodRange(selectedDate, state.period);
    const visibleTasks = state.tasks.filter(task => task.startDate >= range.start && task.startDate <= range.end);
    const ordered = [...visibleTasks].sort((a, b) => a.startDate.localeCompare(b.startDate) || b.priority - a.priority || a.title.localeCompare(b.title));
    const visibleIds = new Set(visibleTasks.map(task => task.id));
    const timeline = timelineEvents().filter(event => event.status !== "archived" && visibleIds.has(event.sourceId));
    return `<div class="page-head"><div><p class="eyebrow">${escapeHtml(state.journey.title)}</p><h1>${escapeHtml(text("title"))}</h1><p class="sub">${escapeHtml(text("intro"))}</p></div></div>
      <div class="levels" aria-label="${escapeHtml(text("title"))}">${["day", "week", "month", "year"].map(period =>
        `<button type="button" data-backend-period="${period}" class="${state.period === period ? "active" : ""}" ${state.period === period ? 'aria-current="page"' : ""}>${escapeHtml(text(period))}</button>`
      ).join("")}</div>
      <section class="panel"><div class="options">
        <button class="secondary" type="button" data-backend-date-shift="-1" aria-label="${escapeHtml(text("previous"))}">‹</button>
        <label class="field">${escapeHtml(text("selectDate"))}<input type="date" data-backend-selected-date value="${escapeHtml(selectedDate)}"></label>
        <button class="secondary" type="button" data-backend-date-shift="1" aria-label="${escapeHtml(text("next"))}">›</button>
      </div></section>
      <section class="panel"><div class="options"><button class="primary" type="button" data-task-add>${escapeHtml(text("add"))}</button>
      <button class="secondary" type="button" data-backend-retry ${state.busy ? "disabled" : ""}>${escapeHtml(text("retry"))}</button></div></section>
      ${state.notice ? `<p class="backend-task-notice" role="status">${escapeHtml(state.notice)}</p>` : ""}
      ${state.error && !state.editing ? `<p class="backend-task-error" role="alert">${escapeHtml(text(state.error === "version_conflict" ? "conflict" : "error"))}</p>` : ""}
      ${state.editing ? formView(state.editing === "new" ? null : state.editing) : ""}
      <h2>${escapeHtml(text("timeline"))}</h2>
      <div class="backend-timeline">${timeline.map(event => `<article class="panel" data-timeline-source="${escapeHtml(event.id)}"><time>${escapeHtml(event.localDate)}</time> · ${escapeHtml(event.title)}</article>`).join("") || `<p class="muted">${escapeHtml(text("empty"))}</p>`}</div>
      <h2>${escapeHtml(text("title"))}</h2>
      <div class="backend-task-list">${ordered.map(taskRow).join("") || `<p class="muted">${escapeHtml(text("empty"))}</p>`}</div>`;
  }

  async function save(form) {
    if (state.busy) return;
    const epoch = identityEpoch;
    state.draft = {
      title: String(form.elements.title.value || ""),
      date: String(form.elements.date.value || ""),
      estimate: String(form.elements.estimate.value || ""),
      priority: String(form.elements.priority.value || "")
    };
    const title = state.draft.title.trim();
    const date = state.draft.date;
    const estimateValue = state.draft.estimate;
    const estimateMinutes = estimateValue ? Number(estimateValue) : null;
    const priority = Number(state.draft.priority);
    if (!title || title.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        estimateMinutes !== null && (!Number.isInteger(estimateMinutes) || estimateMinutes < 1 || estimateMinutes > 10080) ||
        !/^[0-5]$/.test(state.draft.priority)) {
      state.error = "validation_failed";
      notifyRender();
      return;
    }
    state.busy = true;
    state.error = "";
    state.notice = "";
    notifyRender();
    const controller = beginAction();
    try {
      let notice;
      if (state.editing === "new") {
        await repository.create(state.journey.id, { title, startDate: date, estimateMinutes, priority }, { signal: controller.signal });
        notice = text("saved");
      } else {
        await repository.update(state.editing, { title, startDate: date, estimateMinutes, priority }, { signal: controller.signal });
        notice = text("updated");
      }
      if (epoch !== identityEpoch) return;
      state.editing = null;
      state.draft = null;
      state.selectedDate = date;
      await refresh();
      if (epoch === identityEpoch && state.auth === "authenticated") state.notice = notice;
    } catch (error) {
      if (epoch !== identityEpoch) return;
      state.error = error instanceof ApiError ? error.code : error.message || "backend_error";
    } finally {
      finishAction(controller);
      if (epoch === identityEpoch) {
        state.busy = false;
        notifyRender();
      }
    }
  }

  async function changeStatus(id, status) {
    const task = state.tasks.find(item => item.id === id);
    if (!task) return;
    const epoch = identityEpoch;
    state.busy = true;
    state.error = "";
    state.notice = "";
    notifyRender();
    const controller = beginAction();
    try {
      await repository.update(task, { status }, { signal: controller.signal });
      if (epoch !== identityEpoch) return;
      await refresh();
      if (epoch === identityEpoch && state.auth === "authenticated") {
        state.notice = text(status === "archived" ? "archived" : "updated");
      }
    } catch (error) {
      if (epoch !== identityEpoch) return;
      state.error = error instanceof ApiError ? error.code : error.message || "backend_error";
    } finally {
      finishAction(controller);
      if (epoch === identityEpoch) {
        state.busy = false;
        notifyRender();
      }
    }
  }

  function bind() {
    if (typeof document === "undefined") return;
    document.addEventListener("submit", event => {
      const activationForm = event.target.closest("[data-activation-form]");
      if (activationForm) {
        event.preventDefault();
        if (state.busy) return;
        const code = String(activationForm.elements.code.value || "").trim();
        if (!code) return;
        state.busy = true;
        state.error = "";
        notifyRender();
        const epoch = identityEpoch;
        const controller = beginAction();
        client.request("access", { method: "POST", query: { action: "redeem" }, body: { code }, signal: controller.signal })
          .then(() => epoch === identityEpoch ? refresh() : null)
          .catch(error => {
            if (epoch !== identityEpoch) return;
            state.error = error instanceof ApiError ? error.code : "access_request_failed";
          })
          .finally(() => {
            finishAction(controller);
            if (epoch === identityEpoch) {
              state.busy = false;
              notifyRender();
            }
          });
        return;
      }
      const form = event.target.closest("[data-backend-task-form]");
      if (form) {
        event.preventDefault();
        if (!state.busy) save(form);
        return;
      }
      const journeyForm = event.target.closest("[data-backend-journey-form]");
      if (!journeyForm) return;
      event.preventDefault();
      if (state.busy) return;
      state.journeyDraft = String(journeyForm.elements.title.value || "");
      const title = state.journeyDraft.trim();
      if (!title || title.length > 160) {
        journeyForm.querySelector(".backend-task-error").textContent = text("validation");
        return;
      }
      state.busy = true;
      state.error = "";
      notifyRender();
      const epoch = identityEpoch;
      const controller = beginAction();
      repository.createJourney(title, { signal: controller.signal }).then(async journey => {
        if (epoch !== identityEpoch) return;
        state.journeyDraft = "";
        state.selectedDate = currentDate(journey.timeZone);
        await refresh();
        if (epoch === identityEpoch && state.auth === "authenticated") state.notice = text("saved");
      }).catch(error => {
        if (epoch !== identityEpoch) return;
        state.error = error instanceof ApiError ? error.code : error.message || "backend_error";
      }).finally(() => {
        finishAction(controller);
        if (epoch === identityEpoch) {
          state.busy = false;
          notifyRender();
        }
      });
    });
    document.addEventListener("click", event => {
      const target = event.target.closest("[data-backend-retry],[data-access-start],[data-task-add],[data-task-cancel],[data-task-edit],[data-task-toggle],[data-task-archive],[data-backend-period],[data-backend-date-shift]");
      if (!target) return;
      if (state.busy) return;
      if (target.matches("[data-access-start]")) {
        state.busy = true;
        state.error = "";
        notifyRender();
        const epoch = identityEpoch;
        const controller = beginAction();
        client.request("access", { method: "POST", query: { action: "start" }, body: {}, signal: controller.signal })
          .then(() => epoch === identityEpoch ? refresh() : null)
          .catch(error => {
            if (epoch !== identityEpoch) return;
            state.error = error instanceof ApiError ? error.code : "access_request_failed";
          })
          .finally(() => {
            finishAction(controller);
            if (epoch === identityEpoch) {
              state.busy = false;
              notifyRender();
            }
          });
        return;
      }
      if (target.matches("[data-backend-period]")) {
        state.period = target.dataset.backendPeriod;
        refresh();
        return;
      }
      if (target.matches("[data-backend-date-shift]")) {
        state.selectedDate = shiftPeriodDate(state.selectedDate, state.period, Number(target.dataset.backendDateShift));
        refresh();
        return;
      }
      if (target.matches("[data-backend-retry]")) { refresh(); return; }
      if (target.matches("[data-task-add]")) { state.editing = "new"; state.draft = null; state.error = ""; state.notice = ""; notifyRender(); return; }
      if (target.matches("[data-task-cancel]")) { state.editing = null; state.draft = null; state.error = ""; state.notice = ""; notifyRender(); return; }
      if (target.matches("[data-task-edit]")) {
        const id = target.dataset.taskEdit;
        state.busy = true;
        state.error = "";
        notifyRender();
        const epoch = identityEpoch;
        const controller = beginAction();
        repository.getById(id, { signal: controller.signal }).then(task => {
          if (epoch !== identityEpoch) return;
          if (!task) throw new Error("task_not_found");
          state.editing = task;
          state.draft = null;
        }).catch(error => {
          if (epoch !== identityEpoch) return;
          state.error = error instanceof ApiError ? error.code : error.message || "backend_error";
        }).finally(() => {
          finishAction(controller);
          if (epoch === identityEpoch) {
            state.busy = false;
            notifyRender();
          }
        });
        return;
      }
      const id = target.dataset.taskToggle || target.dataset.taskArchive;
      if (target.matches("[data-task-toggle]")) {
        const task = state.tasks.find(item => item.id === id);
        changeStatus(id, task?.status === "completed" ? "active" : "completed");
      } else if (target.matches("[data-task-archive]")) changeStatus(id, "archived");
    });
    document.addEventListener("change", event => {
      if (!event.target.matches("[data-backend-selected-date]") || !event.target.value) return;
      try {
        periodRange(event.target.value, state.period);
        state.selectedDate = event.target.value;
        refresh();
      } catch {
        state.error = "validation_failed";
        notifyRender();
      }
    });
    document.addEventListener("input", event => {
      const journeyForm = event.target.closest("[data-backend-journey-form]");
      if (journeyForm) {
        state.journeyDraft = journeyForm.elements.title.value;
        return;
      }
      const form = event.target.closest("[data-backend-task-form]");
      if (!form) return;
      state.draft = {
        title: form.elements.title.value,
        date: form.elements.date.value,
        estimate: form.elements.estimate.value,
        priority: form.elements.priority.value
      };
    });
  }

  async function start() {
    if (started) return refresh();
    started = true;
    bind();
    if (typeof document !== "undefined") {
      const refreshAtDateChange = () => {
        if (document.hidden || state.auth !== "authenticated" || state.busy || state.editing || !state.journey || !state.loadedToday) return;
        const today = currentDate(state.journey.timeZone);
        if (today === state.loadedToday) return;
        if (state.selectedDate === state.loadedToday) state.selectedDate = today;
        refresh();
      };
      document.addEventListener("visibilitychange", refreshAtDateChange);
      root.setInterval(refreshAtDateChange, 60_000);
    }
    const sessionProvider = guessSessionProvider();
    if (sessionProvider) return configureSessionProvider(sessionProvider);
    state.auth = "unauthenticated";
    state.busy = false;
    notifyRender();
    return null;
  }

  function isBlocking() {
    return state.auth !== "authenticated";
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { start(); }, { once: true });
    else queueMicrotask(() => { start(); });
  }

  return Object.freeze({
    state,
    render,
    refresh,
    start,
    setSessionProvider: configureSessionProvider,
    setApiClient: configureApiClient,
    isBlocking,
    timelineEvents,
    periodRange,
    shiftPeriodDate,
    authView
  });
});
