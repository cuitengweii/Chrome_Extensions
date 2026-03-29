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
