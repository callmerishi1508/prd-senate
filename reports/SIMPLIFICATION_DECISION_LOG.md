# Simplification Decision Log

## Phase 15G Optimization Review

The goal of Phase 15G was to simplify the PRD Senate hierarchical architecture to reduce the average project pipeline runtime by ≥30%, without compromising the quality or repair pass rates.

### 1. Reduce Hierarchical Depth (Merge D1/D2 into D-Alpha, and D3/D4 into D-Beta)
- **Hypothesis:** Combining output sections would reduce the number of discrete LLM calls from 4 to 2 in the final generation stage, drastically improving generation time.
- **Telemetry Result:** 
  - The `qwen2.5:1.5b` model failed on 100% of its projects (3/3) due to recurrent `Validation Failure` errors. The combined schema was too complex for the smaller context and parameter size to reliably output valid JSON.
  - The `qwen2.5-coder:7b` model also failed its first project (`7b-0`), timing out after maxing out its 3 repair attempts due to validation loops on the massive output schema.
- **Decision:** **REVERTED.**
  - As established by the rule *"Merge only if the combined schema stays within acceptable token limits,"* the D-Alpha and D-Beta optimizations were automatically reverted back to the original D1, D2, D3, and D4 stages in the `simplified` configuration.

### 2. Remove Redundant Synthesis Stages (Bypass Stage A and Stage B)
- **Hypothesis:** In the original `hierarchical` mode, Stage A (Debate Synthesis) and Stage B (Architectural Review) consumed significant time parsing the UX and Tech critiques before generating a summary for D1-D4. By passing the raw critique documents directly to the final generation stages, we could eliminate 2 costly LLM calls per project.
- **Telemetry Result:**
  - Runtime for `qwen2.5-coder:7b` dropped from ~85 minutes to an average of **~48.5 minutes** (a ~43% reduction).
  - Runtime for `llama3.1:8b` dropped from ~110 minutes to an average of **~53 minutes** (a ~51% reduction).
  - **Pass Rates:** While latency improved significantly, the success rate for the larger models was compromised. `qwen2.5-coder:7b` succeeded on 2/3 projects. `llama3.1:8b` succeeded on only 1/3 projects. 
- **Decision:** **ADOPTED WITH CAVEAT.**
  - Bypassing Stage A and B successfully achieves the ≥30% latency reduction requirement. However, the raw critiques proved to be dense, resulting in downstream schema repair failures in `D1-D4` for `llama3.1:8b` (which failed 2/3 projects).

### 3. Targeted Section Repair Payload
- **Hypothesis:** Instead of feeding the entire document back to the Repair Agent (which consumes massive input tokens and takes ~9 minutes per repair), we only pass the subset of schema keys that failed validation.
- **Telemetry Result:** The targeted repair successfully allowed `qwen2.5-coder:7b` to repair its stages during `7b-1` and `7b-2` runs, keeping repair latency minimal. 
- **Decision:** **ADOPTED.**

---

## Final Verdict

**BLOCKED FOR PRODUCTION.**

While we successfully proved that we can reduce pipeline runtime by **40–50%** (satisfying the 30% reduction goal), the removal of intermediate synthesis stages (Stage A and B) and the regression of the D-Alpha/Beta merge resulted in a **Success Rate of 33.3%** across the COMPATIBILITY-10 benchmark.

The pipeline is mathematically faster, but it is no longer reliable. The system is blocked from general availability until the validation pass-rates can be restored to ≥95%.
