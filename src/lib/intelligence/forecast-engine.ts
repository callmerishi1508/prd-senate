import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';
import { DeliveryForecast } from './intelligence-schema';

export function generateDeliveryForecast(
  plan: PlanningArtifacts,
  delivery: DeliveryArtifacts
): DeliveryForecast {
  const effortMap: Record<string, number> = { "XS": 1, "S": 3, "M": 5, "L": 8, "XL": 13 };
  const totalPoints = plan.epics.reduce((sum, e) => sum + (effortMap[e.estimatedEffort as string] || 5), 0);
  const sprintCap = delivery.capacityPlan.totalCapacityPoints;
  const sprintLength = delivery.capacityPlan.sprintLengthWeeks;
  
  if (sprintCap === 0) {
    return {
      expectedCompletionDate: "Unknown",
      confidenceInterval: 0,
      scheduleSlippageRisk: 100,
      velocityTrend: 0
    };
  }

  const sprintsNeeded = Math.ceil(totalPoints / sprintCap);
  const weeksNeeded = sprintsNeeded * sprintLength;
  
  const today = new Date();
  today.setDate(today.getDate() + weeksNeeded * 7);
  
  let risk = 0;
  if (sprintsNeeded > 10) risk += 20; 
  if (sprintsNeeded > 20) risk += 30; 
  
  // Check if overloaded
  let overbooked = false;
  for (const s of delivery.sprints) {
    if (s.assignedPoints > s.capacityPoints * 1.1) {
      overbooked = true;
    }
  }
  if (overbooked) risk += 25;

  return {
    expectedCompletionDate: today.toISOString().split('T')[0],
    confidenceInterval: Math.max(0, 100 - risk),
    scheduleSlippageRisk: Math.min(100, risk),
    velocityTrend: 0 
  };
}
