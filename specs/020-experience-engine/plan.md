# Implementation Plan: Experience Engine

**Branch**: `020-experience-engine` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-experience-engine/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a unified runtime engine (`ExperienceEngine`) that executes Clementine experiences through modular step renderers. The engine will:
- Initialize with an experience configuration (steps, navigation flags, persistence mode)
- Render steps using a component registry mapping step types to renderers
- Manage navigation (next, previous, skip, restart) with debouncing
- Support two session modes: persisted (Firestore sync) and ephemeral (in-memory)
- Emit lifecycle callbacks for integration flexibility
- Handle AI transformation flow (ai-transform → processing → reward)

The engine consolidates existing preview playback patterns (`PlaybackState`, `useMockSession`) into a single runtime usable by both Admin Preview and Guest Flow.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19
**Primary Dependencies**: Next.js 16 (App Router), Zod 4.x, Firebase SDK (Client + Admin), Zustand (optional for complex state)
**Storage**: Firebase Firestore (sessions collection), Client SDK for real-time subscriptions, Admin SDK for writes via Server Actions
**Testing**: Jest + React Testing Library, co-located test files (`*.test.ts(x)`)
**Target Platform**: Web (mobile-first 320px-768px primary, desktop 1024px+ secondary)
**Project Type**: Web application (pnpm monorepo, `web/` workspace)
**Performance Goals**: Engine init <100ms, step transitions <200ms, AI trigger <500ms, processing detection <1s
**Constraints**: Must work offline-capable for ephemeral mode, mobile touch targets ≥44x44px, no `any` escapes
**Scale/Scope**: 11 step types, ~15-20 components, ~1500-2500 LOC new code

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: All step renderers designed mobile-first (320px-768px), touch targets ≥44x44px via existing shadcn/ui components, typography inherits from existing step previews (≥14px)
- [x] **Clean Code & Simplicity**: Engine follows composition pattern (step registry + renderers), no over-engineering; builds on existing `PlaybackState` pattern
- [x] **Type-Safe Development**: TypeScript strict mode, existing discriminated unions for Step and StepInputValue, Zod validation for EngineConfig
- [x] **Minimal Testing Strategy**: Jest unit tests for engine core (init, navigation, callbacks), integration tests for AI flow; co-located tests
- [x] **Validation Loop Discipline**: Implementation tasks will include lint/type-check/test validation
- [x] **Firebase Architecture Standards**: Admin SDK for session writes (Server Actions), Client SDK for real-time session subscriptions (`onSnapshot`), schemas in `features/experience-engine/schemas/`
- [x] **Feature Module Architecture**: New feature module at `features/experience-engine/` with components/, hooks/, actions/, schemas/, types/, barrel exports
- [x] **Technical Standards**: Applicable standards reviewed - `firebase.md`, `feature-modules.md`, `components.md`, `error-handling.md`

**Complexity Violations**: None anticipated. The Experience Engine is a planned Phase 7 architectural component (see `CLAUDE.md`). The component registry pattern is standard React composition, not premature abstraction.

## Project Structure

### Documentation (this feature)

```text
specs/020-experience-engine/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/experience-engine/
├── index.ts                           # Public API barrel export
├── components/
│   ├── index.ts                       # Component barrel
│   ├── ExperienceEngine.tsx           # Main engine component
│   ├── StepRenderer.tsx               # Step type dispatcher
│   └── steps/                         # Step renderers (matches existing naming)
│       ├── index.ts                   # Step barrel
│       ├── InfoStep.tsx               # info step
│       ├── CaptureStep.tsx            # capture step
│       ├── AiTransformStep.tsx        # ai-transform step
│       ├── ShortTextStep.tsx          # short_text step
│       ├── LongTextStep.tsx           # long_text step
│       ├── MultipleChoiceStep.tsx     # multiple_choice step
│       ├── YesNoStep.tsx              # yes_no step
│       ├── OpinionScaleStep.tsx       # opinion_scale step
│       ├── EmailStep.tsx              # email step
│       ├── ProcessingStep.tsx         # processing step
│       └── RewardStep.tsx             # reward step
├── hooks/
│   ├── index.ts                       # Hook barrel
│   ├── useEngine.ts                   # Engine state & navigation
│   └── useEngineSession.ts            # Session mode adapter (uses features/sessions)
├── schemas/
│   ├── index.ts                       # Schema barrel (NOT exported in public API)
│   └── engine.schemas.ts              # EngineConfig, EngineState Zod schemas
├── types/
│   ├── index.ts                       # Type barrel
│   ├── engine.types.ts                # EngineConfig, EngineState, EngineCallbacks
│   └── renderer.types.ts              # StepRendererProps, RendererRegistry
├── lib/
│   ├── index.ts                       # Lib barrel
│   ├── step-registry.ts               # Step type → renderer mapping
│   └── variable-interpolation.ts      # {{variable}} substitution utility
└── __tests__/
    ├── useEngine.test.ts
    ├── useEngineSession.test.ts
    └── variable-interpolation.test.ts

web/src/features/sessions/              # Evolved sessions module
├── types/
│   └── sessions.types.ts              # Add TransformationStatus, EngineSession
├── schemas/
│   └── sessions.schemas.ts            # Add transformation status schema
├── actions/
│   └── sessions.actions.ts            # Add engine session CRUD, transform trigger
├── hooks/
│   └── useTransformationStatus.ts     # Real-time transformation subscription
└── repositories/
    └── sessions.repository.ts         # Extend for engine session operations
```

**Structure Decision**: Feature module architecture per Constitution Principle VII. The Experience Engine owns the runtime logic while the Sessions module owns session domain types and persistence. Step components use `*Step.tsx` naming for consistency with existing `features/steps/components/preview/steps/`. Server Actions for session operations live in `features/sessions/` (domain owner).

## Complexity Tracking

No complexity violations identified. The Experience Engine design:

1. **Reuses existing patterns**: Builds on `PlaybackState`, `useMockSession`, and existing step preview components
2. **Standard composition**: Step registry is standard React component mapping, not a new abstraction
3. **Feature module scoped**: All new code lives in `features/experience-engine/` per Principle VII
4. **No new dependencies**: Uses existing Firebase SDK, Zod, and React patterns

## Post-Design Constitution Re-Check ✅

_Verified after Phase 1 design artifacts complete (2025-12-05)_

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Mobile-First | ✅ Pass | Renderers reuse existing mobile-first step components; no new breakpoints added |
| II. Clean Code | ✅ Pass | ~15-20 components, single responsibility; reuses existing code where possible |
| III. Type-Safe | ✅ Pass | `EngineConfig`, `EngineState`, `TransformationStatus` schemas defined in data-model.md |
| IV. Minimal Testing | ✅ Pass | Tests scoped to engine core (hooks), not UI components |
| V. Validation Loop | ✅ Pass | Tasks will include validation step |
| VI. Firebase Standards | ✅ Pass | Admin SDK for writes, Client SDK for subscriptions per contracts |
| VII. Feature Module | ✅ Pass | Full module structure defined in Project Structure section |

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | `specs/020-experience-engine/research.md` | ✅ Complete |
| Data Model | `specs/020-experience-engine/data-model.md` | ✅ Complete |
| Server Actions Contract | `specs/020-experience-engine/contracts/server-actions.md` | ✅ Complete |
| Hooks Contract | `specs/020-experience-engine/contracts/hooks.md` | ✅ Complete |
| Components Contract | `specs/020-experience-engine/contracts/components.md` | ✅ Complete |
| Quickstart | `specs/020-experience-engine/quickstart.md` | ✅ Complete |
