import { StructuredPRD } from '../prd/schema';
import { TraceabilityMap } from '../traceability/types';
import { ResearchReport } from '../research/research-schema';
import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';

export interface PRDVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  createdAt: string;
  title: string;
  changeSummary?: string;
  generatedFromPrompt?: string;
  status: "DRAFT" | "UNDER_REVIEW" | "REVIEW_UPDATED" | "APPROVED" | "PLANNING_READY" | "ARCHIVED";
  structuredPRD: StructuredPRD;
  traceabilityMap: TraceabilityMap[];
  researchReport?: ResearchReport;
  planningArtifacts?: PlanningArtifacts;
  deliveryArtifacts?: DeliveryArtifacts;
}

export interface RequirementChange {
  type: "ADDED" | "REMOVED" | "MODIFIED" | "ID_CHANGED";
  entityType: "Goal" | "Requirement" | "UserStory" | "Metric";
  entityId: string;
  before?: string;
  after?: string;
}

export interface ImpactReport {
  affectedGoals: string[];
  affectedRequirements: string[];
  affectedStories: string[];
  affectedMetrics: string[];
}

export interface EvolutionSummary {
  added: string[];
  modified: string[];
  removed: string[];
}
