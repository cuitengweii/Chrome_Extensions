# LINKEDIN_AUTOMATIC_COMMENTS_DECISIONS

## 2026-03-29 | Runtime Overlay Strategy

### Decision
- Use a runtime overlay patch (`runtime.patch.js` + `popup-custom.css`) instead of editing bundled business modules directly where possible.
- Inject the patch before legacy popup/content behavior so compatibility logic can normalize storage and UI boundaries consistently.

### Why
- The project is maintained as packaged distribution output, not source-level modules.
- Small-scope runtime intervention is safer than broad bundle rewrites when the original source tree is unavailable.

## 2026-03-29 | Storage Serialization Compatibility

### Decision
- Keep legacy storage payloads compatible with the bundled extension runtime.
- Prefer serialized compatibility shims in `runtime.patch.js` instead of silently changing key meaning or payload shape.

### Why
- The bundled popup/content logic still expects legacy storage contracts.
- Raw object/string drift caused popup startup crashes and repeated persistence bugs earlier in the project.

## 2026-04-19 | GasGx Popup Runtime Compatibility Boundary

### Decision
- Treat GasGx as the canonical popup account/auth system for this extension.
- Keep legacy popup bootstrap compatibility inside `runtime.patch.js` rather than depending on the original remote RocketPod account flow.
- Keep Spark runtime entrypoints as the canonical AI generation surface.

### Why
- This preserves extension usability while migrating account ownership away from the old popup flow.
- It is the lowest-risk path available in a packaged-output repository.

## 2026-04-20 | Popup Runtime Shell Ownership

### Decision
- Stop treating the bundled popup DOM as the editable popup surface.
- Popup is now owned by:
  - `D:\code\Chrome_Extensions\LinkedIn automatic comments\popup.html`
  - `D:\code\Chrome_Extensions\LinkedIn automatic comments\runtime.patch.js`
  - `D:\code\Chrome_Extensions\LinkedIn automatic comments\popup-runtime.js`
- Keep `runtime.patch.js` as the popup data/runtime compatibility layer, not as a DOM-diff layer over bundled popup UI.
- Keep bundled popup assets in the repo as rollback artifacts, but not as the active popup ownership surface.

### Why
- Old popup fixes had become too expensive because ownership was split across:
  - bundled popup layout logic
  - runtime DOM injection
  - storage compatibility bridges
  - text/anchor discovery patches
- A controlled runtime popup shell is easier to debug and maintain.

### Stable Defaults
- Popup boot chain is:
  - `popup.html`
  - `runtime.patch.js`
  - `popup-runtime.js`
- Popup settings are controlled from in-memory state plus explicit persistence APIs.
- Popup should not depend on reading old bundled popup DOM state back out.

## 2026-04-20 | GasGx-UI-v6.1 Visual System Adoption

### Decision
- Use GasGx-UI-v6.1 as the visual system for popup and runtime-injected LinkedIn controls.
- Keep a shared token-driven style model instead of isolated green-theme fragments.

### Stable Defaults
- Primary aurora-green buttons must use dark high-contrast text.
- Header controls stay ghosted by default.
- Inputs and textareas use recessed dark surfaces in dark mode.
- Cards, toggles, segmented tabs, and pills share the same border/radius/accent rules.

### Why
- Runtime-owned UI surfaces need one consistent token system to avoid style drift and reduce future UI fix cost.

## 2026-04-20 | Legacy Content Bundle Recovery Strategy

### Decision
- For comment creation and auto-send issues, prefer recovering the legacy content bundle path over expanding full runtime takeover.
- Patch only the exact legacy content behaviors that are clearly broken:
  - hard truncation
  - submit-button early return
  - paragraph-aware write/send behavior

### Why
- The historical working path for comment creation lived inside the old packaged content bundle.
- Directly replacing the whole flow in runtime patch created too many moving parts and made regressions harder to isolate.

### Trade-off
- The project now intentionally keeps mixed ownership:
  - runtime-owned popup shell
  - runtime compatibility/data layer
  - patched legacy content bundle
- Future work must be explicit about which runtime surface owns the behavior being fixed.

## 2026-04-20 | Prompt-First Preference Enforcement

### Decision
- Treat LinkedIn AI preferences as prompt constraints first, not as post-generation truncation rules.
- Keep post-processing as a guardrail, but move the main burden to:
  - stronger prompt structure
  - output validation
  - one repair retry

### Why
- Hard local trimming produced visibly broken output such as half words and cut-off sentences.
- The user requirement is for AI to generate directly toward the requested shape, especially for:
  - paragraph count
  - 120-200 characters per paragraph
  - English-only output
  - mention / emoji / ending preferences

### Stable Defaults
- Comment generation now uses:
  - hard prompt constraints
  - output validation
  - one repair retry on failure
  - final preference enforcement as last guardrail
- Reply generation follows the same pattern with reply-specific rules.
