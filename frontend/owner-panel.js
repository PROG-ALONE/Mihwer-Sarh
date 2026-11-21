"use strict";

(function attachMihwerOwnerPanel(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MihwerOwnerPanel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (root) => {
  const COPY = {
    ar: {
      title: "لوحة المالك", subtitle: "تُعرض فقط بعد تحقق الخادم من صلاحية المالك.", loading: "جارٍ التحقق…",
      failed: "تعذر تنفيذ الطلب. أعد المحاولة.", retry: "إعادة المحاولة", overview: "حالة الوصول",
      trial_not_started: "لم تبدأ", trial_active: "تجربة نشطة", trial_expired: "تجربة منتهية", activated: "مفعّل", suspended: "معلّق",
      codes: "أكواد التفعيل", issueCode: "إصدار كود", days: "مدة التفعيل (أيام)", maxUses: "عدد مرات الاستخدام",
      validUntil: "صالح حتى", newCode: "انسخ الكود الآن، فلن يظهر مرة أخرى:", disable: "إبطال",
      active: "نشط", disabled: "مُبطل", expired: "منتهٍ", exhausted: "مستنفد", uses: "الاستخدام",
      discounts: "أكواد الخصم", issueDiscount: "إصدار كود خصم", label: "الوصف", kind: "النوع", percent: "نسبة %",
      fixed: "مبلغ ثابت", amount: "القيمة", currency: "العملة", endsAt: "ينتهي في", perUser: "لكل مستخدم",
      users: "إدارة الوصول", userId: "معرّف المستخدم", grant: "منح أيام", suspend: "تعليق", unsuspend: "رفع التعليق",
      redemptions: "سجل الاسترداد", audit: "سجل العمليات الإدارية", empty: "لا توجد سجلات.", saved: "تم الحفظ على الخادم.",
      owner_required: "هذه العملية للمالك فقط.", invalid_admin_input: "تحقق من القيم المدخلة.", cannot_suspend_self: "لا يمكن تعليق حساب المالك."
    },
    en: {
      title: "Owner console", subtitle: "Shown only after the server verifies owner rights.", loading: "Verifying…",
      failed: "The request failed. Try again.", retry: "Retry", overview: "Access status",
      trial_not_started: "Not started", trial_active: "Trial active", trial_expired: "Trial ended", activated: "Activated", suspended: "Suspended",
      codes: "Activation codes", issueCode: "Issue code", days: "Activation days", maxUses: "Maximum uses",
      validUntil: "Valid until", newCode: "Copy this code now. It will not be shown again:", disable: "Disable",
      active: "Active", disabled: "Disabled", expired: "Expired", exhausted: "Exhausted", uses: "Uses",
      discounts: "Discount codes", issueDiscount: "Issue discount", label: "Label", kind: "Type", percent: "Percent %",
      fixed: "Fixed amount", amount: "Amount", currency: "Currency", endsAt: "Ends at", perUser: "Per user",
      users: "Access management", userId: "User ID", grant: "Grant days", suspend: "Suspend", unsuspend: "Lift suspension",
      redemptions: "Redemption log", audit: "Admin audit log", empty: "No records.", saved: "Saved on the server.",
      owner_required: "Owner only.", invalid_admin_input: "Check the entered values.", cannot_suspend_self: "The owner account cannot be suspended."
    }
  };
  const ERROR_KEYS = new Set(["owner_required", "invalid_admin_input", "cannot_suspend_self"]);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function shortId(id) {
    return typeof id === "string" ? `${id.slice(0, 8)}…` : "";
  }

  function createOwnerPanel({ client, locale = () => "ar" }) {
    const state = { phase: "idle", isOwner: false, data: null, oneTimeCode: null, message: "", error: "" };
    const t = (key) => (COPY[locale() === "en" ? "en" : "ar"][key] ?? key);
    const date = (value) => {
      if (!value) return "—";
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString(locale() === "en" ? "en-GB" : "ar-SA-u-ca-gregory");
    };

    async function call(action, { method = "GET", body, query = {} } = {}) {
      return client.request("access", { method, query: { action, ...query }, body });
    }

    async function load() {
      state.phase = "loading";
      state.error = "";
      try {
        const status = await call("admin-status");
        state.isOwner = status?.is_owner === true;
        if (!state.isOwner) {
          state.data = null;
          state.phase = "hidden";
          return state;
        }
        const [overview, codes, discounts, redemptions, audit] = await Promise.all([
          call("admin-overview", { query: { limit: 200 } }),
          call("admin-codes", { query: { limit: 50 } }),
          call("admin-discounts", { query: { limit: 50 } }),
          call("admin-redemptions", { query: { limit: 30 } }),
          call("admin-audit", { query: { limit: 30 } })
        ]);
        state.data = {
          overview: Array.isArray(overview) ? overview : [],
          codes: Array.isArray(codes) ? codes : [],
          discounts: Array.isArray(discounts) ? discounts : [],
          redemptions: Array.isArray(redemptions) ? redemptions : [],
          audit: Array.isArray(audit) ? audit : []
        };
        state.phase = "ready";
      } catch (error) {
        state.isOwner = false;
        state.data = null;
        state.phase = error?.status === 403 || error?.status === 401 || error?.status === 503 ? "hidden" : "error";
      }
      return state;
    }

    async function perform(action, body) {
      state.message = "";
      state.error = "";
      try {
        const result = await call(action, { method: "POST", body });
        state.oneTimeCode = typeof result?.code === "string" ? result.code : null;
        state.message = t("saved");
        await load();
      } catch (error) {
        state.oneTimeCode = null;
        state.error = ERROR_KEYS.has(error?.code) ? error.code : "failed";
      }
      return state;
    }

    function overviewCounts() {
      const counts = { trial_not_started: 0, trial_active: 0, trial_expired: 0, activated: 0, suspended: 0 };
      for (const row of state.data.overview) if (Object.hasOwn(counts, row.status)) counts[row.status] += 1;
      return counts;
    }

    function list(rows, renderRow) {
      return rows.length ? `<ul class="owner-list">${rows.map(renderRow).join("")}</ul>` : `<p class="muted">${escapeHtml(t("empty"))}</p>`;
    }

    function render() {
      if (state.phase === "hidden" || state.phase === "idle") return "";
      if (state.phase === "loading" && !state.data) return `<section class="owner-panel" data-owner-panel aria-busy="true"><p class="muted">${escapeHtml(t("loading"))}</p></section>`;
      if (state.phase === "error") {
        return `<section class="owner-panel" data-owner-panel><p role="alert">${escapeHtml(t("failed"))}</p><button type="button" class="secondary" data-owner-retry>${escapeHtml(t("retry"))}</button></section>`;
      }
      const counts = overviewCounts();
      const d = state.data;
      return `<section class="owner-panel" data-owner-panel aria-labelledby="owner-panel-title">
        <h3 id="owner-panel-title">${escapeHtml(t("title"))}</h3><p class="muted">${escapeHtml(t("subtitle"))}</p>
        <p role="status" aria-live="polite" data-owner-message>${escapeHtml(state.error ? t(state.error) : state.message)}</p>
        ${state.oneTimeCode ? `<div class="owner-code-once"><span>${escapeHtml(t("newCode"))}</span><output dir="ltr" data-owner-code>${escapeHtml(state.oneTimeCode)}</output></div>` : ""}
        <div class="owner-stats">${Object.entries(counts).map(([key, value]) => `<div class="summary-card"><small>${escapeHtml(t(key))}</small><strong>${value}</strong></div>`).join("")}</div>
        <details open><summary>${escapeHtml(t("codes"))}</summary>
          <form data-owner-form="admin-issue-code" class="owner-form">
            <label class="field">${escapeHtml(t("days"))}<input name="duration_days" type="number" min="1" max="3650" value="30" required></label>
            <label class="field">${escapeHtml(t("maxUses"))}<input name="max_uses" type="number" min="1" max="100000" value="1" required></label>
            <label class="field">${escapeHtml(t("validUntil"))}<input name="valid_until" type="date"></label>
            <button class="primary" type="submit">${escapeHtml(t("issueCode"))}</button></form>
          ${list(d.codes, (c) => `<li><span>${escapeHtml(t(c.status))}</span><span>${escapeHtml(c.duration_days)}d</span><span>${escapeHtml(t("uses"))} ${escapeHtml(c.use_count)}/${escapeHtml(c.max_uses)}</span><span>${escapeHtml(date(c.valid_until))}</span>${c.status === "active" ? `<button type="button" class="secondary" data-owner-action="admin-disable-code" data-owner-id="${escapeHtml(c.id)}">${escapeHtml(t("disable"))}</button>` : ""}</li>`)}
        </details>
        <details><summary>${escapeHtml(t("discounts"))}</summary>
          <form data-owner-form="admin-issue-discount" class="owner-form">
            <label class="field">${escapeHtml(t("label"))}<input name="label" maxlength="80" required></label>
            <label class="field">${escapeHtml(t("kind"))}<select name="kind"><option value="percent">${escapeHtml(t("percent"))}</option><option value="fixed">${escapeHtml(t("fixed"))}</option></select></label>
            <label class="field">${escapeHtml(t("amount"))}<input name="amount" type="number" min="0.01" step="0.01" required></label>
            <label class="field">${escapeHtml(t("currency"))}<input name="currency" maxlength="3" placeholder="SAR" dir="ltr"></label>
            <label class="field">${escapeHtml(t("endsAt"))}<input name="ends_at" type="date"></label>
            <label class="field">${escapeHtml(t("maxUses"))}<input name="max_uses" type="number" min="1" value="100" required></label>
            <label class="field">${escapeHtml(t("perUser"))}<input name="per_user_limit" type="number" min="1" max="100" value="1"></label>
            <button class="primary" type="submit">${escapeHtml(t("issueDiscount"))}</button></form>
          ${list(d.discounts, (c) => `<li><span>${escapeHtml(c.label)}</span><span dir="ltr">${escapeHtml(c.amount)}${c.discount_kind === "percent" ? "%" : ` ${escapeHtml(c.currency)}`}</span><span>${escapeHtml(t(c.status))}</span><span>${escapeHtml(t("uses"))} ${escapeHtml(c.use_count)}/${escapeHtml(c.max_uses)}</span>${c.status === "active" ? `<button type="button" class="secondary" data-owner-action="admin-disable-discount" data-owner-id="${escapeHtml(c.id)}">${escapeHtml(t("disable"))}</button>` : ""}</li>`)}
        </details>
        <details><summary>${escapeHtml(t("users"))}</summary>
          <form data-owner-form="admin-grant" class="owner-form">
            <label class="field">${escapeHtml(t("userId"))}<input name="user_id" dir="ltr" required pattern="[0-9a-fA-F-]{36}"></label>
            <label class="field">${escapeHtml(t("days"))}<input name="days" type="number" min="1" max="3650" value="30" required></label>
            <button class="primary" type="submit">${escapeHtml(t("grant"))}</button></form>
          ${list(d.overview, (u) => `<li><span dir="ltr">${escapeHtml(shortId(u.owner_id))}</span><span>${escapeHtml(t(u.status))}</span><span>${escapeHtml(date(u.activated_until))}</span><button type="button" class="secondary" data-owner-action="admin-suspend" data-owner-id="${escapeHtml(u.owner_id)}" data-owner-suspend="${u.status === "suspended" ? "false" : "true"}">${escapeHtml(t(u.status === "suspended" ? "unsuspend" : "suspend"))}</button></li>`)}
        </details>
        <details><summary>${escapeHtml(t("redemptions"))}</summary>
          ${list(d.redemptions, (r) => `<li><span dir="ltr">${escapeHtml(shortId(r.owner_id))}</span><span>${escapeHtml(date(r.redeemed_at))}</span><span>${escapeHtml(date(r.activation_expires_at))}</span></li>`)}
        </details>
        <details><summary>${escapeHtml(t("audit"))}</summary>
          ${list(d.audit, (a) => `<li><span dir="ltr">${escapeHtml(a.action)}</span><span dir="ltr">${escapeHtml(shortId(a.target_id))}</span><span>${escapeHtml(date(a.occurred_at))}</span></li>`)}
        </details>
      </section>`;
    }

    function formBody(action, form) {
      const values = Object.fromEntries(new FormData(form).entries());
      const integer = (value) => (value === "" || value == null ? undefined : Number(value));
      const endOfDay = (value) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);
      if (action === "admin-issue-code") {
        return { duration_days: integer(values.duration_days), max_uses: integer(values.max_uses), valid_until: endOfDay(values.valid_until) };
      }
      if (action === "admin-issue-discount") {
        return {
          label: values.label, kind: values.kind, amount: Number(values.amount), currency: values.currency || null,
          ends_at: endOfDay(values.ends_at), max_uses: integer(values.max_uses), per_user_limit: integer(values.per_user_limit)
        };
      }
      if (action === "admin-grant") return { user_id: String(values.user_id || "").trim(), days: integer(values.days) };
      return null;
    }

    function mount(container) {
      if (!container || typeof container.querySelector !== "function") return Promise.resolve(state);
      let host = container.querySelector("[data-owner-panel-host]");
      if (!host) {
        host = container.ownerDocument.createElement("div");
        host.setAttribute("data-owner-panel-host", "");
        container.append(host);
      }
      const paint = () => { if (host.isConnected) host.innerHTML = render(); };
      if (!host.dataset.bound) {
        host.dataset.bound = "true";
        host.addEventListener("submit", async (event) => {
          const form = event.target.closest("[data-owner-form]");
          if (!form) return;
          event.preventDefault();
          const body = formBody(form.dataset.ownerForm, form);
          if (!body) return;
          if (body.user_id !== undefined && !UUID.test(body.user_id)) {
            state.error = "invalid_admin_input";
            paint();
            return;
          }
          await perform(form.dataset.ownerForm, body);
          paint();
        });
        host.addEventListener("click", async (event) => {
          if (event.target.closest("[data-owner-retry]")) { paint(); await load(); paint(); return; }
          const button = event.target.closest("[data-owner-action]");
          if (!button) return;
          const action = button.dataset.ownerAction;
          const id = button.dataset.ownerId;
          const body = action === "admin-suspend" ? { user_id: id, suspended: button.dataset.ownerSuspend === "true" } : { code_id: id };
          button.disabled = true;
          await perform(action, body);
          paint();
        });
      }
      state.oneTimeCode = null;
      state.message = "";
      paint();
      return load().then(() => { paint(); return state; });
    }

    return Object.freeze({ state, load, perform, render, mount });
  }

  let defaultPanel = null;
  function mountDefault(container, language) {
    const apiModule = root.MihwerApiClient;
    const session = root.MihwarSession;
    if (!apiModule || !session || typeof session.getAccessToken !== "function") return Promise.resolve(null);
    if (!defaultPanel) {
      const client = apiModule.createApiClient({ sessionProvider: session, maxGetRetries: 0 });
      let current = language;
      defaultPanel = { panel: createOwnerPanel({ client, locale: () => current }), setLocale: (value) => { current = value; } };
    }
    defaultPanel.setLocale(language);
    return defaultPanel.panel.mount(container);
  }

  return Object.freeze({ createOwnerPanel, mount: mountDefault, escapeHtml });
});
