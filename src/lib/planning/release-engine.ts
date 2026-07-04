import { Epic, Dependency, ReleasePlan, Milestone } from './planning-schema';

export function generateReleasePlan(epics: Epic[], dependencies: Dependency[], targetVersion: string): ReleasePlan {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  
  epics.forEach(e => {
    inDegree.set(e.id, 0);
    adj.set(e.id, []);
  });

  dependencies.forEach(d => {
    if (d.type === 'BLOCKS' || d.type === 'REQUIRES') {
      const from = d.type === 'BLOCKS' ? d.from : d.to;
      const to = d.type === 'BLOCKS' ? d.to : d.from;
      if (!adj.has(from)) { adj.set(from, []); inDegree.set(from, 0); }
      if (!adj.has(to)) { adj.set(to, []); inDegree.set(to, 0); }
      adj.get(from)!.push(to);
      inDegree.set(to, inDegree.get(to)! + 1);
    }
  });

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort((a, b) => {
      const ea = epics.find(e => e.id === a)!;
      const eb = epics.find(e => e.id === b)!;
      const pmap: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pmap[eb.priority] || 0) - (pmap[ea.priority] || 0);
    });

    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adj.get(current) || []) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Handle orphan nodes or cycles gracefully
  epics.forEach(e => {
    if (!sorted.includes(e.id)) {
      sorted.push(e.id);
    }
  });

  const milestones: Milestone[] = [];
  const epicsPerRelease = Math.ceil(sorted.length / 3) || 1;

  for (let i = 0; i < sorted.length; i += epicsPerRelease) {
    const chunk = sorted.slice(i, i + epicsPerRelease);
    milestones.push({
      id: `REL-${i / epicsPerRelease + 1}`,
      title: `Release ${i / epicsPerRelease + 1}`,
      epics: chunk
    });
  }

  return {
    id: `RP-${Date.now()}`,
    title: `Release Plan for ${targetVersion}`,
    milestones,
    epics,
    targetVersion
  };
}
