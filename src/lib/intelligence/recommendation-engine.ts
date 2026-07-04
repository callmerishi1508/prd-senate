import { ProductHealthScore, RoadmapRisk, Recommendation } from './intelligence-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';

export function generateRecommendations(
  health: ProductHealthScore,
  driftScore: number,
  risks: RoadmapRisk[],
  delivery?: DeliveryArtifacts
): Recommendation[] {
  const recs: Recommendation[] = [];
  
  if (health.score < 60) {
    recs.push({
      id: `REC-HLTH-${Date.now()}`,
      type: "REVIEW_COVERAGE",
      action: "Increase review coverage",
      confidence: 85,
      evidence: [`Product health score is low (${health.score})`]
    });
  }
  
  if (health.metrics.scopeGrowth > 25) {
     recs.push({
      id: `REC-SCP-${Date.now()}`,
      type: "SCOPE_FREEZE",
      action: "Freeze roadmap changes",
      confidence: 90,
      evidence: [`Scope growth is severely high at ${health.metrics.scopeGrowth}%`]
    });
  }
  
  const depRisks = risks.filter(r => r.type === "DEPENDENCY");
  if (depRisks.length >= 3 || depRisks.some(r => r.impact > 80)) {
    for (const r of depRisks) {
      recs.push({
        id: `REC-DEP-${r.epicId}-${Date.now()}`,
        type: "SPLIT_EPIC",
        action: `Split epic ${r.epicTitle} to relieve dependency bottleneck`,
        confidence: 95,
        evidence: [`Epic ${r.epicId} has severe dependency bottlenecks (${r.impact} impact)`]
      });
    }
  }

  if (delivery) {
    for (const s of delivery.sprints) {
      if (s.capacityPoints > 0 && (s.assignedPoints / s.capacityPoints) > 0.95) {
        recs.push({
          id: `REC-CAP-${s.id}-${Date.now()}`,
          type: "CAPACITY_INCREASE",
          action: "Increase capacity",
          confidence: 92,
          evidence: [
            `Sprint utilization is ${Math.round((s.assignedPoints / s.capacityPoints)*100)}% for sprint ${s.name}`,
            "Velocity drops increase delivery risk",
            `Roadmap drift is currently ${driftScore}%`
          ]
        });
        break; // Only need one general capacity recommendation
      }
    }
  }

  return recs;
}
