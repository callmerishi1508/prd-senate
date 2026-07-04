import { Epic } from './src/lib/planning/planning-schema';
import { EngineeringTask, Sprint } from './src/lib/delivery/delivery-schema';
import { GithubAdapter } from './src/lib/integrations/github-adapter';
import { MockHttpClient } from './src/lib/integrations/http/http-client';
import { runSyncJob } from './src/lib/integrations/sync-engine';
import { validateIntegrationHealth } from './src/lib/integrations/integration-validator';
import { clearIdempotencyStore } from './src/lib/integrations/idempotency-manager';
import { clearSyncStateStore } from './src/lib/integrations/sync-state-manager';

async function runMegaSyncTest() {
  console.log("=== MEGA SYNC TEST ===");
  clearIdempotencyStore();
  clearSyncStateStore();
  
  const numEpics = 500;
  const numTasks = 5000;
  const numSprints = 50;

  console.log(`Generating ${numEpics} Epics, ${numTasks} Tasks, ${numSprints} Sprints...`);

  const epics: Epic[] = Array.from({length: numEpics}).map((_, i) => ({
    id: `EPIC-${i}`,
    title: `Epic ${i}`,
    description: `Desc ${i}`,
    priority: "MEDIUM",
    estimatedEffort: "M",
    estimatedWeeks: 2,
    relatedRequirements: [`FR-${i}`],
    relatedStories: []
  }));

  const tasks: EngineeringTask[] = Array.from({length: numTasks}).map((_, i) => ({
    id: `TASK-${i}`,
    epicId: `EPIC-${i % numEpics}`,
    relatedRequirementId: `FR-${i % numEpics}`,
    title: `Task ${i}`,
    description: `Desc ${i}`,
    requiredRole: "BACKEND",
    storyPoints: 3,
    confidenceScore: 90
  }));

  const sprints: Sprint[] = Array.from({length: numSprints}).map((_, i) => ({
    id: `SPRINT-${i}`,
    name: `Sprint ${i}`,
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    capacityPoints: 100,
    assignedPoints: 100,
    tasks: tasks.filter((t, idx) => idx % numSprints === i).map(t => t.id)
  }));

  const adapter = new GithubAdapter(new MockHttpClient(), "test-token");
  
  console.log("Starting Sync Job...");
  const t0 = Date.now();
  const job = await runSyncJob(
    "job-mega-sync",
    "version-1",
    "GITHUB",
    adapter,
    epics,
    tasks,
    sprints
  );
  const t1 = Date.now();
  console.log(`Sync completed in ${t1 - t0}ms`);
  
  const successCount = job.results.filter(r => r.status === 'SUCCESS').length;
  console.log(`Results: Total=${job.results.length}, Success=${successCount}`);

  console.log("Validating Traceability & Health...");
  const health = validateIntegrationHealth(job.id, "GITHUB", epics, tasks, sprints);
  console.log(`Health Valid: ${health.isValid}`);
  if (!health.isValid) {
    console.log(`Issues:`, health.issues);
  }

  console.log("\n--- Testing Idempotency (Duplicate Prevention) ---");
  const t2 = Date.now();
  const job2 = await runSyncJob(
    "job-mega-sync-2",
    "version-1",
    "GITHUB",
    adapter,
    epics,
    tasks,
    sprints
  );
  const t3 = Date.now();
  console.log(`Second Sync completed in ${t3 - t2}ms`);
  console.log(`All items should be SUCCESS without recreating. Validation should pass.`);
  const health2 = validateIntegrationHealth(job2.id, "GITHUB", epics, tasks, sprints);
  console.log(`Health Valid: ${health2.isValid}`);

  console.log("\n=== MEGA SYNC COMPLETE ===");
}

runMegaSyncTest().catch(console.error);
