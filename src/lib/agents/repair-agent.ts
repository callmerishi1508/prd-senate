import { generateOllamaResponse } from './ollama';
import { AGENT_PROMPTS } from './prompts';
import { smartExtractJSON } from '../utils/smart-extractor';

export async function runRepairAgent(prdJson: Record<string, unknown>, report: Record<string, unknown>, researchReport: Record<string, unknown>, model: string) {
  const prompt = `Target JSON Section to Repair:\n${JSON.stringify(prdJson, null, 2)}\n\nQuality Gate Report:\n${JSON.stringify(report, null, 2)}\n\nOriginal Research Report:\n${JSON.stringify(researchReport, null, 2)}\n\nIMPORTANT: Return ONLY the exact JSON structure provided in 'Target JSON Section to Repair', but with the validation errors fixed. Do not add any missing fields that are not relevant to this section.`;
  
  const res = await generateOllamaResponse([
    { role: 'system', content: AGENT_PROMPTS.REPAIR_AGENT },
    { role: 'user', content: prompt }
  ], { model, num_ctx: 4096, num_predict: 2048 });

  try {
    return smartExtractJSON(res);
  } catch (e) {
    return prdJson; // Fallback
  }
}
