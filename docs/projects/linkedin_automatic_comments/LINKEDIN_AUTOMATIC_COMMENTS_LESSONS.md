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

## 2026-03-29 | Header Branding and Decorative Icon Are Separate Paths

### Pitfall
- Popup title string and decorative logo are rendered through different components, so changing one does not affect the other.

### What Worked
- Added dedicated runtime handlers: one for header branding text, one for bottom-right fixed logo removal.

### Avoid Next Time
- For popup visual cleanup requests, inspect both textual nodes and fixed-position decorative assets.

## 2026-03-29 | MUI sx Positioning Broke Style-Substring Selectors

### Pitfall
- Selecting fixed elements via `[style*='position: fixed']` is unreliable when layout is generated via MUI `sx` classes rather than inline style attributes.

### What Worked
- Switched to geometry-based detection (`getBoundingClientRect`) for bottom-right icon removal.

### Avoid Next Time
- For UI cleanup in bundled React/MUI outputs, avoid relying solely on inline-style substring selectors.

## 2026-04-01 | Popup Preference Injection Needs Cross-File Wiring Checks

### Pitfall
- In packaged-output extension projects, adding popup runtime controls can silently fail when style layer and runtime injection IDs drift.

### What Worked
- Used ID-level cross-file checks between `runtime.patch.js` and `popup-custom.css` for the new auto-send block.
- Added storage normalization + clamped range helpers before wiring UI events, reducing malformed input edge cases.

### Avoid Next Time
- Treat each new popup control as a 3-part contract:
  - runtime mount/injection ID
  - style selector ID/class
  - storage key + normalization rule
- Before handoff, always run syntax checks plus ID/wiring verification for patched bundle projects.
## 2026-04-15 | Composer Popup Reopened from Popup Bundle Path

### Pitfall
- We previously hardened content-side trigger guards, but popup bundle still contained a scripted avatar click in `getSeatByNavbarImage`; opening the extension popup could still trigger LinkedIn composer modal.

### What Worked
- Auditing both bundled paths (`contents.*.js` and `popup.*.js`) and removing scripted avatar click from popup bootstrap closed the residual composer popup path.
- Tightening comment trigger to article-action-bar whitelist plus click-time blacklist eliminated composer misfire during auto-comment flow.
- Freezing background action icon removed the visible "logo changes after click" side effect.

### Avoid Next Time
- For packaged/minified extension projects, treat popup/content/background as separate runtime surfaces and verify all of them before declaring a UI trigger bug closed.
- For social feed automation, prefer positive structure constraints (post container + action bar) over broad text matches.
## 2026-04-19 | Runtime Patch Limits Around Legacy Preferences

### Pitfall
- Repeated runtime-layer DOM bridges around the old bundled preferences page did not reliably close persistence.
- Several fixes improved surrounding popup behavior, but the original preference values still reset after reopen.

### What Worked
- Storage compatibility fixes were still necessary and useful around the popup runtime:
  - restore legacy serialized object shapes for bundled popup storage reads/writes
  - stop read-path storage writeback to avoid Chrome write quota exhaustion
  - migrate popup auth/account rendering toward GasGx runtime snapshots without reopening LinkedIn or external user-center pages

### What Did Not Fully Work
- DOM-level preference replay and persistence bridges were not enough to guarantee stable bundled preference persistence.
- Treating the problem as only a UI event issue led to multiple partial fixes without closing the root ownership boundary.

### Avoid Next Time
- For this extension, do not keep stacking outer popup DOM fixes once bundled preferences still reset.
- Go directly to one of these deeper fixes in the next thread:
  - intercept bundled `PreferencesModel.load/save`
  - replace the legacy preferences surface with a fully controlled runtime/native implementation

## 2026-04-20 | Mixed Ownership Made Small UI Bugs Expensive

### Pitfall
- We spent too long fixing a small number of visible controls because popup and content behavior were split across:
  - bundled popup/content code
  - runtime DOM injection
  - compatibility storage shims
  - prompt-layer behavior
- This caused repeated partial fixes that each addressed only one ownership layer.

### What Worked
- Explicitly picking one owner per surface reduced churn:
  - popup: runtime-owned shell
  - content comment flow: recover legacy bundle path with minimal targeted fixes
  - AI behavior: strengthen prompt and validation instead of stacking DOM-only fixes

### Avoid Next Time
- Before fixing a bug in this extension, first identify which surface owns it:
  - popup shell
  - runtime compatibility layer
  - legacy content bundle
  - AI prompt/validation layer
- Do not keep mixing fixes across all four in one pass.

## 2026-04-20 | Prompt Weakness Causes Better-Looking Bugs Than Hard Truncation, But Still Needs Repair Loop

### Pitfall
- Weak prompt constraints let AI output drift away from user preferences even when the UI looked correct.
- Hard local truncation fixed shape superficially but produced visibly broken text such as half words and unfinished sentences.

### What Worked
- Converting preferences into explicit prompt rules plus output validation and one repair retry created a safer middle ground.
- This keeps the main shaping responsibility in the model while still giving the runtime one controlled recovery attempt.

### Avoid Next Time
- For AI text generation in this project, do not rely on hard clipping as the primary enforcement mechanism.
- Use this order:
  - prompt constraints
  - output validation
  - one repair retry
  - final guardrail cleanup only if still necessary
