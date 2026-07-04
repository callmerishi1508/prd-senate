import { NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/telemetry/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await metricsRegistry.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': metricsRegistry.contentType
      }
    });
  } catch (error) {
    console.error('Failed to generate metrics', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
