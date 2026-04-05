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
6. Brand icon direction for this extension is now Notebook-style with green palette.
   - Keep action/app icons aligned across `16/48/128` sizes.

## 2026-04-05 UI Visual Standard (GasGx Cyber-Industrial)
1. KongLai-NotebookLM frontend pages (`popup/options/manager/prompts`) now share a single dark tech token baseline:
   - `--bg-main: #0F0F0F`
   - `--bg-card: #202020`
   - `--accent-aurora: #5DD62C`
   - `--primary-green: #28A745`
   - `--aux-bright: #00E676`
   - `--gradient-dark: #337418`
2. Visual effects are standardized as stable UI decisions:
   - glassmorphism on panels/cards (`rgba(32,32,32,0.7)` + `blur(12px)` + green glow border)
   - breathing glow for primary CTA buttons
   - industrial inner-shadow inputs (`inset 0 2px 6px rgba(0,0,0,0.6)`)
3. Theme consistency rule: manager light-theme branch is overridden to the same dark palette to avoid mixed visual language across pages.

## 2026-04-05 UI Spec Upgrade (GasGx-UI-v3.1)
1. Replaced previous v1.0 visual baseline with v3.1 token system:
   - Dark/Light dual-theme tokens (`--bg-main`, `--bg-card`, `--text-primary`, `--border-line`, `--accent-aurora`)
   - Added status signal tokens (`--status-success`, `--status-warning`, `--status-danger`, `--status-info`)
2. Typography decision is now unified:
   - Body uses `Inter + PingFang SC + Microsoft YaHei + Helvetica Neue + Arial`
   - Data metrics use monospace stack (`JetBrains Mono/Fira Code/Consolas`)
3. Industrial shape rules are stabilized:
   - card radius: `8px`
   - button/form radius: `4px`
   - spacing baseline moved to 8px-grid-friendly values
4. Anti-pattern fix is now mandatory in UI layer:
   - dropdown hover/selected state uses aurora translucent background (no default bright blue)
   - checkbox/radio size is hard-locked to `16x16` with `flex-shrink: 0`
5. Sidebar count badge rule is retained:
   - no number => no badge circle rendered.
