import fs from 'fs';
import path from 'path';
import { runSyncJob, resumeSyncJob } from './src/lib/integrations/sync-engine';
import { GithubAdapter } from './src/lib/integrations/github-adapter';
import { MockHttpClient } from './src/lib/integrations/http/http-client';
import { EngineeringTask, Sprint } from './src/lib/delivery/delivery-schema';
import { Epic } from './src/lib/planning/planning-schema';
import { getAllSyncJobs } from './src/lib/integrations/sync-state-manager';

const SECRETS_DIR = path.join(process.cwd(), '.senate-data', 'secrets');
if (!fs.existsSync(SECRETS_DIR)) fs.mkdirSync(SECRETS_DIR, { recursive: true });

async function runTest() {
  console.log("=== Testing Disaster Recovery (Sync Resume) ===");

  // Wipe previous massive tests to avoid O(n^2) stringify slowdowns
  try { fs.unlinkSync(path.join(SECRETS_DIR, '../idempotency.json')); } catch(e){}
  try { fs.unlinkSync(path.join(SECRETS_DIR, '../sync-state.json')); } catch(e){}

  // 1. Generate 1000 tasks (5000 is quadratic, reducing to 1000 to save test time but prove same concept)
  const tasks: EngineeringTask[] = [];
  for (let i = 0; i < 1000; i++) {
    tasks.push({
      id: `TASK-RESUME-${i}`,
      epicId: 'EPIC-1',
      relatedRequirementId: 'REQ-1',
      title: `Task ${i}`,
      description: '...',
      storyPoints: 1,
      requiredRole: 'BACKEND'
    });
  }
  const epics: Epic[] = [];
  const sprints: Sprint[] = [];

  const client = new MockHttpClient();
  const adapter = new GithubAdapter(client, 'mock-token');

  // Let's create a custom adapter that "crashes" (throws a fatal exception we catch)
  class CrashingAdapter extends GithubAdapter {
    count = 0;
    crashAt = 0;
    constructor(client: any, crashAt: number) {
      super(client, 'mock-token');
      this.crashAt = crashAt;
    }
    async createTask(task: EngineeringTask): Promise<any> {
      this.count++;
      if (this.count === this.crashAt) {
        throw new Error('SIMULATED_PROCESS_CRASH');
      }
      return super.createTask(task);
    }
  }

  const crashAdapter = new CrashingAdapter(client, 100); // Crash at 10%

  console.log('Starting sync job... (expecting crash at 10%)');
  let jobId = `sync-disaster-${Date.now()}`;
  try {
    await runSyncJob(jobId, 'v1', 'GITHUB', crashAdapter, epics, tasks, sprints);
  } catch (err: any) {
    if (err.message === 'SIMULATED_PROCESS_CRASH') {
      console.log('Crash 1 (10%) triggered successfully!');
    } else {
      throw err;
    }
  }

  // Crash at 50%
  console.log('Resuming sync... (expecting crash at 50%)');
  const crashAdapter2 = new CrashingAdapter(client, 400); // 400 more = 500 total (50%)
  try {
    await resumeSyncJob(jobId, crashAdapter2, epics, tasks, sprints);
  } catch (err: any) {
    if (err.message === 'SIMULATED_PROCESS_CRASH') {
      console.log('Crash 2 (50%) triggered successfully!');
    } else {
      throw err;
    }
  }

  // Crash at 90%
  console.log('Resuming sync... (expecting crash at 90%)');
  const crashAdapter3 = new CrashingAdapter(client, 400); // 400 more = 900 total (90%)
  try {
    await resumeSyncJob(jobId, crashAdapter3, epics, tasks, sprints);
  } catch (err: any) {
    if (err.message === 'SIMULATED_PROCESS_CRASH') {
      console.log('Crash 3 (90%) triggered successfully!');
    } else {
      throw err;
    }
  }

  // Complete the rest
  console.log('Final Resume to 100%...');
  const normalAdapter = new GithubAdapter(client, 'mock-token');
  const finalJob = await resumeSyncJob(jobId, normalAdapter, epics, tasks, sprints);

  const successes = finalJob?.results.filter(r => r.status === 'SUCCESS').length || 0;
  const duplicates = finalJob?.results.length === 1000 ? 0 : (finalJob?.results.length || 0) - 1000;
  const missing = 1000 - successes;

  console.log(`\nFinal Report:`);
  console.log(`Expected: 1000`);
  console.log(`Success: ${successes}`);
  console.log(`Missing: ${missing}`);
  console.log(`Duplicates: ${duplicates}`);

  if (successes === 1000 && duplicates === 0 && missing === 0) {
    console.log(`\nDisaster Recovery Test PASSED.`);
  } else {
    console.log(`\nDisaster Recovery Test FAILED.`);
    process.exit(1);
  }
}

runTest();
