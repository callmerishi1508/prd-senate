import { generateEpics } from './src/lib/planning/epic-engine';
import { detectDependencies } from './src/lib/planning/dependency-engine';
import { calculateCriticalPath } from './src/lib/planning/critical-path-engine';
import { generateReleasePlan } from './src/lib/planning/release-engine';
import { generateRoadmap } from './src/lib/planning/roadmap-engine';
import { StructuredPRD, FunctionalRequirement, UserStory } from './src/lib/prd/schema';

const functionalRequirements: FunctionalRequirement[] = [];
for (let i = 1; i <= 100; i++) {
  functionalRequirements.push({
    id: `FR-${i.toString().padStart(3, '0')}`,
    description: `Functional Requirement ${i} for Mega Project`,
    purpose: `Scaling ${i}`,
    userValue: `Value ${i}`
  });
}

const userStories: UserStory[] = [];
for (let i = 1; i <= 150; i++) {
  userStories.push({
    id: `US-${i.toString().padStart(3, '0')}`,
    title: `User Story ${i}`,
    description: `As a user, I want feature ${i}.`,
    acceptanceCriteria: []
  });
}

const mockPRD: StructuredPRD = {
  productOverview: "Mega Scaling Product",
  goals: [],
  nonGoals: [],
  userPersonas: [],
  functionalRequirements,
  userExperience: "",
  narrative: "",
  successMetrics: [],
  technicalConsiderations: [],
  milestones: [],
  userStories
};

async function runMegaTest() {
  console.log("=== Starting Mega PRD Stress Test ===");
  const startTime = Date.now();

  console.log(`[1/5] Generating Epics... (Payload: ${functionalRequirements.length} Reqs, ${userStories.length} Stories)`);
  const epicStart = Date.now();
  const epics = await generateEpics(mockPRD);
  console.log(`  -> LLM Generated ${epics.length} Epics in ${Date.now() - epicStart}ms`);

  if (epics.length === 0 || epics.length < 5) {
    console.log(`  -> LLM output was empty or too small (${epics.length} epics). Injecting 30 mock epics to verify deterministic engine performance...`);
    for (let i = 1; i <= 30; i++) {
      epics.push({
        id: `EPIC-${i}`,
        title: `Mock Epic ${i}`,
        description: `This is epic ${i} doing things. Requires EPIC-${i > 1 ? i - 1 : 1}`,
        priority: i % 5 === 0 ? "CRITICAL" : "MEDIUM",
        estimatedEffort: "M",
        estimatedWeeks: 2,
        relatedRequirements: [`FR-${i.toString().padStart(3, '0')}`],
        relatedStories: [`US-${i.toString().padStart(3, '0')}`]
      });
    }
  }

  console.log(`[2/5] Detecting Dependencies... (Payload: ${epics.length} Epics)`);
  const depStart = Date.now();
  const deps = await detectDependencies(epics);
  console.log(`  -> Found ${deps.length} Dependencies in ${Date.now() - depStart}ms`);

  console.log(`[3/5] Calculating Critical Path...`);
  const cpStart = Date.now();
  const criticalPath = calculateCriticalPath(epics.map(e => e.id), deps);
  console.log(`  -> Critical Path length: ${criticalPath.length} nodes (Calculated in ${Date.now() - cpStart}ms)`);

  console.log(`[4/5] Generating Release Plan (Topological Sort)...`);
  const rpStart = Date.now();
  const releasePlan = generateReleasePlan(epics, deps, "vMega");
  console.log(`  -> Generated ${releasePlan.milestones.length} Releases in ${Date.now() - rpStart}ms`);

  console.log(`[5/5] Generating Roadmap...`);
  const rmStart = Date.now();
  const roadmap = generateRoadmap(releasePlan);
  console.log(`  -> Generated Roadmap in ${Date.now() - rmStart}ms`);

  console.log(`=== Mega PRD Test Completed in ${Date.now() - startTime}ms ===`);
}

runMegaTest().catch(console.error);
