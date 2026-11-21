"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

function createHeatmap(){
  const context=vm.createContext({});
  for(const file of ["extended-validation.js","progress-contract.js","progress-engine.js","progress-heatmap.js"]){
    vm.runInContext(fs.readFileSync(require.resolve(`./${file}`),"utf8"),context,{filename:file});
  }
  return context.MihwerProgressHeatmap;
}

test("heatmap creates a rolling thirty-day range and aggregates tasks, habits, activities and extended work",()=>{
  const heatmap=createHeatmap();
  const model=heatmap.build({
    today:"2026-11-21",
    days:[{date:"2026-11-21",stations:[
      {id:"tasks",habit:false,tasks:[{id:"task-1",name:["مهمة","Task"],status:"done"},{id:"task-2",name:["مهمة أخرى","Another task"],status:"pending"}]},
      {id:"habits",habit:true,tasks:[{id:"habit-1",name:["عادة","Habit"],status:"done"}]}
    ],activities:[{id:"activity-1",title:"جلسة",status:"completed"}]}],
    extendedTasks:[{id:"extended-1",subtasks:[{id:"sub-1",name:"خطوة",date:"2026-11-21",status:"pending"},{id:"sub-2",name:"منجزة",date:"2026-11-20",completedDate:"2026-11-20",status:"completed",done:true}]}],
    habits:[{id:"recurring-1",name:"ماء",records:{"2026-11-21":{status:"completed"},"2026-11-20":{status:"incomplete"}}}]
  });
  assert.equal(model.days.length,30);
  assert.equal(model.start,"2026-10-23");
  assert.equal(model.today,"2026-11-21");
  const today=model.days.at(-1);
  assert.equal(today.total,6);
  assert.equal(today.completed,4);
  assert.equal(today.percent,67);
  assert.equal(today.tasks,3);
  assert.equal(today.habits,2);
  assert.equal(today.activities,1);
  assert.equal(model.days[28].completed,1);
});

test("heatmap uses requested inclusive color thresholds and treats days without activity as empty",()=>{
  const heatmap=createHeatmap();
  assert.equal(heatmap.colorFor(25,4),"low");
  assert.equal(heatmap.colorFor(26,4),"mid");
  assert.equal(heatmap.colorFor(50,4),"mid");
  assert.equal(heatmap.colorFor(51,4),"high");
  assert.equal(heatmap.colorFor(75,4),"high");
  assert.equal(heatmap.colorFor(76,4),"full");
  assert.equal(heatmap.colorFor(25.01,1000),"mid");
  assert.equal(heatmap.colorFor(50.01,1000),"high");
  assert.equal(heatmap.colorFor(75.01,1000),"full");
  assert.equal(heatmap.colorFor(null,0),"none");
  const model=heatmap.build({today:"2026-11-21",days:[],extendedTasks:[],habits:[]});
  assert.ok(model.days.every(day=>day.percent===null&&day.color==="none"));
});

test("daily record renders activity details safely and keeps empty-state clear",()=>{
  const heatmap=createHeatmap();
  const model=heatmap.build({
    today:"2026-11-21",
    days:[{date:"2026-11-21",stations:[{id:"s",habit:false,tasks:[{id:"t",name:"<script>",status:"done"}]}],activities:[]}],
    extendedTasks:[],habits:[]
  });
  const html=heatmap.renderDay(model,"2026-11-21",[
    {date:"2026-11-21",at:Date.UTC(2026,10,21,9),action:"completed",detail:"<img src=x>"}
  ]);
  assert.match(html,/progress-day-record/);
  assert.match(html,/&lt;script&gt;/);
  assert.match(html,/&lt;img src=x&gt;/);
  assert.doesNotMatch(html,/<script>|<img src=x>/);
  const empty=heatmap.renderDay(heatmap.build({today:"2026-11-21",days:[],extendedTasks:[],habits:[]}),"2026-11-21");
  assert.match(empty,/لا توجد عناصر مسجلة/);
  assert.match(empty,/لا توجد أحداث مسجلة/);
});
