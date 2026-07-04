import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { PlanningArtifacts } from '../planning/planning-schema';
import { validatePlanningProgrammatically } from '../planning/planning-validator';

export async function runPlanningQualityGate(
  artifacts: PlanningArtifacts,
  model: string = 'qwen2.5:1.5b'
) {
  const programmaticIssues = validatePlanningProgrammatically(artifacts);

  const prompt = `${AGENT_PROMPTS.PLANNING_QUALITY_GATE}\n\nPlanning Artifacts:\n${JSON.stringify(artifacts, null, 2)}\n`;
  
  let parsed: any;
  try {
    const res = await generateOllamaResponse([
      { role: 'user', content: prompt }
    ], { model, format: 'json', num_ctx: 4096, num_predict: 2048 });
    parsed = JSON.parse(res);
  } catch (e) {
    const match = e instanceof Error ? e.message : String(e);
    parsed = {
      score: 0,
      decision: "REJECT",
      issues: ["Failed to parse Planning Quality Gate response.", match],
      summary: "Validation failed due to JSON parsing error."
    };
  }

  if (programmaticIssues.length > 0) {
    parsed.decision = "REJECT";
    parsed.issues = [...(parsed.issues || []), ...programmaticIssues];
    parsed.score = Math.max(0, (parsed.score || 100) - 50);
  }

  return parsed;
}
