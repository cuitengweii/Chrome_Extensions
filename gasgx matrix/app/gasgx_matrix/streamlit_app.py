from __future__ import annotations

import tempfile
import tkinter as tk
from tkinter import filedialog
from pathlib import Path

import streamlit as st

from .ingestion import VIDEO_EXTENSIONS, ensure_category_dirs
from .pipeline import run_pipeline
from .settings import ProjectSettings
from .templates import DEFAULT_TEMPLATE_ID, load_templates, save_templates


def run() -> None:
    root = Path(__file__).resolve().parents[2]
    config_path = root / "config" / "defaults.json"
    templates_path = root / "config" / "templates.json"
    settings = ProjectSettings.from_file(config_path)
    ensure_category_dirs(settings.source_root)
    templates = load_templates(templates_path)

    st.set_page_config(page_title="GasGx Vibe-Matrix", layout="wide")
    _inject_preview_styles()

    st.sidebar.markdown(
        """
        <div class="gx-sidebar-brand">
          <span class="gx-brand-mark"></span>
          <div>
            <div class="gx-sidebar-title">GasGx</div>
            <div class="gx-sidebar-subtitle">Vibe-Matrix Console</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    output_count = st.sidebar.slider("生成数量", 1, 30, min(settings.output_count, 30))
    max_workers = st.sidebar.slider("并行线程数", 1, 6, 3)
    source_mode_label = st.sidebar.radio("素材来源", ["分类目录", "手动上传"], index=0)
    source_mode = "Category folders" if source_mode_label == "分类目录" else "Upload files"
    output_options = st.sidebar.multiselect(
        "输出文件",
        options=["mp4", "png", "txt", "json"],
        default=["mp4"],
    )
    output_root_text = _render_output_directory_picker(settings.output_root)
    template_ids = list(templates.keys()) or [DEFAULT_TEMPLATE_ID]
    selected_template_id = st.sidebar.selectbox("9:16 模板", template_ids)
    copy_language_label = st.sidebar.radio(
        "文案语言",
        options=["中文", "英文", "俄文"],
        index=0,
        horizontal=True,
    )
    language_map = {"中文": "zh", "英文": "en", "俄文": "ru"}
    bgm_upload = st.sidebar.file_uploader("上传背景音乐", type=["mp3", "wav", "m4a"])

    category_counts = _count_category_files(settings.source_root)
    _render_workspace_header(settings, category_counts, output_count, max_workers)
    recent_limits = _render_source_controls(settings, source_mode, category_counts)
    source_uploads = None
    if source_mode == "Upload files":
        source_uploads = st.file_uploader(
            "上传原始视频素材",
            type=["mp4", "mov", "mkv", "avi", "m4v"],
            accept_multiple_files=True,
        )

    template_config = _render_template_editor(templates_path, templates, selected_template_id)
    transcript_upload = st.file_uploader("上传文字稿", type=["txt", "md"])
    st.caption(
        "文字稿规则：上传 TXT/MD 或直接粘贴文本；建议一段一个卖点，包含 CTA 或 ROI 引导；"
        "除非时间码本身属于脚本内容，否则不要写时间码。"
    )
    transcript_text = st.text_area(
        "文字稿内容",
        height=180,
        placeholder="在这里粘贴口播稿、脚本、CTA 或营销文案。",
    )
    use_live_data = st.sidebar.checkbox("启用实时 HUD 数据", value=settings.hud_enable_live_data)

    if st.button("生成 Vibe Matrix", type="primary"):
        if not bgm_upload:
            st.error("请先上传背景音乐。")
            return
        if source_mode == "Upload files" and not source_uploads:
            st.error("请先上传原始视频素材。")
            return
        if "mp4" not in output_options:
            st.error("必须保留 MP4 输出，因为它是主视频文件。")
            return

        active_output_root = Path(output_root_text.strip()).expanduser() if output_root_text.strip() else None
        settings.hud_enable_live_data = use_live_data
        with tempfile.TemporaryDirectory(prefix="gasgx_matrix_") as tmp_dir:
            temp_root = Path(tmp_dir)
            if source_mode == "Upload files":
                source_root = temp_root / "incoming"
                source_root.mkdir(parents=True, exist_ok=True)
                for upload in source_uploads or []:
                    (source_root / upload.name).write_bytes(upload.getbuffer())
                active_recent_limits = None
            else:
                source_root = settings.source_root
                active_recent_limits = recent_limits

            bgm_path = temp_root / bgm_upload.name
            bgm_path.write_bytes(bgm_upload.getbuffer())
            uploaded_transcript = ""
            if transcript_upload is not None:
                uploaded_transcript = transcript_upload.getvalue().decode("utf-8", errors="ignore")
            combined_transcript = transcript_text.strip() or uploaded_transcript.strip()

            stage_box = st.empty()
            progress_bar = st.progress(0, text="等待开始")

            def on_progress(stage: str, progress: float, message: str) -> None:
                progress_bar.progress(int(progress * 100), text=f"{int(progress * 100)}%")
                stage_box.markdown(
                    f"**阶段：** `{_stage_label(stage)}`  \n"
                    f"**进度：** `{int(progress * 100)}%`  \n"
                    f"**当前任务：** `{message}`"
                )

            try:
                with st.spinner("正在生成 Vibe-Matrix 视频..."):
                    assets = run_pipeline(
                        settings=settings,
                        bgm_path=bgm_path,
                        output_count=output_count,
                        source_root=source_root,
                        output_root=active_output_root,
                        progress_callback=on_progress,
                        transcript_text=combined_transcript,
                        output_types=set(output_options),
                        copy_language=language_map[copy_language_label],
                        max_workers=max_workers,
                        recent_limits=active_recent_limits,
                        template_config=template_config,
                    )
            except ValueError as exc:
                st.error(str(exc))
                st.info(
                    "提示：如果素材都是手机默认文件名，建议把部分文件改成 "
                    "`spark_machine`、`office_screen_roi`、`logo_factory_shipping` 这类关键词命名。"
                )
                return

            if assets:
                st.caption(f"最终输出目录：{assets[0].video_path.parent}")
            st.success(f"已生成 {len(assets)} 条视频。")
            _render_phone_gallery(assets)


def _render_workspace_header(
    settings: ProjectSettings,
    category_counts: dict[str, int],
    output_count: int,
    max_workers: int,
) -> None:
    total_sources = sum(category_counts.values())
    st.markdown(
        f"""
        <header class="gx-workspace-topbar">
          <div>
            <div class="gx-kicker">GasGx Video Production Console</div>
            <h1>GasGx 短视频矩阵批量生成工具</h1>
            <p>分类素材入库、节奏卡点混剪、赛博工业视觉协议与批量导出在同一工作台完成。</p>
          </div>
          <div class="gx-topbar-action">Vibe-Matrix</div>
        </header>
        <section class="gx-metric-grid">
          <article class="gx-metric"><span>本地素材</span><strong>{total_sources}</strong></article>
          <article class="gx-metric"><span>生成数量</span><strong>{output_count}</strong></article>
          <article class="gx-metric"><span>并行线程</span><strong>{max_workers}</strong></article>
          <article class="gx-metric"><span>默认比例</span><strong>{settings.target_width}:{settings.target_height}</strong></article>
        </section>
        """,
        unsafe_allow_html=True,
    )


def _render_source_controls(
    settings: ProjectSettings,
    source_mode: str,
    counts: dict[str, int],
) -> dict[str, int] | None:
    if source_mode != "Category folders":
        return None
    st.markdown(
        """
        <section class="gx-section-head">
          <div>
            <span>Source Library</span>
            <h2>分类素材目录</h2>
          </div>
        </section>
        """,
        unsafe_allow_html=True,
    )
    st.code(
        "\n".join(
            [
                str(settings.source_root / "category_A"),
                str(settings.source_root / "category_B"),
                str(settings.source_root / "category_C"),
            ]
        )
    )
    st.caption(
        f"当前素材数量：A={counts['category_A']} / B={counts['category_B']} / C={counts['category_C']}。"
        "程序会从每个目录中读取最新文件。"
    )
    st.sidebar.markdown("每类读取最新素材数")
    return {
        "category_A": st.sidebar.slider("A 类最新素材", 1, 50, settings.recent_limits.get("category_A", 15)),
        "category_B": st.sidebar.slider("B 类最新素材", 1, 50, settings.recent_limits.get("category_B", 8)),
        "category_C": st.sidebar.slider("C 类最新素材", 1, 50, settings.recent_limits.get("category_C", 6)),
    }


def _count_category_files(root: Path) -> dict[str, int]:
    counts = {}
    for category in ("category_A", "category_B", "category_C"):
        folder = root / category
        counts[category] = sum(
            1 for path in folder.rglob("*") if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
        )
    return counts


def _render_output_directory_picker(default_output_root: Path) -> str:
    if "output_root_text" not in st.session_state:
        st.session_state.output_root_text = str(default_output_root)

    st.sidebar.markdown("最终视频生成目录")
    if st.sidebar.button("选择最终生成目录", key="choose_output_root"):
        selected_path = _choose_directory(Path(st.session_state.output_root_text))
        if selected_path:
            st.session_state.output_root_text = str(selected_path)

    st.sidebar.text_input(
        "当前目录",
        value=st.session_state.output_root_text,
        disabled=True,
        label_visibility="collapsed",
    )
    return str(st.session_state.output_root_text)


def _choose_directory(initial_dir: Path) -> Path | None:
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    selected = filedialog.askdirectory(
        title="选择最终视频生成目录",
        initialdir=str(_existing_directory(initial_dir)),
    )
    root.destroy()
    return Path(selected) if selected else None


def _existing_directory(path: Path) -> Path:
    candidate = path if path.is_dir() else path.parent
    while not candidate.exists() and candidate != candidate.parent:
        candidate = candidate.parent
    return candidate if candidate.exists() else Path.cwd()


def _render_template_editor(templates_path: Path, templates: dict, selected_template_id: str) -> dict:
    template = dict(templates[selected_template_id])
    with st.expander("9:16 模板编辑器", expanded=False):
        template["name"] = st.text_input("模板名称", value=str(template.get("name", selected_template_id)))
        visibility_cols = st.columns(3)
        template["show_hud"] = visibility_cols[0].checkbox("HUD", value=bool(template.get("show_hud", True)))
        template["show_slogan"] = visibility_cols[1].checkbox("口号", value=bool(template.get("show_slogan", True)))
        template["show_title"] = visibility_cols[2].checkbox("标题", value=bool(template.get("show_title", True)))

        st.markdown("文字位置")
        pos_cols = st.columns(3)
        with pos_cols[0]:
            template["slogan_x"] = st.slider("口号 X", 0, 1080, int(template.get("slogan_x", 42)))
            template["slogan_y"] = st.slider("口号 Y", 0, 1920, int(template.get("slogan_y", 48)))
            template["slogan_font_size"] = st.slider("口号字号", 16, 96, int(template.get("slogan_font_size", 58)))
        with pos_cols[1]:
            template["title_x"] = st.slider("标题 X", 0, 1080, int(template.get("title_x", 42)))
            template["title_y"] = st.slider("标题 Y", 0, 1920, int(template.get("title_y", 118)))
            template["title_font_size"] = st.slider("标题字号", 16, 72, int(template.get("title_font_size", 26)))
        with pos_cols[2]:
            template["hud_x"] = st.slider("HUD X", 0, 1080, int(template.get("hud_x", 42)))
            template["hud_y"] = st.slider("HUD Y", 0, 1920, int(template.get("hud_y", 1842)))
            template["hud_font_size"] = st.slider("HUD 字号", 16, 64, int(template.get("hud_font_size", 32)))

        bar_cols = st.columns(4)
        template["hud_bar_y"] = bar_cols[0].slider("HUD 背景 Y", 0, 1920, int(template.get("hud_bar_y", 1804)))
        template["hud_bar_height"] = bar_cols[1].slider(
            "HUD 背景高度", 20, 420, int(template.get("hud_bar_height", 116))
        )
        template["hud_bar_opacity"] = bar_cols[2].slider(
            "HUD 透明度", 0.0, 1.0, float(template.get("hud_bar_opacity", 0.38))
        )
        template["hud_bar_color"] = bar_cols[3].color_picker(
            "HUD 背景色", value=str(template.get("hud_bar_color", "#0E1A10"))
        )

        color_cols = st.columns(2)
        template["primary_color"] = color_cols[0].color_picker(
            "主文字色", value=str(template.get("primary_color", "#5DD62C"))
        )
        template["secondary_color"] = color_cols[1].color_picker(
            "辅助文字色", value=str(template.get("secondary_color", "#FFFFFF"))
        )

        if st.button("保存当前模板"):
            templates[selected_template_id] = template
            save_templates(templates_path, templates)
            st.success("模板已保存。")
    return template


def _inject_preview_styles() -> None:
    st.markdown(
        """
        <style>
        :root {
            --bg-main: #0f0f0f;
            --bg-card: #202020;
            --bg-panel: rgba(32, 32, 32, 0.78);
            --text-primary: #E0E0E0;
            --text-secondary: #888888;
            --text-on-primary: #0F0F0F;
            --border-line: #333333;
            --accent-aurora: #5DD62C;
            --accent-soft: rgba(93, 214, 44, 0.14);
            --gradient-dark: #337418;
            --status-success: #28A745;
            --status-warning: #FF9900;
            --status-danger: #FF3366;
            --status-info: #00A3FF;
            --glass-bg: var(--bg-panel);
            --glass-border: rgba(93, 214, 44, 0.16);
        }
        html, body, [data-testid="stAppViewContainer"], .stApp {
            background:
                radial-gradient(circle at 12% 0%, rgba(93, 214, 44, 0.08), transparent 26%),
                radial-gradient(circle at 88% 10%, rgba(0, 163, 255, 0.05), transparent 28%),
                var(--bg-main) !important;
            color: var(--text-primary) !important;
            font-family: "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        [data-testid="stHeader"], header {
            background: transparent !important;
            box-shadow: none !important;
        }
        [data-testid="stToolbar"], [data-testid="stDecoration"], [data-testid="stStatusWidget"] {
            background: transparent !important;
            color: var(--text-secondary) !important;
        }
        [data-testid="stSidebar"] {
            background: #151515 !important;
            border-right: 1px solid var(--border-line) !important;
        }
        [data-testid="stSidebar"] * {
            color: var(--text-primary) !important;
        }
        .gx-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0 24px;
            margin-bottom: 18px;
            border-bottom: 1px solid var(--border-line);
        }
        .gx-brand-mark {
            width: 10px;
            height: 34px;
            border-radius: 3px;
            background: var(--accent-aurora);
            box-shadow: 0 0 16px rgba(93, 214, 44, 0.42);
        }
        .gx-sidebar-title {
            color: var(--text-primary);
            font-size: 22px;
            line-height: 1.08;
            font-weight: 800;
        }
        .gx-sidebar-subtitle {
            color: var(--text-secondary);
            font-size: 12px;
            line-height: 1.5;
            margin-top: 3px;
        }
        .block-container {
            padding-top: 1.75rem !important;
            max-width: 1460px;
        }
        .gx-workspace-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
            padding: 2px 0 4px;
        }
        .gx-kicker,
        .gx-section-head span {
            color: var(--accent-aurora) !important;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .gx-workspace-topbar h1 {
            margin: 6px 0 8px;
            font-size: 30px;
            line-height: 1.1;
        }
        .gx-workspace-topbar p {
            margin: 0;
            color: var(--text-secondary) !important;
        }
        .gx-topbar-action {
            border: 1px solid rgba(93, 214, 44, 0.28);
            border-radius: 999px;
            padding: 9px 13px;
            color: var(--accent-aurora);
            background: var(--accent-soft);
            font-weight: 800;
            box-shadow: 0 0 18px rgba(93, 214, 44, 0.12);
        }
        .gx-metric-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 18px;
        }
        .gx-metric {
            background: var(--bg-panel);
            border: 1px solid rgba(93, 214, 44, 0.16);
            border-radius: 8px;
            padding: 16px;
            backdrop-filter: blur(12px);
        }
        .gx-metric span {
            color: var(--text-secondary) !important;
            font-size: 13px;
        }
        .gx-metric strong {
            display: block;
            margin-top: 10px;
            color: var(--text-primary);
            font-size: 26px;
            line-height: 1;
            font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
        }
        .gx-section-head {
            display: flex;
            align-items: end;
            justify-content: space-between;
            margin: 6px 0 14px;
        }
        .gx-section-head h2 {
            margin: 4px 0 0;
            font-size: 22px;
        }
        h1, h2, h3, h4, label {
            color: var(--text-primary) !important;
            letter-spacing: 0 !important;
        }
        p, small, span, .stCaption, [data-testid="stCaptionContainer"] {
            color: var(--text-primary) !important;
        }
        [data-testid="stTooltipIcon"],
        [data-testid="stTooltipIcon"] *,
        [data-testid="stTooltipHoverTarget"],
        [data-testid="stTooltipHoverTarget"] *,
        svg[aria-label="Help"],
        svg[aria-label="Help"] * {
            color: var(--text-primary) !important;
            fill: var(--text-primary) !important;
            stroke: var(--text-primary) !important;
        }
        code, pre, [data-testid="stCodeBlock"] {
            background: rgba(15, 15, 15, 0.62) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-line) !important;
            border-radius: 8px !important;
            font-family: "JetBrains Mono", "Fira Code", Consolas, monospace !important;
        }
        [data-testid="stExpander"], [data-testid="stFileUploader"], [data-testid="stTextArea"] {
            background: var(--glass-bg) !important;
            border: 1px solid var(--glass-border) !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.04) !important;
            backdrop-filter: blur(12px);
        }
        [data-testid="stExpander"] summary {
            color: var(--text-primary) !important;
        }
        [data-testid="stExpander"] summary *,
        [data-testid="stExpander"] summary svg {
            color: var(--text-primary) !important;
            fill: var(--text-primary) !important;
        }
        [data-testid="stFileUploader"] section {
            background: var(--bg-main) !important;
            border: 1px dashed var(--border-line) !important;
            border-radius: 8px !important;
            color: var(--text-primary) !important;
        }
        [data-testid="stFileUploader"] section *,
        [data-testid="stFileUploader"] small,
        [data-testid="stFileUploader"] span,
        [data-testid="stFileUploader"] p {
            color: var(--text-primary) !important;
        }
        [data-testid="stFileUploader"] button {
            background: transparent !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-line) !important;
            box-shadow: none !important;
        }
        [data-testid="stFileUploader"] button * {
            color: var(--text-primary) !important;
        }
        textarea, input, div[data-baseweb="select"] > div {
            background-color: var(--bg-main) !important;
            color: var(--text-primary) !important;
            border: 1px solid #2b2b2b !important;
            border-radius: 6px !important;
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6) !important;
        }
        textarea:focus, input:focus, div[data-baseweb="select"] > div:focus-within {
            border-color: var(--accent-aurora) !important;
        }
        input:disabled,
        input[disabled],
        [data-testid="stTextInput"] input:disabled,
        [data-testid="stTextInput"] input[disabled] {
            color: var(--text-primary) !important;
            -webkit-text-fill-color: var(--text-primary) !important;
            opacity: 1 !important;
        }
        textarea::placeholder, input::placeholder {
            color: rgba(224, 224, 224, 0.9) !important;
            opacity: 1 !important;
        }
        div[data-baseweb="popover"], ul[role="listbox"] {
            background: var(--bg-card) !important;
            border: 1px solid var(--border-line) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8) !important;
        }
        li[role="option"], [role="option"] {
            background-color: transparent !important;
            color: var(--text-primary) !important;
        }
        div[data-baseweb="popover"] li[role="option"],
        div[data-baseweb="popover"] [role="option"],
        ul[role="listbox"] li,
        ul[role="listbox"] [role="option"] {
            color: var(--text-on-primary) !important;
            -webkit-text-fill-color: var(--text-on-primary) !important;
        }
        div[data-baseweb="popover"] li[role="option"] *,
        div[data-baseweb="popover"] [role="option"] *,
        ul[role="listbox"] li *,
        ul[role="listbox"] [role="option"] * {
            color: var(--text-on-primary) !important;
            -webkit-text-fill-color: var(--text-on-primary) !important;
            fill: var(--text-on-primary) !important;
        }
        li[role="option"]:hover, li[aria-selected="true"], [role="option"]:hover, [role="option"][aria-selected="true"] {
            background-color: rgba(93, 214, 44, 0.15) !important;
            color: var(--text-on-primary) !important;
            -webkit-text-fill-color: var(--text-on-primary) !important;
            border-left: 2px solid var(--accent-aurora) !important;
        }
        .stButton > button, button[kind="primary"] {
            background: var(--accent-aurora) !important;
            color: var(--text-on-primary) !important;
            border: none !important;
            border-radius: 6px !important;
            font-weight: 700 !important;
            box-shadow: 0 0 12px rgba(93, 214, 44, 0.4) !important;
            min-height: 38px !important;
        }
        .stButton > button *, button[kind="primary"] * {
            color: var(--text-on-primary) !important;
            fill: var(--text-on-primary) !important;
        }
        .stButton > button:hover, button[kind="primary"]:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 22px rgba(93, 214, 44, 0.48) !important;
        }
        [data-testid="stSidebar"] [role="radiogroup"],
        [data-testid="stSidebar"] [data-baseweb="select"],
        [data-testid="stSidebar"] [data-baseweb="slider"] {
            background-color: rgba(15, 15, 15, 0.62) !important;
            border: 1px solid var(--border-line) !important;
            border-radius: 6px !important;
            padding: 6px !important;
        }
        [data-testid="stSidebar"] label {
            font-size: 13px !important;
        }
        [data-testid="stSidebar"] [role="radio"] > div:first-child,
        [data-testid="stSidebar"] input[type="checkbox"] {
            width: 16px !important;
            height: 16px !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
        }
        [data-testid="stSidebar"] [aria-checked="true"] {
            color: var(--accent-aurora) !important;
        }
        .stProgress > div > div > div > div {
            background: linear-gradient(90deg, var(--gradient-dark), var(--accent-aurora)) !important;
        }
        [data-baseweb="slider"] [role="slider"] {
            background: var(--accent-aurora) !important;
            border-color: var(--accent-aurora) !important;
            box-shadow: 0 0 12px rgba(93, 214, 44, 0.4) !important;
        }
        [data-baseweb="slider"] > div > div {
            background-color: var(--border-line) !important;
        }
        @media (max-width: 920px) {
            .gx-workspace-topbar,
            .gx-metric-grid {
                display: grid;
                grid-template-columns: 1fr;
            }
        }
        .gx-phone-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 14px 14px 22px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
        }
        .gx-phone-shell {
            background: #080C0A;
            border: 6px solid #202724;
            border-radius: 34px;
            padding: 18px 12px 12px;
            position: relative;
        }
        .gx-phone-notch {
            width: 88px;
            height: 12px;
            border-radius: 999px;
            background: #1F2522;
            margin: 0 auto 12px;
        }
        .gx-phone-meta {
            color: var(--text-secondary);
            font-size: 13px;
            margin-top: 10px;
            line-height: 1.55;
        }
        [data-testid="stMainMenu"],
        [data-testid="stMainMenu"] *,
        div[data-baseweb="popover"] [role="menu"],
        div[data-baseweb="popover"] [role="menu"] *,
        div[data-baseweb="popover"] [role="menuitem"],
        div[data-baseweb="popover"] [role="menuitem"] * {
            background-color: var(--bg-card) !important;
            color: var(--text-primary) !important;
            -webkit-text-fill-color: var(--text-primary) !important;
            opacity: 1 !important;
        }
        div[data-baseweb="popover"] [role="menu"] {
            border: 1px solid var(--border-line) !important;
            border-radius: 8px !important;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.72) !important;
            overflow: hidden !important;
        }
        div[data-baseweb="popover"] [role="menuitem"]:hover,
        div[data-baseweb="popover"] [role="menuitem"]:focus {
            background-color: rgba(93, 214, 44, 0.14) !important;
            color: var(--text-primary) !important;
        }
        div[data-baseweb="popover"] [aria-disabled="true"],
        div[data-baseweb="popover"] [aria-disabled="true"] * {
            color: rgba(224, 224, 224, 0.48) !important;
            -webkit-text-fill-color: rgba(224, 224, 224, 0.48) !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _render_phone_gallery(assets: list) -> None:
    columns = st.columns(3)
    for index, asset in enumerate(assets):
        column = columns[index % 3]
        with column:
            st.markdown(
                '<div class="gx-phone-card"><div class="gx-phone-shell"><div class="gx-phone-notch"></div>',
                unsafe_allow_html=True,
            )
            st.video(str(asset.video_path))
            st.markdown(
                (
                    "</div>"
                    f'<div class="gx-phone-meta"><strong>手机预览 {asset.variant.sequence_number:02d}</strong><br>'
                    f"{asset.variant.title}<br>{asset.variant.slogan}</div>"
                    "</div>"
                ),
                unsafe_allow_html=True,
            )
            with st.expander("封面与文案", expanded=False):
                if asset.cover_path is not None:
                    st.image(str(asset.cover_path), caption="封面")
                if asset.copy_path is not None:
                    st.code(asset.copy_path.read_text(encoding="utf-8"))
                if asset.cover_path is None and asset.copy_path is None:
                    st.caption("当前变体只生成了 MP4。")


def _stage_label(stage: str) -> str:
    labels = {
        "ingestion": "素材入库",
        "hud": "HUD 数据",
        "beat": "节拍分析",
        "planning": "编排去重",
        "render": "视频渲染",
        "finalizing": "收尾导出",
        "complete": "完成",
    }
    return labels.get(stage, stage)
