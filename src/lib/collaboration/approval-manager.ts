import { Approval, CollaborationEntityType, EntityReviewStatus } from './collaboration-schema';
import { getAllReviewSessions, saveAllReviewSessions } from './review-manager';

export async function setApproval(
  sessionId: string,
  entityType: CollaborationEntityType,
  entityId: string,
  reviewer: string,
  status: EntityReviewStatus,
  comment?: string
): Promise<Approval> {
  const sessions = await getAllReviewSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    throw new Error(`Review session ${sessionId} not found`);
  }

  // We could just append, to keep history, or update if the same reviewer is updating their status.
  // We'll just append to keep a full audit log of approvals. The UI/summary can just read the latest one.
  const newApproval: Approval = {
    id: `a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType,
    entityId,
    reviewer,
    status,
    comment,
    createdAt: new Date().toISOString()
  };

  session.approvals.push(newApproval);
  await saveAllReviewSessions(sessions);
  return newApproval;
}

export async function getLatestApproval(sessionId: string, entityId: string): Promise<Approval | undefined> {
  const sessions = await getAllReviewSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return undefined;

  // Filter approvals for this entity
  const entityApprovals = session.approvals.filter(a => a.entityId === entityId);
  if (entityApprovals.length === 0) return undefined;

  // Since we append, the last one in the array is the latest
  return entityApprovals[entityApprovals.length - 1];
}
