# Implementation Plan: Session & Runtime Foundation

**Branch**: `030-session-runtime-capture` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-session-runtime-capture/spec.md`

## Summary

Enable experience execution through a runtime engine with session-based state management. The feature delivers:

1. **Session hooks** for creating, subscribing, and updating session documents
2. **Runtime engine** hook (`useExperienceRuntime`) managing step sequencing, navigation, and session sync
3. **Run mode support** for all step renderers (info, input types, placeholder capture/transform)
4. **Admin preview modal** in the experience editor to test draft configurations

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode enabled, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, Zod 4.1.12, Zustand 5.0.9, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK) - `/projects/{projectId}/sessions/{sessionId}`
**Testing**: Vitest
**Target Platform**: Web (mobile-first, responsive)
**Project Type**: Web application (monorepo with TanStack Start app)
**Performance Goals**: Session writes persist within 1 second, preview loads in under 2 seconds
**Constraints**: Mobile-first (320px-768px primary viewport), touch targets 44x44px minimum
**Scale/Scope**: Preview mode only in this epic (guest mode in E7)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Step renderers for 320px-768px, PreviewShell with mobile viewport |
| II. Clean Code & Simplicity | ✅ PASS | Using established domain patterns, no over-engineering |
| III. Type-Safe Development | ✅ PASS | Session schema with Zod, runtime types defined |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on runtime logic tests |
| V. Validation Gates | ✅ WILL COMPLY | Run checks before commits |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase SDK |
| VII. Backend & Firebase | ✅ PASS | Security rules defined, client SDK |
| VIII. Project Structure | ✅ PASS | Following vertical slice architecture |

### Post-Design Check (Phase 1) ✅ CONFIRMED

After completing Phase 1 design artifacts, re-validating all principles:

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Mobile-First Design | ✅ PASS | StepLayout uses responsive design, PreviewShell provides mobile viewport |
| II. Clean Code & Simplicity | ✅ PASS | Session hooks follow existing patterns (see research.md), runtime hook is single-purpose |
| III. Type-Safe Development | ✅ PASS | All contracts defined with Zod schemas (see contracts/), strict typing throughout |
| IV. Minimal Testing Strategy | ✅ PASS | Testing focused on runtime sequencing rules (see quickstart.md verification checklist) |
| V. Validation Gates | ✅ PASS | Standards review complete, no violations identified |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern confirmed in contracts (useSubscribeSession uses onSnapshot) |
| VII. Backend & Firebase | ✅ PASS | Session path documented (data-model.md), security rules specified (contracts/) |
| VIII. Project Structure | ✅ PASS | Source code structure follows DDD (plan.md), barrel exports planned |

**Post-Design Standards Review**:
- `frontend/design-system.md`: Step renderers use existing theme tokens via ThemeProvider
- `frontend/component-libraries.md`: Using shadcn/ui for UI components, StepLayout for consistency
- `backend/firestore.md`: Following runTransaction pattern, serverTimestamp for timestamps
- `global/project-structure.md`: Session domain hooks follow vertical slice, barrel exports defined

## Project Structure

### Documentation (this feature)

```text
specs/030-session-runtime-capture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (session operations)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/app/
├── domains/
│   ├── session/
│   │   └── shared/
│   │       ├── schemas/
│   │       │   └── session.schema.ts         # EXISTS - session document schema
│   │       ├── types/
│   │       │   ├── session.types.ts          # EXISTS - type re-exports
│   │       │   └── session-api.types.ts      # EXISTS - API function types
│   │       ├── hooks/
│   │       │   ├── index.ts                  # TO CREATE - barrel export
│   │       │   ├── useCreateSession.ts       # TO CREATE
│   │       │   ├── useSubscribeSession.ts    # TO CREATE
│   │       │   └── useUpdateSessionProgress.ts # TO CREATE
│   │       └── queries/
│   │           ├── session.query.ts          # TO CREATE - query keys
│   │           └── index.ts                  # TO CREATE
│   │   └── index.ts                          # EXISTS
│   │
│   └── experience/
│       ├── shared/
│       │   └── types/
│       │       └── runtime.types.ts          # EXISTS - RuntimeEngine interface
│       ├── runtime/                          # EXISTS - runtime folder
│       │   ├── hooks/
│       │   │   ├── useExperienceRuntime.ts   # EXISTS - TO REFACTOR (use Zustand)
│       │   │   └── index.ts                  # EXISTS
│       │   ├── stores/
│       │   │   ├── useSessionRuntimeStore.ts # TO CREATE - Zustand store (AD-001)
│       │   │   └── index.ts                  # TO CREATE
│       │   └── index.ts                      # EXISTS
│       ├── steps/
│       │   └── registry/
│       │       ├── step-registry.ts          # EXISTS
│       │       ├── step-validation.ts        # TO CREATE - input validation (AD-003)
│       │       └── index.ts                  # MODIFY - add validation export
│       ├── designer/
│       │   ├── components/
│       │   │   └── PreviewModal.tsx          # TO CREATE - preview UI
│       │   └── containers/
│       │       └── ExperienceDesignerPage.tsx # MODIFY - add preview button
│       └── steps/
│           └── renderers/
│               ├── InfoStepRenderer.tsx      # MODIFY - add run mode
│               ├── InputScaleRenderer.tsx    # MODIFY - add run mode
│               ├── InputYesNoRenderer.tsx    # MODIFY - add run mode
│               ├── InputMultiSelectRenderer.tsx # MODIFY - add run mode
│               ├── InputShortTextRenderer.tsx # MODIFY - add run mode
│               ├── InputLongTextRenderer.tsx # MODIFY - add run mode
│               ├── CapturePhotoRenderer.tsx  # MODIFY - add placeholder run mode
│               └── TransformPipelineRenderer.tsx # MODIFY - add placeholder run mode
│
└── shared/
    └── preview-shell/                        # EXISTS - reusable preview components
        ├── components/
        │   └── PreviewShell.tsx
        └── hooks/
            └── useFullscreen.ts
