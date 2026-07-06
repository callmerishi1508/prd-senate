# Optimization Candidates

Based on the profiling investigation, the bottleneck lies entirely within the latency of sequentially querying the local LLM. The following optimizations address this constraint.

## 1. Eliminate Stages A & B (Bypass Redundant Synthesis)
Currently, `runHierarchicalConsensus` uses Stage A to summarize the research and Stage B to summarize the debate, feeding both into Stage C (Consensus Summary). Since the Research Engine already produced a synthesis and the UX/Tech critiques are already focused, Stages A and B are largely redundant boilerplate that cost 14 minutes.
- **Expected Latency Reduction**: ~14 minutes per PRD (17% reduction)
- **Implementation Complexity**: Low (Simply pass the raw Research, UX Critique, and Tech Critique directly into Stage C)
- **Expected Quality Impact**: Negligible (Stage C is fully capable of synthesizing the raw text on its own, given a 2048 context window)
- **Risk Level**: Low

## 2. Collapse D1-D4 into Dual Stages (D1/D2 and D3/D4)
Instead of executing 4 separate stages for Overview, Goals, UX, and Tech, we can collapse them into 2 stages. E.g., Stage D-Alpha handles Overview & Goals, and Stage D-Beta handles UX & Tech. 
- **Expected Latency Reduction**: ~19 minutes per PRD (24% reduction)
- **Implementation Complexity**: Medium (Requires merging Zod schema targets and adjusting the prompt instructions)
- **Expected Quality Impact**: Minimal to None. As long as the `num_predict` is increased slightly (e.g. 1024), the 7B model has enough attention span to output two schema blocks concurrently.
- **Risk Level**: Medium (Slightly higher chance of schema validation failure if the model gets confused by a larger combined schema)

## 3. Dedicated Ollama Concurrency (OLLAMA_NUM_PARALLEL)
The original `Promise.all()` deadlock was caused because Ollama by default processes requests strictly sequentially unless `OLLAMA_NUM_PARALLEL` is configured and enough VRAM is available. If we can run D1, D2, D3, and D4 concurrently, we bypass the sequential bottleneck completely.
- **Expected Latency Reduction**: ~28 minutes per PRD (35% reduction)
- **Implementation Complexity**: Low to Medium (Re-enabling `Promise.all()` in code, but requires configuring the host environment/Ollama daemon variables)
- **Expected Quality Impact**: None (The execution logic remains identical)
- **Risk Level**: High (High risk of returning to the deadlock/crashing behavior if host hardware lacks the VRAM to support 4 parallel context windows of a 7B model)

## 4. Prompt Compression for Consensus Stages
Stages D1-D4 inject the entire `Consensus Summary` into the prompt. Compressing the boilerplate instructions and using a highly minified system prompt can reduce the input context size, directly speeding up the "prompt eval" phase of inference.
- **Expected Latency Reduction**: ~3-5 minutes per PRD (4-6% reduction)
- **Implementation Complexity**: Low
- **Expected Quality Impact**: Low
- **Risk Level**: Low
