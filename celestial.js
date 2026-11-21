"use strict";

const radians=Math.PI/180;
const degrees=180/Math.PI;
const dayMs=86400000;
const earthRadiusKm=6378.14;
const lunarRadiusKm=1737.4;
const normalizeDegrees=value=>((value%360)+360)%360;
const normalizeRadians=value=>((value%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
const signedRadians=value=>((value+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const smoothstep=(value,start,end)=>{const x=clamp((value-start)/(end-start),0,1);return x*x*(3-2*x);};

function assertCoordinates(latitude,longitude) {
  if(!Number.isFinite(latitude)||latitude< -90||latitude>90||!Number.isFinite(longitude)||longitude< -180||longitude>180) {
    throw new RangeError("Invalid geographic coordinates");
  }
}

function assertDate(date) {
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new TypeError("A valid Date is required");
}

function julianDay(date) {
  return date.getTime()/dayMs+2440587.5;
}

function solarEquatorial(date) {
  const t=(julianDay(date)-2451545)/36525;
  const meanLongitude=normalizeDegrees(280.46646+t*(36000.76983+t*.0003032))*radians;
  const meanAnomaly=(357.52911+t*(35999.05029-.0001537*t))*radians;
  const eccentricity=.016708634-t*(.000042037+.0000001267*t);
  const center=(1.914602-t*(.004817+.000014*t))*Math.sin(meanAnomaly)
    +(.019993-.000101*t)*Math.sin(2*meanAnomaly)+.000289*Math.sin(3*meanAnomaly);
  const trueLongitude=meanLongitude+center*radians;
  const omega=(125.04-1934.136*t)*radians;
  const apparentLongitude=trueLongitude-(.00569+.00478*Math.sin(omega))*radians;
  const meanObliquity=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60)*radians;
  const obliquity=meanObliquity+.00256*Math.cos(omega)*radians;
  const rightAscension=Math.atan2(Math.cos(obliquity)*Math.sin(apparentLongitude),Math.cos(apparentLongitude));
  const declination=Math.asin(Math.sin(obliquity)*Math.sin(apparentLongitude));
  return {rightAscension,declination,eclipticLongitude:normalizeRadians(apparentLongitude),obliquity};
}

// The 20 largest periodic terms keep this browser model lightweight; it is not the full ephemeris.
const lunarLongitudeDistanceTerms=[
  [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],
  [0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],
  [2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],
  [2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
  [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
  [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],
  [4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208]
];
const lunarLatitudeTerms=[
  [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
  [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
  [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
  [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],
  [2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794]
];

function lunarEquatorial(date) {
  const t=(julianDay(date)-2451545)/36525;
  const polynomial=(constant,linear,quadratic,cubic=0,quartic=0)=>((quartic*t+cubic)*t+quadratic)*t*t+linear*t+constant;
  const meanLongitude=normalizeDegrees(polynomial(218.3164477,481267.88123421,-.0015786,1/538841,-1/65194000))*radians;
  const elongation=polynomial(297.8501921,445267.1114034,-.0018819,1/545868,-1/113065000)*radians;
  const solarAnomaly=polynomial(357.5291092,35999.0502909,-.0001535,-1/24490000)*radians;
  const lunarAnomaly=polynomial(134.9633964,477198.8675055,.0087414,1/69699,-1/14712000)*radians;
  const latitudeArgument=polynomial(93.272095,483202.0175233,-.0036539,-1/3526000,1/863310000)*radians;
  const eccentricity=1-.002516*t-.0000074*t*t;
  let longitudeCorrection=0,distanceCorrection=0,latitudeCorrection=0;
  for(const [d,m,mp,f,longitude,distance] of lunarLongitudeDistanceTerms){
    const eccentricityFactor=eccentricity**Math.abs(m);
    const argument=d*elongation+m*solarAnomaly+mp*lunarAnomaly+f*latitudeArgument;
    longitudeCorrection+=longitude*eccentricityFactor*Math.sin(argument);
    distanceCorrection+=distance*eccentricityFactor*Math.cos(argument);
  }
  for(const [d,m,mp,f,latitude] of lunarLatitudeTerms){
    latitudeCorrection+=latitude*eccentricity**Math.abs(m)
      *Math.sin(d*elongation+m*solarAnomaly+mp*lunarAnomaly+f*latitudeArgument);
  }
  const a1=(119.75+131.849*t)*radians,a2=(53.09+479264.29*t)*radians,a3=(313.45+481266.484*t)*radians;
  longitudeCorrection+=3958*Math.sin(a1)+1962*Math.sin(meanLongitude-latitudeArgument)+318*Math.sin(a2);
  latitudeCorrection+=-2235*Math.sin(meanLongitude)+382*Math.sin(a3)
    +175*Math.sin(a1-latitudeArgument)+175*Math.sin(a1+latitudeArgument)
    +127*Math.sin(meanLongitude-lunarAnomaly)-115*Math.sin(meanLongitude+lunarAnomaly);
  const omega=(125.04452-1934.136261*t)*radians;
  const sunMeanLongitude=(280.4665+36000.7698*t)*radians;
  const moonMeanLongitude=(218.3165+481267.8813*t)*radians;
  const nutationLongitude=(-17.2*Math.sin(omega)-1.32*Math.sin(2*sunMeanLongitude)
    -.23*Math.sin(2*moonMeanLongitude)+.21*Math.sin(2*omega))/3600*radians;
  const nutationObliquity=(9.2*Math.cos(omega)+.57*Math.cos(2*sunMeanLongitude)
    +.1*Math.cos(2*moonMeanLongitude)-.09*Math.cos(2*omega))/3600*radians;
  const eclipticLongitude=normalizeRadians(meanLongitude+longitudeCorrection*1e-6*radians+nutationLongitude);
  const eclipticLatitude=latitudeCorrection*1e-6*radians;
  const distanceKm=385000.56+distanceCorrection*.001;
  const meanObliquity=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60)*radians;
  const obliquity=meanObliquity+nutationObliquity;
  const rightAscension=Math.atan2(
    Math.sin(eclipticLongitude)*Math.cos(obliquity)-Math.tan(eclipticLatitude)*Math.sin(obliquity),
    Math.cos(eclipticLongitude)
  );
  const declination=Math.asin(
    Math.sin(eclipticLatitude)*Math.cos(obliquity)
      +Math.cos(eclipticLatitude)*Math.sin(obliquity)*Math.sin(eclipticLongitude)
  );
  return {rightAscension,declination,eclipticLongitude,eclipticLatitude,distanceKm,obliquity};
}

function siderealAngle(date,longitude) {
  const jd=julianDay(date),t=(jd-2451545)/36525;
  return normalizeRadians((280.46061837+360.98564736629*(jd-2451545)+.000387933*t*t-t*t*t/38710000)*radians+longitude*radians);
}

function horizontalPosition(date,latitude,longitude,equatorial) {
  const hourAngle=signedRadians(siderealAngle(date,longitude)-equatorial.rightAscension);
  const lat=latitude*radians,dec=equatorial.declination;
  const altitude=Math.asin(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hourAngle));
  const azimuth=normalizeRadians(Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle)*Math.sin(lat)-Math.tan(dec)*Math.cos(lat)
  )+Math.PI);
  return {altitude:altitude*degrees,azimuth:azimuth*degrees,hourAngle:hourAngle*degrees};
}

function atmosphericRefraction(altitude) {
  if(altitude>85)return 0;
  const tangent=Math.tan(altitude*radians);
  let arcSeconds;
  if(altitude>5)arcSeconds=58.1/tangent-.07/(tangent**3)+.000086/(tangent**5);
  else if(altitude>-.575)arcSeconds=1735+altitude*(-518.2+altitude*(103.4+altitude*(-12.79+altitude*.711)));
  else arcSeconds=-20.772/tangent;
  return Math.max(0,arcSeconds/3600);
}

function sunPosition(date,latitude,longitude) {
  assertDate(date);assertCoordinates(latitude,longitude);
  const position=horizontalPosition(date,latitude,longitude,solarEquatorial(date));
  const refraction=atmosphericRefraction(position.altitude);
  return {...position,refraction,apparentAltitude:position.altitude+refraction};
}

function topocentricMoon(date,latitude,longitude,moon) {
  const sidereal=siderealAngle(date,longitude),cosDeclination=Math.cos(moon.declination);
  const lunarX=moon.distanceKm*cosDeclination*Math.cos(moon.rightAscension);
  const lunarY=moon.distanceKm*cosDeclination*Math.sin(moon.rightAscension);
  const lunarZ=moon.distanceKm*Math.sin(moon.declination);
  const geodeticLatitude=latitude*radians;
  const reducedLatitude=Math.atan(.99664719*Math.tan(geodeticLatitude));
  const observerX=earthRadiusKm*Math.cos(reducedLatitude)*Math.cos(sidereal);
  const observerY=earthRadiusKm*Math.cos(reducedLatitude)*Math.sin(sidereal);
  const observerZ=earthRadiusKm*.99664719*Math.sin(reducedLatitude);
  const x=lunarX-observerX,y=lunarY-observerY,z=lunarZ-observerZ;
  const distanceKm=Math.hypot(x,y,z);
  return {
    rightAscension:Math.atan2(y,x),
    declination:Math.asin(z/distanceKm),
    distanceKm
  };
}

function moonPosition(date,latitude,longitude) {
  assertDate(date);assertCoordinates(latitude,longitude);
  const moon=lunarEquatorial(date),sun=solarEquatorial(date),topocentric=topocentricMoon(date,latitude,longitude,moon);
  const phase=normalizeRadians(moon.eclipticLongitude-sun.eclipticLongitude);
  const elongation=Math.acos(clamp(
    Math.sin(moon.declination)*Math.sin(sun.declination)
      +Math.cos(moon.declination)*Math.cos(sun.declination)*Math.cos(moon.rightAscension-sun.rightAscension),
    -1,1
  ));
  const phaseAngle=Math.atan2(
    149597870.7*Math.sin(elongation),
    moon.distanceKm-149597870.7*Math.cos(elongation)
  );
  const illumination=clamp((1+Math.cos(phaseAngle))/2,0,1);
  const position=horizontalPosition(date,latitude,longitude,topocentric);
  const sunPositionAtObserver=horizontalPosition(date,latitude,longitude,sun);
  const moonAltitude=position.altitude*radians,sunAltitude=sunPositionAtObserver.altitude*radians;
  const azimuthDifference=signedRadians((sunPositionAtObserver.azimuth-position.azimuth)*radians);
  const east=Math.cos(sunAltitude)*Math.sin(azimuthDifference);
  const up=Math.sin(sunAltitude)*Math.cos(moonAltitude)
    -Math.cos(sunAltitude)*Math.sin(moonAltitude)*Math.cos(azimuthDifference);
  const brightLimbAngle=Math.atan2(-east,up);
  const refraction=atmosphericRefraction(position.altitude);
  return {
    ...position,phase,phaseAngle,elongation,illumination,brightLimbAngle,refraction,
    apparentAltitude:position.altitude+refraction,distanceKm:moon.distanceKm,
    angularRadius:Math.asin(lunarRadiusKm/moon.distanceKm)*degrees
  };
}

function solarEvents(start,end,latitude,longitude) {
  assertCoordinates(latitude,longitude);
  const from=start instanceof Date?start.getTime():start;
  const until=end instanceof Date?end.getTime():end;
  if(!Number.isFinite(from)||!Number.isFinite(until)||until<=from)throw new RangeError("Invalid solar event interval");
  const threshold=-.833,step=5*60*1000;
  const altitudeAt=instant=>sunPosition(new Date(instant),latitude,longitude).altitude;
  const crossing=(left,right,rising)=>{
    for(let i=0;i<32&&right-left>1000;i++){
      const middle=(left+right)/2,above=altitudeAt(middle)>=threshold;
      if(above===rising)right=middle;else left=middle;
    }
    return new Date((left+right)/2);
  };
  let sunrise=null,sunset=null,left=from,previous=altitudeAt(left);
  for(let right=Math.min(from+step,until);right<=until;right=Math.min(right+step,until)){
    const current=altitudeAt(right);
    if(sunrise===null&&previous<threshold&&current>=threshold)sunrise=crossing(left,right,true);
    if(sunset===null&&previous>=threshold&&current<threshold)sunset=crossing(left,right,false);
    left=right;previous=current;
    if(right===until)break;
  }
  return {sunrise,sunset};
}

function lunarEvents(start,end,latitude,longitude) {
  assertCoordinates(latitude,longitude);
  const from=start instanceof Date?start.getTime():start;
  const until=end instanceof Date?end.getTime():end;
  if(!Number.isFinite(from)||!Number.isFinite(until)||until<=from)throw new RangeError("Invalid lunar event interval");
  const step=5*60*1000;
  const altitudeAt=instant=>{
    const moon=moonPosition(new Date(instant),latitude,longitude);
    return moon.altitude+.5667+moon.angularRadius;
  };
  const crossing=(left,right,rising)=>{
    for(let i=0;i<32&&right-left>1000;i++){
      const middle=(left+right)/2,above=altitudeAt(middle)>=0;
      if(above===rising)right=middle;else left=middle;
    }
    return new Date((left+right)/2);
  };
  let moonrise=null,moonset=null,left=from,previous=altitudeAt(left);
  for(let right=Math.min(from+step,until);right<=until;right=Math.min(right+step,until)){
    const current=altitudeAt(right);
    if(moonrise===null&&previous<0&&current>=0)moonrise=crossing(left,right,true);
    if(moonset===null&&previous>=0&&current<0)moonset=crossing(left,right,false);
    left=right;previous=current;
    if(right===until)break;
  }
  return {moonrise,moonset};
}

function project(position,width=1000,height=800,horizon=330,visibleStart=0,visibleWidth=width) {
  if(!position||![position.altitude,position.azimuth,width,height,horizon,visibleStart,visibleWidth].every(Number.isFinite)) {
    throw new TypeError("Valid position and scene dimensions are required");
  }
  const bearing=clamp(signedRadians((position.azimuth-180)*radians)/ (Math.PI/2),-1,1);
  return {
    x:visibleStart+visibleWidth*(.5+.44*bearing),
    y:horizon-(position.apparentAltitude??position.altitude)*2.35
  };
}

function moonShadowOffset(phase,radius) {
  if(!Number.isFinite(phase)||!Number.isFinite(radius)||radius<0)throw new RangeError("Invalid lunar phase or radius");
  const age=normalizeRadians(phase),magnitude=radius*(1-Math.cos(age));
  return age<Math.PI?-magnitude:magnitude;
}

function moonShadowVector(illumination,brightLimbAngle,radius) {
  if(![illumination,brightLimbAngle,radius].every(Number.isFinite)||illumination<0||illumination>1||radius<0) {
    throw new RangeError("Invalid lunar illumination or orientation");
  }
  const distance=2*radius*illumination;
  const x=-distance*Math.sin(brightLimbAngle),y=distance*Math.cos(brightLimbAngle);
  return {x:Object.is(x,-0)?0:x,y:Object.is(y,-0)?0:y};
}

function stellarVisibility(solarAltitude) {
  if(!Number.isFinite(solarAltitude))return 0;
  return .75*smoothstep(-6-solarAltitude,0,12);
}

function solarPhase(position) {
  if(!position||![position.altitude,position.hourAngle].every(Number.isFinite)) {
    throw new TypeError("A valid solar position is required");
  }
  if(position.altitude<=-18)return "night";
  if(position.altitude<-.833)return position.hourAngle<0?"dawn":"evening";
  if(position.altitude<4)return position.hourAngle<0?"sunrise":"sunset";
  if(Math.abs(position.hourAngle)<=15)return "noon";
  return position.hourAngle<0?"morning":"afternoon";
}

function sceneLighting(altitude) {
  if(!Number.isFinite(altitude))return {
    top:"rgba(28,48,56,0)",mid:"rgba(28,48,56,0)",bottom:"rgba(22,35,58,.12)",
    filter:"saturate(.98) brightness(1) contrast(1.03)",glow:"rgb(205,219,218)",light:"rgb(220,225,222)"
  };
  const smooth=(value,start,end)=>{const x=clamp((value-start)/(end-start),0,1);return x*x*(3-2*x);};
  const daylight=smooth(altitude,-8,12),twilight=Math.exp(-(((altitude+1)/11)**2));
  const night=1-daylight,blend=(a,b,t)=>a.map((value,index)=>Math.round(value+(b[index]-value)*t));
  const rgba=(color,alpha)=>`rgba(${color.join(",")},${clamp(alpha,0,1).toFixed(3)})`;
  const navy=[14,34,91],warm=[232,139,76],dayTop=[92,163,208],dayMid=[125,190,215],dayBottom=[26,72,86];
  const nightAlpha=.68*night,warmAlpha=.30*twilight,dayTwilight=twilight*night;
  const top=blend(blend(navy,dayTop,daylight),warm,dayTwilight);
  const middle=blend(blend([12,25,61],dayMid,daylight),warm,dayTwilight*.82);
  const mid=rgba(middle,.38*night+.24*twilight+.18*daylight);
  const bottom=rgba(blend([13,27,48],dayBottom,daylight),.30*night+.10*daylight);
  const daylightColor=blend([155,206,222],[230,172,111],Math.min(.48,twilight*.48));
  return {
    top:rgba(top,Math.min(.82,nightAlpha+warmAlpha+.70*daylight)),
    mid,
    bottom,
    filter:`sepia(${(.18*twilight).toFixed(3)}) saturate(${(.72+.38*daylight).toFixed(3)}) brightness(${(.48+.50*daylight).toFixed(3)}) contrast(1.06)`,
    glow:`rgb(${daylightColor.join(",")})`,
    light:`rgb(${blend([189,210,229],[255,231,173],daylight).join(",")})`
  };
}

const MihwerCelestial=Object.freeze({
  sunPosition,moonPosition,solarEvents,lunarEvents,project,moonShadowOffset,moonShadowVector,
  stellarVisibility,solarPhase,sceneLighting
});
if(typeof module==="object"&&module.exports)module.exports=MihwerCelestial;
