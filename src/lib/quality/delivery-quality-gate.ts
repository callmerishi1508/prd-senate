import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { DeliveryArtifacts } from '../delivery/delivery-schema';

export async function runDeliveryQualityGate(artifacts: DeliveryArtifacts): Promise<{
  score: number;
  decision: "APPROVE" | "REJECT";
  issues: string[];
  summary: string;
}> {
  const context = JSON.stringify({
    sprints: artifacts.sprints.map(s => ({
      name: s.name,
      assignedPoints: s.assignedPoints,
      capacityPoints: s.capacityPoints,
      taskCount: s.tasks.length,
      tasks: s.tasks.map(tId => {
        const task = artifacts.tasks.find(t => t.id === tId);
        return {
          id: task?.id,
          title: task?.title,
          role: task?.requiredRole,
          points: task?.storyPoints
        }
      })
    }))
  }, null, 2);

  try {
    const res = await generateOllamaResponse([
      { role: 'user', content: AGENT_PROMPTS.DELIVERY_QUALITY_GATE + "\n\n" + context }
    ], { format: 'json', num_ctx: 2048, num_predict: 800 });
    const response = JSON.parse(res);
    if (response) {
      return {
        score: response.score || 0,
        decision: response.decision || "REJECT",
        issues: response.issues || [],
        summary: response.summary || "No summary provided."
      };
    }
  } catch (e: any) {
    console.error("Delivery Quality Gate failed", e);
    return { score: 0, decision: "REJECT", issues: ["LLM Evaluation Failed", e.message], summary: "Validation failed" };
  }

  return { score: 0, decision: "REJECT", issues: ["Unknown error in quality gate"], summary: "Failed to validate delivery artifacts." };
}
