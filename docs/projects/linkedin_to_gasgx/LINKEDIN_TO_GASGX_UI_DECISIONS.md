# LinkedIn-to-GasGx UI Decisions (GasGx v2.1 Alignment)

## Scope
- Project path: `D:\code\Chrome_Extensions\Linkedin-to-GasGx`
- Updated UI surfaces:
  - `options.css` + `options.js`
  - `popup.css`
  - `content.css`

## Theme Strategy
- Default theme is dark (`Cyber-Industrial`).
- Light theme is auto-enabled with `@media (prefers-color-scheme: light)`.
- Token families are fixed across all updated surfaces:
  - Base: `--bg-main`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-line`
  - Accent: `--accent-aurora`, `--primary-green`
  - Effects: `--glass-bg`, `--glass-border`, `--input-shadow`

## Typography
- Base font stack:
  - `"Inter", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif`
- Numeric/code style:
  - `"JetBrains Mono", "Fira Code", Consolas, monospace`

## Dropdown Rule (Hard Constraint)
- Native select popup highlight was removed from UX-critical paths by introducing a custom dropdown renderer in `options.js`.
- Enforced classes:
  - Menu container: `.custom-dropdown-menu`
  - Items: `.custom-dropdown-item`
- Accessibility and behavior:
  - Keyboard open support (`ArrowDown`, `ArrowUp`, `Enter`, `Space`)
  - Escape/outside click close
  - Synced back to hidden native `<select>` for storage logic compatibility
- Contrast constraint:
  - Item text is forced with `color: var(--text-primary) !important`
  - Hover/selected background uses aurora translucent fill, never default blue

## Effects
- Glass panel: blur + translucent card + green border tint.
- Breathing glow animation: used on primary CTA surfaces.
- Inner shadow: used on form-like surfaces to preserve industrial depth.

## Guardrails For Future Changes
- Do not reintroduce browser/default blue dropdown active states.
- Do not switch dark theme background to bright panels by default.
- Keep option/readability constraints strict in dark mode.
