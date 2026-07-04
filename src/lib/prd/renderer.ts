import { StructuredPRD } from './schema';

export function renderPRDToMarkdown(prd: StructuredPRD): string {
  let md = `# Product Requirements Document (PRD)\n\n`;

  if (prd.productOverview) {
    const overview = typeof prd.productOverview === 'string' ? prd.productOverview : JSON.stringify(prd.productOverview, null, 2);
    md += `## Product Overview\n${overview}\n\n`;
  }
  
  if (prd.goals && prd.goals.length > 0) {
    md += `## Goals\n`;
    prd.goals.forEach(g => {
      md += `* ${g.description || 'TBD'}\n`;
    });
    md += `\n`;
  }

  if (prd.nonGoals && prd.nonGoals.length > 0) {
    md += `## Non-Goals\n`;
    prd.nonGoals.forEach(ng => {
      md += `* ${ng.description || 'TBD'}\n`;
    });
    md += `\n`;
  }

  if (prd.userPersonas && prd.userPersonas.length > 0) {
    md += `## User Personas\n`;
    md += `| Persona | Age | Gender | Health Status | Preferences |\n`;
    md += `|---------|------|--------|----------------|--------------|\n`;
    prd.userPersonas.forEach(p => {
      md += `| ${p.name || '-'} | ${p.age || '-'} | ${p.gender || '-'} | ${p.healthStatus || '-'} | ${p.preferences || '-'} |\n`;
    });
    md += `\n`;
  }

  if (prd.functionalRequirements && prd.functionalRequirements.length > 0) {
    md += `## Functional Requirements\n`;
    prd.functionalRequirements.forEach((fr, i) => {
      md += `${i + 1}. **${fr.purpose || 'Requirement'}**\n`;
      md += `   * **ID:** ${fr.id || 'FR-XXX'}\n`;
      md += `   * **Description:** ${fr.description || 'TBD'}\n`;
      md += `   * **User value:** ${fr.userValue || 'TBD'}\n`;
    });
    md += `\n`;
  }

  if (prd.userExperience) {
    const ux = typeof prd.userExperience === 'string' ? prd.userExperience : JSON.stringify(prd.userExperience, null, 2);
    md += `## User Experience\n${ux}\n\n`;
  }

  if (prd.narrative) {
    const narrative = typeof prd.narrative === 'string' ? prd.narrative : JSON.stringify(prd.narrative, null, 2);
    md += `## Narrative\n${narrative}\n\n`;
  }

  if (prd.successMetrics && prd.successMetrics.length > 0) {
    md += `## Success Metrics\n`;
    prd.successMetrics.forEach(sm => {
      md += `* **[${sm.id || 'M-XXX'}]** ${sm.description || 'TBD'}\n`;
    });
    md += `\n`;
  }

  if (prd.technicalConsiderations && prd.technicalConsiderations.length > 0) {
    md += `## Technical Considerations\n`;
    prd.technicalConsiderations.forEach(tc => {
      md += `* ${tc}\n`;
    });
    md += `\n`;
  }

  if (prd.milestones && prd.milestones.length > 0) {
    md += `## Milestones & Sequencing\n`;
    prd.milestones.forEach(m => {
      md += `* ${m}\n`;
    });
    md += `\n`;
  }

  if (prd.userStories && prd.userStories.length > 0) {
    md += `## User Stories\n\n`;
    prd.userStories.forEach(us => {
      md += `### ${us.id || 'US-XXX'}\n`;
      md += `**Title:** ${us.title || 'TBD'}\n`;
      md += `**Description:** ${us.description || 'TBD'}\n`;
      md += `**Acceptance Criteria:**\n`;
      if (us.acceptanceCriteria) {
        us.acceptanceCriteria.forEach(ac => {
          md += `* ${ac}\n`;
        });
      }
      md += `\n`;
    });
  }

  return md;
}
