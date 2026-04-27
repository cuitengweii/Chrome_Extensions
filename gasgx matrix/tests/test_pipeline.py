from pathlib import Path

from gasgx_matrix.composition import plan_variants
from gasgx_matrix.ffmpeg_tools import _extract_duration, _extract_video_stream
from gasgx_matrix.hud import HudPayload
from gasgx_matrix.ingestion import _select_source_files, rebalance_categories
from gasgx_matrix.models import ClipMetadata
from gasgx_matrix.pipeline import _copy_template_path, _notify, _resolve_output_root, _resolve_worker_count
from gasgx_matrix.render import _build_filter_complex
from gasgx_matrix.spark_text import _local_copy
from gasgx_matrix.settings import ProjectSettings
from gasgx_matrix.streamlit_app import _existing_directory


def _settings(tmp_path: Path) -> ProjectSettings:
    root = tmp_path / "project"
    return ProjectSettings(
        project_name="GasGx Vibe-Matrix",
        source_root=root / "incoming",
        library_root=root / "library",
        output_root=root / "outputs",
        output_count=4,
        target_width=1080,
        target_height=1920,
        target_fps=60,
        recent_limits={"category_A": 15, "category_B": 8, "category_C": 6},
        video_duration_min=8.0,
        video_duration_max=12.0,
        default_title_prefix="GasGx",
        website_url="https://www.gasgx.com/roi",
        hud_enable_live_data=False,
        hud_fixed_formulas=["A", "B", "C"],
        slogans=["Stop Flaring. Start Hashing.", "Monetize On-site."],
        titles=["Gas To Compute", "Industrial Power"],
        hud_sources={},
    )


def _clip(tmp_path: Path, clip_id: str, category: str, duration: float = 4.0) -> ClipMetadata:
    path = tmp_path / f"{clip_id}.mp4"
    path.write_text("placeholder", encoding="utf-8")
    return ClipMetadata(
        clip_id=clip_id,
        source_path=path,
        normalized_path=path,
        category=category,
        duration=duration,
        width=1080,
        height=1920,
        fps=60.0,
        brightness_score=0.9,
        contrast_score=0.95,
    )


