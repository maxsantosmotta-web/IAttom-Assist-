import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server=readFileSync(new URL("./server-official.js",import.meta.url),"utf8");
const client=readFileSync(new URL("./iattom-client.js",import.meta.url),"utf8");
const features=[
  "product_discovery","product_validation","campaign","content","video_script",
  "prompt_creation","creativeImage1","creativeImage2","creativeImage3",
];

test("MCP presents all nine backend operational modules",()=>{
  const execute=server.match(/server\.registerTool\("executar_modulo_iattom",[\s\S]*?inputSchema:\s*\{[\s\S]*?feature:\s*z\.enum\(\[([^\]]+)\]\)/);
  assert.ok(execute,"Missing executable module enum");
  const listed=[...execute[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(listed,features);
});
test("MCP tool only calls atomic API, never website billing endpoints",()=>{
  assert.match(server,/CHATGPT_MCP_WRITES_ENABLED === "true"/);
  assert.match(server,/operationsBase\.origin === accountBase\.origin/);
  assert.match(server,/allowWrites: true/);
  assert.match(client,/const operationPaths = new Set/);
  for(const route of ["operations/execute","help/execute","video/submit","video/collect"]){
    assert.match(client,new RegExp("/api/chatgpt/"+route));
  }
  assert.doesNotMatch(server,/createIattomClient\([^\n]+\)\("\/api\/credits\/use"/);
});
test("operator previews do not enable mutations without isolated origin flag",()=>{
  assert.match(server,/if \(process\.env\.CHATGPT_MCP_WRITES_ENABLED === "true" && process\.env\.IATTOM_OPERATION_API_URL\)/);
  assert.match(client,/method !== "POST" \|\| !allowWrites \|\| !operationPaths\.has\(path\)/);
});
