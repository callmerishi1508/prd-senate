# Pipeline Hotspot Analysis

Based on the telemetry gathered from `qwen2.5-coder:7b` execution before the benchmark was halted, the pipeline requires an average of **80.5 minutes** per project.

## Stage-by-Stage Runtime

| Stage | Avg Runtime (mins) | Cumulative Runtime (mins) | % of Total Runtime | LLM Calls |
| :--- | :--- | :--- | :--- | :--- |
| **Research Engine** | 5.36 | 5.36 | 6.6% | 1 |
| **Lead PM Draft** | 9.89 | 15.25 | 12.2% | 1 |
| **UX Critique** | 4.73 | 19.98 (parallel) | 5.8% | 1 |
| **Tech Critique** | 4.73 | 19.98 (parallel) | 5.8% | 1 |
| **Consensus Stage A** | ~7.00 | 26.98 | 8.6% | 1 |
| **Consensus Stage B** | ~7.00 | 33.98 | 8.6% | 1 |
| **Consensus Stage C** | ~9.50 | 43.48 | 11.7% | 1 |
| **Consensus Stage D1** | ~9.50 | 52.98 | 11.7% | 1 |
| **Consensus Stage D2** | ~9.50 | 62.48 | 11.7% | 1 |
| **Consensus Stage D3** | ~9.50 | 71.98 | 11.7% | 1 |
| **Consensus Stage D4** | ~9.50 | 81.48 | 11.7% | 1 |
| **Validation / Assembly** | ~0.05 | 81.53 | < 0.1% | 0 |

## Analysis
The primary hotspot is the **Hierarchical Consensus Pipeline (Stages A, B, C, D1-D4)**. Because these 7 stages execute strictly sequentially to prevent Ollama deadlocks, they dominate the pipeline runtime, accounting for **~61.5 minutes (75%)** of the total generation time. 
