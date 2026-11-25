import test from "node:test";
import assert from "node:assert/strict";
import { createIattomClient } from "./iattom-client.js";
test("read requests preserve authorization and reject redirects", async () => {
 let calls=0;
 const client=createIattomClient({baseUrl:"https://example.invalid",token:"test-token",fetchImpl:async(url,options)=>{
 calls++; assert.equal(url.href,"https://example.invalid/api/chatgpt/account"); assert.equal(options.headers.authorization,"Bearer test-token"); assert.equal(options.redirect,"error"); return new Response("{}");
 }});
 await client("/api/chatgpt/account"); assert.equal(calls,1);
});
test("writes and arbitrary paths are blocked by default",async()=>{
 const client=createIattomClient({baseUrl:"https://example.invalid",token:"test-token",fetchImpl:async()=>{throw new Error("Unexpected network call")}});
 await assert.rejects(client("/api/ai/create-campaign",{method:"POST",body:{}}),/Operation not enabled/);
 await assert.rejects(client("/api/credits/use",{method:"POST",body:{}}),/Operation not enabled/);
 await assert.rejects(client("https://other.invalid"),/Operation not enabled/);
});

test("even explicit write opt-in cannot bypass the external atomic operation boundary",async()=>{
 let calls=0;
 const client=createIattomClient({baseUrl:"https://example.invalid/",token:"test-token",allowWrites:true,fetchImpl:async()=>{calls++;throw new Error("Unexpected call")}});
 for(const path of ["/api/ai/create-campaign","/api/ai/creative-ideas","/api/help/chat","/api/image-motion/submit","/api/chatgpt/operations/create-campaign","/api/credits/use"]) {
   await assert.rejects(client(path,{method:"POST",body:{}}),/Operation not enabled/);
 }
 assert.equal(calls,0);
});
test("read requests reject body, redirects and origins with paths",async()=>{
 const client=createIattomClient({baseUrl:"https://example.invalid",token:"test-token",fetchImpl:async()=>{throw new Error("Unexpected call")}});
 await assert.rejects(client("/api/chatgpt/account",{body:{}}),/Operation not enabled/);
 await assert.rejects(client("//other.invalid/api/chatgpt/account"),/Operation not enabled/);
 assert.throws(()=>createIattomClient({baseUrl:"https://example.invalid/hidden",token:"x"}),/Invalid API origin/);
});

test("saved library is read-only and keeps the OAuth identity",async()=>{
 let calls=0;
 const client=createIattomClient({baseUrl:"https://example.invalid",token:"test-token",fetchImpl:async(url,opts)=>{
   calls++; assert.equal(url.pathname,"/api/chatgpt/library");
   assert.equal(opts.method,"GET");
   assert.equal(opts.headers.authorization,"Bearer test-token");
   return new Response(JSON.stringify({items:[]}),{status:200});
 }});
 const result=await client("/api/chatgpt/library");
 assert.deepEqual(await result.json(),{items:[]});
 await assert.rejects(client("/api/chatgpt/library",{method:"POST",body:{}}),/Operation not enabled/);
 assert.equal(calls,1);
});

test("module preflight reads only enumerated features with no debit",async()=>{
  const paths=[];
  const client=createIattomClient({baseUrl:"https://example.invalid",token:"test-token",fetchImpl:async(url,opts)=>{
    assert.equal(opts.method,"GET");
    assert.equal(opts.headers.authorization,"Bearer test-token");
    paths.push(url.pathname);
    return new Response(JSON.stringify({feature:"campaign",executionEnabled:false,reserved:false}),{status:200});
  }});
  const r=await client("/api/chatgpt/operations/preflight/campaign");
  assert.equal((await r.json()).executionEnabled,false);
  for(const path of ["/api/chatgpt/operations/preflight/unknown_feature","/api/chatgpt/operations/preflight/campaign/extra","/api/chatgpt/operations/preflight/campaign?x=1","/api/chatgpt/operations/readiness"]) {
    await assert.rejects(client(path),/Operation not enabled/);
  }
  await assert.rejects(client("/api/chatgpt/operations/preflight/campaign",{method:"POST",body:{}}),/Operation not enabled/);
  assert.deepEqual(paths,["/api/chatgpt/operations/preflight/campaign"]);
});

