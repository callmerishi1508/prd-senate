import fetch from 'node-fetch';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runE2E() {
  console.log("Starting End-to-End Product Lifecycle Validation...");
  const projectId = `test-proj-${Date.now()}`;

  // 1. Create Version (PRD Save)
  console.log("1. Creating PRD Version...");
  let res = await fetch(`${BASE_URL}/api/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      title: "E2E Test PRD",
      status: "DRAFT",
      structuredPRD: {
        goals: [{ id: "G-1", title: "Goal 1", description: "test goal", priority: "HIGH", successMetrics: [] }],
        functionalRequirements: [{ id: "FR-1", title: "Req 1", description: "test req", purpose: "test purpose", priority: "HIGH" }],
        nonFunctionalRequirements: [],
        userStories: [{ id: "US-1", title: "Story 1", description: "As a user, I want X so that Y", acceptanceCriteria: [] }]
      },
      traceabilityMap: []
    })
  });
  const version = await res.json();
  assert(version.projectId === projectId, "Version projectId mismatch");
  assert(version.status === "DRAFT", "Version should be DRAFT");
  const versionId = version.id;
  console.log(`✅ Version created: ${versionId}`);

  // 2. Create Review Session
  console.log("2. Creating Review Session...");
  res = await fetch(`${BASE_URL}/api/reviews?action=createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionId })
  });
  const session = await res.json();
  assert(session.versionId === versionId, "Session versionId mismatch");
  const sessionId = session.id;
  console.log(`✅ Review Session created: ${sessionId}`);

  // Wait for version status to update to UNDER_REVIEW
  res = await fetch(`${BASE_URL}/api/versions?id=${versionId}`);
  let vStatus = await res.json();
  assert(vStatus.status === "UNDER_REVIEW", "Version status should be UNDER_REVIEW");
  console.log(`✅ Version transitioned to UNDER_REVIEW`);

  // 3. Approve Entities
  console.log("3. Approving PRD entities...");
  await fetch(`${BASE_URL}/api/reviews?action=setApproval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, entityType: "Goal", entityId: "G-1", reviewer: "E2E", status: "APPROVED" })
  });
  await fetch(`${BASE_URL}/api/reviews?action=setApproval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, entityType: "Requirement", entityId: "FR-1", reviewer: "E2E", status: "APPROVED" })
  });
  
  res = await fetch(`${BASE_URL}/api/versions?id=${versionId}`);
  vStatus = await res.json();
  assert(vStatus.status === "APPROVED", "Version status should be APPROVED after full approval");
  console.log(`✅ Version transitioned to APPROVED`);

  // 4. Planning Phase
  console.log("4. Generating Planning Artifacts...");
  res = await fetch(`${BASE_URL}/api/planning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prdId: versionId })
  });
  const plan = await res.json();
  if (plan.error) throw new Error(`Planning API Error: ${plan.error} - ${JSON.stringify(plan.issues || {})}`);
  assert(plan.planningArtifacts?.epics?.length > 0, "Should generate epics");
  
  res = await fetch(`${BASE_URL}/api/versions?id=${versionId}`);
  vStatus = await res.json();
  assert(vStatus.status === "PLANNING_READY", "Version should be PLANNING_READY after planning phase");
  console.log(`✅ Version transitioned to PLANNING_READY`);

  // 5. Delivery Phase
  console.log("5. Generating Delivery Artifacts...");
  res = await fetch(`${BASE_URL}/api/delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prdId: versionId, teamSize: 5, velocityPerDev: 8, sprintWeeks: 2 })
  });
  const delivery = await res.json();
  if (delivery.error) throw new Error(`Delivery API Error: ${delivery.error}`);
  assert(delivery.deliveryArtifacts?.sprints?.length > 0, "Should generate sprints");
  console.log(`✅ Delivery artifacts generated`);

  // 6. Integration Sync
  console.log("6. Pushing to GitHub Integration...");
  res = await fetch(`${BASE_URL}/api/integrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "sync", versionId, system: "GITHUB" })
  });
  const sync = await res.json();
  if (sync.error) throw new Error(`Sync API Error: ${sync.error}`);
  assert(sync.job?.projectId === projectId, "Sync job projectId mismatch");
  assert(sync.job.versionId === versionId, "Sync job versionId mismatch");
  assert(sync.validation.isValid === true, "Sync traceability must be valid");
  console.log(`✅ Sync job finished and Traceability validated`);

  console.log("\n🚀 End-to-End Validation PASSED. State is perfectly isolated.");
}

runE2E().catch(err => {
  console.error("❌ E2E Failed:", err.message);
  process.exit(1);
});
