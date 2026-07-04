import { generateExecutiveReport } from './src/lib/intelligence/executive-dashboard-engine';
import { PRDVersion } from './src/lib/versioning/version-schema';
import { PlanningArtifacts } from './src/lib/planning/planning-schema';
import { DeliveryArtifacts } from './src/lib/delivery/delivery-schema';

async function run() {
  const prd = {
    id: "v1", versionNumber: 1, title: "Test",
    structuredPRD: { productOverview: "Test", functionalRequirements: [] },
    versionHistory: []
  } as unknown as PRDVersion;
  const plan = { epics: [], dependencies: [], criticalPath: [], releasePlan: { milestones: [] } } as unknown as PlanningArtifacts;
  const delivery = { tasks: [], sprints: [], capacityPlan: { sprintLengthWeeks: 2, team: [], totalCapacityPoints: 0 } } as unknown as DeliveryArtifacts;
  
  const report = await generateExecutiveReport(prd, plan, delivery, false);
  console.log("Executive Report Generated successfully.");
  console.log("Health:", report.health.rating);
  console.log("Drift:", report.driftSeverity);
  if (report) console.log("Test Passed");
  else process.exit(1);
}
run();
