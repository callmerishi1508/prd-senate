import { TeamMember } from './team-schema';
import { CapacityPlan } from './delivery-schema';

export function calculateCapacityPlan(
  team: TeamMember[],
  sprintLengthWeeks: number,
  defaultVelocityPerDev: number = 10
): CapacityPlan {
  // If a team member doesn't have explicit capacity, we give them default
  const normalizedTeam = team.map(m => ({
    ...m,
    capacityPoints: m.capacityPoints > 0 ? m.capacityPoints : defaultVelocityPerDev
  }));

  const totalCapacityPoints = normalizedTeam.reduce((sum, member) => sum + member.capacityPoints, 0);

  return {
    sprintLengthWeeks,
    velocityPerSprint: totalCapacityPoints,
    team: normalizedTeam,
    totalCapacityPoints
  };
}
