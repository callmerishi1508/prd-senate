import { SchemaViolation } from '../prd/validator';

export function translateValidationErrors(violations: SchemaViolation[]): string[] {
  return violations.map(v => {
    if (v.severity === 'critical') {
      if (v.actualType === 'undefined' || v.actualType === 'null') {
        return `The required property "${v.field}" is missing. Please add it and ensure it is a valid ${v.expectedType}.`;
      }
      return `The property "${v.field}" has the wrong type. It should be a ${v.expectedType}, but it was a ${v.actualType}.`;
    }
    
    if (v.actualType === 'undefined' || v.actualType === 'null') {
       return `Warning: The property "${v.field}" was missing. It has been auto-corrected to an empty ${v.expectedType}, but you should provide valid content next time.`;
    }
    
    return `Validation error at "${v.field}": Expected ${v.expectedType}, got ${v.actualType}.`;
  });
}