test("only isolated execute route is writable with explicit opt-in",async()=>{
 let calls=0;
 const client=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",allowWrites:true,
  fetchImpl:async(url,options)=>{
   calls++; assert.equal(url.pathname,"/api/chatgpt/operations/execute");
   assert.equal(options.method,"POST");
   assert.equal(options.headers.authorization,"Bearer test-token");
   assert.equal(JSON.parse(options.body).requestId,"fixed-safe-request-123456");
   return new Response(JSON.stringify({status:"complete",charged:5}),{status:200});
 }});
 const response=await client("/api/chatgpt/operations/execute",{method:"POST",body:{feature:"product_discovery",input:{query:"test"},requestId:"fixed-safe-request-123456"}});
 assert.equal((await response.json()).charged,5);
 assert.equal(calls,1);
 const disabled=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",fetchImpl:async()=>{throw Error("unexpected")}});
 await assert.rejects(disabled("/api/chatgpt/operations/execute",{method:"POST",body:{}}),/Operation not enabled/);
});

test("status recovery is read-only and preserves original idempotency key",async()=>{
 let calls=0;
 const id="fixed-status-key-123456789";
 const client=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",fetchImpl:async(url,opts)=>{
   calls++; assert.equal(url.pathname,`/api/chatgpt/operations/status/${id}`);
   assert.equal(opts.method,"GET");
   assert.equal(opts.headers.authorization,"Bearer test-token");
   return new Response(JSON.stringify({status:"complete",projectId:"test"}),{status:200});
 }});
 assert.equal((await (await client(`/api/chatgpt/operations/status/${id}`)).json()).status,"complete");
 await assert.rejects(client("/api/chatgpt/operations/status/bad"),/Operation not enabled/);
 await assert.rejects(client(`/api/chatgpt/operations/status/${id}`,{method:"POST",body:{}}),/Operation not enabled/);
 assert.equal(calls,1);
});

test("video submit and collect require explicit isolated write access",async()=>{
 const requests=[];
 const client=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",
   allowWrites:true,fetchImpl:async(url,options)=>{
     requests.push({url:url.pathname,method:options.method,body:JSON.parse(options.body)});
     return new Response(JSON.stringify({status:"processing"}),{status:202});
   }});
 const key="video-test-unique-123456";
 await client("/api/chatgpt/video/submit",{method:"POST",body:{requestId:key,sourceProjectId:"saved",conceptIndex:0,prompt:"movimento suave",format:"vertical"}});
 await client("/api/chatgpt/video/collect",{method:"POST",body:{requestId:key}});
 assert.deepEqual(requests.map(v=>v.url),["/api/chatgpt/video/submit","/api/chatgpt/video/collect"]);
 assert.ok(requests.every(v=>v.method==="POST"));
 const off=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",
   fetchImpl:async()=>{throw new Error("Unexpected call")}});
 await assert.rejects(off("/api/chatgpt/video/submit",{method:"POST",body:{}}),/Operation not enabled/);
 await assert.rejects(off("/api/chatgpt/video/collect",{method:"POST",body:{}}),/Operation not enabled/);
});
test("video polling permits only owned-shaped opaque request keys",async()=>{
 let polls=0;
 const client=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",fetchImpl:async(url,options)=>{
   polls++; assert.equal(options.method,"GET");
   assert.equal(options.headers.authorization,"Bearer test-token");
   return new Response(JSON.stringify({status:"IN_PROGRESS"}),{status:200});
 }});
 assert.equal((await (await client("/api/chatgpt/video/status/video-key-123456789")).json()).status,"IN_PROGRESS");
 for (const path of ["/api/chatgpt/video/status/bad","/api/chatgpt/video/status/video-key-123456789/extra",
  "/api/chatgpt/video/status/video-key-123456789?other=1"]) {
   await assert.rejects(client(path),/Operation not enabled/);
 }
 assert.equal(polls,1);
});

test("Help execute is isolated and status retry cannot debit",async()=>{
 const requestId="help-test-id-1234567890";
 const calls=[];
 const client=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",allowWrites:true,
   fetchImpl:async(url,options)=>{
     calls.push({path:url.pathname,method:options.method});
     return new Response(JSON.stringify({status:"complete",result:{answer:"teste"}}),{status:200});
   }});
 const executed=await client("/api/chatgpt/help/execute",{method:"POST",body:{message:"Como usar a plataforma?",requestId}});
 assert.equal((await executed.json()).status,"complete");
 const retrieved=await client(`/api/chatgpt/help/status/${requestId}`);
 assert.equal((await retrieved.json()).result.answer,"teste");
 assert.deepEqual(calls.map(c=>c.method),["POST","GET"]);
 const disabled=createIattomClient({baseUrl:"https://sandbox.example.invalid",token:"test-token",fetchImpl:async()=>{throw Error("unexpected")}});
 await assert.rejects(disabled("/api/chatgpt/help/execute",{method:"POST",body:{message:"x",requestId}}),/Operation not enabled/);
 await assert.rejects(disabled("/api/chatgpt/help/status/bad"),/Operation not enabled/);
});
