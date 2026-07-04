import { EngineeringTask, Sprint, CapacityPlan, RiskReport } from './delivery-schema';
import { Epic, Dependency } from '../planning/planning-schema';

export function calculateDeliveryRisks(
  tasks: EngineeringTask[],
  sprints: Sprint[],
  capacityPlan: CapacityPlan,
  epics: Epic[],
  dependencies: Dependency[]
): RiskReport {
  const risks: string[] = [];
  let level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

  // Check overloaded sprints
  sprints.forEach(s => {
    if (s.assignedPoints > s.capacityPoints) {
      risks.push(`Sprint ${s.id} is overloaded (${s.assignedPoints}/${s.capacityPoints} points)`);
      level = level === "CRITICAL" ? "CRITICAL" : "HIGH";
    } else if (s.assignedPoints > s.capacityPoints * 0.9) {
      risks.push(`Sprint ${s.id} is near capacity (${s.assignedPoints}/${s.capacityPoints} points)`);
      if (level === "LOW") level = "MEDIUM";
    }
  });

  // Check oversized tasks
  tasks.forEach(t => {
    if ((t.storyPoints || 0) > capacityPlan.totalCapacityPoints * 0.5) {
      risks.push(`Task ${t.id} (${t.storyPoints} pts) consumes >50% of Sprint Capacity (${capacityPlan.totalCapacityPoints} pts)`);
      level = level === "CRITICAL" ? "CRITICAL" : "HIGH";
    }
  });

  // Check single point failures
  const nodeIndegree = new Map<string, number>();
  const nodeOutdegree = new Map<string, number>();
  dependencies.forEach(d => {
    nodeOutdegree.set(d.from, (nodeOutdegree.get(d.from) || 0) + 1);
    nodeIndegree.set(d.to, (nodeIndegree.get(d.to) || 0) + 1);
  });

  for (const [epicId, outdegree] of nodeOutdegree.entries()) {
    if (outdegree >= 3) {
      const epic = epics.find(e => e.id === epicId);
      risks.push(`Single Point of Failure: Epic ${epicId} (${epic?.title}) blocks ${outdegree} other Epics.`);
      level = level === "LOW" ? "MEDIUM" : level;
    }
  }

  return { level, risks };
}
