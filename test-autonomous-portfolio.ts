import { PRDVersion } from './src/lib/versioning/version-schema';
import { PlanningArtifacts } from './src/lib/planning/planning-schema';
import { DeliveryArtifacts, EngineeringTask, Sprint } from './src/lib/delivery/delivery-schema';
import { indexKnowledgeBulk } from './src/lib/knowledge/indexing-engine';
import { generateExecutiveReport } from './src/lib/intelligence/executive-dashboard-engine';

async function runTest() {
  console.time("full-suite");
  console.log("=== MEGA AUTONOMOUS PORTFOLIO TEST ===");
  
  console.log("1. Generating 100 PRDs, 500 Epics, 5000 Tasks, 100 Sprints...");
  const prd = {
    id: "v1", versionNumber: 1, title: "Mega Portfolio",
    structuredPRD: {
      productOverview: "Massive scale test",
      functionalRequirements: Array(100).fill({ description: "Req", purpose: "Test" })
    },
    versionHistory: []
  } as unknown as PRDVersion;

  const plan = {
    epics: Array.from({ length: 500 }).map((_, i) => ({
      id: `EPIC-${i}`, title: `Epic ${i}`, description: '', priority: 'High', estimatedEffort: 10, relatedRequirements: []
    })),
    dependencies: [],
    criticalPath: [],
    releasePlan: { milestones: [] }
  } as unknown as PlanningArtifacts;

  const tasks = Array.from({ length: 5000 }).map((_, i) => ({
    id: `TASK-${i}`, title: `Task ${i}`, epicId: `EPIC-${Math.floor(i / 10)}`, storyPoints: 2, requiredRole: 'ENGINEER'
  })) as unknown as EngineeringTask[];

  const sprints = Array.from({ length: 100 }).map((_, i) => {
    const sprintTasks = tasks.slice(i * 50, (i + 1) * 50).map(t => t.id);
    return {
      id: `SPRINT-${i}`, name: `Sprint ${i}`, capacityPoints: 100, assignedPoints: 100, tasks: sprintTasks
    };
  }) as unknown as Sprint[];

  const delivery = {
    tasks,
    sprints,
    capacityPlan: { sprintLengthWeeks: 2, team: [], totalCapacityPoints: 100 }
  } as unknown as DeliveryArtifacts;

  console.log("2. Running bulk indexing...");
  // Bulk indexing with mocked chunks for performance
  await indexKnowledgeBulk(
    [{ id: "doc-1", type: "PRD", title: "Mega", sourceId: "v1", createdAt: new Date().toISOString() }],
    [{ id: "chk-1", documentId: "doc-1", chunkType: "PRD_METADATA", content: "Mega", sourceConfidence: 100, embedding: new Array(768).fill(0.1) }]
  );
  
  console.log("3. Generating Executive Report (with Local AI Summary)...");
  const report = await generateExecutiveReport(prd, plan, delivery, false);
  
  console.log(`\n=== EXECUTIVE REPORT ===`);
  console.log(`Health: ${report.health.rating} (${report.health.score})`);
  console.log(`Forecast: ${report.forecast.expectedCompletionDate} (Risk: ${report.forecast.scheduleSlippageRisk}%)`);
  console.log(`Drift: ${report.driftSeverity} (${report.driftScore})`);
  console.log(`Risks Detected: ${report.topRisks.length}`);
  console.log(`Recommendations: ${report.recommendations.length}`);
  if (report.recommendations.length > 0) {
    console.log(` Top Rec: ${report.recommendations[0].action} (Conf: ${report.recommendations[0].confidence}%)`);
    console.log(` Evidence: ${report.recommendations[0].evidence.join(' | ')}`);
  }
  console.log(`AI Summary: ${report.aiSummary}`);
  
  console.timeEnd("full-suite");
  
  if (report.recommendations.length > 0) {
    console.log("Mega Test PASSED.");
  } else {
    console.log("Mega Test FAILED.");
    process.exit(1);
  }
}
runTest();
