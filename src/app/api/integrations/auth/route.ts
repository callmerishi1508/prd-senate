import { NextResponse } from 'next/server';
import { connectViaPAT, connectViaOAuth } from '@/lib/integrations/auth/auth-manager';
import { getCredentialMeta, removeCredential } from '@/lib/integrations/auth/credential-manager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, system, token, code, options } = body;

    if (action === 'connect_pat') {
      await connectViaPAT(system, token, options);
      return NextResponse.json({ success: true });
    }

    if (action === 'connect_oauth') {
      await connectViaOAuth(system, code);
      return NextResponse.json({ success: true });
    }

    if (action === 'disconnect') {
      removeCredential(system);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const system = searchParams.get('system');
  if (!system) return NextResponse.json({ error: 'Missing system' }, { status: 400 });

  const meta = getCredentialMeta(system);
  return NextResponse.json(meta || { connected: false });
}
