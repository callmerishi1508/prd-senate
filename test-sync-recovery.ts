import { Epic } from './src/lib/planning/planning-schema';
import { EngineeringTask, Sprint } from './src/lib/delivery/delivery-schema';
import { GithubAdapter } from './src/lib/integrations/github-adapter';
import { MockHttpClient } from './src/lib/integrations/http/http-client';
import { runSyncJob, retryFailedSyncs } from './src/lib/integrations/sync-engine';
import { validateIntegrationHealth } from './src/lib/integrations/integration-validator';
import { clearIdempotencyStore } from './src/lib/integrations/idempotency-manager';
import { clearSyncStateStore } from './src/lib/integrations/sync-state-manager';
import { ExternalWorkItem } from './src/lib/integrations/integration-schema';

class FlakyGithubAdapter extends GithubAdapter {
  private failCount = 0;
  async createTask(task: EngineeringTask): Promise<ExternalWorkItem> {
    if (this.failCount < 5 && Math.random() > 0.5) {
      this.failCount++;
      throw new Error("Rate limit exceeded");
    }
    return super.createTask(task);
  }
}

async function runRecoveryTest() {
  clearIdempotencyStore();
  clearSyncStateStore();
  
  const epics: Epic[] = [{
    id: "EPIC-1", title: "Epic 1", description: "Desc", priority: "MEDIUM", estimatedEffort: "M", estimatedWeeks: 2, relatedRequirements: ["FR-1"], relatedStories: []
  }];
  const tasks: EngineeringTask[] = Array.from({length: 10}).map((_, i) => ({
    id: `TASK-${i}`, epicId: "EPIC-1", relatedRequirementId: "FR-1", title: `Task ${i}`, description: `Desc`, requiredRole: "BACKEND", storyPoints: 3, confidenceScore: 90
  }));
  const sprints: Sprint[] = [{
    id: "SPRINT-1", name: "Sprint 1", startDate: "2026-06-01", endDate: "2026-06-14", capacityPoints: 100, assignedPoints: 30, tasks: tasks.map(t => t.id)
  }];

  const adapter = new FlakyGithubAdapter(new MockHttpClient(), "test-token");
  
  console.log("Running Initial Sync with Flaky Adapter...");
  let job = await runSyncJob("job-recovery", "v1", "GITHUB", adapter, epics, tasks, sprints);
  
  const failed = job.results.filter(r => r.status === 'FAILED').length;
  console.log(`Sync completed with ${failed} failures.`);

  let health = validateIntegrationHealth(job.id, "GITHUB", epics, tasks, sprints);
  console.log(`Initial Health Valid: ${health.isValid}`);

  if (failed > 0) {
    console.log("\nInitiating Targeted Retry...");
    (adapter as any).failCount = 10; // reset
    
    job = (await retryFailedSyncs(job.id, adapter, epics, tasks, sprints))!;
    
    const failedAfterRetry = job.results.filter(r => r.status === 'FAILED').length;
    console.log(`Retry completed. Failures now: ${failedAfterRetry}`);

    health = validateIntegrationHealth(job.id, "GITHUB", epics, tasks, sprints);
    console.log(`Health Valid after Retry: ${health.isValid}`);
    if (!health.isValid) {
      console.log('Issues:', health.issues);
      const { auditSyncTraceability } = require('./src/lib/integrations/sync-traceability');
      const tr = auditSyncTraceability(epics, tasks, sprints, "GITHUB");
      console.log('Unsynced tasks:', tr.unsyncedTasks);
    }
  }
}

runRecoveryTest().catch(console.error);
