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
