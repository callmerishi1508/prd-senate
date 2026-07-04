import { buildTraceability } from './src/lib/traceability/engine';
import { StructuredPRD } from './src/lib/prd/schema';

console.log("=== Test 1: ID Preservation ===");

const prd1: StructuredPRD = {
  productOverview: "A water tracking app.",
  goals: [
    { description: "Track daily water intake" },
    { description: "Remind user to drink" }
  ],
  nonGoals: [],
  userPersonas: [],
  functionalRequirements: [
    { description: "Users can log a glass of water", purpose: "tracking", userValue: "hydration" },
    { description: "Users receive push notifications", purpose: "reminders", userValue: "hydration" }
  ],
  userExperience: "",
  narrative: "",
  successMetrics: [
    { description: "70% of users log water daily" }
  ],
  technicalConsiderations: [],
  milestones: [],
  userStories: [
    { title: "Log Water", description: "As a user, I want to log water", acceptanceCriteria: [] },
    { title: "Get Reminder", description: "As a user, I want a reminder", acceptanceCriteria: [] }
  ]
};

console.log("Building V1...");
buildTraceability(prd1);

console.log("V1 FR IDs:", prd1.functionalRequirements?.map(fr => fr.id));

// Now simulate the LLM generating V2 where it removes the first requirement and adds a new one at the end.
// Without ID preservation, the old FR-002 will become FR-001.

const prd2: StructuredPRD = {
  productOverview: "A water tracking app.",
  goals: [
    { description: "Track daily water intake" },
    { description: "Remind user to drink" }
  ],
  nonGoals: [],
  userPersonas: [],
  functionalRequirements: [
    // Removed the "log a glass of water" requirement
    { description: "Users receive push notifications", purpose: "reminders", userValue: "hydration" }, // This was FR-002
    { description: "Users can see a weekly chart", purpose: "analytics", userValue: "insights" } // New requirement
  ],
  userExperience: "",
  narrative: "",
  successMetrics: [
    { description: "70% of users log water daily" }
  ],
  technicalConsiderations: [],
  milestones: [],
  userStories: [
    { title: "Get Reminder", description: "As a user, I want a reminder", acceptanceCriteria: [] },
    { title: "View Chart", description: "As a user, I want to see a chart", acceptanceCriteria: [] }
  ]
};

console.log("Building V2...");
buildTraceability(prd2, prd1);

console.log("V2 FR IDs:", prd2.functionalRequirements?.map(f => `${f.id}: ${f.description}`));

console.log("\nIf FR-001 is 'Users receive push notifications', then ID preservation failed!");
