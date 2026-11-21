"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
require("./station-task-archive.js");

const archive=globalThis.MihwerStationTaskArchive;

test("archiving hides a task without losing its previous status and can be undone",()=>{
  const task={id:"walk",status:"done"};
  assert.equal(archive.archive(task),true);
  assert.equal(task.archived,true);
  assert.equal(task.status,"cancelled");
  assert.equal(archive.restore(task),true);
  assert.equal(task.archived,undefined);
  assert.equal(task.status,"done");
});

test("archive and restore are safe to repeat",()=>{
  const task={id:"read",status:"pending"};
  assert.equal(archive.archive(task),true);
  assert.equal(archive.archive(task),false);
  assert.equal(archive.restore(task),true);
  assert.equal(archive.restore(task),false);
  assert.equal(task.status,"pending");
});
