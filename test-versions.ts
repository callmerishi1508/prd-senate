import { createVersion, getLatestVersion, getAllVersions } from './src/lib/versioning/version-manager';
import { compareVersions, generateEvolutionSummary } from './src/lib/versioning/diff-engine';
import { runImpactAnalysis } from './src/lib/versioning/impact-analysis';
import { StructuredPRD } from './src/lib/prd/schema';

async function main() {
  console.log("=== Testing Phase 5: PRD Evolution ===");

  const prd1: StructuredPRD = {
    productOverview: "A water tracking app.",
    goals: [{ id: "G-001", description: "Track water" }],
    nonGoals: [],
    userPersonas: [],
    functionalRequirements: [
      { id: "FR-001", description: "Log water", purpose: "tracking", userValue: "hydration" }
    ],
    userExperience: "",
    narrative: "",
    successMetrics: [{ id: "SM-001", description: "Users log daily" }],
    technicalConsiderations: [],
    milestones: [],
    userStories: [
      { id: "US-001", title: "Log glass", description: "Log a glass of water", acceptanceCriteria: [] }
    ]
  };

  const v1 = await createVersion({
    title: "V1 Initial",
    status: "APPROVED",
    structuredPRD: prd1,
    traceabilityMap: [
      { goalId: "G-001", requirementIds: ["FR-001"], userStoryIds: ["US-001"], metricIds: ["SM-001"] }
    ]
  });

  console.log("Created V1:", v1.id);

  // V2: Add reminder feature, remove tracking
  const prd2: StructuredPRD = {
    ...prd1,
    goals: [{ id: "G-001", description: "Track water" }, { id: "G-002", description: "Remind user" }],
    functionalRequirements: [
      { id: "FR-009", description: "Log water", purpose: "tracking", userValue: "hydration" }, // ID CHANGED
      { id: "FR-002", description: "Send push reminder", purpose: "reminders", userValue: "hydration" } // ADDED
    ],
    userStories: [
      { id: "US-002", title: "Receive reminder", description: "Get a push notification", acceptanceCriteria: [] } // ADDED (US-001 removed)
    ]
  };

  const v2 = await createVersion({
    title: "V2 Reminder Feature",
    status: "DRAFT",
    structuredPRD: prd2,
    traceabilityMap: []
  });
  console.log("Created V2:", v2.id);

  const changes = compareVersions(v1, v2);
  const summary = generateEvolutionSummary(changes);
  console.log("\n=== Diff Engine Output ===");
  console.log(JSON.stringify(changes, null, 2));

  console.log("\n=== Evolution Summary ===");
  console.log(summary);

  // Impact analysis on FR-001 ID change / removal
  console.log("\n=== Impact Analysis on G-001 Modification ===");
  const impact = runImpactAnalysis({ type: 'MODIFIED', entityType: 'Goal', entityId: 'G-001' }, v1);
  console.log(impact);

}

main().catch(console.error);
