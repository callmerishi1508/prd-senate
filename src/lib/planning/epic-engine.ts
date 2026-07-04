import { StructuredPRD } from '../prd/schema';
import { Epic } from './planning-schema';
import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';

export async function generateEpics(prd: StructuredPRD, model: string = 'qwen2.5:1.5b'): Promise<Epic[]> {
  const reqsStr = (prd.functionalRequirements || []).map(r => `[${r.id}] ${r.description} (Purpose: ${r.purpose})`).join('\n');
  const storiesStr = (prd.userStories || []).map(s => `[${s.id}] ${s.title}: ${s.description}`).join('\n');

  const prompt = `${AGENT_PROMPTS.EPIC_GENERATOR}\n\nFunctional Requirements:\n${reqsStr}\n\nUser Stories:\n${storiesStr}\n`;

  let parsed: any;
  try {
    const res = await generateOllamaResponse([
      { role: 'user', content: prompt }
    ], { model, format: 'json', num_ctx: 2048, num_predict: 800 });
    parsed = JSON.parse(res);
  } catch (e) {
    console.error("Epic generation failed:", e);
    return [];
  }

  return parsed?.epics || [];
}
