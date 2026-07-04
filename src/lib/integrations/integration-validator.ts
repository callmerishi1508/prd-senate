import { getSyncJob } from './sync-state-manager';
import { auditSyncTraceability } from './sync-traceability';
import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';

export interface IntegrationValidationResult {
  isValid: boolean;
  issues: string[];
}

export function validateIntegrationHealth(
  jobId: string,
  system: string,
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[]
): IntegrationValidationResult {
  const issues: string[] = [];

  const job = getSyncJob(jobId);
  if (!job) {
    issues.push(`Sync job ${jobId} not found.`);
    return { isValid: false, issues };
  }

  if (job.status === 'FAILED') {
    const failedCount = job.results.filter(r => r.status === 'FAILED').length;
    issues.push(`Sync job has ${failedCount} failed items requiring retry.`);
  }

  const traceability = auditSyncTraceability(epics, tasks, sprints, system);
  if (traceability.score < 100) {
    issues.push(`Traceability broken. Score: ${traceability.score}. ` +
      `Orphans: ${traceability.unsyncedEpics.length} Epics, ` +
      `${traceability.unsyncedTasks.length} Tasks, ` +
      `${traceability.unsyncedSprints.length} Sprints.`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
