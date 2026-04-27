from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Callable

from .beat import detect_beat_grid
from .composition import plan_variants
from .hud import build_hud_payload
from .ingestion import ingest_sources
from .models import RenderedAsset
from .render import render_variant
from .settings import ProjectSettings


ProgressCallback = Callable[[str, float, str], None]


def run_pipeline(
    settings: ProjectSettings,
    bgm_path: Path,
    output_count: int | None = None,
    source_root: Path | None = None,
    output_root: Path | None = None,
    progress_callback: ProgressCallback | None = None,
    transcript_text: str = "",
    output_types: set[str] | None = None,
    copy_language: str = "zh",
    max_workers: int | None = None,
    recent_limits: dict[str, int] | None = None,
    template_config: dict | None = None,
) -> list[RenderedAsset]:
    _notify(progress_callback, "ingestion", 0.05, "Collecting and normalizing source clips")
    clips = ingest_sources(settings, source_root=source_root, recent_limits=recent_limits)
    if not clips:
        raise ValueError("No source videos were found for ingestion")
    _notify(progress_callback, "hud", 0.20, "Preparing GasGx data HUD")
    hud_payload = build_hud_payload(settings)
    _notify(progress_callback, "beat", 0.30, "Analyzing BGM beat grid")
    beat_grid = detect_beat_grid(bgm_path, duration_hint=settings.video_duration_max)
    _notify(progress_callback, "planning", 0.42, "Planning de-duplicated video variants")
    variants = plan_variants(clips, settings, hud_payload, beat_grid, output_count=output_count)
    template_copy = _copy_template_path().read_text(encoding="utf-8")
    active_output_root = _resolve_output_root(settings, output_root)
    batch_dir = active_output_root / datetime.now().strftime("%Y%m%d_%H%M%S")
    assets: list[RenderedAsset] = []
    render_start = 0.45
    render_span = 0.50
    total = max(len(variants), 1)
    worker_count = _resolve_worker_count(max_workers, total)
    _notify(progress_callback, "render", render_start, f"Rendering {total} videos with {worker_count} workers")
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = {
            executor.submit(
                render_variant,
                variant,
                settings,
                template_copy,
                batch_dir,
                bgm_path,
                transcript_text,
                output_types or {"mp4"},
                copy_language,
                template_config,
            ): variant.sequence_number
            for variant in variants
        }
        completed = 0
        for future in as_completed(futures):
            assets.append(future.result())
            completed += 1
            progress = render_start + (completed / total) * render_span
            _notify(progress_callback, "render", progress, f"Rendered video {completed}/{total}")
    _notify(progress_callback, "finalizing", 0.97, "Finalizing preview assets and manifests")
    _notify(progress_callback, "complete", 1.0, f"Completed {len(assets)} exports")
    return sorted(assets, key=lambda asset: asset.variant.sequence_number)


def _notify(callback: ProgressCallback | None, stage: str, progress: float, message: str) -> None:
    if callback is not None:
        callback(stage, max(0.0, min(progress, 1.0)), message)


def _resolve_worker_count(max_workers: int | None, total: int) -> int:
    if max_workers is not None:
        return max(1, min(max_workers, total))
    cpu_count = os.cpu_count() or 2
    return max(1, min(total, max(2, cpu_count // 2), 4))


def _resolve_output_root(settings: ProjectSettings, output_root: Path | None) -> Path:
    if output_root is None:
        return settings.output_root
    return output_root.expanduser().resolve()


def _copy_template_path() -> Path:
    return Path(__file__).resolve().parents[2] / "templates" / "copy_template.txt"
