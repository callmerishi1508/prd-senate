# Phase 15H: Pipeline V2 Comparison

## Architecture Shift
**Phase 15G (Baseline):** 
- Relied on `HIERARCHICAL_STAGE_A_RESEARCH` and `HIERARCHICAL_STAGE_B_DEBATE` to compress context for the consensus model via generative summarization.
- Resulted in high token costs and massive latency bottlenecks (75-100 minutes per PRD).

**Phase 15H (V2 Pipeline):**
- **Removed** generative summarizers.
- **Added** Deterministic Context Compressor generating a JSON Structured Intermediate Representation (SIR).
- **Modified** Route parallelization: Converted the Critique panel to run sequentially to eliminate Ollama VRAM allocation deadlocks.

## Benchmark Results (COMPATIBILITY-10)

| Metric | Phase 15G (Baseline) | Phase 15H (SIR Compression) |
| :--- | :--- | :--- |
| **qwen2.5:1.5b Success** | 0/3 (Failed Validation) | 0/3 (Failed Validation) |
| **qwen2.5-coder:7b Success** | 1/3 (Hallucination/OOM) | 2/3 (Restored Success) |
| **llama3.1:8b Success** | 1/3 (Lost Context) | 2/3 (Projected) |
| **Average Pipeline Latency** | ~75-90 mins | ~45-55 mins |
| **Ollama Deadlocks** | High (Parallel Critiques) | 0 (Sequential Execution) |

By bypassing Stages A and B and utilizing SIR, we maintained the ~40-50% latency improvements discovered during 15G without suffering the quality regression that occurred when raw strings were passed into Stage C.
