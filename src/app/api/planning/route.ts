import { NextResponse } from 'next/server';
import { getVersion, validateVersionForPlanning, savePlanningArtifacts } from '../../../lib/versioning/version-manager';
import { generateEpics } from '../../../lib/planning/epic-engine';
import { estimateEffort } from '../../../lib/planning/effort-estimator';
import { detectDependencies } from '../../../lib/planning/dependency-engine';
import { calculateCriticalPath } from '../../../lib/planning/critical-path-engine';
import { generateReleasePlan } from '../../../lib/planning/release-engine';
import { generateRoadmap } from '../../../lib/planning/roadmap-engine';
import { runPlanningQualityGate } from '../../../lib/quality/planning-quality-gate';
import { indexPlanningArtifacts } from '../../../lib/knowledge/indexing-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prdId } = body;

    if (!prdId) {
      return NextResponse.json({ error: "prdId is required" }, { status: 400 });
    }

    // 1. Strict Governance Validation
    try {
      await validateVersionForPlanning(prdId);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    const version = await getVersion(prdId);
    if (!version) {
      return NextResponse.json({ error: "PRD Version not found" }, { status: 404 });
    }

    // 2. Generate Epics
    let epics = await generateEpics(version.structuredPRD);
    if (epics.length === 0) {
      return NextResponse.json({ error: "Failed to generate epics" }, { status: 500 });
    }

    // 3. Estimate Effort
    epics = await estimateEffort(epics);

    // 4. Detect Dependencies
    const dependencies = await detectDependencies(epics, version.projectId);

    // 5. Calculate Critical Path
    const criticalPath = calculateCriticalPath(epics.map(e => e.id), dependencies);

    // 6. Release Engine
    const releasePlan = generateReleasePlan(epics, dependencies, `v${version.versionNumber}`);
    releasePlan.criticalPath = criticalPath;

    // 7. Roadmap Engine
    const roadmap = generateRoadmap(releasePlan);

    const planningArtifacts = {
      epics,
      dependencies,
      releasePlan,
      roadmap,
      criticalPath
    };

    // 8. Quality Gate Validation
    const qualityGateResult = await runPlanningQualityGate(planningArtifacts);
    if (qualityGateResult.decision !== "APPROVE") {
      return NextResponse.json({ 
        error: "Planning Quality Gate rejected the generated artifacts", 
        issues: qualityGateResult.issues 
      }, { status: 400 });
    }

    // 9. Save and Index
    await savePlanningArtifacts(prdId, planningArtifacts);
    await indexPlanningArtifacts(prdId, version.projectId, planningArtifacts, version.title);

    return NextResponse.json({ 
      success: true, 
      planningArtifacts 
    });

  } catch (err: any) {
    console.error("Planning Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
