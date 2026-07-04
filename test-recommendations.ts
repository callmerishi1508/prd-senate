import { generateRecommendations } from './src/lib/intelligence/recommendation-engine';
import { ProductHealthScore, RoadmapRisk } from './src/lib/intelligence/intelligence-schema';

async function run() {
  const health: ProductHealthScore = {
    score: 45,
    rating: 'Critical',
    metrics: { requirementStability: 50, reviewChurn: 20, scopeGrowth: 30, sprintPredictability: 60, planningVolatility: 10 }
  };
  const driftScore = 20;
  const risks: RoadmapRisk[] = [
    { epicId: 'e1', epicTitle: 'E1', type: 'DEPENDENCY', probability: 90, impact: 85, recommendedActions: [] }
  ];
  
  const recs = generateRecommendations(health, driftScore, risks);
  console.log("Recommendations:", recs.map(r => r.action));
  
  // Verify confidence and evidence
  let passed = true;
  for (const r of recs) {
    if (r.confidence === undefined || r.evidence === undefined || r.evidence.length === 0) {
      console.error("Missing evidence or confidence on:", r);
      passed = false;
    }
  }

  if (recs.length > 0 && passed) console.log("Test Passed");
  else process.exit(1);
}
run();
