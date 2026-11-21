"use strict";

class MihwerWheelGestureGate {
  constructor(idleMs=220) {
    this.idleMs=idleMs;
    this.lastAt=null;
    this.route=null;
  }
  shouldAdvance(route,now) {
    const advance=this.route!==route||this.lastAt===null||now-this.lastAt>=this.idleMs;
    this.route=route;
    this.lastAt=now;
    return advance;
  }
  reset() {
    this.lastAt=null;
    this.route=null;
  }
}

const MihwerScrollGesture=Object.freeze({
  isDiscreteWheel(event) {
    const vertical=Math.abs(event.deltaY),horizontal=Math.abs(event.deltaX||0);
    if(vertical===0||vertical<horizontal*1.35)return false;
    return event.deltaMode!==0||vertical>=48;
  },
  WheelGestureGate:MihwerWheelGestureGate
});

if(typeof module==="object"&&module.exports)module.exports=MihwerScrollGesture;
