import { predictRisks } from './src/lib/intelligence/risk-engine';
import { PlanningArtifacts } from './src/lib/planning/planning-schema';
import { DeliveryArtifacts } from './src/lib/delivery/delivery-schema';

async function run() {
  const plan = {
    epics: [{ id: 'e1', title: 'E1', description: '', priority: 'High', estimatedEffort: 50, relatedRequirements: [] }],
    dependencies: [
      { from: 'e2', to: 'e1', type: 'BLOCKS' },
      { from: 'e3', to: 'e1', type: 'BLOCKS' },
      { from: 'e4', to: 'e1', type: 'BLOCKS' }
    ],
    criticalPath: [],
    releasePlan: { milestones: [] }
  } as unknown as PlanningArtifacts;
  const delivery = {
    tasks: [{ id: 't1', title: 'T1', epicId: 'e1', storyPoints: 10, requiredRole: 'ENGINEER' }],
    sprints: [{ id: 's1', name: 'S1', capacityPoints: 8, assignedPoints: 10, tasks: ['t1'] }],
    capacityPlan: { sprintLengthWeeks: 2, team: [], totalCapacityPoints: 8 }
  } as unknown as DeliveryArtifacts;
  
  const risks = predictRisks(plan, delivery);
  console.log("Risks detected:", risks.length);
  if (risks.length > 0) console.log("Test Passed");
  else process.exit(1);
}
run();
