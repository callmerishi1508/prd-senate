import { TeamMember, TeamRole } from './team-schema';

export interface EngineeringTask {
  id: string;
  epicId: string;
  relatedRequirementId: string;
  title: string;
  description: string;
  storyPoints?: number;
  confidenceScore?: number; // 0-100
  requiredRole?: TeamRole;
  externalId?: string;
  externalSystem?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  capacityPoints: number;
  assignedPoints: number;
  tasks: string[]; // Task IDs
}

export interface CapacityPlan {
  sprintLengthWeeks: number;
  velocityPerSprint: number;
  team: TeamMember[];
  totalCapacityPoints: number;
}

export interface ReadinessReport {
  status: "READY" | "NOT_READY" | "BLOCKED";
  reasons: string[];
}

export interface RiskReport {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risks: string[];
}

export interface DeliveryArtifacts {
  tasks: EngineeringTask[];
  sprints: Sprint[];
  capacityPlan: CapacityPlan;
  readinessReport?: ReadinessReport;
  riskReport?: RiskReport;
}
