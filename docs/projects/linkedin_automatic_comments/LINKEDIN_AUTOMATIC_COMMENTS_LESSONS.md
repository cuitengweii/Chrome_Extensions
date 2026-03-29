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
