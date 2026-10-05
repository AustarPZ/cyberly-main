'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let unexpectedNetwork = 0;
const blocked = () => { unexpectedNetwork++; throw new Error('Offline network firewall'); };
global.fetch = blocked;
for (const name of ['node:http', 'node:https']) { const mod = require(name); mod.request = blocked; mod.get = blocked; }
for (const name of ['node:net', 'node:tls']) { const mod = require(name); mod.connect = blocked; if (mod.createConnection) mod.createConnection = blocked; }
require('node:net').Socket.prototype.connect = blocked;
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(request, ...args) {
  if (/mysql|database[\\/]pool|ai\.service|ai\.repository|admin\.routes|session.store|migrate|server\.js$/.test(request)) throw new Error('DB/server import firewall');
  return originalLoad.call(this, request, ...args);
};
const gatePath = path.join(__dirname, 'ai-provider-live-gate.js');
assert.ok(fs.existsSync(gatePath), 'bounded Gate implementation is required');
const { runGate, createBoundedTransport, createLogicalGuard } = require(gatePath);
const fixtureSecret = 'offline-fixture-secret-only';
const env = { OPENAI_API_KEY: fixtureSecret, AI_LIVE_GATE_AUTHORIZED: '1' };
const args = ['--execute','--provider','openai','--model','gpt-5.4-mini','--authorization-id','R5-03-OWNER-OFFLINE-FIXTURE','--budget-usd','0.01','--candidate-sha','53aab9a51c04d70c521ee230de0fda8f5e391b3d'];
let cases=0;
const correctiveFixtureCases=[];
const remove = flag => { const out=[...args]; const i=out.indexOf(flag);out.splice(i,flag==='--execute'?1:2);return out; };
function response(status=200, text='OK') { return new Response(JSON.stringify(status===200 ? {id:'resp_fixture',object:'response',status:'completed',model:'gpt-5.4-mini',output:[{type:'message',role:'assistant',content:[{type:'output_text',text,annotations:[]}]}],usage:{input_tokens:20,output_tokens:1,total_tokens:21}} : {error:{message:fixtureSecret,type:'fixture_failure'}}),{status,headers:{'content-type':'application/json','x-request-id':'req_fixture'}}); }

