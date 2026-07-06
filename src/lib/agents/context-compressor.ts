import { encode } from 'gpt-tokenizer';

export function measureTokens(text: string): number {
  try {
    const tokens = encode(text);
    return tokens.length;
  } catch (e) {
    console.log("Token measurement fallback used.");
    return Math.ceil(text.length / 4);
  }
}

export function compressResearch(research: any): { compressed: any, fidelity: any } {
  const originalStr = JSON.stringify(research);
  const originalTokens = measureTokens(originalStr);
  let sectionsRemoved = 0;
  let requiredFieldsPreserved = Object.keys(research).length;

  const compressed = { ...research };
  if (Array.isArray(compressed.competitors) && compressed.competitors.length > 2) {
    compressed.competitors = compressed.competitors.slice(0, 2);
    sectionsRemoved++;
  }
  if (Array.isArray(compressed.marketTrends) && compressed.marketTrends.length > 2) {
    compressed.marketTrends = compressed.marketTrends.slice(0, 2);
    sectionsRemoved++;
  }
  
  const compressedStr = JSON.stringify(compressed);
  const compressedTokens = measureTokens(compressedStr);

  return {
    compressed,
    fidelity: {
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
      sectionsRemoved,
      requiredFieldsPreserved
    }
  };
}

export function compressDraft(draft: string): { compressed: string, fidelity: any } {
  const originalTokens = measureTokens(draft);
  const lines = draft.split('\n');
  let sectionsRemoved = 0;
  
  const essential = lines.filter(line => {
    const t = line.trim();
    if (t.match(/^#+ /)) return true;
    if (t.match(/^[-*] /)) return true;
    if (t.match(/^\d+\. /)) return true;
    if (t.includes(':') && t.split(' ').length < 15) return true;
    sectionsRemoved++;
    return false;
  });

  const compressedStr = essential.join('\n');
  const compressedTokens = measureTokens(compressedStr);

  return {
    compressed: compressedStr,
    fidelity: {
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
      sectionsRemoved,
      requiredFieldsPreserved: 3 // E.g., Features, Users, Constraints
    }
  };
}

export function compressUXCritique(critique: string): { compressed: string, fidelity: any } {
  const originalTokens = measureTokens(critique);
  const lines = critique.split('\n');
  let sectionsRemoved = 0;
  
  const essential = lines.filter(line => {
    const t = line.trim();
    if (t.match(/^#+ /)) return true;
    if (t.match(/^[-*] /)) return true;
    if (t.toLowerCase().includes('ux')) return true;
    if (t.toLowerCase().includes('interface')) return true;
    if (t.toLowerCase().includes('user')) return true;
    sectionsRemoved++;
    return false;
  });

  const compressedStr = essential.join('\n');
  const compressedTokens = measureTokens(compressedStr);

  return {
    compressed: compressedStr,
    fidelity: {
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
      sectionsRemoved,
      requiredFieldsPreserved: 2 // Insights, Recommendations
    }
  };
}

export function compressTechCritique(critique: string): { compressed: string, fidelity: any } {
  const originalTokens = measureTokens(critique);
  const lines = critique.split('\n');
  let sectionsRemoved = 0;
  
  const essential = lines.filter(line => {
    const t = line.trim();
    if (t.match(/^#+ /)) return true;
    if (t.match(/^[-*] /)) return true;
    if (t.toLowerCase().includes('tech')) return true;
    if (t.toLowerCase().includes('architecture')) return true;
    if (t.toLowerCase().includes('database')) return true;
    if (t.toLowerCase().includes('api')) return true;
    sectionsRemoved++;
    return false;
  });

  const compressedStr = essential.join('\n');
  const compressedTokens = measureTokens(compressedStr);

  return {
    compressed: compressedStr,
    fidelity: {
      originalTokens,
      compressedTokens,
      compressionRatio: compressedTokens / originalTokens,
      sectionsRemoved,
      requiredFieldsPreserved: 2 // Architecture, Data
    }
  };
}
