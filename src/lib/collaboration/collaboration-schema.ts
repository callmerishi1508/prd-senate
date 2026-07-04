export type CollaborationEntityType = 'Goal' | 'Requirement' | 'UserStory' | 'Metric';

export interface Comment {
  id: string;
  entityType: CollaborationEntityType;
  entityId: string;
  author: string;
  content: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export type EntityReviewStatus = 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | 'PENDING';

export interface Approval {
  id: string;
  entityType: CollaborationEntityType;
  entityId: string;
  reviewer: string;
  status: EntityReviewStatus;
  comment?: string;
  createdAt: string;
}

export interface ReviewSession {
  id: string;
  versionId: string;
  versionNumber: number;
  traceabilityHash?: string;
  createdAt: string;
  approvals: Approval[];
  comments: Comment[];
}
