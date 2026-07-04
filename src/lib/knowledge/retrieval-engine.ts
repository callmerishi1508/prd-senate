import { generateEmbedding } from './embedding-manager';
import { getAllKnowledgeChunks, getAllKnowledgeDocuments, cosineSimilarity, saveAllKnowledgeChunks } from './memory-manager';
import { RetrievedChunk, KnowledgeType } from './knowledge-schema';

const GLOBAL_TYPES: KnowledgeType[] = ["STANDARD", "ARCHITECTURE"];

export async function retrieveContext(query: string, topK: number = 5, projectId?: string): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query);
  if (queryEmbedding.length === 0) return [];

  let chunks = await getAllKnowledgeChunks();
  let docs = await getAllKnowledgeDocuments();
  if (projectId) {
     docs = docs.filter(d => d.projectId === projectId || (!d.projectId && GLOBAL_TYPES.includes(d.type)));
  } else {
     docs = docs.filter(d => !d.projectId && GLOBAL_TYPES.includes(d.type));
  }
  if (chunks.length === 0 || docs.length === 0) return [];

  // Map docs for quick title lookup
  const docMap = new Map(docs.map(d => [d.id, d.title]));
  
  // Filter chunks to only those belonging to valid docs and exclude internal caches
  const validDocIds = new Set(docs.map(d => d.id));
  chunks = chunks.filter(c => validDocIds.has(c.documentId) && (c.chunkType as string) !== 'DEPENDENCY_CACHE');

  // Score all chunks
  const scoredChunks: RetrievedChunk[] = chunks.map(chunk => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    // score = cosineSimilarity * sourceConfidence (normalize confidence by / 100)
    // Avoid multiplying if similarity is negative
    const normalizedConfidence = (chunk.sourceConfidence || 50) / 100;
    const score = Math.max(0, similarity) * normalizedConfidence;
    
    return {
      ...chunk,
      similarity,
      score,
      documentTitle: docMap.get(chunk.documentId) || 'Unknown Document'
    };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take top K
  const results = scoredChunks.slice(0, topK).filter(c => c.score > 0.4); // Threshold filtering

  // Update usage count
  if (results.length > 0) {
    const now = new Date().toISOString();
    results.forEach(res => {
      const original = chunks.find(c => c.id === res.id);
      if (original) {
        original.usageCount = (original.usageCount || 0) + 1;
        original.lastUsedAt = now;
      }
    });
    // Await to prevent race conditions during file IO
    await saveAllKnowledgeChunks(chunks).catch(console.error);
  }

  return results;
}
