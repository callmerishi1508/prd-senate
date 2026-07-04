import { EngineeringTask, Sprint, CapacityPlan } from './delivery-schema';

export function validateExecutionPlan(
  tasks: EngineeringTask[],
  sprints: Sprint[],
  capacityPlan: CapacityPlan
): string[] {
  const issues: string[] = [];

  const assignedTaskIds = new Set<string>();
  
  sprints.forEach(s => {
    if (s.assignedPoints > s.capacityPoints) {
      issues.push(`Capacity Breached: Sprint ${s.id} has ${s.assignedPoints} points assigned, but capacity is ${s.capacityPoints}`);
    }
    s.tasks.forEach(tId => assignedTaskIds.add(tId));
  });

  tasks.forEach(t => {
    if (!assignedTaskIds.has(t.id)) {
      issues.push(`Orphan Task: Task ${t.id} is not assigned to any sprint.`);
    }
  });

  if (tasks.length === 0) {
    issues.push("No tasks generated.");
  }

  return issues;
}
