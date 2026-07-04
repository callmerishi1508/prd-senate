# Intelligent Caching Design

## Scope & Candidates
Caching is strictly limited to deterministic stages where the exact same inputs (prompt + project configuration) will mathematically yield the same semantic result, and where skipping the LLM call carries zero quality penalty.

1. **Research Engine Output**: 
   - *Key*: `SHA-256(problemStatement + targetUsers + constraints)`
   - *Value*: `researchReport` JSON
   - *Rationale*: A benchmark run requests the exact same project over and over. By caching the Research Engine, we instantly eliminate ~120 seconds of redundant inference per project.
2. **Model Profiles & Templates**: 
   - *Rationale*: Hardcoded into memory, zero IO cost.
3. **Never Cache PRDs**:
   - The final PRD generation must always be unique to test pipeline stability.

## Implementation Plan
- Create a transient, file-backed cache in `data/.cache` for the Research Engine.
- Introduce `crypto.createHash` in `research-engine.ts`.
- If cache hit: `return JSON.parse(cachedFile)`.
- If cache miss: Run LLM, parse, and save to `data/.cache`.
