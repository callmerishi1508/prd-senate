import { PRDVersion } from '../versioning/version-schema';
import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';
import { ExecutiveReport } from './intelligence-schema';
import { calculateProductHealth } from './health-engine';
import { generateDeliveryForecast } from './forecast-engine';
import { calculateRoadmapDrift } from './roadmap-drift-engine';
import { predictRisks } from './risk-engine';
import { generateRecommendations } from './recommendation-engine';
import { generatePortfolioBenchmarks } from './portfolio-benchmark-engine';

export async function generateExecutiveReport(
  version: PRDVersion,
  plan: PlanningArtifacts,
  delivery: DeliveryArtifacts,
  skipAi: boolean = false
): Promise<ExecutiveReport> {
  const health = calculateProductHealth(version, plan, delivery);
  const forecast = generateDeliveryForecast(plan, delivery);
  const { driftScore, driftSeverity } = calculateRoadmapDrift(plan, delivery);
  const topRisks = predictRisks(plan, delivery);
  const recommendations = generateRecommendations(health, driftScore, topRisks, delivery);
  const benchmarkInsights = await generatePortfolioBenchmarks(forecast);

  let aiSummary = undefined;

  if (!skipAi) {
    try {
      const prompt = `You are a Chief Product Officer AI. Summarize the following executive intelligence data concisely in 3 sentences:
Health: ${health.rating} (${health.score})
Forecast Confidence: ${forecast.confidenceInterval}%
Drift: ${driftSeverity}
Top Risks: ${topRisks.length}
Key Recs: ${recommendations.map(r => r.action).join(', ')}`;
      
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen2.5:1.5b', prompt, stream: false })
      });
      if (res.ok) {
        const data = await res.json();
        aiSummary = data.response;
      } else {
        aiSummary = "AI Summary unavailable due to model failure.";
      }
    } catch (err) {
      console.warn("AI Summarization failed", err);
      aiSummary = "AI Summary unavailable due to model failure.";
    }
  } else {
    aiSummary = "AI Summarization skipped.";
  }

  return {
    id: `EXEC-REP-${Date.now()}`,
    versionId: version.id,
    generatedAt: new Date().toISOString(),
    health,
    forecast,
    driftScore,
    driftSeverity,
    topRisks,
    recommendations,
    benchmarkInsights,
    aiSummary
  };
}
