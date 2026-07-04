import { NextResponse } from 'next/server';
import { getTelemetryStats } from '@/lib/telemetry/telemetry-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getTelemetryStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch telemetry stats', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
