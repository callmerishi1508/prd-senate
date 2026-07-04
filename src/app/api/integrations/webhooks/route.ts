import { NextResponse } from 'next/server';
import { handleWebhookPayload } from '@/lib/integrations/webhooks/webhook-manager';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') || 'UNKNOWN';
    
    const headers = Object.fromEntries(request.headers.entries());
    const body = await request.json().catch(() => ({}));

    const result = await handleWebhookPayload(provider, headers, body);
    
    if (result.success) {
      return NextResponse.json({ success: true, eventId: result.eventId });
    }

    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
