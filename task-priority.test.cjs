"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const priority=require("./task-priority.js");

test("priority provides the four urgency and importance quadrants",()=>{
  assert.deepEqual(priority.values,[
    "urgent-important","urgent-not-important","not-urgent-important","not-urgent-not-important"
  ]);
  for(const value of priority.values){
    assert.equal(priority.normalize(value),value);
    assert.equal(priority.labels[value].length,2);
  }
});

test("unknown priorities use the calm important-first default",()=>{
  assert.equal(priority.normalize(undefined),"not-urgent-important");
  assert.equal(priority.normalize("unknown"),"not-urgent-important");
});

test("priority order preserves the Eisenhower quadrant ranking",()=>{
  const values=[...priority.values].reverse();
  assert.deepEqual(values.sort(priority.compare),priority.values);
});

test("priority focus highlights a quadrant without changing the source order",()=>{
  assert.equal(priority.matchesFocus(undefined,"all"),true);
  for(const value of priority.values){
    assert.equal(priority.matchesFocus(value,"all"),true);
    assert.equal(priority.matchesFocus(value,value),true);
    assert.equal(priority.matchesFocus(value,priority.values.find(other=>other!==value)),false);
  }
  assert.equal(priority.matchesFocus("urgent-important","invalid"),false);
});
