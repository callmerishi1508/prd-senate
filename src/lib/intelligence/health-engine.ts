import { PRDVersion } from '../versioning/version-schema';
import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';
import { ProductHealthScore } from './intelligence-schema';

export function calculateProductHealth(
  prd: PRDVersion,
  plan?: PlanningArtifacts,
  delivery?: DeliveryArtifacts
): ProductHealthScore {
  let reqStability = 100;
  const reqCount = prd.structuredPRD.functionalRequirements?.length || 0;
  
  // Deterministic checks
  if (reqCount > 50) reqStability -= 10;
  if (reqCount > 100) reqStability -= 20;
  
  let scopeGrowth = 0;
  let reviewChurn = 5; 
  let planningVolatility = 5; 
  let sprintPredictability = 100;

  if (plan) {
    if (plan.epics.length > 20) planningVolatility += 15;
  }

  if (delivery) {
    let overcapacitySprints = 0;
    for (const s of delivery.sprints) {
      if (s.assignedPoints > s.capacityPoints) {
        overcapacitySprints++;
      }
    }
    if (delivery.sprints.length > 0) {
      sprintPredictability -= (overcapacitySprints / delivery.sprints.length) * 50;
    }
  }

  let totalScore = (reqStability + (100 - scopeGrowth) + sprintPredictability + (100 - reviewChurn) + (100 - planningVolatility)) / 5;
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  let rating: "Excellent" | "Healthy" | "Warning" | "Critical" = "Healthy";
  if (totalScore >= 90) rating = "Excellent";
  else if (totalScore >= 70) rating = "Healthy";
  else if (totalScore >= 50) rating = "Warning";
  else rating = "Critical";

  return {
    score: totalScore,
    rating,
    metrics: {
      requirementStability: reqStability,
      reviewChurn,
      scopeGrowth,
      sprintPredictability,
      planningVolatility
    }
  };
}
