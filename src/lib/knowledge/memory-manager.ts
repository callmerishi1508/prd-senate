import { promises as fs } from 'fs';
import * as path from 'path';
import { KnowledgeDocument, KnowledgeChunk } from './knowledge-schema';

const DATA_DIR = path.join(process.cwd(), 'data', 'knowledge');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const CHUNKS_FILE = path.join(DATA_DIR, 'chunks.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export async function getAllKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DOCUMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function saveAllKnowledgeDocuments(docs: KnowledgeDocument[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DOCUMENTS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
}

export async function getAllKnowledgeChunks(): Promise<KnowledgeChunk[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CHUNKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

export async function saveAllKnowledgeChunks(chunks: KnowledgeChunk[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(CHUNKS_FILE, JSON.stringify(chunks, null, 2), 'utf-8');
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Removes a document and all its associated chunks
export async function deleteKnowledgeDocument(documentId: string): Promise<void> {
  const docs = await getAllKnowledgeDocuments();
  const chunks = await getAllKnowledgeChunks();
  await saveAllKnowledgeDocuments(docs.filter(d => d.id !== documentId));
  await saveAllKnowledgeChunks(chunks.filter(c => c.documentId !== documentId));
}

export async function deleteKnowledgeBySourceId(sourceId: string): Promise<void> {
  const docs = await getAllKnowledgeDocuments();
  const targetDoc = docs.find(d => d.sourceId === sourceId);
  if (targetDoc) {
    await deleteKnowledgeDocument(targetDoc.id);
  }
}

export async function saveKnowledge(document: KnowledgeDocument, chunks: KnowledgeChunk[]): Promise<void> {
  const docs = await getAllKnowledgeDocuments();
  const allChunks = await getAllKnowledgeChunks();
  
  docs.push(document);
  allChunks.push(...chunks);
  
  await saveAllKnowledgeDocuments(docs);
  await saveAllKnowledgeChunks(allChunks);
}

export async function saveKnowledgeBulk(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]): Promise<void> {
  const docs = await getAllKnowledgeDocuments();
  const allChunks = await getAllKnowledgeChunks();
  
  docs.push(...documents);
  allChunks.push(...chunks);
  
  await saveAllKnowledgeDocuments(docs);
  await saveAllKnowledgeChunks(allChunks);
}
