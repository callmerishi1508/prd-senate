import { buildTraceability } from './src/lib/traceability/engine';
import { StructuredPRD, Goal, FunctionalRequirement, UserStory } from './src/lib/prd/schema';
import { compareVersions } from './src/lib/versioning/diff-engine';
import { PRDVersion } from './src/lib/versioning/version-schema';

console.log("=== Test 2: Large Diff Test ===");

// Create 10 goals, 20 requirements, 30 stories
const goals1: Goal[] = Array.from({ length: 10 }).map((_, i) => ({ description: `Goal ${i}` }));
const reqs1: FunctionalRequirement[] = Array.from({ length: 20 }).map((_, i) => ({ description: `Req ${i}`, purpose: 'P', userValue: 'V' }));
const stories1: UserStory[] = Array.from({ length: 30 }).map((_, i) => ({ title: `Story ${i}`, description: `Desc ${i}`, acceptanceCriteria: [] }));

const prd1: StructuredPRD = {
  productOverview: "Large PRD 1",
  goals: goals1,
  nonGoals: [],
  userPersonas: [],
  functionalRequirements: reqs1,
  userExperience: "",
  narrative: "",
  successMetrics: [],
  technicalConsiderations: [],
  milestones: [],
  userStories: stories1
};

console.time("Build Traceability V1");
buildTraceability(prd1);
console.timeEnd("Build Traceability V1");

const v1: PRDVersion = {
  id: "v1", versionNumber: 1, createdAt: "", title: "V1", status: "APPROVED",
  structuredPRD: prd1,
  traceabilityMap: []
};

// Create V2: modify 2 goals, remove 5 reqs, add 10 new reqs, remove 10 stories, add 20 stories
const goals2: Goal[] = prd1.goals!.map(g => ({ ...g }));
goals2[0].description = "Goal 0 Modified";
goals2.push({ description: "Completely Unrelated Target 10" }, { description: "Completely Unrelated Target 11" });

const reqs2 = [...prd1.functionalRequirements!];
reqs2.splice(15, 5); // remove last 5
for (let i = 0; i < 10; i++) {
  reqs2.push({ description: `Absolutely Fresh Feature ${i}`, purpose: 'P', userValue: 'V' });
}

const stories2 = [...prd1.userStories!];
stories2.splice(20, 10); // remove last 10
for (let i = 0; i < 20; i++) {
  stories2.push({ title: `Brand Spanking Ticket ${i}`, description: `Different Details ${i}`, acceptanceCriteria: [] });
}

const prd2: StructuredPRD = {
  ...prd1,
  productOverview: "Large PRD 2",
  goals: goals2,
  functionalRequirements: reqs2,
  userStories: stories2
};

console.time("Build Traceability V2 with Preservation");
buildTraceability(prd2, prd1);
console.timeEnd("Build Traceability V2 with Preservation");

const v2: PRDVersion = {
  id: "v2", versionNumber: 2, createdAt: "", title: "V2", status: "DRAFT",
  structuredPRD: prd2,
  traceabilityMap: []
};

console.time("Diff Engine");
const changes = compareVersions(v1, v2);
console.timeEnd("Diff Engine");

console.log(`Changes detected: ${changes.length}`);
const added = changes.filter(c => c.type === 'ADDED').length;
const removed = changes.filter(c => c.type === 'REMOVED').length;
const modified = changes.filter(c => c.type === 'MODIFIED' || c.type === 'ID_CHANGED').length;
console.log(`Added: ${added}, Removed: ${removed}, Modified: ${modified}`);

// Expectations:
// Goals: 2 added, 1 modified
// Reqs: 10 added, 5 removed
// Stories: 20 added, 10 removed
// Total = 3 + 15 + 30 = 48 changes expected
if (changes.length === 48) {
  console.log("✅ Diff counts match expected.");
} else {
  console.log("❌ Diff counts DO NOT match expected.");
}

