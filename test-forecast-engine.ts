import { generateDeliveryForecast } from './src/lib/intelligence/forecast-engine';
import { PlanningArtifacts } from './src/lib/planning/planning-schema';
import { DeliveryArtifacts } from './src/lib/delivery/delivery-schema';

async function run() {
  const plan = {
    epics: [{ id: '1', title: 'E', description: '', priority: 'High', estimatedEffort: 50, relatedRequirements: [] }],
    dependencies: [],
    criticalPath: [],
    releasePlan: { milestones: [] }
  } as unknown as PlanningArtifacts;
  const delivery = {
    tasks: [],
    sprints: [{ id: 's1', name: 'S1', capacityPoints: 20, assignedPoints: 30, tasks: [] }],
    capacityPlan: { sprintLengthWeeks: 2, team: [], totalCapacityPoints: 20 }
  } as unknown as DeliveryArtifacts;
  
  const forecast = generateDeliveryForecast(plan, delivery);
  console.log("Forecast:", forecast);
  if (forecast.scheduleSlippageRisk > 0) console.log("Test Passed");
  else process.exit(1);
}
run();
