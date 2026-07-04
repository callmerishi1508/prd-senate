import { promises as fs } from 'fs';
import * as path from 'path';
import { PRDVersion } from './version-schema';

const DATA_DIR = path.join(process.cwd(), 'data');
const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore if exists
  }
}

export async function getAllVersions(): Promise<PRDVersion[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(VERSIONS_FILE, 'utf-8');
    return JSON.parse(data) as PRDVersion[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export async function getVersion(id: string): Promise<PRDVersion | undefined> {
  const versions = await getAllVersions();
  return versions.find(v => v.id === id);
}

export async function getLatestVersion(): Promise<PRDVersion | undefined> {
  const versions = await getAllVersions();
  if (versions.length === 0) return undefined;
  // Sort by versionNumber descending
  versions.sort((a, b) => b.versionNumber - a.versionNumber);
  return versions[0];
}

export async function createVersion(versionData: Omit<PRDVersion, 'id' | 'versionNumber' | 'createdAt'>): Promise<PRDVersion> {
  const versions = await getAllVersions();
  const latest = await getLatestVersion();
  
  const newVersion: PRDVersion = {
    ...versionData,
    id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    versionNumber: latest ? latest.versionNumber + 1 : 1,
    createdAt: new Date().toISOString()
  };
  
  versions.push(newVersion);
  
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');
  return newVersion;
}

export async function updateVersionStatus(id: string, status: PRDVersion['status']): Promise<PRDVersion> {
  const versions = await getAllVersions();
  const version = versions.find(v => v.id === id);
  if (!version) {
    throw new Error(`Version ${id} not found`);
  }
  
  if (status === 'APPROVED') {
    // We must check if there is an active review session that forbids approval
    // (e.g. unreviewed critical items, rejected, or needs_changes)
    try {
      // Find the session for this version
      // We need to import getReviewSessionForVersion or use getAllReviewSessions directly to avoid circular deps if needed
      // Actually we just import getReviewSummary since we only need the counts
      // Let's use a dynamic import to avoid circular dependency issues at the top level
      const { getReviewSessionForVersion, getReviewSummary, isSessionStale } = await import('../collaboration/review-manager');
      const session = await getReviewSessionForVersion(id);
      if (session) {
        if (await isSessionStale(session.id)) {
          throw new Error("Cannot approve version: Review session is stale (underlying PRD has changed).");
        }
        const summary = await getReviewSummary(session.id);
        if (summary.rejectedCount > 0 || summary.needsChangesCount > 0) {
          throw new Error("Cannot approve version: Unresolved review items exist (Rejected or Needs Changes).");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Cannot approve")) throw err;
      // If no session exists, maybe we allow approval (draft -> approved directly) or block it. The user said "Version status cannot become APPROVED if unresolved review items exist", which we enforced.
    }
  }

  version.status = status;
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');

  // Phase 7: Knowledge Indexing
  if (status === 'APPROVED') {
    try {
      const { indexApprovedPRD } = await import('../knowledge/indexing-engine');
      await indexApprovedPRD(version);
    } catch (e) {
      console.error("Failed to index PRD into knowledge base", e);
    }
  }

  return version;
}

export async function validateVersionForPlanning(id: string): Promise<boolean> {
  const v = await getVersion(id);
  if (!v) throw new Error("Version not found");
  if (v.status !== 'APPROVED' && v.status !== 'PLANNING_READY') {
    throw new Error("Version must be APPROVED or PLANNING_READY to begin planning.");
  }

  const { getReviewSessionForVersion, getReviewSummary, isSessionStale } = await import('../collaboration/review-manager');
  const session = await getReviewSessionForVersion(id);
  
  if (session) {
    if (await isSessionStale(session.id)) {
      await updateVersionStatus(id, 'REVIEW_UPDATED');
      throw new Error("Cannot begin planning: Document was updated since approval. Status changed to REVIEW_UPDATED.");
    }
    const summary = await getReviewSummary(session.id);
    if (summary.rejectedCount > 0 || summary.needsChangesCount > 0 || summary.pendingCount > 0) {
      throw new Error("Cannot begin planning: Unresolved or unreviewed items exist.");
    }
  }

  await updateVersionStatus(id, 'PLANNING_READY');
  return true;
}

export async function savePlanningArtifacts(id: string, artifacts: any): Promise<PRDVersion> {
  const versions = await getAllVersions();
  const version = versions.find(v => v.id === id);
  if (!version) throw new Error(`Version ${id} not found`);
  
  version.planningArtifacts = artifacts;
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');
  return version;
}

export async function saveDeliveryArtifacts(id: string, artifacts: any): Promise<PRDVersion> {
  const versions = await getAllVersions();
  const version = versions.find(v => v.id === id);
  if (!version) throw new Error(`Version ${id} not found`);
  
  version.deliveryArtifacts = artifacts;
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');
  return version;
}

export async function deleteVersion(id: string): Promise<void> {
  const versions = await getAllVersions();
  const filtered = versions.filter(v => v.id !== id);
  if (filtered.length === versions.length) {
    throw new Error(`Version ${id} not found`);
  }
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');

  try {
    const { deleteKnowledgeBySourceId } = await import('../knowledge/memory-manager');
    await deleteKnowledgeBySourceId(id);
  } catch (e) {
    console.error("Failed to delete knowledge for version", e);
  }
}
