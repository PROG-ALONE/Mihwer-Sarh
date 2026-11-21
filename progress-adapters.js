"use strict";

globalThis.MihwerProgressAdapters = (() => {
  const {normalizeEntry} = globalThis.MihwerProgressContract;
  const taskStatuses = {done:"completed", completed:"completed", pending:"incomplete", incomplete:"incomplete", cancelled:"cancelled", deferred:"deferred"};

  function taskStatus(status) {
    const normalized = taskStatuses[status];
    if (!normalized) throw new Error("Unsupported task status");
    return normalized;
  }

  function fromStationDays(days, {observedBy="stationDays"}={}) {
    if (!Array.isArray(days)) throw new Error("Invalid station days");
    return days.flatMap(day => {
      if (!day || !Array.isArray(day.stations)) throw new Error("Invalid station day");
      return day.stations.flatMap(station => {
        if (!station || typeof station.id !== "string" || !Array.isArray(station.tasks)) throw new Error("Invalid station");
        return station.tasks.map(task => normalizeEntry({
          id:task.id, type:station.habit ? "traditionalHabit" : "task",
          source:"dayStation", observedBy:[observedBy], date:day.date,
          parentId:station.id, status:taskStatus(task.status),
          metadata:{stationId:station.id, habit:!!station.habit}
        }));
      });
    });
  }

  function fromExtendedTasks(tasks, {observedBy="extendedTasks"}={}) {
    if(Array.isArray(tasks)) {
      for(const task of tasks) {
        if(!Array.isArray(task?.subtasks)) continue;
        for(const subtask of task.subtasks) {
          if((subtask?.status==="completed"||(subtask?.status===undefined&&subtask?.done===true))&&
              subtask.completedDate===undefined) throw new Error("Completed extended subtask requires completedDate");
        }
      }
    }
    if (!globalThis.MihwerExtendedValidation.validCollection(tasks)) throw new Error("Invalid extended task collection");
    return tasks.flatMap(task => {
      if (!task || typeof task.id !== "string" || !Array.isArray(task.subtasks)) throw new Error("Invalid extended task");
      return task.subtasks.map(subtask => {
        if (!subtask || typeof subtask.id !== "string") throw new Error("Invalid extended subtask");
        const status=subtask.status??(subtask.done===true?"completed":"pending");
        if(!["pending","completed","cancelled"].includes(status)||
            (status==="completed"&&subtask.done!==true)||
            (status==="pending"&&subtask.done===true)) throw new Error("Invalid extended subtask status");
        const completed = status==="completed";
        const parentExcluded=task.status==="cancelled"||task.archived===true;
        return normalizeEntry({
          id:subtask.id, parentId:task.id, type:"extendedSubtask",
          source:"extendedTask", observedBy:[observedBy],
          date:completed ? subtask.completedDate : status==="cancelled"?(subtask.cancelledDate||subtask.date):subtask.date,
          status:completed ? "completed" : status==="cancelled"?"cancelled":"incomplete",
          eligibility:parentExcluded||status==="cancelled"||subtask.archived===true?"excluded":"eligible",
          metadata:{parentStatus:task.status || "open", parentArchived:!!task.archived,
            subtaskStatus:status, subtaskArchived:!!subtask.archived, scheduledDate:subtask.date,
            ...(subtask.completedDate?{completedDate:subtask.completedDate}:{}),
            ...(subtask.cancelledDate?{cancelledDate:subtask.cancelledDate}:{})}
        });
      });
    });
  }

  function fromRecurringHabits(habits, {observedBy="recurringHabits"}={}) {
    if (!Array.isArray(habits)) throw new Error("Invalid recurring habits");
    const statusMap = {completed:"completed", incomplete:"incomplete", exempt:"exempt"};
    return habits.flatMap(habit => {
      if (!habit || typeof habit.id !== "string" || !habit.records || typeof habit.records !== "object" || Array.isArray(habit.records)) throw new Error("Invalid recurring habit");
      return Object.entries(habit.records).map(([date, record]) => {
        if (!record || !statusMap[record.status]) throw new Error("Invalid recurring habit record");
        return normalizeEntry({
          id:habit.id, type:"recurringHabit", source:"recurringHabitRecord",
          observedBy:[observedBy], date, status:statusMap[record.status],
          metadata:{amount:record.amount ?? null}
        });
      });
    });
  }

  return {fromStationDays, fromExtendedTasks, fromRecurringHabits};
})();