```

**Structure Decision**: Following existing domain-driven architecture. Session hooks in `/domains/session/shared/hooks/`, runtime engine in new `/domains/experience/runtime/` folder to keep runtime logic separate from designer logic.

## Architectural Decisions

### AD-001: Zustand Store for Runtime State

**Decision**: Use Zustand store for runtime navigation state, separate from Firestore session persistence.

**Rationale**:
- **Firestore session** = persistent progress (for recovery/analytics)
- **Zustand store** = runtime navigation (for immediate UI updates)
- Navigation (back/forward) updates Zustand immediately without Firestore writes
- Firestore sync only on "meaningful" events: answer submitted, step completed, session complete
- Reduces unnecessary Firestore writes during step review

**Files**:
- `src/domains/experience/runtime/stores/useSessionRuntimeStore.ts` (TO CREATE)

### AD-002: Session Schema Alignment with Epic

**Decision**: Update session schema to match E5 epic specification with structured arrays.

**Changes**:
- Replace `inputs: Record<string, unknown>` → `answers: Answer[]` (with stepType, answeredAt)
- Replace `outputs: Record<string, MediaReference>` → `capturedMedia: CapturedMedia[]`
- Add explicit `result: SessionResult | null` for final output
- Add `workspaceId` for cross-project analytics
- Rename `activeJobId` → `jobId`

**Rationale**: Structured arrays enable better analytics (queries by stepType, timing analysis).

### AD-003: Step Input Validation in Registry

**Decision**: Move input validation logic to step registry, co-located with step definitions.

**Rationale**:
- Validation rules are defined by step config (min/max, required, maxLength)
- Each step type owns its validation
- Extensible via registry pattern (matches existing `step-registry.ts`)
- Cleaner separation from runtime hook

**Files**:
- `src/domains/experience/steps/registry/step-validation.ts` (TO CREATE)

### AD-004: Remove Query Invalidation from Session Hooks

**Decision**: Remove `queryClient.invalidateQueries()` from session mutation hooks.

**Rationale**:
- `useSubscribeSession` uses `onSnapshot` for real-time updates
- Subscription auto-syncs state changes
- Query invalidation is unnecessary overhead

### AD-005: Use convertFirestoreData Utility

**Decision**: Use existing `convertFirestoreData()` utility for Firestore type conversion.

**Rationale**:
- Consistent handling of Timestamps, DocumentReferences, GeoPoints
- Already exists at `@/shared/utils/firestore-utils`
- Replaces manual timestamp conversion in `useSubscribeSession`

## Complexity Tracking

No constitution violations identified. Design follows established patterns.
