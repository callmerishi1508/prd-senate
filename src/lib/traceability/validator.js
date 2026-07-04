"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTraceability = validateTraceability;
function validateTraceability(prd, maps) {
    var errors = [];
    var mappedReqs = new Set();
    var mappedStories = new Set();
    var mappedMetrics = new Set();
    maps.forEach(function (m) {
        if (m.requirementIds.length === 0) {
            errors.push("Goal ".concat(m.goalId, " has no mapped Functional Requirements."));
        }
        m.requirementIds.forEach(function (id) { return mappedReqs.add(id); });
        m.userStoryIds.forEach(function (id) { return mappedStories.add(id); });
        m.metricIds.forEach(function (id) { return mappedMetrics.add(id); });
    });
    prd.functionalRequirements.forEach(function (fr) {
        if (!mappedReqs.has(fr.id)) {
            errors.push("Orphan Functional Requirement detected: ".concat(fr.id));
        }
    });
    prd.userStories.forEach(function (us) {
        if (!mappedStories.has(us.id)) {
            errors.push("Orphan User Story detected: ".concat(us.id));
        }
        if (!us.acceptanceCriteria || us.acceptanceCriteria.length === 0) {
            errors.push("User Story ".concat(us.id, " is missing Acceptance Criteria."));
        }
    });
    prd.successMetrics.forEach(function (sm) {
        if (!mappedMetrics.has(sm.id)) {
            // The user prompt said: "A Success Metric without a Goal = Warning"
            // We can push it as an error or just ignore it. Let's push it so it gets fixed.
            errors.push("Orphan Success Metric detected: ".concat(sm.id));
        }
    });
    return errors;
}
