"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const {isDiscreteWheel,WheelGestureGate}=require("./scroll-gesture.js");

test("discrete wheel input advances once for one burst",()=>{
  const gate=new WheelGestureGate(220);
  assert.equal(gate.shouldAdvance("day",1000),true);
  assert.equal(gate.shouldAdvance("day",1040),false);
  assert.equal(gate.shouldAdvance("day",1200),false);
  assert.equal(gate.shouldAdvance("day",1450),true);
});

test("a new route starts a distinct wheel gesture",()=>{
  const gate=new WheelGestureGate();
  assert.equal(gate.shouldAdvance("week",1000),true);
  assert.equal(gate.shouldAdvance("month",1050),true);
  gate.reset();
  assert.equal(gate.shouldAdvance("month",1075),true);
});

test("line and page wheel input are discrete even at small delta values",()=>{
  assert.equal(isDiscreteWheel({deltaX:0,deltaY:1,deltaMode:1}),true);
  assert.equal(isDiscreteWheel({deltaX:0,deltaY:1,deltaMode:2}),true);
});

test("small pixel wheel deltas and horizontal trackpad gestures remain native",()=>{
  assert.equal(isDiscreteWheel({deltaX:0,deltaY:12,deltaMode:0}),false);
  assert.equal(isDiscreteWheel({deltaX:45,deltaY:20,deltaMode:0}),false);
});

test("large vertical pixel wheel ticks are discrete",()=>{
  assert.equal(isDiscreteWheel({deltaX:0,deltaY:100,deltaMode:0}),true);
});
