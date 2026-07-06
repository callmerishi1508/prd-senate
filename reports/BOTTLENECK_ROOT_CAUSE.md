# Bottleneck Root Cause Analysis

## Time Spent Categorization (Per PRD)

Based on an 80.5-minute average generation time for `qwen2.5-coder:7b`:

| Category | Time (mins) | % of Total Time |
| :--- | :--- | :--- |
| **LLM Inference** | ~80.5 | >99.9% |
| **Idle / Wait (Network / Concurrency)** | ~0.0 | <0.1% |
| **Serialization & Validation (Zod)** | ~0.05 | <0.1% |
| **Repeated Generations / Retries** | ~0.0 (if pass) | N/A |
| **Research Synthesis / API** | ~0.0 | <0.1% |

*Note: The time spent on research synthesis execution (querying APIs) is minimal, the 5.36m in "Research Engine" is almost entirely spent waiting for the LLM to write the markdown synthesis.*

## Root Cause

**1. Inference Speed (Hardware Bounds):**
The predominant root cause of the long delay is the sheer slowness of local LLM inference for a 7-billion parameter model on the host hardware. The pipeline waits ~9.5 minutes for a single 800-token generation chunk to complete (amounting to ~1.4 tokens per second).

**2. Sequential Architectural Depth (The 7-Stage Chain):**
The pipeline requires 11 heavy LLM calls in total. While `UX Critique` and `Tech Critique` are successfully parallelized, the `Hierarchical Consensus` phase (Stage A -> B -> C -> D1 -> D2 -> D3 -> D4) is strictly sequential. 
Because `Promise.all()` deadlocked the Ollama daemon under high load, these stages must execute one after the other. Therefore, the pipeline pays the 9.5-minute generation latency 7 consecutive times without concurrency. 

**3. Context Window Saturation:**
Stages A, B, and C feed immense prompt context (Research + Draft + Critiques) into the model (`num_ctx: 2048`). Generating text from large prompt contexts on CPU / unoptimized local GPU compounds the inference time drastically.

In summary, the pipeline operates perfectly efficiently from a code perspective (no significant idle time, wait time, or validation overhead). The bottleneck is completely bounded by the sequential generation of 11 large context LLM queries at ~1.4 tokens per second.
