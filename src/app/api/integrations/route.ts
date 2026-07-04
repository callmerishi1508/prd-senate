import { NextResponse } from 'next/server';
import { getVersion } from '@/lib/versioning/version-manager';
import { GithubAdapter } from '@/lib/integrations/github-adapter';
import { JiraAdapter } from '@/lib/integrations/jira-adapter';
import { LinearAdapter } from '@/lib/integrations/linear-adapter';
import { AzureDevOpsAdapter } from '@/lib/integrations/azure-adapter';
import { MockHttpClient } from '@/lib/integrations/http/http-client';
import { runSyncJob, retryFailedSyncs } from '@/lib/integrations/sync-engine';
import { getAllSyncJobs, getSyncJob } from '@/lib/integrations/sync-state-manager';
import { indexIntegrationArtifacts } from '@/lib/knowledge/indexing-engine';
import { validateIntegrationHealth } from '@/lib/integrations/integration-validator';
import { ExternalSystem, IntegrationAdapter } from '@/lib/integrations/integration-schema';

function getAdapter(system: string): IntegrationAdapter {
  const client = new MockHttpClient();
  switch (system) {
    case 'GITHUB': return new GithubAdapter(client, 'mock-token');
    case 'JIRA': return new JiraAdapter(client, 'mock-token', 'mock-domain');
    case 'LINEAR': return new LinearAdapter(client, 'mock-token');
    case 'AZURE_DEVOPS': return new AzureDevOpsAdapter(client, 'mock-token', 'mock-org', 'mock-proj');
    default: return new GithubAdapter(client, 'mock-token');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'history') {
    let jobs = getAllSyncJobs();
    if (searchParams.has('projectId') && searchParams.get('projectId')) {
      jobs = jobs.filter(j => j.projectId === searchParams.get('projectId'));
    }
    return NextResponse.json(jobs);
  }

  if (action === 'status') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    return NextResponse.json(getSyncJob(id));
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, versionId, system, jobId } = body;

    if (action === 'sync') {
      const version = await getVersion(versionId);
      if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (!version.deliveryArtifacts) return NextResponse.json({ error: 'No delivery artifacts' }, { status: 400 });

      const adapter = getAdapter(system);
      const newJobId = `sync-${Date.now()}`;
      
      const job = await runSyncJob(
        newJobId,
        version.projectId,
        versionId,
        system as ExternalSystem,
        adapter,
        version.planningArtifacts?.epics || [],
        version.deliveryArtifacts.tasks,
        version.deliveryArtifacts.sprints
      );

      const validation = validateIntegrationHealth(
        job.id, 
        system, 
        version.planningArtifacts?.epics || [], 
        version.deliveryArtifacts.tasks, 
        version.deliveryArtifacts.sprints
      );

      await indexIntegrationArtifacts(versionId, version.projectId, job, version.title);

      return NextResponse.json({ job, validation });
    }

    if (action === 'retry') {
      const job = getSyncJob(jobId);
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

      const version = await getVersion(job.versionId);
      if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

      const adapter = getAdapter(job.system);
      const retriedJob = await retryFailedSyncs(
        jobId,
        adapter,
        version.planningArtifacts?.epics || [],
        version.deliveryArtifacts?.tasks || [],
        version.deliveryArtifacts?.sprints || []
      );

      return NextResponse.json(retriedJob);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
