import { PRDVersion } from '../versioning/version-schema';
import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';
import { SyncJob } from '../integrations/integration-schema';
import { KnowledgeDocument, KnowledgeChunk, ChunkType } from './knowledge-schema';
import { generateEmbedding } from './embedding-manager';
import { saveKnowledge, saveKnowledgeBulk, deleteKnowledgeBySourceId } from './memory-manager';
import { validateKnowledge } from './knowledge-validator';

function generateId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export async function indexApprovedPRD(version: PRDVersion): Promise<void> {
  const docId = `doc-prd-${version.id}`;
  
  // Create document metadata
  const doc: KnowledgeDocument = {
    id: docId,
    projectId: version.projectId,
    type: "PRD",
    title: version.title || `PRD v${version.versionNumber}`,
    sourceId: version.id,
    createdAt: new Date().toISOString()
  };

  const chunks: KnowledgeChunk[] = [];
  const prd = version.structuredPRD;

  // Helper to add chunks
  const addChunk = async (type: ChunkType, content: string, confidence: number) => {
    if (!content || content.trim() === '') return;
    const embedding = await generateEmbedding(content);
    chunks.push({
      id: `chk-${generateId()}`,
      documentId: docId,
      chunkType: type,
      content,
      sourceConfidence: confidence,
      usageCount: 0,
      embedding
    });
  };

  // PRD Metadata
  await addChunk("PRD_METADATA", `Product: ${version.title}\nSummary: ${prd.productOverview}`, 95);

  // Goals
  if (prd.goals) {
    for (const g of prd.goals) {
      const text = typeof g === 'string' ? g : (g as any).description;
      if (text) await addChunk("GOAL", text, 100);
    }
  }

  // Requirements
  if (prd.functionalRequirements) {
    for (const fr of prd.functionalRequirements) {
      const text = typeof fr === 'string' ? fr : `${(fr as any).description} (Purpose: ${(fr as any).purpose})`;
      if (text) await addChunk("REQUIREMENT", text, 100);
    }
  }

  // User Stories
  if (prd.userStories) {
    for (const us of prd.userStories) {
      const text = typeof us === 'string' ? us : `${(us as any).title}: ${(us as any).description}`;
      if (text) await addChunk("USER_STORY", text, 90);
    }
  }

  // Metrics
  if (prd.successMetrics) {
    for (const sm of prd.successMetrics) {
      const text = typeof sm === 'string' ? sm : (sm as any).description;
      if (text) await addChunk("METRIC", text, 95);
    }
  }

  // Validation
  const errors = await validateKnowledge(doc, chunks);
  if (errors.length > 0) {
    // If it says it already exists, maybe we update it (delete and re-index)
    if (errors.some(e => e.includes('already exists'))) {
      await deleteKnowledgeBySourceId(version.id);
      // proceed to save new version
    } else {
      throw new Error("Knowledge indexing failed: " + errors.join("; "));
    }
  }

  await saveKnowledge(doc, chunks);
}

export async function indexPlanningArtifacts(versionId: string, projectId: string, artifacts: PlanningArtifacts, title: string): Promise<void> {
  const docId = `doc-plan-${versionId}`;
  
  const doc: KnowledgeDocument = {
    id: docId,
    projectId,
    type: "PLANNING",
    title: `Planning for ${title}`,
    sourceId: versionId,
    createdAt: new Date().toISOString()
  };

  const chunks: KnowledgeChunk[] = [];
  const addChunk = async (type: ChunkType, content: string, confidence: number) => {
    if (!content || content.trim() === '') return;
    const embedding = await generateEmbedding(content);
    chunks.push({
      id: `chk-${generateId()}`,
      documentId: docId,
      chunkType: type,
      content,
      sourceConfidence: confidence,
      usageCount: 0,
      embedding
    });
  };

  // Index Epics
  for (const epic of artifacts.epics) {
    await addChunk("EPIC", `Epic: ${epic.title}\nDescription: ${epic.description}\nPriority: ${epic.priority}\nEffort: ${epic.estimatedEffort}`, 100);
  }

  // Index Dependencies
  const depStrs = artifacts.dependencies.map(d => `Epic ${d.from} ${d.type} Epic ${d.to}`);
  if (depStrs.length > 0) {
    await addChunk("DEPENDENCY_GRAPH", depStrs.join("\n"), 90);
  }

  // Index Critical Path
  if (artifacts.criticalPath && artifacts.criticalPath.length > 0) {
    await addChunk("CRITICAL_PATH", `Critical Path: ${artifacts.criticalPath.join(" -> ")}`, 90);
  }

  // Index Roadmap/Releases
  for (const release of artifacts.releasePlan.milestones) {
    const epicTitles = release.epics.map(eId => {
      const e = artifacts.epics.find(x => x.id === eId);
      return e ? e.title : eId;
    });
    await addChunk("RELEASE_PLAN", `Release ${release.title} contains Epics: ${epicTitles.join(", ")}`, 95);
  }

  await deleteKnowledgeBySourceId(`doc-plan-${versionId}`).catch(() => {});
  await saveKnowledge(doc, chunks);
}

