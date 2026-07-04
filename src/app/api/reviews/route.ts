import { NextRequest, NextResponse } from 'next/server';
import { getReviewSessionForVersion, createReviewSession, getReviewSummary, getReviewSession } from '@/lib/collaboration/review-manager';
import { addComment, resolveComment } from '@/lib/collaboration/comment-manager';
import { setApproval } from '@/lib/collaboration/approval-manager';
import { updateVersionStatus } from '@/lib/versioning/version-manager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get('versionId');
  const sessionId = searchParams.get('sessionId');
  const action = searchParams.get('action');

  try {
    if (action === 'summary' && sessionId) {
      const summary = await getReviewSummary(sessionId);
      return NextResponse.json(summary);
    }

    if (versionId) {
      const session = await getReviewSessionForVersion(versionId);
      if (!session) return NextResponse.json({ error: "No session found" }, { status: 404 });
      return NextResponse.json(session);
    }
    
    if (sessionId) {
      const session = await getReviewSession(sessionId);
      if (!session) return NextResponse.json({ error: "No session found" }, { status: 404 });
      return NextResponse.json(session);
    }

    return NextResponse.json({ error: "Missing versionId or sessionId" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'createSession') {
      const { versionId } = await req.json();
      const session = await createReviewSession(versionId);
      await updateVersionStatus(versionId, 'UNDER_REVIEW');
      return NextResponse.json(session, { status: 201 });
    }

    if (action === 'addComment') {
      const { sessionId, entityType, entityId, author, content } = await req.json();
      const comment = await addComment(sessionId, entityType, entityId, author, content);
      return NextResponse.json(comment, { status: 201 });
    }

    if (action === 'resolveComment') {
      const { sessionId, commentId } = await req.json();
      const comment = await resolveComment(sessionId, commentId);
      return NextResponse.json(comment);
    }

    if (action === 'setApproval') {
      const { sessionId, entityType, entityId, reviewer, status, comment } = await req.json();
      const approval = await setApproval(sessionId, entityType, entityId, reviewer, status, comment);
      
      const summary = await getReviewSummary(sessionId);
      if (summary.pendingCount === 0 && summary.rejectedCount === 0 && summary.needsChangesCount === 0) {
        const session = await getReviewSession(sessionId);
        if (session) {
          try { await updateVersionStatus(session.versionId, 'APPROVED'); } catch (e) {}
        }
      }

      return NextResponse.json(approval, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
