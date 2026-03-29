# KongLai-NotebookLM Decisions
- Updated: 2026-03-29

## Stable Decisions
1. Refresh execution is tracked at two scopes:
   - `source` scope for each source execution result
   - `notebook` scope for notebook-level aggregate result
2. Run summary is the source of truth for UI observability:
   - `totalSources`, `successCount`, `failedCount`, `skippedCount`
   - `failureReasons` distribution
   - top failed source samples (max 3 in UI)
3. Same-notebook duplicate trigger prevention is enforced in both layers:
   - manager row-level disable via active/pending notebook set
   - background `runNotebookNow` hard rejection with `notebook_run_in_progress`
4. Retry strategy is fixed as bounded exponential backoff:
   - retries: configurable (0-3)
   - base delay: configurable (200-5000 ms)
   - delay formula: `base * 2^(attempt-1)`
5. Source refresh entry matching is resilient by design:
   - `refreshLabel` supports multiple candidates
   - candidate parsing supports separators and dedup
   - defaults are always merged to tolerate UI text drift
