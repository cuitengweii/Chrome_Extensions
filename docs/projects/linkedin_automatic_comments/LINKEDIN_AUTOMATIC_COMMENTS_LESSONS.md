# LINKEDIN_AUTOMATIC_COMMENTS_LESSONS

## 2026-03-29

### Pitfall
- Editing minified bundled modules directly is fragile and easy to break when there is no source map/rebuild pipeline.

### What Worked
- Injecting a dedicated runtime patch layer at entry points allowed us to:
  - preserve layout and structure
  - implement theme and i18n toggles quickly
  - enforce local unlock behavior without deep bundle rewrites

### Avoid Next Time
- If source repository becomes available, move:
  - theme tokens
  - i18n dictionary
  - authorization/feature gating switches
  back to source-level modules and rebuild for long-term maintainability.

## 2026-03-29 | Load Failure Follow-up

### Pitfall
- In packaged-output projects, committing only local patch files can leave the extension unloadable in clean environments because hashed runtime files are missing.

### What Worked
- Rebuilding a clean unpacked `manifest.json` and ensuring full runtime dependency set (`popup/content/background/assets/icons`) are present fixes loadability.

### Avoid Next Time
- For unpacked Chrome extension projects, always validate:
  - manifest JSON parse
  - referenced file existence
  - syntax checks for popup/content/background scripts
  before handing over.

## 2026-03-29 | Popup JSON Crash Reopen

### Pitfall
- Runtime-layer storage normalization alone may not fully absorb all legacy local state shapes in long-lived Chrome profiles.

### What Worked
- Adding a narrow fallback in bundled popup parser (`parseValue`) stopped repeated boot crash caused by legacy `"[object Object]"` payload.

### Avoid Next Time
- For packaged-output extensions, guard both layers:
  - storage write/read normalization in runtime patch
  - bundle-side deserialization fallback in popup boot path

## 2026-03-29 | Comment Trigger Not Firing on Chinese LinkedIn UI

### Pitfall
- Content trigger discovery was text-bound to English (`Comment/Reply`) and missed Chinese UI labels (`评论/回复`), so buttons looked normal but no generation handler was attached.

### What Worked
- Expanding selector text coverage in bundled content script to include both English and Chinese labels restored click-to-generate behavior.

### Avoid Next Time
- For social-site automation features, avoid single-language text selectors.
- Prefer multilingual fallback or attribute-based selectors when working with localized UIs.

## 2026-03-29 | Terminal Encoding Corrupted Chinese Selector Text

### Pitfall
- Directly patching bundled JS with raw Chinese text via shell caused `评论/回复` literals to degrade into `??`, silently breaking selector matching.

### What Worked
- Replacing Chinese literals with unicode escapes (`\u8bc4\u8bba`, `\u56de\u590d`) made the patch encoding-safe across terminal/codepage differences.

### Avoid Next Time
- In minified/bundled patch workflows, prefer ASCII-safe unicode escape literals for non-ASCII selector text.

## 2026-03-29 | Enum Labels Stayed English Under zh-CN

### Pitfall
- Translating only static labels misses enum-generated dropdown values in popup UI, which leaves visible English strings under Chinese mode.

### What Worked
- Extracted enum/display strings from `popup.bce84c5a.js` and expanded runtime option mapping accordingly.
- Added a small coverage check to compare popup option-like keys against runtime dictionaries.

### Avoid Next Time
- After any popup bundle update, re-run option coverage verification before handoff.
- Keep the runtime option dictionary aligned with enum output values, not only static UI labels.

## 2026-03-29 | Long Tooltip Strings Need Literal Coverage Checks

### Pitfall
- Long tooltip sentences can bypass translation if punctuation or rich-text form differs from dictionary keys.

### What Worked
- Extracting all popup `tooltip:"..."` literals and comparing against runtime dictionaries immediately exposes gaps.

### Avoid Next Time
- Include tooltip-literal coverage check in zh-CN regression before handoff.
