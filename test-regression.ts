import { validateAndNormalizePRD } from './src/lib/prd/validator';

console.log("--- REGRESSION AUDIT ---");

// Test 1: missing problemStatement and missing productOverview
const prd1 = {
  functionalRequirements: []
};
const res1 = validateAndNormalizePRD(prd1);
console.log("Test 1 (missing both): isValid =", res1.isValid, "| violations =", res1.violations.map(v => v.field));

// Test 2: has problemStatement but no productOverview
const prd2 = {
  problemStatement: "This is a problem statement.",
  functionalRequirements: []
};
const res2 = validateAndNormalizePRD(prd2);
console.log("Test 2 (has problemStatement): isValid =", res2.isValid, "| productOverview =", res2.normalizedPRD.productOverview);

// Test 3: missing businessGoals and missing goals
const prd3 = {
  problemStatement: "This is a problem statement.",
  functionalRequirements: []
};
const res3 = validateAndNormalizePRD(prd3);
console.log("Test 3 (missing goals): isValid =", res3.isValid, "| goals array length =", res3.normalizedPRD.goals?.length);

// Test 4: malformed goals (businessGoals is a string instead of array)
const prd4 = {
  problemStatement: "Valid.",
  functionalRequirements: [],
  businessGoals: "This should be an array"
};
const res4 = validateAndNormalizePRD(prd4);
console.log("Test 4 (malformed businessGoals): isValid =", res4.isValid, "| goals array length =", res4.normalizedPRD.goals?.length);
