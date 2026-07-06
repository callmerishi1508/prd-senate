# LLM Call Graph

This graph maps every model invocation for a single `qwen2.5-coder:7b` project run through the pipeline.

## LLM Invocations

1. **Research Engine**
   - **Input Tokens**: `num_ctx: 2048`
   - **Output Tokens (Max)**: `num_predict: 800`
   - **Average Latency**: 5.36 minutes

2. **Lead PM Draft**
   - **Input Tokens**: `num_ctx: 2048`
   - **Output Tokens (Max)**: `num_predict: 800`
   - **Average Latency**: 9.89 minutes

3. **UX Critique** (Parallel)
   - **Input Tokens**: `num_ctx: 1024`
   - **Output Tokens (Max)**: `num_predict: 400`
   - **Average Latency**: 4.73 minutes

4. **Tech Critique** (Parallel)
   - **Input Tokens**: `num_ctx: 1024`
   - **Output Tokens (Max)**: `num_predict: 400`
   - **Average Latency**: 4.73 minutes

5. **Consensus Stage A (Research Synthesis)**
   - **Input Tokens**: `num_ctx: 2048`
   - **Output Tokens (Max)**: `num_predict: 600`
   - **Average Latency**: ~7.00 minutes

6. **Consensus Stage B (Debate Synthesis)**
   - **Input Tokens**: `num_ctx: 2048`
   - **Output Tokens (Max)**: `num_predict: 600`
   - **Average Latency**: ~7.00 minutes

7. **Consensus Stage C (Consensus Summary)**
   - **Input Tokens**: `num_ctx: 2048`
   - **Output Tokens (Max)**: `num_predict: 800`
   - **Average Latency**: ~9.50 minutes

8. **Consensus Stage D1 (Overview)**
   - **Input Tokens**: `num_ctx: 1024`
   - **Output Tokens (Max)**: `num_predict: 800`
   - **Average Latency**: ~9.50 minutes

9. **Consensus Stage D2 (Goals)**
   - **Input Tokens**: `num_ctx: 1024`
   - **Output Tokens (Max)**: `num_predict: 800`
   - **Average Latency**: ~9.50 minutes

10. **Consensus Stage D3 (UX & Stories)**
    - **Input Tokens**: `num_ctx: 1024`
    - **Output Tokens (Max)**: `num_predict: 800`
    - **Average Latency**: ~9.50 minutes

11. **Consensus Stage D4 (Tech & Personas)**
    - **Input Tokens**: `num_ctx: 1024`
    - **Output Tokens (Max)**: `num_predict: 800`
    - **Average Latency**: ~9.50 minutes

*Note: In the event of a JSON validation failure in Stage D1-D4, a retry is invoked which adds roughly 9.5 minutes per retry.*
