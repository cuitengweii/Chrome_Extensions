# LINKEDIN_AUTOMATIC_COMMENTS_DECISIONS

## 2026-03-29 | Runtime Overlay Strategy

### Decision
- Use a runtime overlay patch (`runtime.patch.js` + `popup-custom.css`) instead of editing bundled business modules directly.
- Inject patch before popup bundle and preload it in content scripts to keep behavior consistent.

### Why
- Current project is distribution output (`popup.*.js`, `contents.*.js`) with no editable source tree.
- Request explicitly constrained scope to style/language/feature gating and required no UI layout adjustment.
- Runtime overlay minimizes risk and keeps current popup structure intact.

### Stable Defaults
- Default theme: `dark`
- Theme options: `dark / light`
- Default language: auto-detect (`zh-CN` for Chinese browser locales, otherwise `en`)
- Language options: `zh-CN / en`
- Local premium gate behavior: forced `plan=Advanced`, `isTrialEligible=true`, disabled UI controls unlocked

### Trade-off
- This is a client-side unlock and visual/i18n overlay.
- If server-side subscription or quota checks reject requests, a deeper API-level patch would still be required in a follow-up thread.

## 2026-03-29 | Unpacked Loadability Hardening

### Decision
- Keep a clean unpacked `manifest.json` by removing `key` and `update_url` fields.
- Track required runtime artifacts for this extension in repository scope (bundle js/css, static background, icons, assets), not only patch files.

### Why
- The extension can fail to load on Chrome when unpacked metadata/config is inconsistent between machines.
- Tracking only patch files is insufficient for a packaged-output project because core runtime bundles are mandatory load dependencies.

### Stable Defaults
- Load target remains unpacked extension at:
  - `D:\code\Chrome_Extensions\LinkedIn automatic comments`
- Manifest keeps only fields required for local unpacked execution.

## 2026-03-29 | Naming Unification

### Decision
- Set extension display name to exactly `LinkedIn automatic comments`.
- Keep popup title synchronized with the same name.

### Why
- Avoid mixed branding from legacy `CommenTron` naming and reduce confusion when loading/debugging in Chrome extensions page.

### Stable Defaults
- `manifest.json > name`: `LinkedIn automatic comments`
- `popup.html > title`: `LinkedIn automatic comments`

## 2026-03-29 | Storage Serialization Compatibility

### Decision
- Persist patched `account` payload in `chrome.storage` as JSON string, not raw object.
- Add runtime `storage.get` normalization hook to convert legacy object-shaped account values to JSON string on read path.

### Why
- Extension storage layer (`@rocket/storage`) calls `JSON.parse` for objects loaded with `getObject`.
- Raw object writes from runtime patch caused popup boot failure with `SyntaxError: "[object Object]" is not valid JSON`.

### Stable Defaults
- `account` storage value shape remains stringified JSON across popup/content contexts.
- Runtime self-heals historical bad values without requiring manual storage clear.
- Runtime applies two safety layers before app bootstrap:
  - normalize object-shaped values from `chrome.storage.*.get` into JSON strings
  - guard `JSON.parse` against legacy `"[object Object]"` input

## 2026-03-29 | Popup Bundle Parser Fallback

### Decision
- Patch bundled popup storage parser (`parseValue`) with compatibility fallback:
  - return raw value when storage value is already an object
  - return empty object for `"[object Object]"` legacy string
  - otherwise continue standard `JSON.parse` path

### Why
- Runtime patch + storage normalization can still miss edge cases from stale local extension state.
- The crash stack is inside bundled popup parser path, so in-bundle guard is the strongest last-mile protection.

### Stable Defaults
- Parser fallback is limited to malformed legacy payload handling and does not change normal JSON serialization flow.
- Existing storage contract still prefers stringified JSON object payloads.

## 2026-03-29 | LinkedIn Multi-Language Trigger Registration

### Decision
- Update content trigger discovery to register both English and Chinese action buttons:
  - comment: `Comment` + `评论`
  - reply: `Reply` + `回复`

### Why
- Original bundle only scanned `Comment/Reply` text, which fails on Chinese LinkedIn UI and causes “clicking comment does nothing”.
- Keeping text-based dual-language match is the smallest safe fix for packaged-output project without source rebuild.

### Stable Defaults
- Existing filtering guards remain unchanged (`comment-post` and `comment-reply-post` submit buttons are still excluded).
- Trigger behavior remains identical after registration; only candidate button discovery scope is expanded.
- Chinese keyword literals in bundled patch are written as unicode escapes (`\u8bc4\u8bba`, `\u56de\u590d`) to avoid shell/codepage corruption.
- Attribute-based fallback selectors (`aria-label`, `data-view-name`) are enabled to reduce dependency on visible text locale.

## 2026-03-29 | Popup Enum i18n Strategy

### Decision
- Translate popup enum output values at runtime via dictionary mapping in `runtime.patch.js`, instead of rewriting string literals inside the minified popup bundle.

### Why
- Enum-driven dropdown labels are produced dynamically and were not fully covered by the previous static-label dictionary.
- Bundle-level direct edits are brittle in packaged-output projects and increase regression risk.

### Stable Defaults
- Keep a dedicated option dictionary: `OPTION_EN_TO_ZH`.
- Keep reverse mapping for language switching back: `OPTION_ZH_TO_EN`.
- Route all option-like text through `translateOptionLabel` before fallback dictionary matching.
- Coverage scope includes length/tone/industry/post-age/cooldown/plan/voice values used by popup UI.

## 2026-03-29 | Tooltip Translation Robustness

### Decision
- Keep tooltip translation coverage validated against extracted popup tooltip literals.
- Add punctuation-tolerant fallback match for critical long tooltip text to reduce locale/encoding drift risk.

### Stable Defaults
- For long narrative tooltip strings, support exact-map translation plus regex fallback for punctuation variants.

## 2026-03-29 | Popup Branding Override

### Decision
- Use runtime DOM normalization in popup context to enforce product title text as `LinkedIn Automatic Comments`.
- Hide decorative bottom-right fixed logo (`/assets/logo.png`) without changing existing layout structure.

### Stable Defaults
- Branding replacement is limited to header text nodes only.
- Bottom-right logo suppression is limited to fixed-position container carrying the logo image.

## 2026-03-29 | Visual Override Robustness Upgrade

### Decision
- Replace fragile text-node-only branding logic with deterministic overlay title rendering in popup header.
- Replace style-attribute-based corner-logo selector with viewport-position-based hiding logic.

### Stable Defaults
- Brand enforcement no longer depends on bundled DOM split structure (`Commen` + `TRON` cases covered).
- Corner icon suppression no longer depends on inline style presence (works with MUI class-generated positioning).

## 2026-04-01 | Auto-Send Preference Model in Runtime Patch

### Decision
- Introduce explicit popup preferences for auto-send behavior at runtime layer:
  - one boolean switch for send automation
  - one bounded random delay range (`min/max` seconds)
- Keep the persistence contract in `chrome.storage.local` under dedicated keys.

### Why
- Existing auto-flow lacked user-visible safety control for send timing.
- A bounded random delay reduces deterministic click timing while preserving operator control.
- Runtime-layer addition keeps packaged bundle change scope minimal for this repo shape.

### Stable Defaults
- `ce_auto_send_enabled = true`
- `ce_auto_send_delay_min_sec = 2`
- `ce_auto_send_delay_max_sec = 7`
- Delay bounds are clamped to `0..30` seconds with min/max normalization.

### Trade-off
- This is a client-side preference patch; server-side policy constraints are unchanged.
- Full behavior confidence still requires real LinkedIn UI runtime validation after popup reload.