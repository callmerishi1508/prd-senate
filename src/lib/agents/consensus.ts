import { generateOllamaResponse } from './ollama';
import { smartExtractJSON as extractJSON } from '../utils/smart-extractor';
import { validateAndNormalizePRD } from '../prd/validator';
import { runRepairAgent } from './repair-agent';
import { StructuredPRD } from '../prd/schema';
import { AGENT_PROMPTS } from './prompts';
import { compressResearch, compressDraft, compressUXCritique, compressTechCritique } from './context-compressor';
import { logTokenEvent, logRetryEvent } from '../telemetry/telemetry-manager';

export async function runHierarchicalConsensus(
  projectId: string,
  model: string,
  researchReport: any,
  draftRes: string,
  uxRes: string,
  techRes: string,
  verifyRes: string,
  sendEvent: (event: string, data: any) => void,
  pipelineProfile: "legacy" | "simplified" = "simplified"
): Promise<StructuredPRD> {
  const profile = { maxRetries: 3 };
  
  let stageARes = "";
  let stageBRes = "";
  
  if (pipelineProfile === "legacy") {
    // Stage A: Research
    sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'synthesizing research' });
    stageARes = await generateOllamaResponse([
      { role: 'system', content: AGENT_PROMPTS.HIERARCHICAL_STAGE_A_RESEARCH },
      { role: 'user', content: `Original Research:\n${JSON.stringify(researchReport, null, 2)}` }
    ], { model, num_predict: 600, num_ctx: 2048 });

    // Stage B: Debate
    sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'synthesizing debate' });
    const stageBPrompt = `Draft:\n${draftRes}\n\nUX Critique:\n${uxRes}\n\nTech Critique:\n${techRes}`;
    stageBRes = await generateOllamaResponse([
      { role: 'system', content: AGENT_PROMPTS.HIERARCHICAL_STAGE_B_DEBATE },
      { role: 'user', content: stageBPrompt }
    ], { model, num_predict: 600, num_ctx: 2048 });
  }

  // Stage C: Consensus
  sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'building consensus summary' });
  const tC_start = Date.now();
  
  let stageCPrompt = "";
  if (pipelineProfile === "simplified") {
      const researchData = compressResearch(researchReport);
      const draftData = compressDraft(draftRes);
      const uxData = compressUXCritique(uxRes);
      const techData = compressTechCritique(techRes);
      
      const ts = new Date().toISOString();
      logTokenEvent({ projectId, model, stage: 'Compress_Research', timestamp: ts, fidelity: researchData.fidelity });
      logTokenEvent({ projectId, model, stage: 'Compress_Draft', timestamp: ts, fidelity: draftData.fidelity });
      logTokenEvent({ projectId, model, stage: 'Compress_UX', timestamp: ts, fidelity: uxData.fidelity });
      logTokenEvent({ projectId, model, stage: 'Compress_Tech', timestamp: ts, fidelity: techData.fidelity });

      const sir = {
        market: researchData.compressed,
        features: draftData.compressed,
        uxConstraints: uxData.compressed,
        techConstraints: techData.compressed
      };
      
      stageCPrompt = `Structured Intermediate Representation:\n${JSON.stringify(sir, null, 2)}`;
  } else {
      stageCPrompt = `Research Summary:\n${stageARes}\n\nDebate Summary:\n${stageBRes}`;
  }
    
  const consensusSummary = await generateOllamaResponse([
    { role: 'system', content: AGENT_PROMPTS.HIERARCHICAL_STAGE_C_CONSENSUS },
    { role: 'user', content: stageCPrompt }
  ], { model, num_predict: 800, num_ctx: 2048 });
  const tC_end = Date.now();

  // Stage D Helpers
  const runD = async (stageName: string, systemPrompt: string) => {
     sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: `generating ${stageName}` });
     const tD_start = Date.now();
     const stageDPrompt = `Consensus Summary:\n${consensusSummary}`;
     
     let json: any = {};
     let currentPrompt = stageDPrompt;
     for (let i = 0; i < profile.maxRetries; i++) {
         const rawJson = await generateOllamaResponse([
           { role: 'system', content: systemPrompt },
           { role: 'user', content: currentPrompt }
         ], { model, num_predict: 800, num_ctx: 1024 });
         
         try {
           json = extractJSON(rawJson);
           if (json) {
               logRetryEvent({
                 projectId, model, stage: stageName, timestamp: new Date().toISOString(),
                 retryNumber: i, reason: i > 0 ? 'Parsing Succeeded after Retries' : 'First Pass Success',
                 validatorMessage: 'None', repairPrompt: currentPrompt, repairOutput: rawJson, success: true
               }).catch(() => {});
               break;
           }
         } catch (e: any) {
           logRetryEvent({
             projectId, model, stage: stageName, timestamp: new Date().toISOString(),
             retryNumber: i, reason: 'JSON Parse Failure',
             validatorMessage: e.message, repairPrompt: currentPrompt, repairOutput: rawJson, success: false
           }).catch(() => {});
           currentPrompt = stageDPrompt + `\n\nERROR IN PREVIOUS ATTEMPT: Your output could not be parsed as valid JSON. ${e.message}\nPlease fix the JSON and try again.`;
         }
     }
     const tD_end = Date.now();
     
     return json;
  };

  let assembled: any = {};
  
  if (pipelineProfile === "simplified") {
      // Reverted D-Alpha and D-Beta merge due to validation failures on 7b. 
      // Falling back to D1-D4 while keeping A/B bypass.
      const d1 = await runD('Stage D1 (Overview & Requirements)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D1);
      const d2 = await runD('Stage D2 (Goals & Metrics)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D2);
      const d3 = await runD('Stage D3 (UX & Stories)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D3);
      const d4 = await runD('Stage D4 (Tech & Personas)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D4);
      assembled = { ...d1, ...d2, ...d3, ...d4 };
  } else {
      const d1 = await runD('Stage D1 (Overview & Requirements)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D1);
      const d2 = await runD('Stage D2 (Goals & Metrics)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D2);
      const d3 = await runD('Stage D3 (UX & Stories)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D3);
      const d4 = await runD('Stage D4 (Tech & Personas)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D4);
      assembled = { ...d1, ...d2, ...d3, ...d4 };
  }

  // Schema Integrity Gate
  sendEvent('agent-status', { agent: 'Quality Validator', status: 'validating assembly' });
  let { isValid, normalizedPRD, violations } = validateAndNormalizePRD(assembled);
  
  if (!isValid) {
      sendEvent('schema-violations', { violations });
      const alphaKeys = ['problemStatement', 'targetUsers', 'constraints', 'functionalRequirements', 'nonFunctionalRequirements'];
      const betaKeys = ['businessGoals', 'userStories', 'userPersonas'];
      
      for (let r = 0; r < profile.maxRetries; r++) {
         const failedKeys = violations.map(v => v.field);
         const failedAlpha = failedKeys.some(k => alphaKeys.includes(k));
         const failedBeta = failedKeys.some(k => betaKeys.includes(k));
         
         let repairTargets: any = {};
         let sectionName = 'whole document';
         if (failedAlpha && !failedBeta && pipelineProfile === "simplified") {
            alphaKeys.forEach(k => { repairTargets[k] = assembled[k] });
            sectionName = 'Stage D1 (Overview)';
         } else if (failedBeta && !failedAlpha && pipelineProfile === "simplified") {
            betaKeys.forEach(k => { repairTargets[k] = assembled[k] });
            sectionName = 'Stage D2/D3/D4';
         } else {
            repairTargets = assembled;
         }

         const naturalErrors = violations.map(v => `Field ${v.field} is invalid or missing: ${v.actualType} instead of ${v.expectedType}`);
         const repairReport = { decision: "REJECT", criticalIssues: naturalErrors, summary: `Schema validation failed in ${sectionName}.` };
         sendEvent('agent-status', { agent: 'Repair Agent', status: `fixing ${sectionName} schema (Attempt ${r + 1})` });
         
         const repairedPart = await runRepairAgent(repairTargets, repairReport, researchReport, model);
         assembled = { ...assembled, ...repairedPart };
         
         const check = validateAndNormalizePRD(assembled);
         logRetryEvent({
             projectId, model, stage: 'Schema Repair', timestamp: new Date().toISOString(),
             retryNumber: r, reason: 'Validation Failure',
             validatorMessage: repairReport.summary, repairPrompt: JSON.stringify(repairTargets), repairOutput: JSON.stringify(repairedPart), success: check.isValid
         }).catch(() => {});

         if (check.isValid) {
             isValid = true;
             normalizedPRD = check.normalizedPRD;
             break;
         }
         violations = check.violations;
      }
  }

  if (!isValid || !normalizedPRD) {
      throw new Error("Hierarchical Assembly Failed validation gates after max retries.");
  }

  return normalizedPRD as StructuredPRD;
}
