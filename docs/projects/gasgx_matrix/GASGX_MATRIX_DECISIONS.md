# GASGX MATRIX DECISIONS

## 2026-04-25

- `gasgx matrix` keeps the user-requested directory name with a space, while Python package code lives under `app/gasgx_matrix/`.
- Video rendering uses direct `ffmpeg` / `ffprobe` orchestration rather than MoviePy-first rendering.
- HUD data is implemented as live-first with deterministic fallback to local ROI formulas so generation does not stop on network failure.
- Streamlit is restricted to operator upload / preview / trigger responsibilities; pipeline logic lives in the Python package.
- The first implementation targets correctness and batch uniqueness, not a guaranteed `30 videos in 3 minutes` SLA.

## 2026-04-27

- Streamlit operator UI uses Chinese as the default interface language.
- GasGx Matrix follows the existing Chrome_Extensions GasGx Cyber-Industrial visual system:
  - dark default surface
  - aurora green `#5DD62C` primary accent
  - glass panels with green border tint
  - recessed dark inputs
  - green high-contrast primary action
  - no default blue dropdown active state
- Streamlit operator UI should visually align with `G:\GasGx Video Distribution`:
  - left sidebar uses the `#151515` console rail with an aurora-green vertical brand mark
  - main workspace starts with a topbar plus compact metric cards
  - panels use translucent `rgba(32, 32, 32, 0.78)` surfaces and `rgba(93, 214, 44, 0.16)` borders
  - business functions remain unchanged when applying visual-only layout updates
