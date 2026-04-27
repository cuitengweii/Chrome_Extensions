# GasGx Vibe-Matrix

GasGx Vibe-Matrix is a local-first Python tool for generating cyber-industrial short videos in batch. It ingests raw clips, normalizes them, aligns edits to BGM beats, applies the GasGx visual protocol, and exports videos with matching cover art and marketing copy.

## Features

- Material ingestion with category-aware library folders and metadata index
- FFmpeg-driven vertical normalization to `1080x1920` and target `60fps`
- Beat analysis via `librosa` with fallback pulse generation
- Structured `[A+B+A+C]` sequencing for 8-12 second outputs
- De-duplication signatures across clip order, transform jitter, slogans, and HUD values
- Cover frame generation with aurora-green overlay and title
- Streamlit UI for upload, generation, preview, and export
- CLI entrypoint for batch runs and automation

## Quick Start

```powershell
cd "D:\code\Chrome_Extensions\gasgx matrix"
python -m pip install -e .
streamlit run streamlit_app.py
```

Or run the CLI:

```powershell
gasgx-matrix --config config\defaults.json --output-count 6
```

## Layout

- `app/gasgx_matrix/`: application package
- `config/defaults.json`: default production profile
- `data/`: local storage abstraction for incoming clips and categorized library
- `outputs/`: exported videos, covers, copy, and manifests
- `templates/`: copy template
- `tests/`: unit tests for sequencing and de-duplication rules

## Notes

- The first version assumes local folders instead of S3/NAS. The storage layer is isolated so a remote backend can be added later.
- `ffprobe` is preferred for media probing. If it is not on `PATH`, the app resolves it next to `ffmpeg`.
