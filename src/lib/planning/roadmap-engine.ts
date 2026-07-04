import { ReleasePlan, Milestone } from './planning-schema';

export function generateRoadmap(releasePlan: ReleasePlan): Milestone[] {
  const roadmap: Milestone[] = [];
  
  releasePlan.milestones.forEach((m, idx) => {
    roadmap.push({
      id: `Q${idx + 1}`,
      title: `Quarter ${idx + 1}`,
      epics: m.epics
    });
  });

  return roadmap;
}
