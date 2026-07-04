import { EngineeringTask, Sprint, CapacityPlan } from './delivery-schema';
import { Epic, ReleasePlan } from '../planning/planning-schema';

export function generateSprints(
  tasks: EngineeringTask[],
  epics: Epic[],
  releasePlan: ReleasePlan,
  capacityPlan: CapacityPlan
): Sprint[] {
  const sprints: Sprint[] = [];
  
  // Create an ordered list of tasks based on Release Plan
  // Epics in earlier milestones go first. Within a milestone, priority CRITICAL goes first.
  let orderedEpicIds: string[] = [];
  for (const milestone of releasePlan.milestones) {
    const sortedEpics = [...milestone.epics].sort((aId, bId) => {
      const a = epics.find(e => e.id === aId);
      const b = epics.find(e => e.id === bId);
      const priorityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const scoreA = a ? priorityScore[a.priority as keyof typeof priorityScore] : 0;
      const scoreB = b ? priorityScore[b.priority as keyof typeof priorityScore] : 0;
      return scoreB - scoreA;
    });
    orderedEpicIds.push(...sortedEpics);
  }

  // Any tasks belonging to epics not in the release plan (e.g. orphans), put them at the end
  const orphanTasks = tasks.filter(t => !orderedEpicIds.includes(t.epicId));
  
  let orderedTasks: EngineeringTask[] = [];
  for (const epicId of orderedEpicIds) {
    orderedTasks.push(...tasks.filter(t => t.epicId === epicId));
  }
  orderedTasks.push(...orphanTasks);

  // Allocate tasks into sprints
  let currentSprintNum = 1;
  let currentSprint: Sprint = {
    id: `SPRINT-${currentSprintNum.toString().padStart(3, '0')}`,
    name: `Sprint ${currentSprintNum}`,
    capacityPoints: capacityPlan.totalCapacityPoints,
    assignedPoints: 0,
    tasks: []
  };

  for (const task of orderedTasks) {
    const points = task.storyPoints || 5;

    // If a single task is larger than a sprint's capacity, we still have to put it somewhere 
    // (though the execution-validator or risk-engine should flag this as Oversized)
    if (currentSprint.assignedPoints + points > currentSprint.capacityPoints && currentSprint.tasks.length > 0) {
      // Close current sprint
      sprints.push(currentSprint);
      currentSprintNum++;
      currentSprint = {
        id: `SPRINT-${currentSprintNum.toString().padStart(3, '0')}`,
        name: `Sprint ${currentSprintNum}`,
        capacityPoints: capacityPlan.totalCapacityPoints,
        assignedPoints: 0,
        tasks: []
      };
    }

    currentSprint.tasks.push(task.id);
    currentSprint.assignedPoints += points;
  }

  // Push the final sprint if it has tasks
  if (currentSprint.tasks.length > 0) {
    sprints.push(currentSprint);
  }

  return sprints;
}
