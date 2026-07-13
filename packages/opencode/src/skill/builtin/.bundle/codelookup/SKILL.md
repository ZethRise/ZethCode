---
name: CodeLookup
description: Search callers, dependents, and linked systems before changing code.
---

Before editing code, check impact.

1. Run `node bin/generate-graph.js` when `.codelookup/graph.json` is absent or stale.
2. Run `node bin/pre-check.js`, `npx codelookup-check`, or local project equivalent.
3. Inspect changed code callers, return contracts, schemas, and linked systems.
4. Apply required cascade updates in same change.
5. Run integration tests covering changed code and dependents.

If checker unavailable, use `rg` to trace imports, callers, and dependent tests. Report Mermaid blast radius before editing.
