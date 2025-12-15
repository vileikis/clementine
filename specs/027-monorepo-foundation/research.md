# Research: Monorepo Foundation

**Feature**: 027-monorepo-foundation
**Date**: 2025-12-15

## Research Tasks

### 1. pnpm Workspace Configuration for Firebase Functions

**Question**: How should the workspace be configured to support both Next.js web app and Firebase Functions with shared packages?

**Decision**: Extend existing `pnpm-workspace.yaml` to include `packages/*` directory for shared packages.

**Rationale**:
- Current workspace already includes `web`, `functions`, and `scripts`
- Adding `packages/*` enables shared package pattern without disrupting existing structure
- pnpm workspace protocol (`workspace:*`) handles local package resolution automatically

**Alternatives Considered**:
1. **Turborepo** - Rejected: adds unnecessary complexity for current scope, pnpm workspaces sufficient
2. **Nx** - Rejected: overkill for 2-workspace monorepo, steeper learning curve
3. **Yarn workspaces** - Rejected: already using pnpm, migration unnecessary

### 2. Firebase Functions v2 SDK Best Practices

**Question**: What is the recommended setup for Firebase Functions v2 with TypeScript in a monorepo?

**Decision**: Use Firebase Functions v2 SDK with TypeScript, following Firebase's official monorepo guidance.

**Rationale**:
- v2 SDK provides better concurrency defaults, longer timeouts, and easier configuration
- TypeScript compiled to CommonJS (required by Cloud Functions runtime)
- Functions build independently from shared package, using workspace dependency

**Key Findings**:
- Firebase Functions require `main` entry in `package.json` pointing to compiled JS
- `predeploy` hook in `firebase.json` handles build orchestration
- Node.js 18+ is required for Functions v2 (already an assumption in spec)

### 3. Shared Package Pattern with Zod Schemas

**Question**: How should the shared package be structured for consumption by both web (Next.js) and functions (Node.js)?

**Decision**: Create `packages/shared` with Zod schemas as source of truth, deriving TypeScript types via `z.infer<>`. Compile to both ESM and CommonJS.

**Rationale**:
- Zod provides single source of truth for both validation and types
- Types are always in sync with validation rules (no drift possible)
- Runtime validation available in both environments
- Zod works in both Node.js (functions) and browser (web)
- Next.js 16 uses ESM by default; Firebase Functions runtime uses CommonJS
- Dual format ensures compatibility without requiring different import paths

**Structure**:
```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── session.schemas.ts   # Zod schemas + derived types
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Alternatives Considered**:
1. **Plain TypeScript interfaces only** - Rejected: no runtime validation, requires separate schema definitions
2. **TypeScript path mapping only** - Rejected: doesn't work with Firebase deploy (needs compiled JS)
3. **Copy types to each workspace** - Rejected: violates DRY, leads to type drift
4. **Single format (CommonJS only)** - Rejected: Next.js works better with ESM

### 4. Firebase Configuration for Functions in Monorepo

**Question**: How should `firebase.json` be configured to build and deploy functions from a workspace?

**Decision**: Add `functions` configuration to existing `firebase.json` with proper `source`, `predeploy`, and `ignore` settings.

**Rationale**:
- Firebase CLI expects functions configuration in `firebase.json`
- `predeploy` hook enables automated build before deploy
- Ignore patterns prevent unnecessary files from being uploaded

**Configuration**:
```json
{
  "functions": {
    "source": "functions",
    "codebase": "default",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"],
    "ignore": ["node_modules", ".git", "src/**/*.test.ts"]
  }
}
```

### 5. Deploy Script Architecture

**Question**: What is the best approach for orchestrating multi-workspace builds before deployment?

**Decision**: Create a bash deploy script in `functions/scripts/deploy.sh` that builds shared package first, then deploys functions.

**Rationale**:
- Simple bash script is portable and requires no additional dependencies
- Uses `set -e` for fail-fast behavior on any error
- pnpm filter commands enable targeted workspace builds
- Located in functions/ since it's specific to functions deployment

**Script Flow**:
1. Build `@clementine/shared` package
2. Firebase deploy (which triggers functions predeploy build)

**Alternatives Considered**:
1. **Firebase-only predeploy** - Rejected: cannot express cross-workspace dependencies
2. **npm scripts chaining** - Rejected: less readable, harder to add logging/status messages
3. **Turborepo pipelines** - Rejected: overkill for 2 packages
4. **Root /scripts/ folder** - Rejected: deploy is functions-specific, keep it co-located

### 6. Local Development with Emulators

**Question**: How should local development be configured for testing functions?

**Decision**: Use Firebase emulators with functions emulator added to existing emulator config.

**Rationale**:
- Emulators already configured for Firestore and Storage
- Adding functions emulator enables local testing without deployment
- `npm run serve` in functions workspace handles build + emulator start

**Configuration Addition**:
```json
"functions": {
  "port": 5001
}
```

## Technical Decisions Summary

| Decision | Choice | Key Reason |
|----------|--------|------------|
| Workspace tool | pnpm workspaces | Already in use, sufficient for scope |
| Schema library | Zod | Single source of truth for validation + types |
| Shared package format | Dual (ESM + CJS) | Next.js (ESM) + Functions (CJS) compatibility |
| Functions SDK | Firebase v2 | Better defaults, official recommendation |
| Build orchestration | Bash script in functions/ | Simple, co-located with functions |
| Local testing | Firebase emulators | Existing infrastructure, no additional tools |

## Dependencies Identified

### Production Dependencies (shared)
- `zod`: ^4.0.0 (match web version)

### Development Dependencies (shared)
- `typescript`: ^5.0.0

### Production Dependencies (functions)
- `firebase-admin`: ^12.0.0
- `firebase-functions`: ^5.0.0
- `@clementine/shared`: workspace:*

### Development Dependencies (functions)
- `typescript`: ^5.0.0

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TypeScript version mismatch | Build failures | Pin same version across all workspaces |
| Zod version mismatch | Runtime errors | Use same Zod version as web (^4.0.0) |
| Firebase deploy fails silently | Broken production | Script uses `set -e`, verifies build outputs |
| Shared package not rebuilt | Stale types | Deploy script always rebuilds shared first |