export async function indexDeliveryArtifacts(versionId: string, projectId: string, artifacts: DeliveryArtifacts, title: string): Promise<void> {
  const docId = `doc-delivery-${versionId}`;
  
  const doc: KnowledgeDocument = {
    id: docId,
    projectId,
    type: "DELIVERY",
    title: `Delivery Plan for ${title}`,
    sourceId: versionId,
    createdAt: new Date().toISOString()
  };

  const chunks: KnowledgeChunk[] = [];
  const addChunk = async (type: ChunkType, content: string, confidence: number) => {
    if (!content || content.trim() === '') return;
    const embedding = await generateEmbedding(content);
    chunks.push({
      id: `chk-${generateId()}`,
      documentId: docId,
      chunkType: type,
      content,
      sourceConfidence: confidence,
      usageCount: 0,
      embedding
    });
  };

  for (const sprint of artifacts.sprints) {
    const taskDetails = sprint.tasks.map(tId => {
      const t = artifacts.tasks.find(x => x.id === tId);
      return t ? `Task ${t.id} (${t.title}, ${t.storyPoints} pts, Role: ${t.requiredRole})` : tId;
    });
    await addChunk("SPRINT", `Sprint: ${sprint.name}\nCapacity: ${sprint.capacityPoints}\nAssigned: ${sprint.assignedPoints}\nTasks: ${taskDetails.join(", ")}`, 100);
  }

  await addChunk("CAPACITY_PLAN", `Sprint Length: ${artifacts.capacityPlan.sprintLengthWeeks} weeks\nTeam Size: ${artifacts.capacityPlan.team.length}\nTotal Capacity: ${artifacts.capacityPlan.totalCapacityPoints} pts`, 100);

  if (artifacts.riskReport) {
    await addChunk("RISK_REPORT", `Risk Level: ${artifacts.riskReport.level}\nRisks: ${artifacts.riskReport.risks.join(", ")}`, 100);
  }

  if (artifacts.readinessReport) {
    await addChunk("READINESS_REPORT", `Readiness Status: ${artifacts.readinessReport.status}\nReasons: ${artifacts.readinessReport.reasons.join(", ")}`, 100);
  }

  await deleteKnowledgeBySourceId(docId).catch(() => {});
  await saveKnowledge(doc, chunks);
}

export async function indexIntegrationArtifacts(versionId: string, projectId: string, job: SyncJob, title: string): Promise<void> {
  const docId = `doc-integration-${job.id}`;
  
  const doc: KnowledgeDocument = {
    id: docId,
    projectId,
    type: "INTEGRATION",
    title: `Sync Job for ${title} to ${job.system}`,
    sourceId: job.id,
    createdAt: new Date().toISOString()
  };

  const chunks: KnowledgeChunk[] = [];
  const addChunk = async (type: ChunkType, content: string, confidence: number) => {
    if (!content || content.trim() === '') return;
    const embedding = await generateEmbedding(content);
    chunks.push({
      id: `chk-${generateId()}`,
      documentId: docId,
      chunkType: type,
      content,
      sourceConfidence: confidence,
      usageCount: 0,
      embedding
    });
  };

  const syncDetails = job.results.map(r => `${r.sourceType} ${r.localId} synced: ${r.status}`).join('\n');
  await addChunk("SYNC_REPORT", `Job ID: ${job.id}\nSystem: ${job.system}\nStatus: ${job.status}\n\n${syncDetails}`, 100);

  await deleteKnowledgeBySourceId(docId).catch(() => {});
  await saveKnowledge(doc, chunks);
}

export async function indexKnowledgeBulk(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]): Promise<void> {
  // Batch Validate
  for (const doc of documents) {
    const docChunks = chunks.filter(c => c.documentId === doc.id);
    const errors = await validateKnowledge(doc, docChunks);
    if (errors.length > 0 && !errors.some(e => e.includes('already exists'))) {
      throw new Error(`Bulk Knowledge indexing failed for doc ${doc.id}: ` + errors.join("; "));
    }
  }

  // Single Atomic Write
  await saveKnowledgeBulk(documents, chunks);
}
