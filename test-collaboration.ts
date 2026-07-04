import { createReviewSession, getReviewSummary, getAllReviewSessions } from './src/lib/collaboration/review-manager';
import { addComment, resolveComment } from './src/lib/collaboration/comment-manager';
import { setApproval } from './src/lib/collaboration/approval-manager';
import { updateVersionStatus } from './src/lib/versioning/version-manager';
import * as fs from 'fs/promises';

async function run() {
  console.log("=== Test: Collaboration Phase 6 ===");

  // 1. We need a valid version to review
  const versionsData = await fs.readFile('./data/versions.json', 'utf-8');
  const versions = JSON.parse(versionsData);
  if (versions.length === 0) {
    console.log("No versions found to test with.");
    return;
  }
  const version = versions[0];
  console.log(`Using Version ID: ${version.id}`);

  // 2. Create Review Session
  console.log("Creating review session...");
  const session = await createReviewSession(version.id);
  console.log(`Session ID: ${session.id}`);

  // 3. Add Comments
  console.log("Adding comments...");
  await addComment(session.id, 'Goal', 'G-001', 'Alice', 'This goal needs to be more specific.');
  await addComment(session.id, 'Requirement', 'FR-001', 'Bob', 'Is this requirement technically feasible?');
  const c3 = await addComment(session.id, 'Requirement', 'FR-002', 'Charlie', 'Typo here.');
  await addComment(session.id, 'UserStory', 'US-001', 'Alice', 'I like this user story.');
  await addComment(session.id, 'Metric', 'M-001', 'Bob', 'How do we measure this exactly?');

  console.log("Resolving comment 3...");
  await resolveComment(session.id, c3.id);

  // 4. Set Approvals
  console.log("Setting approvals...");
  await setApproval(session.id, 'Goal', 'G-001', 'Alice', 'NEEDS_CHANGES', 'Please address my comment.');
  await setApproval(session.id, 'Requirement', 'FR-001', 'Bob', 'REJECTED', 'Not feasible.');
  await setApproval(session.id, 'Requirement', 'FR-002', 'Charlie', 'APPROVED');
  await setApproval(session.id, 'UserStory', 'US-001', 'Alice', 'APPROVED');
  await setApproval(session.id, 'Metric', 'M-001', 'Bob', 'APPROVED');

  // 5. Generate Summary
  console.log("Generating summary...");
  const summary = await getReviewSummary(session.id);
  console.log(summary);

  // 6. Test Quality Gate Validation (version approval blocking)
  console.log("Attempting to approve version with unresolved review items...");
  try {
    await updateVersionStatus(version.id, 'APPROVED');
    console.log("❌ FAILED: Version was approved despite rejected items!");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Unresolved review items exist')) {
      console.log("✅ SUCCESS: Version approval was correctly blocked.");
    } else {
      console.log("❌ FAILED: Unexpected error", message);
    }
  }

  // 7. Verify persistence
  const allSessions = await getAllReviewSessions();
  const savedSession = allSessions.find(s => s.id === session.id);
  if (savedSession && savedSession.comments.length === 5 && savedSession.approvals.length === 5) {
    console.log("✅ SUCCESS: Data was successfully persisted to data/reviews.json");
  } else {
    console.log("❌ FAILED: Data was not persisted properly.");
  }
}

run().catch(console.error);
