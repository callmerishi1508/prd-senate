"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPRDToMarkdown = renderPRDToMarkdown;
function renderPRDToMarkdown(prd) {
    var md = "# Product Requirements Document (PRD)\n\n";
    if (prd.productOverview) {
        md += "## Product Overview\n".concat(prd.productOverview, "\n\n");
    }
    if (prd.goals && prd.goals.length > 0) {
        md += "## Goals\n";
        prd.goals.forEach(function (g) {
            md += "* ".concat(g.description, "\n");
        });
        md += "\n";
    }
    if (prd.nonGoals && prd.nonGoals.length > 0) {
        md += "## Non-Goals\n";
        prd.nonGoals.forEach(function (ng) {
            md += "* ".concat(ng.description, "\n");
        });
        md += "\n";
    }
    if (prd.userPersonas && prd.userPersonas.length > 0) {
        md += "## User Personas\n";
        md += "| Persona | Age | Gender | Health Status | Preferences |\n";
        md += "|---------|------|--------|----------------|--------------|\n";
        prd.userPersonas.forEach(function (p) {
            md += "| ".concat(p.name || '-', " | ").concat(p.age || '-', " | ").concat(p.gender || '-', " | ").concat(p.healthStatus || '-', " | ").concat(p.preferences || '-', " |\n");
        });
        md += "\n";
    }
    if (prd.functionalRequirements && prd.functionalRequirements.length > 0) {
        md += "## Functional Requirements\n";
        prd.functionalRequirements.forEach(function (fr, i) {
            md += "".concat(i + 1, ". **").concat(fr.purpose || 'Requirement', "**\n");
            md += "   * **ID:** ".concat(fr.id, "\n");
            md += "   * **Description:** ".concat(fr.description, "\n");
            md += "   * **User value:** ".concat(fr.userValue, "\n");
        });
        md += "\n";
    }
    if (prd.userExperience) {
        md += "## User Experience\n".concat(prd.userExperience, "\n\n");
    }
    if (prd.narrative) {
        md += "## Narrative\n".concat(prd.narrative, "\n\n");
    }
    if (prd.successMetrics && prd.successMetrics.length > 0) {
        md += "## Success Metrics\n";
        prd.successMetrics.forEach(function (sm) {
            md += "* **[".concat(sm.id, "]** ").concat(sm.description, "\n");
        });
        md += "\n";
    }
    if (prd.technicalConsiderations && prd.technicalConsiderations.length > 0) {
        md += "## Technical Considerations\n";
        prd.technicalConsiderations.forEach(function (tc) {
            md += "* ".concat(tc, "\n");
        });
        md += "\n";
    }
    if (prd.milestones && prd.milestones.length > 0) {
        md += "## Milestones & Sequencing\n";
        prd.milestones.forEach(function (m) {
            md += "* ".concat(m, "\n");
        });
        md += "\n";
    }
    if (prd.userStories && prd.userStories.length > 0) {
        md += "## User Stories\n\n";
        prd.userStories.forEach(function (us) {
            md += "### ".concat(us.id || 'US-XXX', "\n");
            md += "**Title:** ".concat(us.title, "\n");
            md += "**Description:** ".concat(us.description, "\n");
            md += "**Acceptance Criteria:**\n";
            if (us.acceptanceCriteria) {
                us.acceptanceCriteria.forEach(function (ac) {
                    md += "* ".concat(ac, "\n");
                });
            }
            md += "\n";
        });
    }
    return md;
}
