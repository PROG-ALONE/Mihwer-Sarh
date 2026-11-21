"use strict";

globalThis.MihwerExtendedValidation = (() => {
  function isDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validFields(name, start, end, pathId, pathIds) {
    return typeof name === "string" && name.trim().length > 0 && name.length <= 100 &&
      isDate(start) && (end === "" || (isDate(end) && end >= start)) &&
      Array.isArray(pathIds) && pathIds.includes(pathId);
  }
  function datesFit(subtasks, start, end) {
    if (!Array.isArray(subtasks) || !isDate(start) || (end !== "" && (!isDate(end) || end < start))) return false;
    return subtasks.every(sub => sub && isDate(sub.date) &&
      (sub.completedDate === undefined || isDate(sub.completedDate)) &&
      [sub.date, sub.completedDate].filter(Boolean).every(date => date >= start && (!end || date <= end)));
  }
  function validCollection(tasks) {
    if(!Array.isArray(tasks)) return false;
    const taskIds=new Set(),subtaskIds=new Set();
    for(const task of tasks) {
      if(!task||typeof task.id!=="string"||!task.id.trim()||taskIds.has(task.id)||
          typeof task.pathId!=="string"||!validFields(task.name,task.start,task.end,task.pathId,[task.pathId])||
          !Array.isArray(task.subtasks)||!datesFit(task.subtasks,task.start,task.end)||
          Object.hasOwn(task,"parentId")||
          (task.status!==undefined&&!["open","completed","cancelled"].includes(task.status))||
          (task.archived!==undefined&&typeof task.archived!=="boolean")||
          (task.createdAt!==undefined&&(typeof task.createdAt!=="string"||!Number.isFinite(Date.parse(task.createdAt))||
            new Date(task.createdAt).toISOString()!==task.createdAt))) return false;
      taskIds.add(task.id);
    }
    for(const task of tasks) {
      for(const sub of task.subtasks) {
        const identity=JSON.stringify([task.id,sub?.id]);
        if(!sub||typeof sub.id!=="string"||!sub.id.trim()||taskIds.has(sub.id)||subtaskIds.has(identity)||typeof sub.name!=="string"||!sub.name.trim()||
            sub.name.length>100||Object.hasOwn(sub,"subtasks")||
            (sub.parentId!==undefined&&sub.parentId!==task.id)||
            (sub.status!==undefined&&!["pending","completed","cancelled"].includes(sub.status))||
            (sub.archived!==undefined&&typeof sub.archived!=="boolean")||
            (sub.done!==undefined&&typeof sub.done!=="boolean")||
            (sub.status==="completed"&&sub.done!==true)||
            (sub.status==="pending"&&sub.done===true)||
            ((sub.status==="completed"||(sub.status===undefined&&sub.done===true))&&!isDate(sub.completedDate))||
            (sub.completedDate!==undefined&&!isDate(sub.completedDate))||
            (sub.cancelledDate!==undefined&&!isDate(sub.cancelledDate))) return false;
        subtaskIds.add(identity);
      }
    }
    return true;
  }
  function periodOverlapsTask(task,start,end) {
    if(!task||!isDate(start)||!isDate(end)||start>end||!isDate(task.start)||
        (task.end!==""&&(!isDate(task.end)||task.end<task.start))) throw new Error("Invalid task period");
    return task.start<=end&&(!task.end||task.end>=start);
  }
  return {isDate, validFields, datesFit, validCollection, overlapsPeriod:periodOverlapsTask};
})();