// These cases catch masked successful authentication and missing/unsafe predicate diagnostics.
// Only the HTTP boundary is replaced: installed SDK and unchanged adapter remain real.
async function correctiveCases() {
  const failures=[];
  const empty={returnedModel:null,returnedModelAvailable:null,returnedModelSafe:null,requestedModelMatch:null,rawModelMatch:null,finishReasonMatch:null,responseTextMatch:null,toolCallCount:null,toolCallCountMatch:null,failedHealthChecks:[]};
  const healthy={returnedModel:'gpt-5.4-mini',returnedModelAvailable:true,returnedModelSafe:true,requestedModelMatch:true,rawModelMatch:true,finishReasonMatch:true,responseTextMatch:true,toolCallCount:0,toolCallCountMatch:true,failedHealthChecks:[]};
  const tool={type:'function_call',id:'fc_private_fixture',call_id:'call_private_fixture',name:'fixture_private_tool',arguments:'{"private":"fixture_tool_argument"}',status:'completed'};
  async function check(name, task) {
    cases++;
    try { await task(); correctiveFixtureCases.push(name); }
    catch(error) { failures.push({case:name,message:String(error.message).replaceAll(fixtureSecret,'[fixture-secret-redacted]')}); }
  }
  async function fixture(patch={}) {
    let attempts=0;
    const result=await runGate(args,env,{fetchImpl:async()=>{attempts++;const body=await response().json();return new Response(JSON.stringify({...body,...patch}),{headers:{'content-type':'application/json','x-request-id':'req_fixture'}});}});
    assert.equal(attempts,1);assert.equal(result.actualOutboundAttempts,1);assert.equal(result.retryCount,0);
    assert.equal(JSON.stringify(result).includes(fixtureSecret),false);
    return result;
  }
  function invalid(result, expected) {
    assert.equal(result.testState,'tested');assert.equal(result.authState,'valid');assert.equal(result.healthState,'fail');assert.equal(result.resultCode,'INVALID_HEALTH_RESPONSE');
    assert.deepEqual(result.healthDiagnostics,{...healthy,...expected});
  }
  await check('strict success diagnostics',async()=>{const r=await fixture();assert.equal(r.resultCode,'HEALTH_PASS');assert.equal(r.authState,'valid');assert.deepEqual(r.healthDiagnostics,healthy);assert.equal(r.gateVersion,'r5-03a-v1');});
  await check('F02 text mismatch retains valid auth',async()=>{
    const r=await fixture({output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'private_response_marker',annotations:[]}]}]});
    invalid(r,{responseTextMatch:false,failedHealthChecks:['RESPONSE_TEXT_MISMATCH']});assert.equal(JSON.stringify(r).includes('private_response_marker'),false);
  });
  await check('F01 snapshot raw model diagnostic',async()=>{
    const r=await fixture({model:'gpt-5.4-mini-2026-03-17'});
    assert.deepEqual(r.healthDiagnostics?.failedHealthChecks,['RAW_MODEL_MISMATCH']);
    invalid(r,{returnedModel:'gpt-5.4-mini-2026-03-17',rawModelMatch:false,failedHealthChecks:['RAW_MODEL_MISMATCH']});
  });
  await check('F01 actual SDK adapter function_call diagnostic',async()=>{
    const base=await response().json();const r=await fixture({output:[...base.output,tool]});
    assert.deepEqual(r.healthDiagnostics?.failedHealthChecks,['TOOL_CALL_MISMATCH']);
    invalid(r,{toolCallCount:1,toolCallCountMatch:false,failedHealthChecks:['TOOL_CALL_MISMATCH']});
    for(const value of ['fixture_private_tool','fixture_tool_argument','fc_private_fixture','call_private_fixture']) assert.equal(JSON.stringify(r).includes(value),false);
  });
  await check('incomplete finish diagnostic',async()=>{const r=await fixture({status:'incomplete'});invalid(r,{finishReasonMatch:false,failedHealthChecks:['FINISH_REASON_MISMATCH']});assert.equal(r.finishReason,'incomplete');});
  await check('ordered simultaneous mismatches',async()=>{
    const r=await fixture({model:'snapshot',status:'incomplete',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'different',annotations:[]}]},tool]});
    invalid(r,{returnedModel:'snapshot',rawModelMatch:false,finishReasonMatch:false,responseTextMatch:false,toolCallCount:1,toolCallCountMatch:false,failedHealthChecks:['RAW_MODEL_MISMATCH','FINISH_REASON_MISMATCH','RESPONSE_TEXT_MISMATCH','TOOL_CALL_MISMATCH']});
  });
  const unsafe=['model\u4e2d','x'.repeat(129),'prefix:'+fixtureSecret,'https://model.example','bad/model','bad\\model','bad model','bad\nmodel','bad\x00model','bad\tmodel','bad-final-newline\n'];
  for(let i=0;i<unsafe.length;i++) await check(`unsafe model identifier ${i+1}`,async()=>{const r=await fixture({model:unsafe[i]});invalid(r,{returnedModel:null,returnedModelAvailable:true,returnedModelSafe:false,rawModelMatch:false,failedHealthChecks:['RAW_MODEL_MISMATCH']});assert.equal(JSON.stringify(r).includes(JSON.stringify(unsafe[i]).slice(1,-1)),false);});
  await check('missing raw model',async()=>{const r=await fixture({model:null});invalid(r,{returnedModel:null,returnedModelAvailable:false,returnedModelSafe:null,rawModelMatch:false,failedHealthChecks:['RAW_MODEL_MISMATCH']});});
  await check('safe model identifier maximum length',async()=>{const value='A_0.-:'.repeat(21)+'Ab';const r=await fixture({model:value});invalid(r,{returnedModel:value,rawModelMatch:false,failedHealthChecks:['RAW_MODEL_MISMATCH']});});
  await check('normalized tool count capped at 99',async()=>{const base=await response().json();const r=await fixture({output:[...base.output,...Array.from({length:100},(_,i)=>({...tool,id:`fc_${i}`,call_id:`call_${i}`}))]});invalid(r,{toolCallCount:99,toolCallCountMatch:false,failedHealthChecks:['TOOL_CALL_MISMATCH']});});
  for(const status of [401,403,429,500,503]) await check(`HTTP ${status} unevaluated diagnostics`,async()=>{const r=await runGate(args,env,{fetchImpl:async()=>response(status)});assert.equal(r.authState,status===401||status===403?'invalid':'unknown');assert.equal(r.healthState,'fail');assert.deepEqual(r.healthDiagnostics,empty);assert.equal(r.actualOutboundAttempts,1);assert.equal(r.retryCount,0);});
  for(const [name,error] of [['timeout',Object.assign(new Error(fixtureSecret),{name:'AbortError'})],['network',new Error(fixtureSecret)]]) await check(`${name} unevaluated diagnostics`,async()=>{const r=await runGate(args,env,{fetchImpl:async()=>{throw error;}});assert.equal(r.authState,'unknown');assert.equal(r.healthState,'fail');assert.deepEqual(r.healthDiagnostics,empty);assert.equal(r.actualOutboundAttempts,1);assert.equal(r.retryCount,0);});
  await check('preflight refusal unevaluated diagnostics',async()=>{const r=await runGate([],{}, {fetchImpl:blocked});assert.equal(r.authState,'not_tested');assert.equal(r.healthState,'not_tested');assert.equal(r.actualOutboundAttempts,0);assert.deepEqual(r.healthDiagnostics,empty);});
  // Configuration-derived adapter model cannot mismatch through the real HTTP path.
  // Wrap the real adapter only for this isolated adversarial predicate case.
  await check('all five mismatches ordered including adapter model',async()=>{
    const providerPath=require.resolve('../src/ai/providers/openai.provider');const oldProvider=require.cache[providerPath];const oldGate=require.cache[gatePath];
    try {
      require.cache[providerPath]={...oldProvider,exports:{...oldProvider.exports,createOpenAiProvider(config){const provider=oldProvider.exports.createOpenAiProvider(config);return {...provider,async generate(request){return {...await provider.generate(request),model:'adapter-model-mismatch'};}};}}};
      delete require.cache[gatePath];const alteredGate=require(gatePath).runGate;
      const r=await alteredGate(args,env,{fetchImpl:async()=>{const body=await response().json();return new Response(JSON.stringify({...body,model:'snapshot',status:'incomplete',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'different',annotations:[]}]},tool]}),{headers:{'content-type':'application/json'}});}});
      invalid(r,{returnedModel:'snapshot',requestedModelMatch:false,rawModelMatch:false,finishReasonMatch:false,responseTextMatch:false,toolCallCount:1,toolCallCountMatch:false,failedHealthChecks:['REQUESTED_MODEL_MISMATCH','RAW_MODEL_MISMATCH','FINISH_REASON_MISMATCH','RESPONSE_TEXT_MISMATCH','TOOL_CALL_MISMATCH']});
    } finally {require.cache[providerPath]=oldProvider;require.cache[gatePath]=oldGate;}
  });
  if(failures.length) {console.log(JSON.stringify({result:'RED',failures,unexpectedRealNetworkAttempts:unexpectedNetwork,liveProviderCalls:{openai:0,gemini:0,ilmu:0}}));throw new Error(`${failures.length} corrective expectations failed`);}
}

