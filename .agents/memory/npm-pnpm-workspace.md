---
name: npm vs pnpm workspace
description: Pitfalls when migrating from pnpm to npm workspaces in this monorepo
---

## Rule
Use pnpm for all package installs in this repo. npm install times out on the large workspace tree.

**Why:** `npm install` consistently hangs/times out (>120s) when resolving all workspace packages at once. pnpm 10.x is installed via Nix and works reliably.

**How to apply:**
- Run `pnpm --filter @workspace/<name> install --no-frozen-lockfile` to add/refresh deps for a single workspace.
- Never replace `workspace:*` with `*` in package.json for internal workspace deps — pnpm requires the `workspace:` prefix to resolve local packages; bare `*` tries npm registry and fails with 404.
- `catalog:` entries in package.json are pnpm-workspace.yaml catalog references — npm rejects them with EUNSUPPORTEDPROTOCOL. Always replace with explicit version strings when migrating a package away from catalog.
- The `pnpm-workspace.yaml` `catalog:` section acts as a version pinning dictionary for pnpm — npm ignores this file entirely.
