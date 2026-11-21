"use strict";

const priorityRank=Object.freeze({"urgent-important":0,"urgent-not-important":1,"not-urgent-important":2,"not-urgent-not-important":3});
const MihwerTaskPriority=Object.freeze({
  values:Object.freeze(["urgent-important","urgent-not-important","not-urgent-important","not-urgent-not-important"]),
  rank:priorityRank,
  labels:Object.freeze({
    "urgent-important":["عاجل ومهم","Urgent and important"],
    "urgent-not-important":["عاجل وغير مهم","Urgent, not important"],
    "not-urgent-important":["غير عاجل ومهم","Important, not urgent"],
    "not-urgent-not-important":["غير عاجل وغير مهم","Neither urgent nor important"]
  }),
  normalize(value) {
    return Object.hasOwn(priorityRank,value)?value:"not-urgent-important";
  },
  matchesFocus(value,focus) {
    return focus==="all"||Object.hasOwn(priorityRank,focus)&&this.normalize(value)===focus;
  },
  compare(a,b) {
    const normalize=value=>Object.hasOwn(priorityRank,value)?value:"not-urgent-important";
    return priorityRank[normalize(a)]-priorityRank[normalize(b)];
  }
});
if(typeof module==="object"&&module.exports)module.exports=MihwerTaskPriority;
