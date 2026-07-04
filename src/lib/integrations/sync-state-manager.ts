import fs from 'fs';
import path from 'path';
import { SyncJob } from './integration-schema';
import { writeJsonAtomicSync } from './atomic-write';

const SYNC_STATE_FILE = path.join(process.cwd(), '.senate-data', 'sync-state.json');

export function initSyncStateStore() {
  const dir = path.dirname(SYNC_STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SYNC_STATE_FILE)) writeJsonAtomicSync(SYNC_STATE_FILE, []);
}

export function saveSyncJob(job: SyncJob) {
  initSyncStateStore();
  const jobs: SyncJob[] = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  writeJsonAtomicSync(SYNC_STATE_FILE, jobs);
}

export function getSyncJob(id: string): SyncJob | null {
  initSyncStateStore();
  const jobs: SyncJob[] = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
  return jobs.find(j => j.id === id) || null;
}

export function getAllSyncJobs(): SyncJob[] {
  initSyncStateStore();
  return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf-8'));
}

export function clearSyncStateStore() {
  initSyncStateStore();
  writeJsonAtomicSync(SYNC_STATE_FILE, []);
}
