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
