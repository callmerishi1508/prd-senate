import { Comment, CollaborationEntityType } from './collaboration-schema';
import { getAllReviewSessions, saveAllReviewSessions } from './review-manager';

export async function addComment(
  sessionId: string,
  entityType: CollaborationEntityType,
  entityId: string,
  author: string,
  content: string
): Promise<Comment> {
  const sessions = await getAllReviewSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    throw new Error(`Review session ${sessionId} not found`);
  }

  const newComment: Comment = {
    id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityType,
    entityId,
    author,
    content,
    createdAt: new Date().toISOString(),
    resolved: false
  };

  session.comments.push(newComment);
  await saveAllReviewSessions(sessions);
  return newComment;
}

export async function resolveComment(sessionId: string, commentId: string): Promise<Comment> {
  const sessions = await getAllReviewSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) throw new Error(`Review session ${sessionId} not found`);

  const comment = session.comments.find(c => c.id === commentId);
  if (!comment) throw new Error(`Comment ${commentId} not found`);

  comment.resolved = true;
  comment.resolvedAt = new Date().toISOString();

  await saveAllReviewSessions(sessions);
  return comment;
}

export async function deleteComment(sessionId: string, commentId: string): Promise<void> {
  const sessions = await getAllReviewSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) throw new Error(`Review session ${sessionId} not found`);

  session.comments = session.comments.filter(c => c.id !== commentId);
  await saveAllReviewSessions(sessions);
}
