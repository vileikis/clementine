# Implementation Plan: Experience System Structural Foundations

**Branch**: `020-exp-structural-foundations` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-exp-structural-foundations/spec.md`

## Summary

Establish domain scaffolding and naming conventions for the Experience System. This phase creates the foundational directory structures for `domains/experience/` and `domains/session/`, defines core type definitions (`ExperienceProfile`, `ExperienceSlot`), extends the project schema with `activeEventId`, and renames existing components (`WelcomeControls` → `WelcomeConfigPanel`, `ThemeControls` → `ThemeConfigPanel`) for consistency. This is a technical-only phase with no user-facing changes.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, Zod 4.1.12, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Page load < 2s on 4G, TypeScript compilation with zero errors
**Constraints**: No circular dependencies between domain modules, import boundaries enforced
**Scale/Scope**: Scaffolding only - placeholder files with type exports, no runtime functionality

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No UI changes in this phase |
| II. Clean Code & Simplicity | PASS | Scaffolding follows YAGNI - placeholder files only |
| III. Type-Safe Development | PASS | TypeScript strict mode, Zod schemas for all types |
| IV. Minimal Testing Strategy | PASS | No tests needed for placeholder files |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commit |
| VI. Frontend Architecture | PASS | Follows client-first pattern, DDD structure |
| VII. Backend & Firebase | N/A | No Firebase operations in this phase |
| VIII. Project Structure | PASS | Vertical slice architecture, barrel exports |

**Pre-Phase 0 Gate Result**: PASS - All applicable principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/020-exp-structural-foundations/
├── plan.md              # This file
├── research.md          # Phase 0 output - Profile type alignment research
├── data-model.md        # Phase 1 output - Type definitions
├── quickstart.md        # Phase 1 output - Implementation guide
├── contracts/           # Phase 1 output - Type contracts (N/A - no APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/
├── experience/                      # Core experience domain (EXTEND)
│   ├── index.ts                     # Barrel export (EXISTS)
│   ├── shared/                      # Shared types, schemas, hooks (EXISTS)
│   │   ├── index.ts                 # (EXISTS)
│   │   ├── schemas/                 # (EXISTS)
│   │   │   ├── index.ts             # (EXISTS)
│   │   │   ├── experience.schema.ts # (EXISTS - UPDATE profiles)
│   │   │   └── step-registry.schema.ts # (EXISTS)
│   │   └── types/                   # (EXISTS)
│   │       ├── index.ts             # (EXISTS)
│   │       ├── experience.types.ts  # (EXISTS)
│   │       ├── profile.types.ts     # (EXISTS - UPDATE)
│   │       ├── step.types.ts        # (EXISTS)
│   │       └── runtime.types.ts     # (EXISTS)
│   ├── steps/                       # Step registry (CREATE)
│   │   └── index.ts                 # Placeholder export
│   ├── validation/                  # Profile validation (CREATE)
│   │   └── index.ts                 # Slot compatibility placeholder
│   ├── runtime/                     # Runtime engine (CREATE)
│   │   └── index.ts                 # Placeholder export
│   └── editor/                      # Editor UI (CREATE)
│       └── index.ts                 # Placeholder export
│
├── session/                         # Session domain (EXTEND)
│   ├── index.ts                     # Barrel export (EXISTS)
│   └── shared/                      # (EXISTS)
│       ├── index.ts                 # (EXISTS)
│       ├── schemas/                 # (EXISTS)
│       │   ├── index.ts             # (EXISTS)
│       │   └── session.schema.ts    # (EXISTS)
│       └── types/                   # (EXISTS)
│           ├── index.ts             # (EXISTS)
│           ├── session.types.ts     # (EXISTS)
│           └── session-api.types.ts # (EXISTS)
│
└── event/
    ├── welcome/
    │   └── components/
    │       └── WelcomeConfigPanel.tsx   # RENAME from WelcomeControls.tsx
    └── theme/
        └── components/
            └── ThemeConfigPanel.tsx     # RENAME from ThemeControls.tsx

packages/shared/src/entities/project/
└── project.schema.ts                    # (EXISTS - activeEventId already present)
```

**Structure Decision**: Extend existing DDD structure. The experience and session domains already have `shared/` subdirectories with schemas and types. Need to add `steps/`, `validation/`, `runtime/`, and `editor/` subdirectories to experience domain with placeholder exports. Component renames are pure refactoring within existing event domain structure.

## Complexity Tracking

> No violations identified. All changes follow existing patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | - | - |

## Key Findings from Codebase Exploration

### Existing State

1. **Experience Domain**: Already has `shared/` with schemas and types. ExperienceProfile enum exists but uses different values (`freeform`, `main_default`, `pregate_default`, `preshare_default`) than spec (`freeform`, `survey`, `informational`).

2. **Session Domain**: Already has `shared/` with schemas, types, and API type definitions (`CreateSessionFn`, `SubscribeSessionFn`).

3. **Project Schema**: `activeEventId` field already exists in `packages/shared/src/entities/project/project.schema.ts` - no schema change needed.

4. **Components to Rename**:
   - `WelcomeControls.tsx` at `domains/event/welcome/components/`
   - `ThemeControls.tsx` at `domains/event/theme/components/`

### Research Needed

1. **Profile Type Alignment**: Need to reconcile existing ExperienceProfile values with spec requirements. The existing profiles (`freeform`, `main_default`, `pregate_default`, `preshare_default`) don't match the spec (`freeform`, `survey`, `informational`).

2. **ExperienceSlot Type**: Not currently defined - needs to be added per spec.

3. **Slot-Profile Compatibility**: Placeholder needed for mapping which profiles are allowed in which slots.
