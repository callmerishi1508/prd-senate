# Prompt Efficiency Report

## Prompt Token Audit
- **Average System Prompt Size**: ~250 tokens
- **Average User Prompt Size (with context)**: ~800 - 1500 tokens
- **Total Pipeline Prompt Tokens**: ~12,000+ tokens per run

## Duplicated Context
1. **Boilerplate Instructions**: Every single agent prompt in `prompts.ts` duplicates the exact same `StructuredOutputRules` ("Output strictly valid JSON...") and `FailureRecoveryInstructions` ("If validation fails..."). This adds ~40 redundant tokens to every LLM call (over 15 calls = ~600 wasted tokens).
2. **Context Str**: The `contextStr` retrieved from the knowledge base is injected into both the Draft agent and the full Consensus agent (legacy mode). 
3. **Repeated Examples**: Each agent receives a few-shot JSON example that is largely empty (`"competitors": []`). The LLM still has to process these structural hints.

## Compression Strategies
1. **Remove Legacy JSON Strictness**: Since we integrated `smartExtractJSON` in Phase 15E, we can safely compress the JSON formatting rules into a single short directive: "Output raw JSON." instead of the verbose paragraph.
2. **Global System Message**: Abstract the JSON output contract to a global suffix rather than building it into every unique agent profile, saving template size.
3. **Truncate Research Summaries**: `HIERARCHICAL_STAGE_C_CONSENSUS` concatenates `stageA_Res` and `stageB_Res` in full. We can instruct Stage A and B to output bullet points strictly to reduce the token load on Stage C and D1-D4.
