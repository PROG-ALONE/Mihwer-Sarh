"use strict";

globalThis.MihwerExtendedLifecycle = (() => {
  const isDate=date=>globalThis.MihwerExtendedValidation.isDate(date);
  const activeParent=task=>!task.archived&&(task.status||"open")==="open";

  function stateAt(task,today) {
    if(!task||!isDate(today)||!isDate(task.start)||
        (task.end!==""&&(!isDate(task.end)||task.end<task.start))) throw new Error("Invalid task period");
    if(task.archived) return "archived";
    if(task.status==="cancelled") return "cancelled";
    if(task.status==="completed") return "completed";
    if(task.status!==undefined&&task.status!=="open") throw new Error("Invalid status");
    if(today<task.start) return "notStarted";
    if(task.end&&today>task.end) return "overdue";
    return "inProgress";
  }

  function transition(task, action, today) {
    if (!task || typeof task.id!=="string" || !task.id || !Array.isArray(task.subtasks) || !isDate(today)||
        !isDate(task.start)||(task.end!==""&&(!isDate(task.end)||task.end<task.start))||
        (task.archived!==undefined&&typeof task.archived!=="boolean")) throw new Error("Invalid task or date");
    const status = task.status || "open";
    if (!["open", "completed", "cancelled"].includes(status)) throw new Error("Invalid status");
    if(action==="edit-period") throw new Error("Edit periods through the validated task update flow");
    if (action === "archive" && !task.archived) return {...task, archived:true};
    if (action === "restore-archive" && task.archived) return {...task, archived:false};
    if (task.archived) throw new Error("Task is archived");
    if (action === "cancel" && status === "open") return {...task, status:"cancelled"};
    if (action === "restore" && status === "cancelled") return {...task, status:"open"};
    if (action === "reopen" && status === "completed") return {...task, status:"open"};
    if (action === "complete" && status === "open") {
      if (today < task.start || (task.end && today > task.end)) throw new Error("Outside task period");
      return {...task, status:"completed"};
    }
    throw new Error("Invalid transition");
  }

  function transitionSubtask(task, subtaskId, action, today) {
    if(!task||typeof task.id!=="string"||!Array.isArray(task.subtasks)||!isDate(today)||
        !isDate(task.start)||(task.end!==""&&(!isDate(task.end)||task.end<task.start))||
        !["complete","reopen","cancel","restore","archive","restore-archive"].includes(action)) throw new Error("Invalid subtask transition");
    if(!activeParent(task)) throw new Error("Parent task is not active");
    const matches=task.subtasks.filter(subtask=>subtask?.id===subtaskId);
    if(matches.length!==1) throw new Error("Subtask identity is missing or duplicated");
    const subtask=matches[0],status=subtask.status||(subtask.done?"completed":"pending");
    if(!["pending","completed","cancelled"].includes(status)||
        (status==="completed"&&subtask.done!==true)||(status==="pending"&&subtask.done===true)||
        (subtask.archived!==undefined&&typeof subtask.archived!=="boolean")||
        !isDate(subtask.date)||(subtask.completedDate!==undefined&&!isDate(subtask.completedDate))||
        (status==="completed"&&!isDate(subtask.completedDate))) throw new Error("Invalid subtask");
    if(action==="archive"&&!subtask.archived) return {...task,subtasks:task.subtasks.map(item=>item===subtask?{...item,archived:true}:item)};
    if(action==="restore-archive"&&subtask.archived) return {...task,subtasks:task.subtasks.map(item=>item===subtask?{...item,archived:false}:item)};
    if(subtask.archived) throw new Error("Subtask is archived");
    if(action==="cancel"&&status!=="cancelled") return {...task,subtasks:task.subtasks.map(item=>item===subtask?{...item,status:"cancelled",cancelledDate:today}:item)};
    if(action==="restore"&&status==="cancelled") {
      const restored={...subtask,status:subtask.done?"completed":"pending"};
      delete restored.cancelledDate;
      return {...task,subtasks:task.subtasks.map(item=>item===subtask?restored:item)};
    }
    if(action==="complete"&&status==="pending") {
      if(today<subtask.date||today<task.start||(task.end&&today>task.end)) throw new Error("Outside task period");
      return {...task,subtasks:task.subtasks.map(item=>item===subtask?{...item,done:true,status:"completed",completedDate:today}:item)};
    }
    if(action==="reopen"&&status==="completed") {
      const updated={...subtask,done:false,status:"pending"};
      delete updated.completedDate;
      return {...task,subtasks:task.subtasks.map(item=>item===subtask?updated:item)};
    }
    throw new Error("Invalid subtask transition");
  }

  function toggleSubtask(task, subtaskId, today) {
    const subtask=task?.subtasks?.find(item=>item?.id===subtaskId);
    if(!subtask) throw new Error("Subtask identity is missing");
    const status=subtask.status||(subtask.done?"completed":"pending");
    return transitionSubtask(task,subtaskId,status==="completed"?"reopen":"complete",today);
  }

  function overlapsPeriod(task,start,end) {
    return globalThis.MihwerExtendedValidation.overlapsPeriod(task,start,end);
  }

  return {stateAt,transition,transitionSubtask,toggleSubtask,overlapsPeriod};
})();
