export interface Epic {
  id: string;
  title: string;
  description: string;

  relatedRequirements: string[];
  relatedStories: string[];

  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

  estimatedEffort: "XS" | "S" | "M" | "L" | "XL";
  estimatedWeeks?: number;
  confidence?: number;
}

export interface Dependency {
  from: string;
  to: string;

  type: "BLOCKS" | "REQUIRES" | "ENHANCES";
}

export interface Milestone {
  id: string;
  title: string;
  epics: string[];
}

export interface ReleasePlan {
  id: string;
  title: string;

  milestones: Milestone[];
  epics: Epic[];
  criticalPath?: string[];

  targetVersion: string;
}

export interface PlanningArtifacts {
  epics: Epic[];
  dependencies: Dependency[];
  releasePlan: ReleasePlan;
  roadmap: Milestone[];
  criticalPath: string[];
}
