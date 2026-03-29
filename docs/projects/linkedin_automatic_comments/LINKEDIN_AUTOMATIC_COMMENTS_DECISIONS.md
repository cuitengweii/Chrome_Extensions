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
