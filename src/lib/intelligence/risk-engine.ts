import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';
import { RoadmapRisk } from './intelligence-schema';

export function predictRisks(
  plan: PlanningArtifacts,
  delivery?: DeliveryArtifacts
): RoadmapRisk[] {
  const risks: RoadmapRisk[] = [];
  
  // Check for dependency bottlenecks
  for (const epic of plan.epics) {
    const dependentOnUs = plan.dependencies.filter(d => d.to === epic.id);
    if (dependentOnUs.length > 2) {
      risks.push({
        epicId: epic.id,
        epicTitle: epic.title,
        type: "DEPENDENCY",
        probability: 80,
        impact: 75,
        recommendedActions: ["Split epic to unblock dependencies", "Assign parallel streams"]
      });
    }
    
    const effortMap: Record<string, number> = { "XS": 1, "S": 3, "M": 5, "L": 8, "XL": 13 };
    if ((effortMap[epic.estimatedEffort as string] || 5) > 8) {
      risks.push({
        epicId: epic.id,
        epicTitle: epic.title,
        type: "DELIVERY",
        probability: 60,
        impact: 50,
        recommendedActions: ["Break down into smaller epics"]
      });
    }
  }

  if (delivery) {
    for (const sprint of delivery.sprints) {
      if (sprint.assignedPoints > sprint.capacityPoints) {
        // Find which epic is causing it? Just attribute to a large task's epic
        const task = delivery.tasks.find(t => sprint.tasks.includes(t.id) && (t.storyPoints || 0) > 5);
        if (task) {
          const epic = plan.epics.find(e => e.id === task.epicId);
          if (epic) {
            risks.push({
              epicId: epic.id,
              epicTitle: epic.title,
              type: "RESOURCE",
              probability: 90,
              impact: 85,
              recommendedActions: ["Reduce sprint assignment", "Increase capacity"]
            });
          }
        }
      }
    }
  }

  return risks;
}
