import { EngineeringTask } from './src/lib/delivery/delivery-schema';
import { calculateCapacityPlan } from './src/lib/delivery/capacity-engine';
import { generateSprints } from './src/lib/delivery/sprint-engine';
import { calculateDeliveryRisks } from './src/lib/delivery/risk-engine';
import { validateExecutionPlan } from './src/lib/delivery/execution-validator';
import { auditDeliveryTraceability } from './src/lib/delivery/traceability-audit';

import * as ollama from './src/lib/agents/ollama';

import { StructuredPRD } from './src/lib/prd/schema';
import { Epic, ReleasePlan, Dependency } from './src/lib/planning/planning-schema';
import { TeamMember } from './src/lib/delivery/team-schema';

async function runMegaDeliveryTest() {
  console.log("=== MEGA DELIVERY TEST ===");

  // 1. Mock 100 Reqs
  const reqs = Array.from({length: 100}).map((_, i) => ({
    id: `FR-${i.toString().padStart(3, '0')}`,
    description: `Mega requirement ${i}`,
    purpose: "Test scale",
    userValue: "Scale testing",
    source: "System"
  }));

  const stories = Array.from({length: 150}).map((_, i) => ({
    id: `US-${i.toString().padStart(3, '0')}`,
    title: `User story ${i}`,
    description: `User story ${i} desc`,
    acceptanceCriteria: ["AC 1"]
  }));

  const prd = {
    productOverview: "Mega PRD",
    goals: [],
    nonGoals: [],
    userPersonas: [],
    functionalRequirements: reqs,
    userExperience: "",
    narrative: "",
    successMetrics: [],
    technicalConsiderations: [],
    milestones: [],
    userStories: stories
  } as StructuredPRD;

  const epics: Epic[] = Array.from({length: 30}).map((_, i) => {
    // Distribute the 100 requirements across 30 epics without leaving orphans
    // Each epic gets 3-4 requirements. For i=0..9, it gets 4 requirements (idx: i*4 to i*4+3). For i=10..29, it gets 3 requirements (idx: 40+(i-10)*3).
    const reqIds: string[] = [];
    if (i < 10) {
      reqIds.push(`FR-${(i*4).toString().padStart(3, '0')}`);
      reqIds.push(`FR-${(i*4+1).toString().padStart(3, '0')}`);
      reqIds.push(`FR-${(i*4+2).toString().padStart(3, '0')}`);
      reqIds.push(`FR-${(i*4+3).toString().padStart(3, '0')}`);
    } else {
      const base = 40 + (i-10)*3;
      reqIds.push(`FR-${base.toString().padStart(3, '0')}`);
      reqIds.push(`FR-${(base+1).toString().padStart(3, '0')}`);
      reqIds.push(`FR-${(base+2).toString().padStart(3, '0')}`);
    }

    return {
      id: `EPIC-${i.toString().padStart(3, '0')}`,
      title: `Mega Epic ${i}`,
      description: `Epic ${i} desc`,
      priority: i % 5 === 0 ? "CRITICAL" : "MEDIUM",
      estimatedEffort: "M",
      estimatedWeeks: 2,
      relatedRequirements: reqIds,
      relatedStories: []
    }
  });

  const releasePlan: ReleasePlan = {
    id: "rp-1",
    title: "Phase 1 Release",
    epics: epics,
    targetVersion: "v1.0",
    milestones: [
      { id: "m-1", title: "M1", epics: epics.slice(0, 10).map(e => e.id) },
      { id: "M2", title: "Release 2", epics: epics.slice(10, 20).map(e => e.id) },
      { id: "M3", title: "Release 3", epics: epics.slice(20, 30).map(e => e.id) }
    ]
  };

  const dependencies: Dependency[] = [];
  for(let i=1; i<30; i++) {
    const fromId = `EPIC-${(i-1).toString().padStart(3, '0')}`;
    const toId = `EPIC-${i.toString().padStart(3, '0')}`;
    dependencies.push({ from: fromId, to: toId, type: 'REQUIRES' });
  }

  // Mock task generator for performance
  async function mockGenerateTasks(epics: Epic[], prd: StructuredPRD): Promise<EngineeringTask[]> {
    const tasks: EngineeringTask[] = [];
    epics.forEach(epic => {
      epic.relatedRequirements.forEach((reqId, idx) => {
        tasks.push({
          id: `TASK-${epic.id.replace('EPIC-', '')}-${(idx + 1).toString().padStart(3, '0')}`,
          epicId: epic.id,
          relatedRequirementId: reqId,
          title: `Task for ${reqId}`,
          description: `Auto-generated for testing`,
          requiredRole: idx % 2 === 0 ? "BACKEND" : "FRONTEND",
          storyPoints: 5,
          confidenceScore: 90
        });
      });
    });
    return tasks;
  }

  async function mockEstimateStoryPoints(tasks: EngineeringTask[]): Promise<EngineeringTask[]> {
    return tasks;
  }

  const t0 = Date.now();
  
  console.log("Generating Tasks...");
  let tasks = await mockGenerateTasks(epics, prd);
  console.log(`Generated ${tasks.length} tasks in ${Date.now() - t0}ms`);

  const t1 = Date.now();
  console.log("Estimating Story Points...");
  tasks = await mockEstimateStoryPoints(tasks);
  console.log(`Estimated points for ${tasks.length} tasks in ${Date.now() - t1}ms`);

  const t2 = Date.now();
  console.log("Calculating Capacity...");
  const team: TeamMember[] = Array.from({length: 5}).map((_, i) => ({
    id: `DEV-${i}`, name: `Dev ${i}`, role: "FULLSTACK", capacityPoints: 8
  }));
  const capacityPlan = calculateCapacityPlan(team, 2, 8);
  console.log(`Capacity calculated. Total Points/Sprint: ${capacityPlan.totalCapacityPoints}`);

  console.log("Generating Sprints...");
  const sprints = generateSprints(tasks, epics, releasePlan, capacityPlan);
  console.log(`Generated ${sprints.length} sprints`);

  console.log("Calculating Risks...");
  const risks = calculateDeliveryRisks(tasks, sprints, capacityPlan, epics, dependencies);
  console.log(`Risks: Level=${risks.level}, Count=${risks.risks.length}`);
  if (risks.risks.length > 0) {
    console.log(risks.risks.slice(0, 3).join('\n'));
  }

  console.log("Validating Execution Plan...");
  const issues = validateExecutionPlan(tasks, sprints, capacityPlan);
  console.log(`Issues: ${issues.length}`);

  console.log("Running Traceability Audit...");
  const audit = auditDeliveryTraceability(prd, epics, tasks, sprints);
  console.log(`Requirements: ${prd.functionalRequirements.length}`);
  console.log(`Mapped to Epics: ${prd.functionalRequirements.length - audit.orphanRequirements.length}`);
  console.log(`Epics: ${epics.length}`);
  console.log(`Mapped to Tasks: ${epics.length - audit.orphanEpics.length}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Assigned to Sprint: ${tasks.length - audit.orphanTasks.length}`);
  const totalOrphans = audit.orphanRequirements.length + audit.orphanEpics.length + audit.orphanTasks.length + audit.orphanSprints.length;
  console.log(`Orphans: ${totalOrphans}`);

  console.log(`\n=== Total Delivery Time: ${Date.now() - t0}ms ===`);
}

runMegaDeliveryTest().catch(console.error);
