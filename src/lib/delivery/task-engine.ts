import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { EngineeringTask } from './delivery-schema';
import { Epic } from '../planning/planning-schema';
import { StructuredPRD } from '../prd/schema';
import { TeamRole } from './team-schema';

export async function generateTasks(epics: Epic[], prd: StructuredPRD): Promise<EngineeringTask[]> {
  const tasks: EngineeringTask[] = [];

  for (let i = 0; i < epics.length; i++) {
    const epic = epics[i];
    
    // Find related requirements text
    const reqs = (prd.functionalRequirements || []).filter(r => r.id && epic.relatedRequirements.includes(r.id));
    
    const context = `
EPIC: ${epic.title}
DESCRIPTION: ${epic.description}
REQUIREMENTS:
${reqs.map(r => `- [${r.id}] ${r.description} (Purpose: ${r.purpose})`).join('\n')}
    `;

    try {
      const res = await generateOllamaResponse([
        { role: 'user', content: AGENT_PROMPTS.TASK_GENERATOR + "\n\n" + context }
      ], { format: 'json', num_ctx: 2048, num_predict: 800 });
      const response = JSON.parse(res);
      
      if (response && response.tasks && Array.isArray(response.tasks)) {
        response.tasks.forEach((t: any, idx: number) => {
          tasks.push({
            id: `TASK-${epic.id.replace('EPIC-', '')}-${(idx + 1).toString().padStart(3, '0')}`,
            epicId: epic.id,
            relatedRequirementId: t.relatedRequirementId || reqs[0]?.id || epic.relatedRequirements[0],
            title: t.title || "Untitled Task",
            description: t.description || "",
            requiredRole: (t.requiredRole as TeamRole) || "FULLSTACK"
          });
        });
      }
    } catch (e) {
      console.error(`Failed to generate tasks for epic ${epic.id}`, e);
    }
  }

  // Fallback for safety: if LLM fails, create dummy tasks
  if (tasks.length === 0) {
    epics.forEach(epic => {
      tasks.push({
        id: `TASK-${epic.id.replace('EPIC-', '')}-001`,
        epicId: epic.id,
        relatedRequirementId: epic.relatedRequirements[0],
        title: `Implement ${epic.title}`,
        description: `Auto-generated fallback task for ${epic.title}`,
        requiredRole: "FULLSTACK"
      });
    });
  }

  return tasks;
}
