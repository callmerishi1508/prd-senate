import { NextResponse } from 'next/server';
import { generateExecutiveReport } from '../../../lib/intelligence/executive-dashboard-engine';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'health') {
    return NextResponse.json({ message: "Health endpoint" });
  } else if (action === 'forecast') {
    return NextResponse.json({ message: "Forecast endpoint" });
  } else if (action === 'risks') {
    return NextResponse.json({ message: "Risks endpoint" });
  } else if (action === 'recommendations') {
    return NextResponse.json({ message: "Recommendations endpoint" });
  } else if (action === 'executive-report') {
    return NextResponse.json({ message: "Executive report endpoint" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
  const { prd, plan, delivery } = await request.json();
  const report = await generateExecutiveReport(prd, plan, delivery);
  return NextResponse.json(report);
}
