# Duplicate Call Audit

## Redundant Subsystems
1. **Verification Agent**: In `route.ts`, the Verification agent is executed sequentially after the Critiques. However, when the pipeline forks into `hierarchical` mode, `Stage B (Debate Summary)` explicitly asks the LLM to synthesize the Draft, UX Critique, and Tech Critique.
   - **Action**: Bypass the Verification Agent entirely when `consensusMode === 'hierarchical'`.
   
2. **Research Engine Repetition**: During benchmark execution (`validation-runner.ts`), the identical `problemStatement` is sent to the Research Engine 10+ times per suite. The Research Engine utilizes simulated external API calls and takes ~120s.
   - **Action**: Introduce a deterministic file-backed cache using `SHA-256` hashes of the problem statement and constraints. If a benchmark asks for the identical project, immediately return the cached research JSON (0s latency).