async function run() {
  for (const flag of ['--execute','--provider','--model','--authorization-id','--budget-usd']) {
    const result=await runGate(remove(flag),env,{fetchImpl:blocked});
    assert.equal(result.healthState,'not_tested');assert.equal(result.actualOutboundAttempts,0);cases++;
  }
  const noEnv=await runGate(args,{...env,AI_LIVE_GATE_AUTHORIZED:undefined},{fetchImpl:blocked});assert.equal(noEnv.resultCode,'NOT_AUTHORIZED');assert.equal(noEnv.logicalCallsAuthorized,0);assert.equal(noEnv.transportAttemptsAuthorized,0);cases++;
  for (const id of ['gemini','ilmu']) {const alt=[...args];alt[alt.indexOf('--provider')+1]=id;const result=await runGate(alt,env,{fetchImpl:blocked});assert.equal(result.resultCode,'PROVIDER_NOT_YET_HARDENED');assert.equal(result.actualOutboundAttempts,0);cases++;}
  const unknown=[...args];unknown[unknown.indexOf('--model')+1]='unknown-model';assert.equal((await runGate(unknown,env,{fetchImpl:blocked})).resultCode,'UNKNOWN_MODEL_PRICING');cases++;
  const tiny=[...args];tiny[tiny.indexOf('--budget-usd')+1]='0.00000001';assert.equal((await runGate(tiny,env,{fetchImpl:blocked})).actualOutboundAttempts,0);cases++;
  for (const extra of [['--prompt','anything'],['--max-output-tokens','17'],['--provider','ilmu']]) {assert.equal((await runGate([...args,...extra],env,{fetchImpl:blocked})).actualOutboundAttempts,0);cases++;}
  let requests=0;
  const success=await runGate(args,env,{fetchImpl:async(url,options)=>{
    requests++;assert.equal(String(url),'https://api.openai.com/v1/responses');assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
    const body=JSON.parse(options.body);assert.equal(body.model,'gpt-5.4-mini');assert.equal(body.max_output_tokens,16);assert.equal(body.store,false);assert.equal(body.text,undefined);assert.equal(body.tools,undefined);
    assert.equal(body.instructions,'Cyberly internal provider health check. Reply with OK.');assert.deepEqual(body.input,[{role:'user',content:'Reply with OK.'}]);return response();
  }});
  assert.equal(requests,1);assert.equal(success.logicalCallsActual,1);assert.equal(success.actualOutboundAttempts,1);assert.equal(success.authState,'valid');assert.equal(success.healthState,'pass');assert.equal(success.providerResponseId,'resp_fixture');assert.equal(success.httpRequestId,'req_fixture');assert.equal(success.retryCount,0);assert.equal(success.maxRetries,0);assert.equal(success.testState,'tested');assert.equal(JSON.stringify(success).includes(fixtureSecret),false);cases++;
  for (const status of [401,403,429,500]) {
    let attempts=0;const result=await runGate(args,env,{fetchImpl:async()=>{attempts++;return response(status);}});
    assert.equal(attempts,1,'SDK must not retry eligible failures');assert.equal(result.healthState,'fail');assert.equal(result.authState,status===401||status===403?'invalid':'unknown');assert.equal(JSON.stringify(result).includes(fixtureSecret),false);cases++;
  }
  for (const error of [Object.assign(new Error(fixtureSecret),{name:'AbortError'}),new Error(fixtureSecret)]) {const result=await runGate(args,env,{fetchImpl:async()=>{throw error;}});assert.equal(result.authState,'unknown');assert.equal(result.healthState,'fail');assert.equal(result.actualOutboundAttempts,1);assert.equal(JSON.stringify(result).includes(fixtureSecret),false);cases++;}
  const invalid=await runGate(args,env,{fetchImpl:async()=>response(200,'Unexpected')});assert.equal(invalid.healthState,'fail');cases++;
  for (const url of ['https://evil.example/v1/responses','http://api.openai.com/v1/responses','https://api.openai.com/v1/chat/completions','https://api.openai.com/v1/responses?x=1','https://api.openai.com:444/v1/responses','https://user@api.openai.com/v1/responses']) {const counters={transportInvocationCount:0,actualOutboundAttemptCount:0};const transport=createBoundedTransport({fetchImpl:blocked,counters});await assert.rejects(()=>transport(url,{method:'POST'}));assert.equal(counters.actualOutboundAttemptCount,0);cases++;}
  {const counters={transportInvocationCount:0,actualOutboundAttemptCount:0};let outbound=0;const transport=createBoundedTransport({counters,fetchImpl:async()=>{outbound++;return response();}});await transport('https://api.openai.com/v1/responses',{method:'POST'});await assert.rejects(()=>transport('https://api.openai.com/v1/responses',{method:'POST'}),e=>e.code==='TRANSPORT_ATTEMPT_LIMIT');assert.equal(outbound,1);assert.equal(counters.transportInvocationCount,2);assert.equal(counters.actualOutboundAttemptCount,1);cases++;}
  {const counters={logicalCallCount:0};const logical=createLogicalGuard(counters);let calls=0;await logical(async()=>{calls++;});await assert.rejects(()=>logical(async()=>{calls++;}),e=>e.code==='LOGICAL_CALL_LIMIT');assert.equal(calls,1);cases++;}
  const {createProviderRegistry}=require('../src/ai/providers/aiProvider.registry');const status=createProviderRegistry({env:{OPENAI_API_KEY:fixtureSecret,GEMINI_API_KEY:fixtureSecret}}).getSafeStatus();assert.equal(status.providers.find(p=>p.id==='openai').lastRuntimeStatus,'not_tested');assert.equal(status.providers.find(p=>p.id==='gemini').lastRuntimeError,'AI_RUNTIME_DISABLED');cases++;
  for (const method of ['GET','PUT']) {const counters={transportInvocationCount:0,actualOutboundAttemptCount:0};await assert.rejects(()=>createBoundedTransport({fetchImpl:blocked,counters})('https://api.openai.com/v1/responses',{method}));assert.equal(counters.actualOutboundAttemptCount,0);cases++;}
  {let calls=0;const result=await runGate(args,env,{fetchImpl:async()=>{calls++;const r=response();const body=await r.json();body.model='wrong-model';return new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});}});assert.equal(result.healthState,'fail');assert.equal(calls,1);cases++;}
  {const result=await runGate(args,env,{fetchImpl:async()=>{const r=response();const body=await r.json();delete body.usage;return new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});}});assert.equal(result.usage,null);assert.equal(result.estimatedCostUsd,null);cases++;}
  {const providerPath=require.resolve('../src/ai/providers/openai.provider');const sdkPath=require.resolve('openai');const oldProvider=require.cache[providerPath];const oldSdk=require.cache[sdkPath];const options=[];try {require.cache[sdkPath]={id:sdkPath,filename:sdkPath,loaded:true,exports:class{constructor(value){options.push(value);}}};delete require.cache[providerPath];const {createOpenAiProvider}=require(providerPath);createOpenAiProvider({apiKey:fixtureSecret,model:'gpt-5.4-mini'});createOpenAiProvider({apiKey:fixtureSecret,model:'gpt-5.4-mini',maxRetries:0,fetchImpl:blocked});assert.equal(Object.hasOwn(options[0],'maxRetries'),false);assert.equal(Object.hasOwn(options[0],'fetch'),false);assert.equal(options[1].maxRetries,0);assert.equal(options[1].fetch,blocked);}finally{require.cache[sdkPath]=oldSdk;require.cache[providerPath]=oldProvider;}cases++;}
  for (const blockedEnv of [{...env,OPENAI_API_KEY:undefined},{...env,AI_PROVIDER_RUNTIME_DISABLED:'openai'}]) {const result=await runGate(args,blockedEnv,{fetchImpl:blocked});assert.equal(result.actualOutboundAttempts,0);assert.equal(result.authState,'not_tested');assert.equal(result.healthState,'not_tested');cases++;}
  {const result=await runGate(args,env,{fetchImpl:async()=>{const r=response();const body=await r.json();body.usage={};return new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});}});assert.equal(result.usage,null);assert.equal(result.estimatedCostUsd,null);cases++;}
  {const result=await runGate(args,env,{fetchImpl:async()=>{const r=response();const body=await r.json();body.usage.output_tokens=17;body.usage.total_tokens=37;return new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});}});assert.equal(result.resultCode,'BUDGET_OR_USAGE_EXCEEDED');assert.equal(result.healthState,'fail');cases++;}
  {let attempts=0;const result=await runGate(args,env,{fetchImpl:async()=>{attempts++;return new Response(null,{status:302,headers:{location:'https://evil.example/'}});}});assert.equal(attempts,1);assert.equal(result.healthState,'fail');assert.equal(result.authState,'unknown');cases++;}
  await correctiveCases();
  assert.equal(unexpectedNetwork,0);
  console.log(JSON.stringify({result:'PASS',cases,correctiveFixtureCases,unexpectedRealNetworkAttempts:unexpectedNetwork,liveProviderCalls:{openai:0,gemini:0,ilmu:0},note:'All successful/failure results are in-memory fixtures, not live certifications'}));
}
run().catch(error=>{console.error(String(error.stack || 'Offline live-gate verification failed').replaceAll(fixtureSecret, '[fixture-secret-redacted]'));process.exitCode=1;});
