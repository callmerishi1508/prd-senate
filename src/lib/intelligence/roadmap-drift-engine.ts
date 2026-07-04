import { PlanningArtifacts } from '../planning/planning-schema';
import { DeliveryArtifacts } from '../delivery/delivery-schema';

export function calculateRoadmapDrift(
  plan: PlanningArtifacts,
  delivery: DeliveryArtifacts
): { driftScore: number, driftSeverity: "Low" | "Medium" | "High" | "Critical" } {
  let drift = 0;
  
  // Calculate drift by seeing if planned epics don't fit into the current sprint capacities
  const effortMap: Record<string, number> = { "XS": 1, "S": 3, "M": 5, "L": 8, "XL": 13 };
  const totalPoints = plan.epics.reduce((sum, e) => sum + (effortMap[e.estimatedEffort as string] || 5), 0);
  const totalAssigned = delivery.sprints.reduce((sum, s) => sum + s.assignedPoints, 0);
  
  if (totalAssigned < totalPoints) {
    // If we haven't even assigned tasks covering the epics, there's drift
    drift += ((totalPoints - totalAssigned) / totalPoints) * 50; 
  }

  // Heavy overbooking indicates drifting schedule
  for (const sprint of delivery.sprints) {
    if (sprint.assignedPoints > sprint.capacityPoints) {
      drift += 10;
    }
  }

  drift = Math.min(100, Math.max(0, drift));
  
  let severity: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (drift >= 60) severity = "Critical";
  else if (drift >= 40) severity = "High";
  else if (drift >= 20) severity = "Medium";
  
  return { driftScore: Math.round(drift), driftSeverity: severity };
}
