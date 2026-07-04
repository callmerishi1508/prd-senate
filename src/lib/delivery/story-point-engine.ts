import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { EngineeringTask } from './delivery-schema';

export async function estimateStoryPoints(tasks: EngineeringTask[]): Promise<EngineeringTask[]> {
  // We process in chunks to not overwhelm the LLM context
  const chunkSize = 20;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize);
    
    const context = JSON.stringify(chunk.map(t => ({
      taskId: t.id,
      title: t.title,
      description: t.description,
      role: t.requiredRole
    })));

    try {
      const res = await generateOllamaResponse([
        { role: 'user', content: AGENT_PROMPTS.STORY_POINT_ESTIMATOR + "\n\n" + context }
      ], { format: 'json' });
      const response = JSON.parse(res);
      
      if (response && response.estimates && Array.isArray(response.estimates)) {
        response.estimates.forEach((est: any) => {
          const task = tasks.find(t => t.id === est.taskId);
          if (task) {
            task.storyPoints = [1, 2, 3, 5, 8, 13, 21].includes(est.storyPoints) ? est.storyPoints : 5;
            task.confidenceScore = est.confidenceScore || 50;
          }
        });
      }
    } catch (e) {
      console.error('Failed to estimate story points', e);
    }
  }

  // Fallback for tasks that missed estimation
  tasks.forEach(t => {
    if (!t.storyPoints) {
      t.storyPoints = 5;
      t.confidenceScore = 50;
    }
  });

  return tasks;
}
