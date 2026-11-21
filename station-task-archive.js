"use strict";

globalThis.MihwerStationTaskArchive = (() => {
  function archive(task) {
    if (!task || task.archived) return false;
    task.archivePreviousStatus = task.status;
    task.archived = true;
    task.status = "cancelled";
    return true;
  }

  function restore(task) {
    if (!task || !task.archived) return false;
    task.status = task.archivePreviousStatus || "pending";
    delete task.archivePreviousStatus;
    delete task.archived;
    return true;
  }

  return Object.freeze({archive, restore});
})();
