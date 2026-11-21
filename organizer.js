"use strict";

const organizerLabels={
  title:["المشتريات والاشتراكات","Shopping and subscriptions"],
  subtitle:["قوائم شخصية بسيطة؛ لا مدفوعات ولا ربط بحسابات مالية.","Simple personal lists; no payments or financial account connections."],
  openOrganizer:["المشتريات والاشتراكات","Shopping and subscriptions"],
  back:["العودة إلى المهام والعادات","Back to tasks and habits"],
  purchases:["قائمة المشتريات","Shopping list"],
  purchaseTab:["المشتريات","Purchases"],
  subscriptions:["الاشتراكات","Subscriptions"],
  itemName:["اسم العنصر","Item name"],
  addPurchase:["إضافة للقائمة","Add to list"],
  amount:["السعر","Price"],
  currency:["العملة","Currency"],
  currencyHint:["تُسجّل قيمة الاشتراك بالدولار، ويظهر تقدير بالعملة المحلية حسب منطقة الجهاز.","Subscriptions are entered in USD; an estimate in the device region's currency is shown."],
  localEquivalent:["تقريباً","Approx."],
  localCurrencyLoading:["جارٍ جلب العملة المحلية وسعر الصرف…","Fetching local currency and exchange rate…"],
  localCurrencyUnavailable:["تعذر جلب سعر الصرف؛ تحقق من الاتصال بالإنترنت.","Could not fetch the exchange rate; check your internet connection."],
  renewal:["التجديد القادم","Next renewal"],
  cadence:["التكرار","Frequency"],
  monthly:["شهري","Monthly"],
  yearly:["سنوي","Yearly"],
  addSubscription:["إضافة اشتراك","Add subscription"],
  updateSubscription:["حفظ التعديلات","Save changes"],
  editSubscription:["تعديل","Edit"],
  cancel:["إلغاء","Cancel"],
  emptyPurchases:["قائمة المشتريات فارغة؛ أضف ما تحتاجه.","Your shopping list is empty; add what you need."],
  emptySubscriptions:["لا توجد اشتراكات مسجلة.","No subscriptions recorded."],
  purchaseCount:["عنصر في القائمة","items on the list"],
  subscriptionCount:["اشتراك مسجل","subscriptions tracked"],
  temporary:["هذه البيانات تجريبية وتبقى في ذاكرة الصفحة حتى تحديثها.","This is a prototype; data stays in page memory until refresh."],
  invalid:["تحقق من الاسم والسعر والعملة وتاريخ التجديد.","Check the name, price, currency and renewal date."]
};
const organizerText=key=>organizerLabels[key][language==="ar"?0:1];
const organizerState={purchases:[],subscriptions:[]};
globalThis.MihwerOrganizer=organizerState;
let organizerNextId=0;
let editingOrganizerSubscription=null;
let organizerTab="purchases";
const organizerId=()=>`organizer-${++organizerNextId}`;
let organizerLocalRatePromise=null;
function organizerSubscriptionForm(item={},editing=false){
  const formId=editing?`data-organizer-subscription-edit="${esc(item.id)}"`:"data-organizer-add-subscription";
  return `<form ${formId} class="organizer-form organizer-subscription-form"><label class="field">${organizerText("itemName")}<input name="name" maxlength="100" value="${esc(item.name||"")}" required></label><div class="organizer-form-row"><label class="field">${organizerText("amount")}<input name="amount" type="number" min="0" step="0.01" inputmode="decimal" value="${item.amount??""}" required></label><label class="field">${organizerText("currency")}<input name="currency" maxlength="12" value="${esc(item.currency||"USD")}" required></label></div><small class="organizer-currency-hint">${organizerText("currencyHint")}</small><div class="organizer-form-row"><label class="field">${organizerText("renewal")}<input name="renewal" type="date" value="${esc(item.renewal||selectedDate)}" required></label><label class="field">${organizerText("cadence")}<select name="cadence"><option value="monthly" ${item.cadence==="yearly"?"":"selected"}>${organizerText("monthly")}</option><option value="yearly" ${item.cadence==="yearly"?"selected":""}>${organizerText("yearly")}</option></select></label></div><p class="organizer-error" role="alert"></p><div class="options"><button class="primary" type="submit">${organizerText(editing?"updateSubscription":"addSubscription")}</button>${editing?`<button class="secondary" type="button" data-organizer-cancel-edit>${organizerText("cancel")}</button>`:""}</div></form>`;
}
async function organizerLocalCurrencyRate(){
  if(organizerLocalRatePromise)return organizerLocalRatePromise;
  organizerLocalRatePromise=(async()=>{
    const region=new Intl.Locale(navigator.language).region;
    if(!region)throw new Error("No region is available in the device language settings.");
    const countryResponse=await fetch(`https://countries.nexperts.nl/${encodeURIComponent(region)}`);
    if(!countryResponse.ok)throw new Error(`Country currency request failed with status ${countryResponse.status}.`);
    const countryData=await countryResponse.json(),country=Array.isArray(countryData)?countryData[0]:null;
    const currency=Object.keys(country?.currencies||{})[0];
    if(!currency)throw new Error("No local currency was returned for the device region.");
    if(currency==="USD")return {currency,rate:1,date:null};
    const rateResponse=await fetch(`https://api.frankfurter.dev/v2/rate/usd/${encodeURIComponent(currency.toLowerCase())}`);
    if(!rateResponse.ok)throw new Error(`Exchange-rate request failed with status ${rateResponse.status}.`);
    const rateData=await rateResponse.json(),rate=rateData.rate;
    if(!Number.isFinite(rate)||rate<=0)throw new Error("No valid USD exchange rate was returned.");
    return {currency,rate,date:rateData.date||null};
  })().catch(error=>{organizerLocalRatePromise=null;throw error;});
  return organizerLocalRatePromise;
}
function updateOrganizerLocalConversions(){
  const conversions=[...document.querySelectorAll("[data-organizer-local-conversion]")];
  if(!conversions.length)return;
  conversions.forEach(node=>{node.textContent=organizerText("localCurrencyLoading");});
  organizerLocalCurrencyRate().then(({currency,rate,date})=>{
    conversions.forEach(node=>{
      if(!node.isConnected)return;
      const amount=Number(node.dataset.amount);
      if(!Number.isFinite(amount)){node.textContent=organizerText("localCurrencyUnavailable");return;}
      const formatted=new Intl.NumberFormat(language==="ar"?"ar-SA":"en-US",{style:"currency",currency,maximumFractionDigits:2}).format(amount*rate);
      node.textContent=`${organizerText("localEquivalent")} ${formatted}${date?` · ${date}`:""}`;
    });
  }).catch(error=>{
    console.warn("Local subscription currency conversion is unavailable:",error);
    conversions.forEach(node=>{if(node.isConnected)node.textContent=organizerText("localCurrencyUnavailable");});
  });
}
function organizerView(){
  const purchaseRows=organizerState.purchases.map(item=>`<li class="organizer-row ${item.checked?"is-checked":""}"><button type="button" class="organizer-check" data-organizer-purchase="${esc(item.id)}" aria-pressed="${item.checked}" aria-label="${item.checked?"✓ ":""}${esc(item.name)}">${item.checked?"✓":""}</button><span>${esc(item.name)}</span></li>`).join("");
  const subscriptionRows=organizerState.subscriptions.map(item=>`<li class="organizer-subscription ${editingOrganizerSubscription===item.id?"is-editing":""}"><div><strong>${esc(item.name)}</strong><small>${esc(item.amount)} ${esc(item.currency)} · ${organizerText("renewal")}: <bdi dir="ltr">${esc(item.renewal)}</bdi> · ${organizerText(item.cadence==="yearly"?"yearly":"monthly")}</small>${item.currency.trim().toUpperCase()==="USD"?`<small class="organizer-local-conversion" data-organizer-local-conversion data-amount="${esc(item.amount)}" role="status">${organizerText("localCurrencyLoading")}</small>`:""}</div>${editingOrganizerSubscription===item.id?organizerSubscriptionForm(item,true):`<button type="button" class="secondary" data-organizer-edit="${esc(item.id)}">${organizerText("editSubscription")}</button>`}</li>`).join("");
  const purchaseCount=organizerState.purchases.filter(item=>!item.checked).length;
  const subscriptionCount=organizerState.subscriptions.length;
  const purchaseIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.4L21 8H5.2"/><circle cx="9" cy="19" r="1"/><circle cx="17" cy="19" r="1"/></svg>`;
  const subscriptionIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`;
  const view=`<div class="paths-page organizer-page">${header("organizerTitle","organizerSubtitle")}<section class="panel organizer-panel">
    <p class="muted">${organizerText("subtitle")}</p>
    <div class="organizer-tabs" role="tablist" aria-label="${organizerText("title")}">
      <button type="button" id="organizer-tab-purchases" role="tab" aria-controls="organizer-panel-purchases" aria-selected="${organizerTab==="purchases"}" tabindex="${organizerTab==="purchases"?"0":"-1"}" data-organizer-tab="purchases">${purchaseIcon}<span>${organizerText("purchaseTab")}</span><b>${purchaseCount}</b></button>
      <button type="button" id="organizer-tab-subscriptions" role="tab" aria-controls="organizer-panel-subscriptions" aria-selected="${organizerTab==="subscriptions"}" tabindex="${organizerTab==="subscriptions"?"0":"-1"}" data-organizer-tab="subscriptions">${subscriptionIcon}<span>${organizerText("subscriptions")}</span><b>${subscriptionCount}</b></button>
    </div>
    <div class="organizer-sections">
      <section class="organizer-section organizer-purchases" id="organizer-panel-purchases" role="tabpanel" aria-labelledby="organizer-tab-purchases" ${organizerTab==="purchases"?"":"hidden"}>
        <div class="organizer-section-head"><div><span class="organizer-icon" aria-hidden="true">${purchaseIcon}</span><h2>${organizerText("purchases")}</h2></div><span class="activity-count">${purchaseCount} ${organizerText("purchaseCount")}</span></div>
        <form data-organizer-add-purchase class="organizer-form"><label class="field">${organizerText("itemName")}<input name="name" maxlength="100" required></label><p class="organizer-error" role="alert"></p><button class="primary" type="submit">${organizerText("addPurchase")}</button></form>
        <ul class="organizer-list">${purchaseRows||`<li class="organizer-empty">${organizerText("emptyPurchases")}</li>`}</ul>
      </section>
      <section class="organizer-section organizer-subscriptions" id="organizer-panel-subscriptions" role="tabpanel" aria-labelledby="organizer-tab-subscriptions" ${organizerTab==="subscriptions"?"":"hidden"}>
        <div class="organizer-section-head"><div><span class="organizer-icon" aria-hidden="true">${subscriptionIcon}</span><h2>${organizerText("subscriptions")}</h2></div><span class="activity-count">${subscriptionCount} ${organizerText("subscriptionCount")}</span></div>
        ${organizerSubscriptionForm()}<ul class="organizer-list organizer-subscription-list">${subscriptionRows||`<li class="organizer-empty">${organizerText("emptySubscriptions")}</li>`}</ul>
      </section>
    </div>
    <div class="organizer-footer"><small>${organizerText("temporary")}</small></div>
  </section></div>`;
  queueMicrotask(updateOrganizerLocalConversions);
  return view;
}
document.addEventListener("submit",event=>{
  const purchaseForm=event.target.closest("[data-organizer-add-purchase]");
  if(purchaseForm){
    event.preventDefault();
    const name=new FormData(purchaseForm).get("name").toString().trim();
    if(!name){purchaseForm.querySelector(".organizer-error").textContent=organizerText("invalid");return;}
    organizerState.purchases.push({id:organizerId(),name,checked:false});
    globalThis.MihwerSystemLog?.record("shopping","added",name);
    render();return;
  }
  const subscriptionForm=event.target.closest("[data-organizer-add-subscription],[data-organizer-subscription-edit]");
  if(!subscriptionForm)return;
  event.preventDefault();
  const values=new FormData(subscriptionForm),name=values.get("name").toString().trim(),amount=Number(values.get("amount")),currency=values.get("currency").toString().trim(),renewal=values.get("renewal").toString(),cadence=values.get("cadence").toString();
  const parsedDate=new Date(`${renewal}T12:00:00Z`);
  if(!name||!Number.isFinite(amount)||amount<0||!currency||!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==renewal||!["monthly","yearly"].includes(cadence)){subscriptionForm.querySelector(".organizer-error").textContent=organizerText("invalid");return;}
  const subscription={name,amount,currency,renewal,cadence};
  if(subscriptionForm.dataset.organizerSubscriptionEdit){
    const existing=organizerState.subscriptions.find(item=>item.id===subscriptionForm.dataset.organizerSubscriptionEdit);
    if(!existing)return;
    Object.assign(existing,subscription);
    globalThis.MihwerSystemLog?.record("subscriptions","updated",name);
    editingOrganizerSubscription=null;
  }else{
    organizerState.subscriptions.push({id:organizerId(),...subscription});
    globalThis.MihwerSystemLog?.record("subscriptions","added",name);
  }
  render();
});
document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-organizer-tab]");
  if(tab){organizerTab=tab.dataset.organizerTab;render();return;}
  const purchase=event.target.closest("[data-organizer-purchase]");
  if(purchase){
    const item=organizerState.purchases.find(entry=>entry.id===purchase.dataset.organizerPurchase);
    if(item){item.checked=!item.checked;globalThis.MihwerSystemLog?.record("shopping",item.checked?"completed":"reopened",item.name);render();}
    return;
  }
  const edit=event.target.closest("[data-organizer-edit]");
  if(edit){editingOrganizerSubscription=edit.dataset.organizerEdit;render();return;}
  if(event.target.closest("[data-organizer-cancel-edit]")){editingOrganizerSubscription=null;render();}
});
document.addEventListener("keydown",event=>{
  const activeTab=event.target.closest("[data-organizer-tab]");
  if(!activeTab)return;
  const tabs=[...document.querySelectorAll(".organizer-tabs [data-organizer-tab]")];
  const index=tabs.indexOf(activeTab);
  const forwardKey=language==="ar"?"ArrowLeft":"ArrowRight";
  const backwardKey=language==="ar"?"ArrowRight":"ArrowLeft";
  const nextIndex=event.key==="Home"?0:event.key==="End"?tabs.length-1:event.key===forwardKey?(index+1)%tabs.length:event.key===backwardKey?(index-1+tabs.length)%tabs.length:null;
  if(nextIndex===null)return;
  event.preventDefault();
  organizerTab=tabs[nextIndex].dataset.organizerTab;
  render();
  document.getElementById(`organizer-tab-${organizerTab}`).focus();
});
