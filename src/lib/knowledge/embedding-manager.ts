export async function checkEmbeddingModel(): Promise<boolean> {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    if (!res.ok) return false;
    const data = await res.json();
    const models = data.models || [];
    return models.some((m: any) => m.name.includes('nomic-embed-text'));
  } catch (err) {
    return false;
  }
}

// Simple in-memory cache for embeddings to avoid re-embedding identical text across restarts during same session
const embeddingCache = new Map<string, number[]>();

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === '') return [];
  
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  const hasModel = await checkEmbeddingModel();
  if (!hasModel) {
    throw new Error('Knowledge Engine Disabled: Missing embedding model: nomic-embed-text. Run: ollama pull nomic-embed-text');
  }

  try {
    const res = await fetch('http://127.0.0.1:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama embedding failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.embedding) {
      throw new Error('Ollama did not return an embedding array.');
    }

    embeddingCache.set(text, data.embedding);
    return data.embedding;
  } catch (err) {
    console.error("Failed to generate embedding", err);
    throw err;
  }
}
