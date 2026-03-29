# KongLai-NotebookLM Lessons
- Updated: 2026-03-29

## Lessons
1. UI-only lock is not enough for idempotency.
   - If only frontend disables buttons, cross-entry or race-triggered duplicate runs can still queue.
   - Backend lock (`pending + active`) is required for real protection.
2. Notebook-level logs are not sufficient for troubleshooting.
   - Source-level logs and reason distribution drastically reduce diagnosis time for flaky refresh runs.
3. Observability must expose both aggregate and sample detail.
   - A compact summary (total/success/fail/skip) plus top failed samples gives faster triage than raw log streams alone.
