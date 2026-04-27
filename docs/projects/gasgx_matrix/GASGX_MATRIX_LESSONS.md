# GASGX MATRIX LESSONS

## 2026-04-25

- `ffprobe` was not directly available on `PATH` in the current Windows environment, so the project resolves it relative to the discovered `ffmpeg` binary.
- Keeping batch video assembly in raw `ffmpeg` commands avoids the heavier performance and compatibility overhead of Python-side frame orchestration for this first cut.
