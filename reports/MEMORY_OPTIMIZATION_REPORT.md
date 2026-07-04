# Memory Optimization Report

## Current Memory Footprint
1. **Context Window Saturation**: The `num_ctx` is set to 4096 or 2048 for multiple LLM calls, even when the input context is much smaller.
2. **JSON Duplication**: The full PRD is serialized and deserialized multiple times across validation loops, creating massive string allocations in Node.js V8 memory.
3. **Traceability Engine Overload**: The traceability engine traverses the entire PRD tree repeatedly during the Quality Gate loops, retaining large DOM-like string representations in memory.

## Optimization Strategy
1. **Dynamic Context Windows**: We will adjust `num_ctx` based on the exact token requirements of the stage, preventing the Ollama backend from allocating maximum context buffer sizes for small critique tasks.
2. **Selective State Passing**: Instead of passing the full Research Report JSON to every single stage (which balloons memory), we will only pass the `Stage A: Research Summary` text. 
3. **Streamlined Normalization**: `smartExtractJSON` and the Zod Validator will execute sequentially in place without duplicating the state tree.
