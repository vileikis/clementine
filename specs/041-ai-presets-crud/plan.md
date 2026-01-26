# Implementation Plan: AI Presets Foundation and List Page

**Branch**: `041-ai-presets-crud` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/041-ai-presets-crud/spec.md`

## Summary

Implement the foundation and list page for AI Presets - reusable configurations for AI image generation within a workspace. This includes the Zod schema in `packages/shared`, Firestore security rules, React Query hooks for CRUD operations, and a list page UI following the established ProjectEventsList pattern.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, TanStack Query 5.66, Zod 4.1, Firebase SDK 12.5
**Storage**: Firestore (subcollection: `/workspaces/{workspaceId}/aiPresets/{presetId}`)
**Testing**: Vitest (unit tests for schema validation)
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Monorepo (pnpm workspace)
**Performance Goals**: Page load < 2 seconds, CRUD operations < 2 seconds
**Constraints**: Mobile-first, 44x44px touch targets, real-time updates via onSnapshot
**Scale/Scope**: Workspace-scoped, ~10-100 presets per workspace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | List page follows ProjectEventsList mobile-first pattern |
| II. Clean Code & Simplicity | ✅ PASS | Following established CRUD patterns, no over-engineering |
| III. Type-Safe Development | ✅ PASS | Zod schemas for all data, strict TypeScript |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for schema validation only |
| V. Validation Gates | ✅ PASS | Will run pnpm app:check before commits |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase SDK, real-time onSnapshot |
| VII. Backend & Firebase | ✅ PASS | Security rules for member read, admin write |
| VIII. Project Structure | ✅ PASS | Vertical slice in `domains/ai-presets/` |

## Project Structure

### Documentation (this feature)

```text
specs/041-ai-presets-crud/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - client-first, no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/
    ├── media/                        # Shared media schemas (already exists)
    │   ├── media-reference.schema.ts # Base schema extended by preset-media
    │   └── ...
    └── ai-preset/
        ├── ai-preset.schema.ts       # Main entity schema
        ├── preset-variable.schema.ts # Variable discriminated union
        ├── preset-media.schema.ts    # Extends mediaReferenceSchema with name
        └── index.ts                  # Barrel export

apps/clementine-app/
├── src/
│   ├── app/routes/
│   │   └── workspace/
│   │       └── $workspaceSlug.ai-presets/
│   │           ├── index.tsx         # List page route
│   │           └── $presetId.tsx     # Editor page route (placeholder)
│   │
│   └── domains/
│       ├── ai-presets/               # New domain
│       │   ├── components/
│       │   │   ├── AIPresetsList.tsx
│       │   │   ├── AIPresetItem.tsx
│       │   │   ├── CreateAIPresetButton.tsx
│       │   │   ├── RenameAIPresetDialog.tsx
│       │   │   └── DeleteAIPresetDialog.tsx
│       │   ├── containers/
│       │   │   └── AIPresetsPage.tsx
│       │   ├── hooks/
│       │   │   ├── useWorkspaceAIPresets.ts
│       │   │   ├── useCreateAIPreset.ts
│       │   │   ├── useDeleteAIPreset.ts
│       │   │   ├── useRenameAIPreset.ts
│       │   │   └── useDuplicateAIPreset.ts
│       │   ├── schemas/
│       │   │   └── ai-preset.input.schemas.ts
│       │   └── index.ts              # Barrel export
│       │
│       └── navigation/
│           └── components/workspace/
│               └── workspaceNavItems.ts  # Add AI Presets nav item
│
└── firebase/
    └── firestore.rules                # Add aiPresets rules
```

**Structure Decision**: Follows established vertical slice architecture with domain at `domains/ai-presets/`. Schema goes in shared package for potential backend reuse. Routes follow TanStack Router file-based pattern.

## Complexity Tracking

> No violations - implementation follows established patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Schema location | `packages/shared` | Matches experience.schema.ts pattern for cross-package reuse |
| Hooks pattern | Real-time onSnapshot + TanStack Query | Matches useProjectEvents pattern |
| UI pattern | ProjectEventsList/Item | Reference implementation per spec |
