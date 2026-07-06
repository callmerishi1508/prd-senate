# Phase 15K: Validation Failure Heatmap

## Failure Matrix
Based on the exact telemetry collected in `ai_retries.jsonl` from the `COMPATIBILITY-10` run:

| Failed Project | Model | Missing Section (Critical) | Invalid Section (Non-Critical) | Repair Attempts | Final Rejection Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Project 0** | `qwen2.5:1.5b` | `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 1** | `qwen2.5:1.5b` | `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 2** | `qwen2.5:1.5b` | `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 0** | `qwen2.5-coder:7b`| `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 2** | `qwen2.5-coder:7b`| `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 1** | `llama3.1:8b` | `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |
| **Project 2** | `llama3.1:8b` | `productOverview` | `businessGoals` (Expected `goals`) | 3 | Max Retries Exceeded |

### Heatmap Analysis
*   **Intensity:** 100% of validation failures share identical missing sections.
*   **Context:** The repair agent could not fix the `productOverview` missing error because its internal targets (`alphaKeys`) mandated generating a `problemStatement` instead.
*   **Conclusion:** The validation logic itself is rejecting structurally sound JSON simply because of key mismatches (`problemStatement` vs `productOverview`, and `businessGoals` vs `goals`).
