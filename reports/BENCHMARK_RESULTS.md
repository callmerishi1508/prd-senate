# Phase 15K: Benchmark Results

## Full Compatibility Benchmark (COMPATIBILITY-10)

Following the implementation of the minimal schema alignment patch (mapping `problemStatement` to `productOverview`), the `COMPATIBILITY-10` suite was completely re-executed.

### Source Telemetry
*Data retrieved directly from executed benchmark output (`benchmark_report_compatibility-10.md` and underlying JSONL).*

*   **Total Projects:** 9
*   **Successful:** 9
*   **Failed:** 0
*   **Success Rate:** 100.0%
*   **Health Score:** 93.0
*   **Correction Rate:** 0.0%
*   **Correction Efficiency:** 100.0%
*   **Average Latency:** 135.3s
*   **Critical Escapes:** 0
*   **Cross-Project Contamination:** 0

### Error Rates
*   **Parser Recoveries:** 0
*   **Repair Conversions:** 0 (No schema repairs were required; first-pass validation succeeded across all 9 projects).
*   **Validation Failures:** 0

### Model Specific Breakdown
*   **`qwen2.5:1.5b`**: 3/3 Success
*   **`qwen2.5-coder:7b`**: 3/3 Success
*   **`llama3.1:8b`**: 3/3 Success

**Conclusion:** The schema alignment patch resulted in a 100% success rate across all tested parameters without requiring any downstream pipeline repairs.
