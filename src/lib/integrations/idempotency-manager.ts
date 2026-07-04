import fs from 'fs';
import path from 'path';
import { ExternalWorkItem } from './integration-schema';
import { writeJsonAtomicSync } from './atomic-write';

const IDEMPOTENCY_FILE = path.join(process.cwd(), '.senate-data', 'idempotency.json');

export function initIdempotencyStore() {
  const dir = path.dirname(IDEMPOTENCY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(IDEMPOTENCY_FILE)) writeJsonAtomicSync(IDEMPOTENCY_FILE, {});
}

export function generateSyncFingerprint(id: string, type: 'EPIC' | 'TASK' | 'SPRINT' | 'REQUIREMENT', system: string): string {
  return `${system}_${type}_${id}`;
}

export function getExternalItemByFingerprint(fingerprint: string): ExternalWorkItem | null {
  initIdempotencyStore();
  const data = JSON.parse(fs.readFileSync(IDEMPOTENCY_FILE, 'utf-8'));
  return data[fingerprint] || null;
}

export function saveExternalItem(item: ExternalWorkItem) {
  initIdempotencyStore();
  const data = JSON.parse(fs.readFileSync(IDEMPOTENCY_FILE, 'utf-8'));
  data[item.fingerprint] = item;
  writeJsonAtomicSync(IDEMPOTENCY_FILE, data);
}

export function clearIdempotencyStore() {
  initIdempotencyStore();
  writeJsonAtomicSync(IDEMPOTENCY_FILE, {});
}
