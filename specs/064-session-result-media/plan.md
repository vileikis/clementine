# Implementation Plan: Session Result Media Schema Alignment

**Branch**: `064-session-result-media` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/064-session-result-media/spec.md`

## Summary

Replace the custom `sessionResultMediaSchema` (`{stepId, assetId, url, createdAt}`) with the standard `mediaReferenceSchema` (`{mediaAssetId, url, filePath, displayName}`) from `media-reference.schema.ts`. Update the single writer (Cloud Function `transformPipelineJob` via `updateSessionResultMedia`) and all consumers (SharePage, runtime store, runtime types) to use the new format. Maintain backward compatibility for existing Firestore documents through Zod's `looseObject()` and `.catch()` defaults.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: Zod 4.1.12 (validation), Firebase SDK 12.5.0 (client), Firebase Admin SDK (functions), React 19, Zustand 5.x, TanStack Start 1.132.0
**Storage**: Firebase Firestore (NoSQL), Firebase Storage (media files)
**Testing**: Vitest
**Target Platform**: Web (mobile-first), Firebase Cloud Functions (Node.js)
**Project Type**: pnpm workspace monorepo (apps/clementine-app, functions/, packages/shared)
**Performance Goals**: Standard web app expectations (< 2s page load on 4G)
**Constraints**: Zero downtime migration — existing sessions must remain readable
**Scale/Scope**: 3 workspaces affected (shared, functions, clementine-app), ~10 files to modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No UI changes — schema/data layer only |
| II. Clean Code & Simplicity | PASS | Reducing schema count from 2 to 1 simplifies the codebase |
| III. Type-Safe Development | PASS | Leverages existing Zod schemas; strict TypeScript throughout |
| IV. Minimal Testing Strategy | PASS | Unit tests for schema changes and backward compat |
| V. Validation Gates | PASS | Will run format, lint, type-check before commit |
| VI. Frontend Architecture | PASS | Client-first pattern unchanged; only field names change in consumers |
| VII. Backend & Firebase | PASS | Firestore write path simplified; public URLs stored as before |
| VIII. Project Structure | PASS | Changes follow existing domain structure and barrel exports |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/064-session-result-media/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (not applicable — no API changes)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── media/
│   └── media-reference.schema.ts      # Existing — no changes needed
└── session/
    └── session.schema.ts              # MODIFY: Replace sessionResultMediaSchema with mediaReferenceSchema

functions/src/
├── repositories/
│   └── session.ts                     # MODIFY: Update type from SessionResultMedia to MediaReference
└── tasks/
    └── transformPipelineJob.ts         # MODIFY: Write MediaReference format instead of legacy format

apps/clementine-app/src/
├── domains/session/shared/
│   └── schemas/index.ts               # MODIFY: Update re-exports (remove sessionResultMediaSchema/SessionResultMedia)
├── domains/experience/shared/types/
│   └── runtime.types.ts               # MODIFY: Replace SessionResultMedia with MediaReference
├── domains/experience/runtime/stores/
│   └── experienceRuntimeStore.ts      # MODIFY: Replace SessionResultMedia with MediaReference
├── domains/experience/runtime/hooks/
│   └── useRuntime.ts                  # NO CHANGE: Uses RuntimeState, auto-resolved
└── domains/guest/containers/
    └── SharePage.tsx                  # NO CHANGE: Already accesses only .url (field unchanged)
```

**Structure Decision**: Existing monorepo structure used as-is. Changes span 3 workspaces but touch only the data layer — no new files or directories needed.

## Complexity Tracking

> No constitution violations. No complexity tracking needed.
