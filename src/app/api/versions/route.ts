import { NextRequest, NextResponse } from 'next/server';
import { getAllVersions, getVersion, createVersion } from '@/lib/versioning/version-manager';
import { compareVersions, generateEvolutionSummary } from '@/lib/versioning/diff-engine';
import { runImpactAnalysis } from '@/lib/versioning/impact-analysis';
import { RequirementChange } from '@/lib/versioning/version-schema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'compare') {
      const id1 = searchParams.get('v1');
      const id2 = searchParams.get('v2');
      if (!id1 || !id2) return NextResponse.json({ error: "Missing v1 or v2" }, { status: 400 });

      const v1 = await getVersion(id1);
      const v2 = await getVersion(id2);
      if (!v1 || !v2) return NextResponse.json({ error: "Version not found" }, { status: 404 });

      const changes = compareVersions(v1, v2);
      const summary = generateEvolutionSummary(changes);

      return NextResponse.json({ changes, summary });
    } else if (action === 'impact') {
      const v1Id = searchParams.get('v1');
      const entityId = searchParams.get('entityId');
      const entityType = searchParams.get('entityType') as RequirementChange['entityType'];

      if (!v1Id || !entityId || !entityType) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

      const v1 = await getVersion(v1Id);
      if (!v1) return NextResponse.json({ error: "Version not found" }, { status: 404 });

      // We just mock a change object to pass to the impact analysis
      const dummyChange: RequirementChange = {
        type: 'MODIFIED',
        entityType,
        entityId
      };

      const impact = runImpactAnalysis(dummyChange, v1);
      return NextResponse.json(impact);
    } else if (searchParams.has('id')) {
      const id = searchParams.get('id')!;
      const v = await getVersion(id);
      if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(v);
    } else {
      // List all
      let versions = await getAllVersions();
      if (searchParams.has('projectId') && searchParams.get('projectId')) {
        const pId = searchParams.get('projectId')!;
        versions = versions.filter(v => v.projectId === pId);
      }
      // Omit heavy fields for listing
      const lightVersions = versions.map(v => ({
        id: v.id,
        projectId: v.projectId,
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        title: v.title,
        status: v.status,
        changeSummary: v.changeSummary
      }));
      return NextResponse.json(lightVersions);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newVersion = await createVersion(body);
    return NextResponse.json(newVersion, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { action, versionId, status } = data;

    if (action === 'update-status') {
      const { updateVersionStatus } = await import('@/lib/versioning/version-manager');
      const updated = await updateVersionStatus(versionId, status as any);
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