def test_variant_pattern_and_uniqueness(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    clips = [
        _clip(tmp_path, "a1", "category_A"),
        _clip(tmp_path, "a2", "category_A"),
        _clip(tmp_path, "b1", "category_B", duration=6.0),
        _clip(tmp_path, "b2", "category_B", duration=6.5),
        _clip(tmp_path, "c1", "category_C"),
        _clip(tmp_path, "c2", "category_C"),
    ]
    beat_grid = [round(i * 0.5, 3) for i in range(40)]
    hud = HudPayload(lines=["BTC/USD", "NET_HASHRATE", "Flare_Gas_Input -> Hash_Output"], used_live_data=False)
    variants = plan_variants(clips, settings, hud, beat_grid, output_count=4, seed=8)

    assert len(variants) == 4
    assert len({variant.signature for variant in variants}) == 4
    for variant in variants:
        assert [segment.category for segment in variant.segments] == ["category_A", "category_B", "category_A", "category_C"]
        total_duration = sum(segment.duration for segment in variant.segments)
        assert 8.0 <= total_duration <= 12.0


def test_missing_category_raises(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    clips = [_clip(tmp_path, "a1", "category_A"), _clip(tmp_path, "b1", "category_B")]
    beat_grid = [0.0, 0.5, 1.0]
    hud = HudPayload(lines=["A"], used_live_data=False)
    try:
        plan_variants(clips, settings, hud, beat_grid, output_count=1)
    except ValueError as exc:
        assert "category_C" in str(exc)
    else:
        raise AssertionError("Expected missing category error")


def test_ffmpeg_fallback_parsers() -> None:
    stderr = """
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'sample.mp4':
  Duration: 00:00:04.52, start: 0.000000, bitrate: 2510 kb/s
  Stream #0:0: Video: h264 (High), yuv420p(progressive), 1080x1920, 60 fps, 60 tbr, 15360 tbn
"""
    assert _extract_duration(stderr) == "4.520"
    assert _extract_video_stream(stderr) == (1080, 1920, 60)


def test_uncategorized_clips_fill_missing_buckets(tmp_path: Path) -> None:
    clips = [
        _clip(tmp_path, "u1", "uncategorized"),
        _clip(tmp_path, "u2", "uncategorized"),
        _clip(tmp_path, "u3", "uncategorized"),
        _clip(tmp_path, "a1", "category_A"),
    ]
    rebalanced = rebalance_categories(clips)
    categories = [clip.category for clip in rebalanced]
    assert "category_A" in categories
    assert "category_B" in categories
    assert "category_C" in categories


def test_progress_callback_clamps_range() -> None:
    events: list[tuple[str, float, str]] = []
    _notify(lambda stage, progress, message: events.append((stage, progress, message)), "render", 1.6, "done")
    assert events == [("render", 1.0, "done")]


def test_render_filter_normalizes_sar_and_uses_font(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    clips = [
        _clip(tmp_path, "a1", "category_A"),
        _clip(tmp_path, "b1", "category_B", duration=6.0),
        _clip(tmp_path, "a2", "category_A"),
        _clip(tmp_path, "c1", "category_C"),
    ]
    beat_grid = [round(i * 0.5, 3) for i in range(40)]
    hud = HudPayload(lines=["BTC/USD", "NET_HASHRATE", "ROI"], used_live_data=False)
    variant = plan_variants(clips, settings, hud, beat_grid, output_count=1, seed=7)[0]
    filter_complex, _ = _build_filter_complex(variant, settings)
    assert "setsar=1" in filter_complex
    assert "drawtext=fontfile=" in filter_complex or "drawtext=fontcolor=" in filter_complex


def test_render_filter_respects_template_visibility(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    clips = [
        _clip(tmp_path, "a1", "category_A"),
        _clip(tmp_path, "b1", "category_B", duration=6.0),
        _clip(tmp_path, "a2", "category_A"),
        _clip(tmp_path, "c1", "category_C"),
    ]
    hud = HudPayload(lines=["BTC/USD"], used_live_data=False)
    variant = plan_variants(clips, settings, hud, [i * 0.5 for i in range(40)], output_count=1)[0]
    filter_complex, _ = _build_filter_complex(
        variant,
        settings,
        template_config={"show_hud": False, "show_slogan": False, "show_title": False},
    )
    assert "drawtext=" not in filter_complex
    assert "drawbox=" not in filter_complex


def test_copy_template_has_transcript_placeholder() -> None:
    template = Path("templates/copy_template.txt").read_text(encoding="utf-8")
    assert "{transcript}" in template


def test_worker_count_respects_total_and_override() -> None:
    assert _resolve_worker_count(8, 3) == 3
    assert _resolve_worker_count(0, 3) == 1


def test_output_root_can_be_overridden(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    custom_root = tmp_path / "custom_exports"
    assert _resolve_output_root(settings, None) == settings.output_root
    assert _resolve_output_root(settings, custom_root) == custom_root.resolve()
    assert _copy_template_path().exists()


def test_directory_picker_uses_existing_ancestor(tmp_path: Path) -> None:
    nested_missing_path = tmp_path / "exports" / "future" / "batch"
    assert _existing_directory(nested_missing_path) == tmp_path


def test_local_copy_includes_transcript(tmp_path: Path) -> None:
    settings = _settings(tmp_path)
    clips = [
        _clip(tmp_path, "a1", "category_A"),
        _clip(tmp_path, "b1", "category_B", duration=6.0),
        _clip(tmp_path, "a2", "category_A"),
        _clip(tmp_path, "c1", "category_C"),
    ]
    hud = HudPayload(lines=["BTC/USD"], used_live_data=False)
    variant = plan_variants(clips, settings, hud, [i * 0.5 for i in range(40)], output_count=1)[0]
    template = "{title}\n{transcript}\n{hud_summary}\n{website_url}\n{sequence_number}\n{slogan}"
    copy = _local_copy(variant, settings, "script body", template)
    assert "script body" in copy


def test_select_source_files_uses_latest_per_category(tmp_path: Path) -> None:
    root = tmp_path / "incoming"
    paths = []
    for index in range(3):
        path = root / "category_A" / f"machine_{index}.mp4"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("x", encoding="utf-8")
        timestamp = 1000 + index
        path.touch()
        import os

        os.utime(path, (timestamp, timestamp))
        paths.append(path)

    selected = _select_source_files(root, {"category_A": 1, "category_B": 1, "category_C": 1})
    assert selected == [paths[-1]]
