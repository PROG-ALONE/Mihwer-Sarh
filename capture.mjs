import {writeFile} from "node:fs/promises";

const root = "/Users/macbookair/.copilot/session-state/6068ab85-b90c-4863-85e0-d9cf72cb41ae/files/mihwer-journey-design";
const target = await (await fetch("http://127.0.0.1:19224/json/new?about:blank", {method:"PUT"})).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject) => {
  socket.addEventListener("open",resolve,{once:true});
  socket.addEventListener("error",reject,{once:true});
});
let id=0;
const pending=new Map();
socket.addEventListener("message",event=>{
  const message=JSON.parse(event.data);
  if(!pending.has(message.id))return;
  const {resolve,reject}=pending.get(message.id);
  pending.delete(message.id);
  if(message.error)reject(new Error(message.error.message)); else resolve(message.result);
});
function call(method,params={}) {
  return new Promise((resolve,reject)=>{
    const request=++id;
    pending.set(request,{resolve,reject});
    socket.send(JSON.stringify({id:request,method,params}));
  });
}
async function evaluate(expression) {
  const result=await call("Runtime.evaluate",{expression,returnByValue:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
await call("Page.enable");
await call("Runtime.enable");
for(const [size,width,height] of [["desktop",1440,900],["mobile",375,812]]) {
  await call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  await call("Page.navigate",{url:"http://127.0.0.1:18769/"});
  let ready=false;
  for(let i=0;i<100;i++){
    ready=await evaluate("document.readyState === 'complete' && typeof go === 'function'");
    if(ready)break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!ready)throw new Error("Prototype did not load");
  for(const lang of ["ar","en"]) {
    await evaluate(`document.querySelector('#language').value='${lang}';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}))`);
    if(await evaluate("document.documentElement.lang")!==lang)throw new Error(`Language not applied: ${lang}`);
    for(const screen of ["day","week","month","year","document","preview","sharing","paths"]) {
      await evaluate(`go('${screen}')`);
      await new Promise(resolve=>setTimeout(resolve,100));
      const {data}=await call("Page.captureScreenshot",{format:"png",fromSurface:true});
      await writeFile(`${root}/${screen}-${lang}-${size}.png`,Buffer.from(data,"base64"));
      console.log(`${screen}-${lang}-${size} ${width}x${height}`);
    }
  }
}
socket.close();
await fetch(`http://127.0.0.1:19224/json/close/${target.id}`);
