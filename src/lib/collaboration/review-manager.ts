import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ReviewSession } from './collaboration-schema';
import { getVersion } from '../versioning/version-manager';

const DATA_DIR = path.join(process.cwd(), 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export async function getAllReviewSessions(): Promise<ReviewSession[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data) as ReviewSession[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export async function saveAllReviewSessions(sessions: ReviewSession[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(REVIEWS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

export async function getReviewSession(sessionId: string): Promise<ReviewSession | undefined> {
  const sessions = await getAllReviewSessions();
  return sessions.find(s => s.id === sessionId);
}

export async function getReviewSessionForVersion(versionId: string): Promise<ReviewSession | undefined> {
  const sessions = await getAllReviewSessions();
  return sessions.find(s => s.versionId === versionId);
}

// Generate a simple hash from the traceability map to detect if the version has changed
export function hashTraceability(version: any): string {
  if (!version || !version.traceabilityMap) return '';
  return crypto.createHash('sha256').update(JSON.stringify(version.traceabilityMap)).digest('hex').substring(0, 32);
}

export async function createReviewSession(versionId: string): Promise<ReviewSession> {
  const sessions = await getAllReviewSessions();
  
  // Check if session already exists for this version
  const existing = sessions.find(s => s.versionId === versionId);
  if (existing) return existing;

  const version = await getVersion(versionId);
  if (!version) {
    throw new Error(`Version ${versionId} not found`);
  }

  const newSession: ReviewSession = {
    id: `rs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    versionId,
    versionNumber: version.versionNumber,
    traceabilityHash: hashTraceability(version),
    createdAt: new Date().toISOString(),
    approvals: [],
    comments: []
  };

  sessions.push(newSession);
  await saveAllReviewSessions(sessions);
  return newSession;
}

export interface ReviewSummary {
  approvedCount: number;
  rejectedCount: number;
  needsChangesCount: number;
  pendingCount: number;
  totalEntities: number;
}

export async function getReviewSummary(sessionId: string): Promise<ReviewSummary> {
  const session = await getReviewSession(sessionId);
  if (!session) throw new Error("Session not found");

  const summary: ReviewSummary = {
    approvedCount: 0,
    rejectedCount: 0,
    needsChangesCount: 0,
    pendingCount: 0,
    totalEntities: 0 // Ideally this is calculated based on the version's actual entity count
  };

  // The summary is based on the latest approval status for each entity
  const latestApprovals = new Map<string, string>(); // entityId -> status
  session.approvals.forEach(a => {
    // approvals array might have history, so we take the latest. Assuming chronological order of insertion.
    latestApprovals.set(a.entityId, a.status);
  });

  latestApprovals.forEach(status => {
    if (status === 'APPROVED') summary.approvedCount++;
    else if (status === 'REJECTED') summary.rejectedCount++;
    else if (status === 'NEEDS_CHANGES') summary.needsChangesCount++;
    else if (status === 'PENDING') summary.pendingCount++;
  });

  return summary;
}

export async function isSessionStale(sessionId: string): Promise<boolean> {
  const session = await getReviewSession(sessionId);
  if (!session) return false;
  const version = await getVersion(session.versionId);
  if (!version) return true; // If version is gone, session is invalid/stale
  const currentHash = hashTraceability(version as any);
  return session.traceabilityHash !== currentHash;
}
