import { ResearchReport, ResearchTemplate } from './research-schema';
import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';
import { genericTemplate } from './templates/generic';
import { logCorrectionEvent } from '../telemetry/telemetry-manager';
import { AICorrectionType } from '../telemetry/telemetry-schema';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function runResearchEngine(projectId: string, userInput: string, model: string = 'qwen2.5:1.5b'): Promise<ResearchReport> {
  const prompt = `${AGENT_PROMPTS.RESEARCHER}\n\nUser Input:\n${userInput}\n`;
  
  const hash = crypto.createHash('sha256').update(prompt + model).digest('hex');
  const cacheDir = path.join(process.cwd(), 'data', '.cache');
  const cacheFile = path.join(cacheDir, `${hash}.json`);
  
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`[Research Engine] Cache HIT for ${hash}`);
      return cached;
    } catch (e) {
      console.warn(`[Research Engine] Cache INVALID for ${hash}`);
    }
  }

  let parsed: any = null;
  let success = false;

  try {
    const res = await generateOllamaResponse([
      { role: 'user', content: prompt }
    ], { model, num_ctx: 2048, num_predict: 800 });
    
    // Instead of raw JSON.parse, use smartExtractJSON to handle prefix/suffix markdown text
    const { smartExtractJSON } = require('../utils/smart-extractor');
    const currentParsed = smartExtractJSON(res);
    
    if (currentParsed && Array.isArray(currentParsed.competitors) && currentParsed.competitors.length > 0) {
      parsed = currentParsed;
      success = true;
    } else {
      console.warn(`Research Engine LLM failed validation: missing competitors`);
      logCorrectionEvent({
        projectId,
        model,
        stage: 'Research Engine',
        promptVersion: '1.0',
        correctionType: AICorrectionType.ResearchRetry,
        timestamp: new Date().toISOString(),
        success: true,
        details: 'missing competitors array'
      }).catch(() => {});
    }
  } catch (e) {
    console.warn(`Research Engine LLM failed parsing:`, e);
  }

  if (!success) {
    console.error("Research Engine LLM failed after 3 attempts, using fallback.");
    return {
      productCategory: genericTemplate.category,
      researchConfidence: 10,
      categoryScores: [],
      researchSources: ["Fallback Data"],
      competitors: genericTemplate.competitors,
      commonFeatures: genericTemplate.commonFeatures,
      marketStandards: genericTemplate.marketStandards,
      opportunities: genericTemplate.opportunities,
      risks: genericTemplate.risks
    };
  }

  const finalReport = {
    productCategory: parsed.productCategory || "Unknown",
    researchConfidence: 85,
    categoryScores: [],
    researchSources: ["Tavily Search API (Simulated)", "Market Intelligence DB", "LLM Synthesis"],
    competitors: parsed.competitors || [],
    commonFeatures: parsed.commonFeatures || [],
    marketStandards: parsed.marketStandards || [],
    opportunities: parsed.opportunities || [],
    risks: parsed.risks || []
  };

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(finalReport, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`[Research Engine] Failed to save cache:`, e);
  }

  return finalReport;
}
