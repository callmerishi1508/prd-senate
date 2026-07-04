import { generateOllamaResponse } from './ollama';
import { smartExtractJSON as extractJSON } from '../utils/smart-extractor';
import { validateAndNormalizePRD } from '../prd/validator';
import { runRepairAgent } from './repair-agent';
import { StructuredPRD } from '../prd/schema';
import { AGENT_PROMPTS } from './prompts';

export async function runHierarchicalConsensus(
  projectId: string,
  model: string,
  researchReport: any,
  draftRes: string,
  uxRes: string,
  techRes: string,
  verifyRes: string,
  sendEvent: (event: string, data: any) => void
): Promise<StructuredPRD> {
  const profile = { maxRetries: 3 };
  
  // Stage A: Research
  sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'synthesizing research' });
  const tA_start = Date.now();
  const stageARes = await generateOllamaResponse([
    { role: 'system', content: AGENT_PROMPTS.HIERARCHICAL_STAGE_A_RESEARCH },
    { role: 'user', content: `Original Research:\n${JSON.stringify(researchReport, null, 2)}` }
  ], { model, num_predict: 600, num_ctx: 2048 });
  const tA_end = Date.now();

  // Stage B: Debate
  sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'synthesizing debate' });
  const tB_start = Date.now();
  const stageBPrompt = `Draft:\n${draftRes}\n\nUX Critique:\n${uxRes}\n\nTech Critique:\n${techRes}`;
  const stageBRes = await generateOllamaResponse([
    { role: 'system', content: AGENT_PROMPTS.HIERARCHICAL_STAGE_B_DEBATE },
    { role: 'user', content: stageBPrompt }
  ], { model, num_predict: 600, num_ctx: 2048 });
  const tB_end = Date.now();

  // Stage C: Consensus
  sendEvent('agent-status', { agent: 'Hierarchical Coordinator', status: 'building consensus summary' });
  const tC_start = Date.now();
  const stageCPrompt = `Research Summary:\n${stageARes}\n\nDebate Summary:\n${stageBRes}`;
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
           if (json) break;
         } catch (e: any) {
           currentPrompt = stageDPrompt + `\n\nERROR IN PREVIOUS ATTEMPT: Your output could not be parsed as valid JSON. ${e.message}\nPlease fix the JSON and try again.`;
         }
     }
     const tD_end = Date.now();
     
     return json;
  };

  const d1 = await runD('Stage D1 (Overview & Requirements)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D1);
  const d2 = await runD('Stage D2 (Goals & Metrics)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D2);
  const d3 = await runD('Stage D3 (UX & Stories)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D3);
  const d4 = await runD('Stage D4 (Tech & Personas)', AGENT_PROMPTS.HIERARCHICAL_STAGE_D4);

  // Stage E: Assembly
  sendEvent('agent-status', { agent: 'Quality Validator', status: 'validating assembly' });
  const assembled: any = {
      ...d1,
      ...d2,
      ...d3,
      ...d4
  };

  // Schema Integrity Gate
  let { isValid, normalizedPRD, violations } = validateAndNormalizePRD(assembled);
  
  if (!isValid) {
      sendEvent('schema-violations', { violations });
      for (let r = 0; r < profile.maxRetries; r++) {
         const naturalErrors = violations.map(v => `Field ${v.field} is invalid or missing: ${v.actualType} instead of ${v.expectedType}`);
         const repairReport = { decision: "REJECT", criticalIssues: naturalErrors, summary: "Schema validation failed during Assembly." };
         sendEvent('agent-status', { agent: 'Repair Agent', status: `fixing assembly schema (Attempt ${r + 1})` });
         
         const repairedPRD = await runRepairAgent(assembled, repairReport, researchReport, model);
         const check = validateAndNormalizePRD(repairedPRD);
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
