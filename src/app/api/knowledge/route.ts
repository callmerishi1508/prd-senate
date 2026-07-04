import { NextResponse } from 'next/server';
import { getAllKnowledgeDocuments, getAllKnowledgeChunks } from '@/lib/knowledge/memory-manager';

export async function GET() {
  try {
    const docs = await getAllKnowledgeDocuments();
    const chunks = await getAllKnowledgeChunks();
    return NextResponse.json({ docs, chunks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
