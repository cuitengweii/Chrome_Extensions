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
