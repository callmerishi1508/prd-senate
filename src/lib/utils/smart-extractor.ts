import { jsonrepair } from 'jsonrepair';

export function smartExtractJSON(text: string): any {
  let jsonString = text;
  
  // 1. Try raw parsing
  try {
    return JSON.parse(jsonString);
  } catch (e) {}

  // 2. Try Markdown block parsing
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonString = markdownMatch[1];
    try {
      return JSON.parse(jsonString);
    } catch (e) {}
  }
  
  // 3. Balanced Brace Extraction
  jsonString = extractBalancedBraces(text) || text;
  
  // 4. Try parsing extracted block
  try {
    return JSON.parse(jsonString);
  } catch (e) {}
  
  // 5. Try jsonrepair on the extracted block
  try {
    const repaired = jsonrepair(jsonString);
    return JSON.parse(repaired);
  } catch (e) {
    throw new Error(`Failed to parse JSON even after repair. Error: ${(e as Error).message}`);
  }
}

function extractBalancedBraces(text: string): string | null {
  let startIdx = text.indexOf('{');
  if (startIdx === -1) {
    startIdx = text.indexOf('[');
  }
  
  if (startIdx === -1) return null;
  
  const openChar = text[startIdx];
  const closeChar = openChar === '{' ? '}' : ']';
  
  let depth = 0;
  let endIdx = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
  }
  
  if (endIdx !== -1) {
    return text.substring(startIdx, endIdx + 1);
  }
  
  return null;
}
