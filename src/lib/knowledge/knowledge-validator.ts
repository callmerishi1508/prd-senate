import { getAllKnowledgeDocuments } from './memory-manager';
import { KnowledgeDocument, KnowledgeChunk } from './knowledge-schema';

export async function validateKnowledge(document: KnowledgeDocument, chunks: KnowledgeChunk[]): Promise<string[]> {
  const errors: string[] = [];

  // Check duplicate source ID
  const docs = await getAllKnowledgeDocuments();
  if (docs.some(d => d.sourceId === document.sourceId)) {
    errors.push(`Document with sourceId ${document.sourceId} already exists in Organizational Memory.`);
  }

  // Check embeddings
  if (!chunks || chunks.length === 0) {
    errors.push("Document has no chunks to index.");
  }

  chunks.forEach((chunk, i) => {
    if (!chunk.embedding || chunk.embedding.length === 0) {
      errors.push(`Chunk ${chunk.id} is missing its embedding vector.`);
    }
    if (chunk.content.trim() === '') {
      errors.push(`Chunk ${chunk.id} has empty content.`);
    }
  });

  return errors;
}
