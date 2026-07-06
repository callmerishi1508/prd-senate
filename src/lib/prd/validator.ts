import { StructuredPRD } from './schema';

export interface SchemaViolation {
  field: string;
  expectedType: string;
  actualType: string;
  severity: "warning" | "critical";
  action: "normalized" | "rejected";
}

export interface ValidationResult {
  isValid: boolean;
  normalizedPRD: StructuredPRD;
  violations: SchemaViolation[];
}

export function validateAndNormalizePRD(raw: any): ValidationResult {
  const violations: SchemaViolation[] = [];
  const normalized: any = {};

  if (!raw || typeof raw !== 'object') {
    violations.push({
      field: 'root',
      expectedType: 'object',
      actualType: typeof raw,
      severity: 'critical',
      action: 'rejected'
    });
    return { isValid: false, normalizedPRD: raw as any, violations };
  }

  // Map keys from prompt generation schema to validator schema (Phase 15K reliability fix)
  if (raw && typeof raw === 'object') {
    if (raw.problemStatement && !raw.productOverview) {
      raw.productOverview = raw.problemStatement;
    }
    if (raw.businessGoals && !raw.goals) {
      raw.goals = Array.isArray(raw.businessGoals) ? raw.businessGoals.map((g: any) => ({
        description: (g.goal || '') + ' (Metric: ' + (g.metric || '') + ')'
      })) : [];
    }
  }

  // Helper to get actual type including 'null' and 'array'
  const getActualType = (val: any) => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  };

  const processStringField = (field: string, isCritical: boolean = false) => {
    const val = raw[field];
    const actualType = getActualType(val);

    if (actualType === 'string') {
      normalized[field] = val;
    } else if (actualType === 'undefined' || actualType === 'null') {
      if (isCritical) {
        violations.push({ field, expectedType: 'string', actualType, severity: 'critical', action: 'rejected' });
      } else {
        // Warning, we can normalize to empty string or leave it
        normalized[field] = '';
        violations.push({ field, expectedType: 'string', actualType, severity: 'warning', action: 'normalized' });
      }
    } else {
      // It's an object, array, number, etc.
      normalized[field] = JSON.stringify(val, null, 2);
      violations.push({ field, expectedType: 'string', actualType, severity: 'warning', action: 'normalized' });
    }
  };

  const processArrayField = (field: string, isCritical: boolean = false) => {
    const val = raw[field];
    const actualType = getActualType(val);

    if (actualType === 'array') {
      normalized[field] = val; // We could recursively check objects inside the array, but keeping it top-level for now
    } else if (actualType === 'undefined' || actualType === 'null') {
      if (isCritical) {
        violations.push({ field, expectedType: 'array', actualType, severity: 'critical', action: 'rejected' });
      } else {
        normalized[field] = [];
        violations.push({ field, expectedType: 'array', actualType, severity: 'warning', action: 'normalized' });
      }
    } else {
      // Wrap it in an array if it's not an array
      normalized[field] = [val];
      violations.push({ field, expectedType: 'array', actualType, severity: 'warning', action: 'normalized' });
    }
  };

  // Schema processing
  processStringField('productOverview', true); // Product Overview is highly critical
  processStringField('userExperience', false);
  processStringField('narrative', false);
  
  processArrayField('goals', false);
  processArrayField('nonGoals', false);
  processArrayField('userPersonas', false);
  processArrayField('functionalRequirements', true); // Missing FRs is critical
  processArrayField('successMetrics', false);
  processArrayField('technicalConsiderations', false);
  processArrayField('milestones', false);
  processArrayField('userStories', false);
  
  if (raw.researchReferences) {
    if (getActualType(raw.researchReferences) === 'object') {
       normalized.researchReferences = raw.researchReferences;
       if (!Array.isArray(normalized.researchReferences.competitors)) {
          normalized.researchReferences.competitors = [];
       }
       if (!Array.isArray(normalized.researchReferences.marketStandards)) {
          normalized.researchReferences.marketStandards = [];
       }
    } else {
       violations.push({ field: 'researchReferences', expectedType: 'object', actualType: getActualType(raw.researchReferences), severity: 'warning', action: 'normalized' });
       normalized.researchReferences = { competitors: [], marketStandards: [] };
    }
  }

  const hasCritical = violations.some(v => v.severity === 'critical');

  return {
    isValid: !hasCritical,
    normalizedPRD: normalized as StructuredPRD,
    violations
  };
}
