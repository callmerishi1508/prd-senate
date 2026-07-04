export interface Goal {
  id?: string;
  description: string;
}

export interface NonGoal {
  id?: string;
  description: string;
}

export interface UserPersona {
  id?: string;
  name: string;
  age: string;
  gender: string;
  healthStatus: string;
  preferences: string;
}

export interface FunctionalRequirement {
  id?: string;
  description: string;
  purpose: string;
  userValue: string;
  source?: string;
}

export interface UserStory {
  id?: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface SuccessMetric {
  id?: string;
  description: string;
}

export interface StructuredPRD {
  researchReferences?: {
    competitors: string[];
    marketStandards: string[];
  };
  productOverview: string;
  goals: Goal[];
  nonGoals: NonGoal[];
  userPersonas: UserPersona[];
  functionalRequirements: FunctionalRequirement[];
  userExperience: string;
  narrative: string;
  successMetrics: SuccessMetric[];
  technicalConsiderations: string[];
  milestones: string[];
  userStories: UserStory[];
}
