export type KnowledgeType = "PRD" | "RESEARCH" | "REVIEW" | "ARCHITECTURE" | "STANDARD" | "PLANNING" | "DELIVERY" | "INTEGRATION" | "INTELLIGENCE";
export type ChunkType = "GOAL" | "REQUIREMENT" | "USER_STORY" | "METRIC" | "RESEARCH" | "REVIEW" | "STANDARD" | "PRD_METADATA" | "EPIC" | "ROADMAP" | "RELEASE_PLAN" | "DEPENDENCY_GRAPH" | "CRITICAL_PATH" | "TASK" | "SPRINT" | "CAPACITY_PLAN" | "READINESS_REPORT" | "RISK_REPORT" | "EXTERNAL_EPIC" | "EXTERNAL_TASK" | "EXTERNAL_SPRINT" | "SYNC_REPORT" | "WEBHOOK_EVENT" | "DELTA_SYNC" | "CONFLICT" | "AUTH_EVENT" | "PRODUCT_HEALTH" | "FORECAST" | "ROADMAP_DRIFT" | "RISK" | "RECOMMENDATION" | "EXECUTIVE_REPORT";

export type Environment = "TEST" | "DEV" | "PROD";

export interface KnowledgeDocument {
  id: string;
  projectId?: string;
  type: KnowledgeType;
  environment?: Environment;
  title: string;
  sourceId: string;
  createdAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkType: ChunkType;
  content: string;
  sourceConfidence: number; // e.g. 100 for approved req, 85 for research
  lastUsedAt?: string;
  usageCount?: number;
  embedding: number[];
}

export interface RetrievedChunk extends KnowledgeChunk {
  similarity: number;
  score: number; // Reranked score: similarity * sourceConfidence
  documentTitle: string; // Hydrated for easy UI access
}
