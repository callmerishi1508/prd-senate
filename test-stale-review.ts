import { createReviewSession, isSessionStale, hashTraceability } from './src/lib/collaboration/review-manager';
import { setApproval } from './src/lib/collaboration/approval-manager';
import { updateVersionStatus, getAllVersions } from './src/lib/versioning/version-manager';
import { buildTraceability } from './src/lib/traceability/engine';
import * as fs from 'fs/promises';
import * as path from 'path';

async function run() {
  console.log("=== Test: Stale Review Session Validation ===");

  const DATA_DIR = path.join(process.cwd(), 'data');
  const VERSIONS_FILE = path.join(DATA_DIR, 'versions.json');

  // 1. Get existing version
  const versions = await getAllVersions();
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

  // 3. Set Approvals (Make it theoretically approved)
  console.log("Setting 5 approvals...");
  await setApproval(session.id, 'Goal', 'G-001', 'Alice', 'APPROVED');
  await setApproval(session.id, 'Requirement', 'FR-001', 'Bob', 'APPROVED');
  await setApproval(session.id, 'Requirement', 'FR-002', 'Charlie', 'APPROVED');
  await setApproval(session.id, 'UserStory', 'US-001', 'Alice', 'APPROVED');
  await setApproval(session.id, 'Metric', 'M-001', 'Bob', 'APPROVED');

  const staleBefore = await isSessionStale(session.id);
  console.log(`Is session stale before changes? ${staleBefore}`);

  // 4. Modify Version (simulate someone changing requirements during/after review)
  console.log("Modifying underlying PRD version...");
  if (!version.structuredPRD.goals) version.structuredPRD.goals = [];
  version.structuredPRD.goals.push({ description: "A sneaky new goal inserted after review" });
  
  // Rebuild traceability map so the hash changes
  const { maps } = buildTraceability(version.structuredPRD);
  version.traceabilityMap = maps;
  
  // Save modified version to disk
  const vIndex = versions.findIndex(v => v.id === version.id);
  versions[vIndex] = version;
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf-8');

  // 5. Verify Stale Detection
  const sessionAfter = await createReviewSession(version.id);
  const currentHash = hashTraceability(version);
  console.log(`Hash in session: ${sessionAfter.traceabilityHash}`);
  console.log(`Current Hash:    ${currentHash}`);

  const staleAfter = await isSessionStale(session.id);
  console.log(`Is session stale after changes? ${staleAfter}`);
  
  if (!staleAfter) {
    console.log("❌ FAILED: Session was not marked stale after underlying PRD changed.");
    return;
  }

  // 6. Attempt Approval
  console.log("Attempting to approve version with stale review session...");
  try {
    await updateVersionStatus(version.id, 'APPROVED');
    console.log("❌ FAILED: Version was approved despite stale session!");
  } catch (err: any) {
    if (err.message.includes('stale')) {
      console.log("✅ SUCCESS: Version approval was correctly blocked due to stale session.");
    } else {
      console.log("❌ FAILED: Unexpected error", err.message);
    }
  }
}

run().catch(console.error);
