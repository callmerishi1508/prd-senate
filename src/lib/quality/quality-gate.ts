import { generateOllamaResponse } from '../agents/ollama';
import { AGENT_PROMPTS } from '../agents/prompts';

export async function runQualityGate(
  markdown: string,
  researchReport?: any,
  model = 'default',
  contextStr?: string
): Promise<any> {
  let prompt = AGENT_PROMPTS.QUALITY_GATE.replace('{{GENERATED_PRD}}', markdown);
  
  if (researchReport) {
    prompt = `Research Context (For Completeness Check):\n${JSON.stringify(researchReport, null, 2)}\n\n` + prompt;
  }
  
  if (contextStr) {
    prompt = `CRITICAL INSTRUCTION: Read the <ORGANIZATIONAL_MEMORY> carefully. If the generated PRD conflicts with or directly contradicts the <ORGANIZATIONAL_MEMORY> (for example, if memory says MFA is required but PRD says password-only), you MUST set "decision" to "REJECT" and output a critical issue in the JSON array.\n\n<ORGANIZATIONAL_MEMORY>\n${contextStr}\n</ORGANIZATIONAL_MEMORY>\n\n` + prompt;
  }
  
  const res = await generateOllamaResponse([
    { role: 'user', content: prompt }
  ], { model, format: 'json', num_ctx: 4096, num_predict: 2048 });

  let parsed: any = null;
  try {
    parsed = JSON.parse(res || '{}');
  } catch (e) {
    const match = (res || '').match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch {}
    }
  }

  if (!parsed) {
    parsed = {
      score: 0,
      decision: "REJECT",
      criticalIssues: ["Failed to parse Quality Gate response."],
      summary: "Validation failed due to JSON parsing error."
    };
  }

  // Two-pass conflict detection for small models
  if (contextStr) {
    const conflictPrompt = `You are a strict compliance checker.
<ORGANIZATIONAL_MEMORY>
${contextStr}
</ORGANIZATIONAL_MEMORY>

<PRD>
${markdown}
</PRD>

Does the PRD contradict or conflict with the ORGANIZATIONAL_MEMORY?
Return ONLY valid JSON matching this schema:
{ "conflict": boolean, "reason": "string" }`;

    try {
      const conflictRes = await generateOllamaResponse([
        { role: 'system', content: conflictPrompt }
      ], { model, format: 'json', num_ctx: 4096, num_predict: 512 });
      let conflictParsed: any = null;
      try {
        conflictParsed = JSON.parse(conflictRes || '{}');
      } catch (e) {
        const match = (conflictRes || '').match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
           try { conflictParsed = JSON.parse(match[1]); } catch {}
        }
      }
      
      if (conflictParsed && (conflictParsed.conflict === true || conflictParsed.conflict === "true")) {
        parsed.hasKnowledgeConflict = true;
        parsed.knowledgeConflictReason = conflictParsed.reason;
      }
    } catch (err) {
      // ignore
    }
  }

  // The user rule: If hallucinatedRequirements.length > 0 and it's rejected, change to APPROVE_WITH_REVISIONS
  if (parsed.hallucinatedRequirements && Array.isArray(parsed.hallucinatedRequirements) && parsed.hallucinatedRequirements.length > 0) {
    // Only downgrade if there are no OTHER critical issues blocking it completely
    const hasOtherCritical = parsed.criticalIssues && Array.isArray(parsed.criticalIssues) && parsed.criticalIssues.some((i: any) => typeof i === 'string' && !i.toLowerCase().includes('hallucinat'));
    if (!hasOtherCritical && parsed.decision === 'REJECT') {
       parsed.decision = 'APPROVE_WITH_REVISIONS';
    }
  }

  const hasConflictInString = (str: any) => {
    if (typeof str !== 'string') return false;
    const s = str.toLowerCase();
    return s.includes('conflict') || s.includes('contradict') || (s.includes('memory') && (s.includes('prd') || s.includes('says')));
  };

  const hasAnyConflict = parsed.hasKnowledgeConflict === true ||
    (parsed.knowledgeConflictEvaluation && hasConflictInString(parsed.knowledgeConflictEvaluation)) ||
    (parsed.knowledgeConflictReason && hasConflictInString(parsed.knowledgeConflictReason)) ||
    (parsed.criticalIssues && Array.isArray(parsed.criticalIssues) && parsed.criticalIssues.some(hasConflictInString)) ||
    (parsed.majorIssues && Array.isArray(parsed.majorIssues) && parsed.majorIssues.some(hasConflictInString));

  if (hasAnyConflict) {
    parsed.decision = 'REJECT';
    if (!parsed.criticalIssues) parsed.criticalIssues = [];
    if (!parsed.criticalIssues.some((i: any) => typeof i === 'string' && i.includes("Knowledge Conflict"))) {
      parsed.criticalIssues.push(`Knowledge Conflict: ${parsed.knowledgeConflictReason || 'Contradicts Organizational Memory'}`);
    }
  }

  return parsed;
}
