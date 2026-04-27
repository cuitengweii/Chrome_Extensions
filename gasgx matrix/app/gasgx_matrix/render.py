from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .ffmpeg_tools import concat_video, extract_frame
from .models import RenderedAsset, VideoVariant
from .settings import ProjectSettings
from .spark_text import build_marketing_copy
from .templates import coerce_template

FONT_CANDIDATES = (
    Path(r"C:\Windows\Fonts\arial.ttf"),
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
    Path(r"C:\Windows\Fonts\arialbd.ttf"),
)


def render_variant(
    variant: VideoVariant,
    settings: ProjectSettings,
    template_copy: str,
    batch_dir: Path,
    bgm_path: Path | None = None,
    transcript_text: str = "",
    output_types: set[str] | None = None,
    copy_language: str = "zh",
    template_config: dict | None = None,
) -> RenderedAsset:
    batch_dir.mkdir(parents=True, exist_ok=True)
    output_types = output_types or {"mp4"}
    video_path = batch_dir / f"vibe_{variant.sequence_number:02d}.mp4"
    cover_frame = batch_dir / f"vibe_{variant.sequence_number:02d}_raw_cover.png"
    cover_path = batch_dir / f"vibe_{variant.sequence_number:02d}_cover.png" if "png" in output_types else None
    copy_path = batch_dir / f"vibe_{variant.sequence_number:02d}_copy.txt" if "txt" in output_types else None
    manifest_path = batch_dir / f"vibe_{variant.sequence_number:02d}_manifest.json" if "json" in output_types else None

    filter_complex, inputs = _build_filter_complex(variant, settings, template_config=template_config)
    concat_video(filter_complex, inputs, video_path, bgm_path=bgm_path)
    if cover_path is not None:
        extract_frame(video_path, cover_frame, timestamp=1.0)
        _decorate_cover(cover_frame, cover_path, variant.title)
        cover_frame.unlink(missing_ok=True)

    if copy_path is not None:
        copy_path.write_text(
            build_marketing_copy(variant, settings, transcript_text, copy_language, template_copy),
            encoding="utf-8",
        )

    if manifest_path is not None:
        manifest_path.write_text(
            json.dumps(
                {
                    "sequence_number": variant.sequence_number,
                    "title": variant.title,
                    "slogan": variant.slogan,
                    "signature": variant.signature,
                    "video_path": str(video_path),
                    "cover_path": str(cover_path) if cover_path else None,
                    "copy_path": str(copy_path) if copy_path else None,
                    "copy_language": copy_language,
                    "hud_lines": variant.hud_lines,
                    "segments": [
                        {
                            "clip_id": segment.clip.clip_id,
                            "category": segment.category,
                            "source_path": str(segment.clip.source_path),
                            "normalized_path": str(segment.clip.normalized_path),
                            "start_time": segment.start_time,
                            "duration": segment.duration,
                        }
                        for segment in variant.segments
                    ],
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
    return RenderedAsset(variant, video_path, cover_path, copy_path, manifest_path)


def _build_filter_complex(
    variant: VideoVariant,
    settings: ProjectSettings,
    template_config: dict | None = None,
) -> tuple[str, list[Path]]:
    inputs = [segment.clip.normalized_path for segment in variant.segments]
    chains: list[str] = []
    labels: list[str] = []
    font_arg = _resolve_drawtext_font_arg()
    template = coerce_template(template_config)
    hud_text = " | ".join(line.replace(":", "\\:") for line in variant.hud_lines)
    slogan = variant.slogan.replace(":", "\\:")
    title = variant.title.replace(":", "\\:")
    for idx, segment in enumerate(variant.segments):
        crop_x = max(0, (settings.target_width * variant.zoom - settings.target_width) / 2 + variant.x_offset)
        crop_y = max(0, (settings.target_height * variant.zoom - settings.target_height) / 2 + variant.y_offset)
        chain = (
            f"[{idx}:v]"
            f"trim=start={segment.start_time}:duration={segment.duration},setpts=PTS-STARTPTS,"
            f"scale={int(settings.target_width * variant.zoom)}:{int(settings.target_height * variant.zoom)},"
            f"crop={settings.target_width}:{settings.target_height}:{int(crop_x)}:{int(crop_y)},"
            f"{'hflip,' if variant.mirror and idx % 2 == 0 else ''}"
            f"colorbalance=rs=-0.05:gs=0.10:bs=-0.04:rh=0.02:gh=0.01:bh=0.03,"
            f"eq=contrast={round(1.18 * variant.lut_strength, 3)}:brightness=-0.02:saturation=1.12,"
            f"setsar=1"
            f"{_overlay_filters(template, font_arg, hud_text, slogan, title)}"
            f"[v{idx}]"
        )
        chains.append(chain)
        labels.append(f"[v{idx}]")
    chains.append(f"{''.join(labels)}concat=n={len(labels)}:v=1:a=0[vout]")
    return ";".join(chains), inputs


def _decorate_cover(source_path: Path, target_path: Path, title: str) -> None:
    image = Image.open(source_path).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (13, 31, 18, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = image.size
    for step in range(height):
        alpha = int(90 + (step / max(height, 1)) * 120)
        color = (22, 255, 135, min(alpha, 180))
        draw.line([(0, step), (width, step)], fill=color)
    base = Image.alpha_composite(image, overlay)
    text_draw = ImageDraw.Draw(base)
    font = ImageFont.load_default()
    text_draw.rounded_rectangle((120, height // 2 - 56, width - 120, height // 2 + 56), radius=24, fill=(6, 14, 8, 190))
    text_draw.text((160, height // 2 - 8), title, fill=(255, 255, 255, 255), font=font)
    base.convert("RGB").save(target_path)


def _resolve_drawtext_font_arg() -> str:
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            escaped = str(candidate).replace("\\", "/").replace(":", "\\:")
            return f"fontfile='{escaped}':"
    return ""


def _overlay_filters(template: dict, font_arg: str, hud_text: str, slogan: str, title: str) -> str:
    filters: list[str] = []
    if template.get("show_hud", True):
        filters.append(
            "drawbox="
            f"x=0:y={int(template['hud_bar_y'])}:w=iw:h={int(template['hud_bar_height'])}:"
            f"color={template['hud_bar_color']}@{float(template['hud_bar_opacity']):.2f}:t=fill"
        )
        filters.append(
            "drawtext="
            f"{font_arg}fontcolor={template['secondary_color']}:"
            f"fontsize={int(template['hud_font_size'])}:"
            f"text='{hud_text}':x={int(template['hud_x'])}:y={int(template['hud_y'])}"
        )
    if template.get("show_slogan", True):
        filters.append(
            "drawtext="
            f"{font_arg}fontcolor={template['primary_color']}:"
            f"fontsize={int(template['slogan_font_size'])}:"
            f"text='{slogan}':x={int(template['slogan_x'])}:y={int(template['slogan_y'])}"
        )
    if template.get("show_title", True):
        filters.append(
            "drawtext="
            f"{font_arg}fontcolor={template['secondary_color']}:"
            f"fontsize={int(template['title_font_size'])}:"
            f"text='{title}':x={int(template['title_x'])}:y={int(template['title_y'])}"
        )
    return "," + ",".join(filters) if filters else ""
