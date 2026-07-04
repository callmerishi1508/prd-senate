import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { IntegrationAdapter, SyncJob, SyncResult, ExternalSystem, ExternalWorkItem } from './integration-schema';
import { generateSyncFingerprint, getExternalItemByFingerprint, saveExternalItem } from './idempotency-manager';
import { saveSyncJob, getSyncJob } from './sync-state-manager';

export async function runSyncJob(
  jobId: string,
  projectId: string,
  versionId: string,
  system: ExternalSystem,
  adapter: IntegrationAdapter,
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[]
): Promise<SyncJob> {
  const job: SyncJob = {
    id: jobId,
    projectId,
    versionId,
    system,
    status: 'SYNCING',
    createdAt: new Date().toISOString(),
    results: []
  };

  // Pre-populate results as PENDING so a crash leaves a recoverable state
  for (const s of sprints) job.results.push({ localId: s.id, sourceType: 'SPRINT', status: 'PENDING', retryCount: 0 });
  for (const e of epics) job.results.push({ localId: e.id, sourceType: 'EPIC', status: 'PENDING', retryCount: 0 });
  for (const t of tasks) job.results.push({ localId: t.id, sourceType: 'TASK', status: 'PENDING', retryCount: 0 });
  
  saveSyncJob(job);

  // Process each pending item and update the state incrementally
  for (let i = 0; i < job.results.length; i++) {
    const res = job.results[i];
    if (res.status === 'SUCCESS') continue; // Idempotent skip if already done

    let newRes;
    if (res.sourceType === 'SPRINT') {
      const s = sprints.find(x => x.id === res.localId)!;
      newRes = await syncEntity(s.id, 'SPRINT', system, () => adapter.createSprint(s), res);
    } else if (res.sourceType === 'EPIC') {
      const e = epics.find(x => x.id === res.localId)!;
      newRes = await syncEntity(e.id, 'EPIC', system, () => adapter.createEpic(e), res);
    } else if (res.sourceType === 'TASK') {
      const t = tasks.find(x => x.id === res.localId)!;
      newRes = await syncEntity(t.id, 'TASK', system, () => adapter.createTask(t), res);
    }

    if (newRes) {
      job.results[i] = newRes;
      if (i % 50 === 0) saveSyncJob(job); // Atomic write periodically
    }
  }

  job.status = job.results.some(r => r.status === 'FAILED') ? 'FAILED' : 'SUCCESS';
  job.completedAt = new Date().toISOString();
  saveSyncJob(job);

  return job;
}

async function syncEntity(
  id: string, 
  type: 'EPIC' | 'TASK' | 'SPRINT' | 'REQUIREMENT', 
  system: ExternalSystem,
  createFn: () => Promise<ExternalWorkItem>,
  existingResult?: SyncResult
): Promise<SyncResult> {
  const fp = generateSyncFingerprint(id, type, system);
  const existingItem = getExternalItemByFingerprint(fp);

  const result: SyncResult = existingResult ? { ...existingResult } : {
    localId: id,
    sourceType: type,
    status: 'PENDING',
    retryCount: 0
  };

  if (existingItem && existingItem.syncStatus === 'SUCCESS') {
    result.status = 'SUCCESS';
    return result; // Idempotent skip
  }

  try {
    const externalItem = await createFn();
    saveExternalItem(externalItem);
    result.status = 'SUCCESS';
    result.lastError = undefined;
  } catch (err: any) {
    if (err.message === 'SIMULATED_PROCESS_CRASH') throw err;
    result.status = 'FAILED';
    result.lastError = err.message || 'Unknown error';
  }
  result.lastAttemptAt = new Date().toISOString();

  return result;
}

export async function retryFailedSyncs(
  jobId: string,
  adapter: IntegrationAdapter,
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[]
): Promise<SyncJob | null> {
  const job = getSyncJob(jobId);
  if (!job) return null;

  job.status = 'RETRYING';
  saveSyncJob(job);

  for (let i = 0; i < job.results.length; i++) {
    const res = job.results[i];
    if (res.status === 'FAILED') {
      res.retryCount += 1;
      let newRes;
      if (res.sourceType === 'SPRINT') {
        const sprint = sprints.find(s => s.id === res.localId)!;
        newRes = await syncEntity(sprint.id, 'SPRINT', job.system, () => adapter.createSprint(sprint), res);
      } else if (res.sourceType === 'EPIC') {
        const epic = epics.find(e => e.id === res.localId)!;
        newRes = await syncEntity(epic.id, 'EPIC', job.system, () => adapter.createEpic(epic), res);
      } else if (res.sourceType === 'TASK') {
        const task = tasks.find(t => t.id === res.localId)!;
        newRes = await syncEntity(task.id, 'TASK', job.system, () => adapter.createTask(task), res);
      }
      if (newRes) job.results[i] = newRes;
    }
  }

  job.status = job.results.some(r => r.status === 'FAILED') ? 'FAILED' : 'SUCCESS';
  job.completedAt = new Date().toISOString();
  saveSyncJob(job);

  return job;
}

export async function resumeSyncJob(
  jobId: string,
  adapter: IntegrationAdapter,
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[]
): Promise<SyncJob | null> {
  const job = getSyncJob(jobId);
  if (!job) return null;

  job.status = 'SYNCING';
  saveSyncJob(job);

  for (let i = 0; i < job.results.length; i++) {
    const res = job.results[i];
    // Resume anything that is not SUCCESS
    if (res.status === 'PENDING' || res.status === 'SYNCING' || res.status === 'FAILED') {
      if (res.status === 'FAILED') res.retryCount += 1;
      
      let newRes;
      if (res.sourceType === 'SPRINT') {
        const s = sprints.find(x => x.id === res.localId);
        if (s) newRes = await syncEntity(s.id, 'SPRINT', job.system, () => adapter.createSprint(s), res);
      } else if (res.sourceType === 'EPIC') {
        const e = epics.find(x => x.id === res.localId);
        if (e) newRes = await syncEntity(e.id, 'EPIC', job.system, () => adapter.createEpic(e), res);
      } else if (res.sourceType === 'TASK') {
        const t = tasks.find(x => x.id === res.localId);
        if (t) newRes = await syncEntity(t.id, 'TASK', job.system, () => adapter.createTask(t), res);
      }

      if (newRes) {
        job.results[i] = newRes;
        if (i % 50 === 0) saveSyncJob(job);
      }
    }
  }

  job.status = job.results.some(r => r.status === 'FAILED') ? 'FAILED' : 'SUCCESS';
  job.completedAt = new Date().toISOString();
  saveSyncJob(job);

  return job;
}
