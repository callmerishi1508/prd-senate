import { NextResponse } from 'next/server';
import { getVersion, saveDeliveryArtifacts } from '@/lib/versioning/version-manager';
import { generateTasks } from '@/lib/delivery/task-engine';
import { estimateStoryPoints } from '@/lib/delivery/story-point-engine';
import { calculateCapacityPlan } from '@/lib/delivery/capacity-engine';
import { generateSprints } from '@/lib/delivery/sprint-engine';
import { calculateDeliveryRisks } from '@/lib/delivery/risk-engine';
import { validateExecutionPlan } from '@/lib/delivery/execution-validator';
import { runDeliveryQualityGate } from '@/lib/quality/delivery-quality-gate';
import { calculateReadiness } from '@/lib/delivery/readiness-engine';
import { auditDeliveryTraceability } from '@/lib/delivery/traceability-audit';
import { indexDeliveryArtifacts } from '@/lib/knowledge/indexing-engine';
import { TeamMember } from '@/lib/delivery/team-schema';
import { DeliveryArtifacts } from '@/lib/delivery/delivery-schema';
import { getReviewSessionForVersion } from '@/lib/collaboration/review-manager';

export async function POST(req: Request) {
  try {
    const { prdId, teamSize = 5, velocityPerDev = 8, sprintWeeks = 2 } = await req.json();

    if (!prdId) {
      return NextResponse.json({ error: 'Missing prdId' }, { status: 400 });
    }

    const version = await getVersion(prdId);
    if (!version) {
      return NextResponse.json({ error: 'PRD version not found' }, { status: 404 });
    }

    if (version.status !== 'APPROVED' && version.status !== 'PLANNING_READY') {
      return NextResponse.json({ error: 'Delivery planning requires an APPROVED or PLANNING_READY PRD version.' }, { status: 400 });
    }

    const session = await getReviewSessionForVersion(prdId);
    if (session) {
      const hasOpenItems = session.approvals.some((a: any) => a.status === 'PENDING' || a.status === 'NEEDS_CHANGES');
      if (hasOpenItems) {
        return NextResponse.json({ error: 'Cannot generate delivery plan while review items are open.' }, { status: 400 });
      }
    }

    if (!version.planningArtifacts) {
      return NextResponse.json({ error: 'No Planning Artifacts found. Please generate Roadmaps and Epics first.' }, { status: 400 });
    }

    const { epics, dependencies, releasePlan } = version.planningArtifacts;

    // 1. Task Engine
    let tasks = await generateTasks(epics, version.structuredPRD);

    // 2. Story Point Engine
    tasks = await estimateStoryPoints(tasks);

    // 3. Capacity Engine
    const mockTeam: TeamMember[] = Array.from({ length: teamSize }).map((_, i) => ({
      id: `DEV-${i+1}`,
      name: `Developer ${i+1}`,
      role: i % 3 === 0 ? "FRONTEND" : i % 3 === 1 ? "BACKEND" : "FULLSTACK",
      capacityPoints: velocityPerDev
    }));
    const capacityPlan = calculateCapacityPlan(mockTeam, sprintWeeks, velocityPerDev);

    // 4. Sprint Allocation
    const sprints = generateSprints(tasks, epics, releasePlan, capacityPlan);

    // 5. Risk Engine
    const riskReport = calculateDeliveryRisks(tasks, sprints, capacityPlan, epics, dependencies);

    const deliveryArtifacts: DeliveryArtifacts = {
      tasks,
      sprints,
      capacityPlan,
      riskReport
    };

    // 6. Execution Validator
    const executionIssues = validateExecutionPlan(tasks, sprints, capacityPlan);

    // 6.5 Traceability Audit
    const audit = auditDeliveryTraceability(version.structuredPRD, epics, tasks, sprints);
    if (audit.score < 100) {
      executionIssues.push(`Traceability audit failed (Score: ${audit.score}). Orphans found: ` + 
        `${audit.orphanRequirements.length} Reqs, ${audit.orphanEpics.length} Epics, ${audit.orphanTasks.length} Tasks, ${audit.orphanSprints.length} Sprints.`
      );
    }

    // 7. Delivery Quality Gate
    const qualityGateResult = await runDeliveryQualityGate(deliveryArtifacts);

    // 8. Readiness Report
    const readinessReport = calculateReadiness(deliveryArtifacts, executionIssues, qualityGateResult.decision, qualityGateResult.issues);
    deliveryArtifacts.readinessReport = readinessReport;

    // 9. Save and Index
    version.deliveryArtifacts = deliveryArtifacts;
    await saveDeliveryArtifacts(version.id, deliveryArtifacts);

    if (readinessReport.status !== 'BLOCKED') {
      await indexDeliveryArtifacts(version.id, version.projectId, deliveryArtifacts, version.title);
    }

    return NextResponse.json({
      message: 'Delivery plan generated',
      deliveryArtifacts,
      qualityGateDecision: qualityGateResult.decision,
      issues: [...executionIssues, ...qualityGateResult.issues]
    });

  } catch (error: any) {
    console.error('Delivery generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
