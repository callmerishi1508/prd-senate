import fs from 'fs';
import path from 'path';
import { writeJsonAtomicSync } from './atomic-write';

export type ResolutionMode = 'LOCAL_WINS' | 'EXTERNAL_WINS' | 'MANUAL';

export interface ConflictRecord {
  id: string;
  localId: string;
  externalId: string;
  system: string;
  localState: any;
  externalState: any;
  resolved: boolean;
  resolution?: 'LOCAL' | 'EXTERNAL' | 'MANUAL_EDIT';
  timestamp: string;
}

const CONFLICTS_FILE = path.join(process.cwd(), '.senate-data', 'conflicts.json');

export function initConflictsStore() {
  const dir = path.dirname(CONFLICTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONFLICTS_FILE)) writeJsonAtomicSync(CONFLICTS_FILE, []);
}

export function registerConflict(localId: string, externalId: string, system: string, localState: any, externalState: any): ConflictRecord {
  initConflictsStore();
  const conflicts = JSON.parse(fs.readFileSync(CONFLICTS_FILE, 'utf-8'));
  
  const conflict: ConflictRecord = {
    id: `conf-${Date.now()}`,
    localId,
    externalId,
    system,
    localState,
    externalState,
    resolved: false,
    timestamp: new Date().toISOString()
  };
  
  conflicts.push(conflict);
  writeJsonAtomicSync(CONFLICTS_FILE, conflicts);
  return conflict;
}

export function resolveConflict(conflictId: string, resolution: 'LOCAL' | 'EXTERNAL' | 'MANUAL_EDIT', manualState?: any) {
  initConflictsStore();
  const conflicts: ConflictRecord[] = JSON.parse(fs.readFileSync(CONFLICTS_FILE, 'utf-8'));
  
  const idx = conflicts.findIndex(c => c.id === conflictId);
  if (idx !== -1) {
    conflicts[idx].resolved = true;
    conflicts[idx].resolution = resolution;
    if (manualState) {
      conflicts[idx].localState = manualState;
    }
    writeJsonAtomicSync(CONFLICTS_FILE, conflicts);
  }
}

export function getAllConflicts(): ConflictRecord[] {
  initConflictsStore();
  return JSON.parse(fs.readFileSync(CONFLICTS_FILE, 'utf-8'));
}
