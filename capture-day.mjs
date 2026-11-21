import {writeFile} from "node:fs/promises";

const root="/Users/macbookair/.copilot/session-state/6068ab85-b90c-4863-85e0-d9cf72cb41ae/files/mihwer-journey-design";
const target=await (await fetch("http://127.0.0.1:19225/json/new?about:blank",{method:"PUT"})).json();
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
let next=0;
const pending=new Map();
socket.addEventListener("message",event=>{const message=JSON.parse(event.data);if(!pending.has(message.id))return;const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);});
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await call("Runtime.evaluate",{expression,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;}
await call("Page.enable");
await call("Runtime.enable");
await call("Page.navigate",{url:`file://${root}/index.html`});
let ready=false;
for(let i=0;i<100;i++){ready=await evaluate("document.readyState === 'complete' && typeof go === 'function'");if(ready)break;await new Promise(resolve=>setTimeout(resolve,100));}
if(!ready)throw new Error("Prototype did not load");
for(const [size,width,height] of [["desktop",1440,900],["mobile",375,812]]){
  await call("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
  for(const lang of ["ar","en"]){
    await evaluate(`document.querySelector('#language').value='${lang}';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}))`);
    if(await evaluate("document.documentElement.lang")!==lang)throw new Error(`Language not applied: ${lang}`);
    await evaluate("go('day')");
    await new Promise(resolve=>setTimeout(resolve,150));
    const {data}=await call("Page.captureScreenshot",{format:"png",fromSurface:true});
    await writeFile(`${root}/day-current-${lang}-${size}.png`,Buffer.from(data,"base64"));
    console.log(`day-current-${lang}-${size} ${width}x${height}`);
  }
}
socket.close();
await fetch(`http://127.0.0.1:19225/json/close/${target.id}`);
