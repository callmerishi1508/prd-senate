# Retry Optimization Report

## Current Retry Inefficiencies
1. **Blind Retries in Hierarchical Stages**: Inside `consensus.ts`, stages D1-D4 blindly retry the full generation loop (`maxRetries` times) if JSON extraction fails, without telling the LLM what went wrong.
2. **Global PRD Rewrites**: In `route.ts`, if the Quality Gate fails on the final assembled PRD (e.g., missing 'Problem Statement'), it passes the entire PRD (4000+ tokens) to the Repair Agent. Generating a 4000-token JSON payload takes over 5 minutes and significantly increases the risk of hallucination or timeouts.
3. **Traceability Retries**: Re-running the Repair Agent on the *entire* PRD just because a few functional requirements are missing the `source` field.

## Safe Targeted Repairs
- **Targeted Sub-Repairs**: Instead of passing the entire PRD to the Repair Agent, we will segment the repair. If the Quality Gate flags an issue in `functionalRequirements`, we only extract the `functionalRequirements` block, ask the Repair Agent to fix that block, and then patch it back into the master PRD.
- **Error-Injected Retries**: Instead of blind retries in D1-D4, we will append the specific Zod validation error to the prompt for the retry, converting it from a "blind retry" into a "guided repair".
- **Eliminate Full-PRD Rewrites**: Never ask the LLM to output the full PRD. Only ask it to output the specific fields that are violated.
