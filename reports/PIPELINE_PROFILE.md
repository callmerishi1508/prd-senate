# Pipeline Profiling Report

## 19-Stage Generative Pipeline Latency (Baseline)
1. **Research Engine**: ~122s
2. **Draft generation**: ~247s
3. **UX Critique**: ~157s
4. **Tech Critique**: ~132s
5. **Verification Agent**: ~120s
6. **Consensus Stage A (Research Summary)**: ~20s
7. **Consensus Stage B (Debate Summary)**: ~25s
8. **Consensus Stage C (Consensus Summary)**: ~31s
9. **Hierarchical Stage D1**: ~219s
10. **Hierarchical Stage D2**: ~83s
11. **Hierarchical Stage D3**: ~334s
12. **Hierarchical Stage D4**: ~82s
13. **Assembly Quality Gate**: ~2s (Validating 12 sub-schemas)
14. **Repair Agent (if Gate fails)**: ~140s
15. **Traceability Engine**: ~5s
16. **Database Write**: ~1s
17. **Telemetry Log**: ~1s
18. **Final JSON Render**: ~1s
19. **Response Transmission**: ~1s

## Critical Bottlenecks Identified
- **Sequential Execution**: The UX Critique and Tech Critique agents currently execute sequentially, artificially adding 132s to the critical path.
- **Hierarchical Sequentiality**: Stages D1, D2, D3, and D4 execute sequentially, totaling 718s. They are mutually exclusive in their output schemas and depend only on Stage C, meaning they can be fully parallelized.
- **Redundant Processing**: The Verification Agent serves no purpose in the hierarchical mode, as Stage B (Debate Summary) performs an identical synthesis function.
