import { Epic } from '../planning/planning-schema';
import { EngineeringTask, Sprint } from '../delivery/delivery-schema';
import { getExternalItemByFingerprint, generateSyncFingerprint } from './idempotency-manager';

export interface SyncTraceabilityResult {
  unsyncedEpics: string[];
  unsyncedTasks: string[];
  unsyncedSprints: string[];
  score: number;
}

export function auditSyncTraceability(
  epics: Epic[],
  tasks: EngineeringTask[],
  sprints: Sprint[],
  system: string
): SyncTraceabilityResult {
  const result: SyncTraceabilityResult = {
    unsyncedEpics: [],
    unsyncedTasks: [],
    unsyncedSprints: [],
    score: 100
  };

  epics.forEach(e => {
    const fp = generateSyncFingerprint(e.id, 'EPIC', system);
    if (!getExternalItemByFingerprint(fp)) result.unsyncedEpics.push(e.id);
  });

  tasks.forEach(t => {
    const fp = generateSyncFingerprint(t.id, 'TASK', system);
    if (!getExternalItemByFingerprint(fp)) result.unsyncedTasks.push(t.id);
  });

  sprints.forEach(s => {
    const fp = generateSyncFingerprint(s.id, 'SPRINT', system);
    if (!getExternalItemByFingerprint(fp)) result.unsyncedSprints.push(s.id);
  });

  const totalUnsynced = result.unsyncedEpics.length + result.unsyncedTasks.length + result.unsyncedSprints.length;
  result.score = Math.max(0, 100 - (totalUnsynced * 5));

  return result;
}
