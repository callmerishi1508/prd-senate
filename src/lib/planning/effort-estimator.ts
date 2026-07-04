import { Epic } from './planning-schema';
import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';

export async function estimateEffort(epics: Epic[], model: string = 'qwen2.5:1.5b'): Promise<Epic[]> {
  const epicsStr = JSON.stringify(epics.map(e => ({ id: e.id, title: e.title, description: e.description })), null, 2);

  const prompt = `${AGENT_PROMPTS.EFFORT_ESTIMATOR}\n\nEpics:\n${epicsStr}\n`;

  let parsed: any;
  try {
    const res = await generateOllamaResponse([
      { role: 'user', content: prompt }
    ], { model, format: 'json', num_ctx: 2048, num_predict: 800 });
    parsed = JSON.parse(res);
  } catch (e) {
    console.error("Effort estimation failed:", e);
    return epics;
  }

  if (parsed?.estimates) {
    for (const est of parsed.estimates) {
      const epic = epics.find(e => e.id === est.id);
      if (epic) {
        epic.estimatedEffort = est.estimatedEffort;
        epic.estimatedWeeks = est.estimatedWeeks;
        epic.confidence = est.confidence;
      }
    }
  }

  return epics;
}
