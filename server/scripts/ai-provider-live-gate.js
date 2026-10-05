'use strict';
// DB-free entry point. Never load dotenv or the server/service/registry layers.
const { createOpenAiProvider } = require('../src/ai/providers/openai.provider');
const GATE_VERSION = 'r5-03d-v1';
const MODEL_IDENTITY_POLICY_VERSION = 'openai-gpt-5.4-mini-r5-03d-v1';
// Explicit reviewed identities only; frozen, private and independent of environment.
const MODEL_IDENTITIES = Object.freeze({
  'gpt-5.4-mini': Object.freeze(['gpt-5.4-mini', 'gpt-5.4-mini-2026-03-17'])
});
const MODEL_PRICES = Object.freeze({ 'gpt-5.4-mini': { input: 0.75, output: 4.5 } });
const SYSTEM = 'Cyberly internal provider health check. Reply with OK.';
const USER = 'Reply with OK.';
function guardError(code) { return Object.assign(new Error(code), { code }); }
function createLogicalGuard(counters) {
  return async callback => {
    counters.logicalCallCount++;
    if (counters.logicalCallCount > 1) throw guardError('LOGICAL_CALL_LIMIT');
    return callback();
  };
}
function createBoundedTransport({ fetchImpl, counters }) {
  return async (input, options = {}) => {
    counters.transportInvocationCount++;
    if (counters.transportInvocationCount > 1) { counters.guardFailureCode = 'TRANSPORT_ATTEMPT_LIMIT'; throw guardError(counters.guardFailureCode); }
    let url;
    try { url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url); } catch { counters.guardFailureCode = 'DESTINATION_REJECTED'; throw guardError(counters.guardFailureCode); }
    const method = options.method || input?.method;
    if (url.protocol !== 'https:' || url.hostname !== 'api.openai.com' || url.port || url.username || url.password || url.pathname !== '/v1/responses' || url.search || url.hash || method !== 'POST') { counters.guardFailureCode = 'DESTINATION_REJECTED'; throw guardError(counters.guardFailureCode); }
    counters.actualOutboundAttemptCount++;
    return fetchImpl(input, { ...options, redirect: 'error' });
  };
}
function parseArgs(argv) {
  const values = {};
  const flags = new Set(['--execute','--provider','--model','--authorization-id','--budget-usd','--candidate-sha']);
  for (let i=0; i<argv.length; i++) {
    const flag=argv[i];
    if (!flags.has(flag) || Object.hasOwn(values, flag)) throw guardError('INVALID_ARGUMENTS');
    if (flag === '--execute') values[flag]=true;
    else { const value=argv[++i]; if (!value || value.startsWith('--')) throw guardError('INVALID_ARGUMENTS'); values[flag]=value; }
  }
  return values;
}
function safeId(value, prefix, secret) {
  return typeof value === 'string' && new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,100}$`).test(value) && !value.includes(secret) ? value : null;
}
function knownUsage(value) {
  if (!value || !['inputTokens','outputTokens','totalTokens'].every(key=>Number.isSafeInteger(value[key]) && value[key]>=0)) return null;
  return { inputTokens:value.inputTokens, outputTokens:value.outputTokens, totalTokens:value.totalTokens };
}
// Diagnostic values never include response text or normalized tool payloads.
function healthDiagnostics(response, requestedModel, secret) {
  const rawModel=response.rawMetadata?.model;
  const available=rawModel!==undefined && rawModel!==null;
  const safe=available ? typeof rawModel==='string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(rawModel) && !rawModel.includes(secret) : null;
  const modelIdentityAccepted=Boolean(safe && Object.hasOwn(MODEL_IDENTITIES,requestedModel) && MODEL_IDENTITIES[requestedModel].includes(rawModel));
  const approvedSnapshotMatch=modelIdentityAccepted && rawModel!==requestedModel;
  const toolCount=Array.isArray(response.toolCalls) ? response.toolCalls.length : 0;
  const diagnostics={returnedModel:safe ? rawModel : null,returnedModelAvailable:available,returnedModelSafe:safe,requestedModelMatch:response.model===requestedModel,rawModelMatch:rawModel===requestedModel,modelIdentityPolicyVersion:MODEL_IDENTITY_POLICY_VERSION,modelIdentityAccepted,approvedSnapshotMatch,finishReasonMatch:response.finishReason==='completed',responseTextMatch:String(response.text||'').trim()==='OK',toolCallCount:Math.min(toolCount,99),toolCallCountMatch:toolCount===0,failedHealthChecks:[]};
  const checks=[['requestedModelMatch','REQUESTED_MODEL_MISMATCH'],['modelIdentityAccepted','MODEL_IDENTITY_POLICY_MISMATCH'],['finishReasonMatch','FINISH_REASON_MISMATCH'],['responseTextMatch','RESPONSE_TEXT_MISMATCH'],['toolCallCountMatch','TOOL_CALL_MISMATCH']];
  diagnostics.failedHealthChecks=checks.filter(([field])=>!diagnostics[field]).map(([,code])=>code);
  return diagnostics;
}
async function runGate(argv, env = process.env, { fetchImpl = global.fetch } = {}) {
  const started=Date.now();
  const counters={logicalCallCount:0,transportInvocationCount:0,actualOutboundAttemptCount:0};
  const result={gateVersion:GATE_VERSION,authorizationId:null,provider:null,model:null,purpose:'bounded_provider_health',candidateGitSha:null,configured:false,enabled:false,testState:'not_tested',authState:'not_tested',healthState:'not_tested',logicalCallsAuthorized:0,logicalCallsActual:0,transportAttemptsAuthorized:0,transportInvocationsActual:0,actualOutboundAttempts:0,maxOutputTokens:16,maxRetries:0,usage:null,estimatedCostUsd:null,providerReportedCostUsd:null,authorizedBudgetUsd:null,latencyMs:0,providerResponseId:null,providerResponseIdAvailable:false,httpRequestId:null,httpRequestIdAvailable:false,finishReason:null,healthDiagnostics:{returnedModel:null,returnedModelAvailable:null,returnedModelSafe:null,requestedModelMatch:null,rawModelMatch:null,modelIdentityPolicyVersion:MODEL_IDENTITY_POLICY_VERSION,modelIdentityAccepted:null,approvedSnapshotMatch:null,finishReasonMatch:null,responseTextMatch:null,toolCallCount:null,toolCallCountMatch:null,failedHealthChecks:[]},resultCode:'NOT_AUTHORIZED',retryCount:0,unexpectedDuplicateAttempt:false,timestamp:null};
  let key='';
  try {
    const opts=parseArgs(argv);
    if (!opts['--execute'] || env.AI_LIVE_GATE_AUTHORIZED !== '1') throw guardError('NOT_AUTHORIZED');
    const authorizationId=opts['--authorization-id'];
    if (!authorizationId || !/^[A-Za-z][A-Za-z0-9_-]{0,95}$/.test(authorizationId) || /^(sk-|AIza)/.test(authorizationId)) throw guardError('AUTHORIZATION_ID_REQUIRED');
    if (!['openai','gemini','ilmu'].includes(opts['--provider'])) throw guardError('PROVIDER_REQUIRED');
    if (!opts['--model']) throw guardError('MODEL_REQUIRED');
    if (!Object.hasOwn(MODEL_PRICES, opts['--model']) && opts['--provider']==='openai') throw guardError('UNKNOWN_MODEL_PRICING');
    const budget=Number(opts['--budget-usd']);
    if (!opts['--budget-usd'] || !/^\d+(\.\d+)?$/.test(opts['--budget-usd']) || !Number.isFinite(budget) || budget<=0) throw guardError('BUDGET_REQUIRED');
    if (opts['--candidate-sha'] && !/^[a-f0-9]{40}$/.test(opts['--candidate-sha'])) throw guardError('CANDIDATE_SHA_INVALID');
    result.authorizationId=authorizationId;result.provider=opts['--provider'];result.authorizedBudgetUsd=budget;result.candidateGitSha=opts['--candidate-sha']||null;
    if (result.provider!=='openai') throw guardError('PROVIDER_NOT_YET_HARDENED');
    result.model=opts['--model'];
    key=String(env.OPENAI_API_KEY||'').trim();
    if (authorizationId===key) {result.authorizationId=null;throw guardError('AUTHORIZATION_ID_REQUIRED');}
    result.configured=Boolean(key);
    const disabled=String(env.AI_PROVIDER_RUNTIME_DISABLED===undefined?'gemini':env.AI_PROVIDER_RUNTIME_DISABLED).split(',').map(id=>id.trim().toLowerCase());
    result.enabled=!disabled.includes('openai');
    if (!result.configured) throw guardError('AI_PROVIDER_NOT_CONFIGURED');
    if (!result.enabled) throw guardError('AI_RUNTIME_DISABLED');
    if (typeof fetchImpl!=='function') throw guardError('TRANSPORT_UNAVAILABLE');
    // Conservative planning allowance, not a guarantee of provider billing.
    const prices=MODEL_PRICES[result.model];
    const reserve=(1024*prices.input+16*prices.output)/1000000;
    if (budget<reserve) throw guardError('BUDGET_INSUFFICIENT');
    result.logicalCallsAuthorized=1;
    result.transportAttemptsAuthorized=1;
    const transport=createBoundedTransport({fetchImpl,counters});
    const provider=createOpenAiProvider({apiKey:key,model:result.model,maxRetries:0,fetchImpl:transport,timeoutMs:20000,maxOutputTokens:16});
    const logical=createLogicalGuard(counters);
    result.testState='tested';result.authState='unknown';result.healthState='fail';
    const response=await logical(()=>provider.generate({systemInstruction:SYSTEM,messages:[{role:'user',content:USER}],maxOutputTokens:16,tools:[],metadata:{purpose:result.purpose}}));
    result.authState='valid';
    result.healthDiagnostics=healthDiagnostics(response,result.model,key);
    if (counters.logicalCallCount!==1 || counters.actualOutboundAttemptCount!==1 || counters.transportInvocationCount!==1) throw guardError('CALL_ACCOUNTING_MISMATCH');
    result.providerResponseId=safeId(response.providerResponseId,'resp',key);result.httpRequestId=safeId(response.httpRequestId,'req',key);
    result.finishReason=['completed','incomplete','failed'].includes(response.finishReason)?response.finishReason:null;
    result.usage=response.rawMetadata?.usageAvailable ? knownUsage(response.usage) : null;
    if (result.usage) {
      result.estimatedCostUsd=Number(((result.usage.inputTokens*prices.input+result.usage.outputTokens*prices.output)/1000000).toFixed(8));
      if (result.usage.outputTokens>16 || result.estimatedCostUsd>budget) throw guardError('BUDGET_OR_USAGE_EXCEEDED');
    }
    if (result.healthDiagnostics.failedHealthChecks.length) throw guardError('INVALID_HEALTH_RESPONSE');
    result.healthState='pass';result.resultCode='HEALTH_PASS';
  } catch (error) {
    const allowed=new Set(['NOT_AUTHORIZED','INVALID_ARGUMENTS','AUTHORIZATION_ID_REQUIRED','PROVIDER_REQUIRED','MODEL_REQUIRED','UNKNOWN_MODEL_PRICING','BUDGET_REQUIRED','CANDIDATE_SHA_INVALID','PROVIDER_NOT_YET_HARDENED','AI_PROVIDER_NOT_CONFIGURED','AI_RUNTIME_DISABLED','TRANSPORT_UNAVAILABLE','BUDGET_INSUFFICIENT','DESTINATION_REJECTED','TRANSPORT_ATTEMPT_LIMIT','LOGICAL_CALL_LIMIT','CALL_ACCOUNTING_MISMATCH','BUDGET_OR_USAGE_EXCEEDED','INVALID_HEALTH_RESPONSE','AI_AUTH_FAILED','AI_RATE_LIMITED','AI_PROVIDER_TIMEOUT','AI_PROVIDER_UNAVAILABLE','AI_REQUEST_FAILED']);
    const failureCode = counters.guardFailureCode || error.code;
    result.resultCode=allowed.has(failureCode)?failureCode:'GATE_FAILED';
    if (result.testState==='tested' && result.resultCode==='AI_AUTH_FAILED') result.authState='invalid';
    if (counters.actualOutboundAttemptCount===0) {result.testState='not_tested';result.authState='not_tested';result.healthState='not_tested';}
  }
  result.logicalCallsActual=counters.logicalCallCount;result.transportInvocationsActual=counters.transportInvocationCount;result.actualOutboundAttempts=counters.actualOutboundAttemptCount;
  result.unexpectedDuplicateAttempt=counters.transportInvocationCount>1;result.retryCount=Math.max(0,counters.actualOutboundAttemptCount-1);
  result.providerResponseIdAvailable=Boolean(result.providerResponseId);result.httpRequestIdAvailable=Boolean(result.httpRequestId);result.latencyMs=Date.now()-started;result.timestamp=new Date().toISOString();
  return result;
}
if (require.main===module) {
  runGate(process.argv.slice(2)).then(result=>{process.stdout.write(`${JSON.stringify(result)}\n`);if(result.resultCode!=='HEALTH_PASS') process.exitCode=1;}).catch(()=>{process.stdout.write(JSON.stringify({gateVersion:GATE_VERSION,resultCode:'GATE_FAILED',actualOutboundAttempts:0})+'\n');process.exitCode=1;});
}
module.exports={runGate,createBoundedTransport,createLogicalGuard};
