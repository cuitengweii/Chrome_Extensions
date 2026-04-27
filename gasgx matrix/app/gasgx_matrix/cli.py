from __future__ import annotations

import argparse
from pathlib import Path

from .pipeline import run_pipeline
from .settings import ProjectSettings
from .templates import DEFAULT_TEMPLATE_ID, load_templates


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="GasGx Vibe-Matrix batch renderer")
    parser.add_argument("--config", type=Path, default=Path("config/defaults.json"))
    parser.add_argument("--bgm", type=Path, required=False, help="Path to the BGM audio file")
    parser.add_argument("--source-root", type=Path, required=False, help="Override source root")
    parser.add_argument("--output-root", type=Path, required=False, help="Override final output directory")
    parser.add_argument("--output-count", type=int, default=None)
    parser.add_argument("--outputs", default="mp4", help="Comma-separated outputs: mp4,png,txt,json")
    parser.add_argument("--copy-language", choices=["zh", "en", "ru"], default="zh")
    parser.add_argument("--max-workers", type=int, default=None)
    parser.add_argument("--template", default=DEFAULT_TEMPLATE_ID)
    parser.add_argument("--latest-by-category", action="store_true")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    settings = ProjectSettings.from_file(args.config.resolve())
    templates = load_templates(args.config.resolve().parent / "templates.json")
    template_config = templates.get(args.template) or next(iter(templates.values()))
    bgm_path = args.bgm.resolve() if args.bgm else _default_bgm_placeholder(args.config.resolve())
    assets = run_pipeline(
        settings=settings,
        bgm_path=bgm_path,
        output_count=args.output_count,
        source_root=args.source_root.resolve() if args.source_root else None,
        output_root=args.output_root.resolve() if args.output_root else None,
        output_types={item.strip() for item in args.outputs.split(",") if item.strip()},
        copy_language=args.copy_language,
        max_workers=args.max_workers,
        recent_limits=settings.recent_limits if args.latest_by_category else None,
        template_config=template_config,
    )
    print(f"Rendered {len(assets)} Vibe-Matrix videos to {assets[0].video_path.parent if assets else settings.output_root}")


def _default_bgm_placeholder(config_path: Path) -> Path:
    candidate = config_path.parent.parent / "assets" / "bgm_placeholder.wav"
    if not candidate.exists():
        raise SystemExit("BGM path is required until assets/bgm_placeholder.wav is provided.")
    return candidate.resolve()


if __name__ == "__main__":
    main()
