import { calculateRoadmapDrift } from './src/lib/intelligence/roadmap-drift-engine';
import { PlanningArtifacts } from './src/lib/planning/planning-schema';
import { DeliveryArtifacts } from './src/lib/delivery/delivery-schema';

async function run() {
  const plan = {
    epics: [{ id: '1', title: 'E', description: '', priority: 'High', estimatedEffort: 100, relatedRequirements: [] }],
    dependencies: [],
    criticalPath: [],
    releasePlan: { milestones: [] }
  } as unknown as PlanningArtifacts;
  const delivery = {
    tasks: [],
    sprints: [{ id: 's1', name: 'S1', capacityPoints: 50, assignedPoints: 30, tasks: [] }],
    capacityPlan: { sprintLengthWeeks: 2, team: [], totalCapacityPoints: 50 }
  } as unknown as DeliveryArtifacts;
  
  const drift = calculateRoadmapDrift(plan, delivery);
  console.log("Drift:", drift);
  if (drift.driftScore > 0) console.log("Test Passed");
  else process.exit(1);
}
run();
