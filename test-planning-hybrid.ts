import { generateEpics } from './src/lib/planning/epic-engine';
import { detectDependencies } from './src/lib/planning/dependency-engine';
import { calculateCriticalPath } from './src/lib/planning/critical-path-engine';
import { generateReleasePlan } from './src/lib/planning/release-engine';
import { validatePlanningProgrammatically } from './src/lib/planning/planning-validator';
import { StructuredPRD } from './src/lib/prd/schema';
import { Epic, Dependency } from './src/lib/planning/planning-schema';

const mockPRD: StructuredPRD = {
  productOverview: "Ride Sharing Platform",
  goals: [],
  nonGoals: [],
  userPersonas: [],
  functionalRequirements: [
    { id: "FR-001", description: "User must be able to log in", purpose: "Auth", userValue: "Security" },
    { id: "FR-002", description: "User must be able to create profile", purpose: "Profile", userValue: "Identity" },
    { id: "FR-003", description: "User must be able to book ride", purpose: "Core", userValue: "Transport" }
  ],
  userExperience: "",
  narrative: "",
  successMetrics: [],
  technicalConsiderations: [],
  milestones: [],
  userStories: [
    { id: "US-001", title: "Login", description: "As a user, I want to log in.", acceptanceCriteria: [] },
    { id: "US-002", title: "Profile", description: "As a user, I want to create a profile.", acceptanceCriteria: [] }
  ]
};

async function test() {
  console.log("=== Testing Planning Generation ===");
  const epics = await generateEpics(mockPRD);
  console.log("Generated Epics:", epics.length);
  
  if (epics.length === 0) {
    // Inject mock epics if LLM fails just to test the rest of the pipeline
    epics.push({ id: "EPIC-1", title: "Auth", description: "Authentication", priority: "CRITICAL", estimatedEffort: "M", relatedRequirements: ["FR-001"], relatedStories: ["US-001"] });
    epics.push({ id: "EPIC-2", title: "Profiles", description: "User Profiles", priority: "HIGH", estimatedEffort: "S", relatedRequirements: ["FR-002"], relatedStories: ["US-002"] });
    epics.push({ id: "EPIC-3", title: "Booking", description: "Ride Booking. Requires Auth and Profiles.", priority: "HIGH", estimatedEffort: "L", relatedRequirements: ["FR-003"], relatedStories: [] });
  }

  const deps = await detectDependencies(epics);
  console.log("Generated Dependencies:", deps);

  const criticalPath = calculateCriticalPath(epics.map(e => e.id), deps);
  console.log("Critical Path:", criticalPath);

  const releasePlan = generateReleasePlan(epics, deps, "v1");
  console.log("Release Milestones:", releasePlan.milestones.map(m => m.id));

  const issues = validatePlanningProgrammatically({ epics, dependencies: deps, releasePlan, roadmap: [], criticalPath });
  console.log("Validator Issues:", issues);

  console.log("=== Testing Cyclic Dependency Validation ===");
  const cyclicDeps: Dependency[] = [
    { from: "EPIC-1", to: "EPIC-2", type: "BLOCKS" },
    { from: "EPIC-2", to: "EPIC-1", type: "BLOCKS" }
  ];
  const cyclicReleasePlan = generateReleasePlan(epics, cyclicDeps, "v1");
  const cyclicIssues = validatePlanningProgrammatically({ epics, dependencies: cyclicDeps, releasePlan: cyclicReleasePlan, roadmap: [], criticalPath: [] });
  console.log("Cyclic Validator Issues (should detect cycle):", cyclicIssues);
}

test().catch(console.error);
