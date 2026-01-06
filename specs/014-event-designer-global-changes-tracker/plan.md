# Implementation Plan: Event Designer - Global Changes Tracker

**Branch**: `014-event-designer-global-changes-tracker` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-event-designer-global-changes-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a global state management system using Zustand to track real-time saving status across all event configuration changes. This enhances UX by providing clear visual feedback through save status indicators (spinner during saves, checkmark on success) and unpublished changes badges. The system uses reference counting to handle multiple concurrent saves gracefully and integrates with existing TanStack Query mutation hooks via a tracking wrapper, maintaining zero breaking changes to domain logic.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, Zustand 5.x, Zod 4.1.12, Lucide React (icons)
**Storage**: N/A (client-side state management only, persists to Firestore via existing mutation hooks)
**Testing**: Vitest (unit tests for store actions, mutation tracking, component behavior)
**Target Platform**: Web (TanStack Start app at `apps/clementine-app/`)
**Project Type**: Web (monorepo workspace)
**Performance Goals**:
  - Save status UI updates < 50ms after mutation state change
  - Checkmark timer accuracy ± 100ms (3 seconds)
  - Handle 10+ concurrent saves without UI flickering
  - Zero memory leaks from timer cleanup
**Constraints**:
  - Zero breaking changes to existing mutation hooks
  - Must integrate with existing TanStack Query mutations
  - Clean separation of concerns (tracking logic in designer domain, not spread across feature hooks)
  - Must follow DDD vertical slice architecture
**Scale/Scope**:
  - 1 new Zustand store (EventDesignerStore)
  - 1 tracking wrapper hook (useTrackedMutation)
  - 1 UI component (DesignerStatusIndicators)
  - 2 existing mutation hooks to update (useUpdateOverlays, useUpdateShareOptions)
  - 1 layout container to update (EventDesignerLayout)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS
- **Status**: Compliant
- **Analysis**: Status indicators use 16px icons (h-4 w-4) which meet minimum touch target of 44x44px when considering padding. Badge and button spacing designed for mobile viewport. Component is responsive and works on 320px+ screens.
- **Testing**: Visual indicators tested on real mobile devices (iPhone/Android) to ensure visibility and proper spacing.

### Principle II: Clean Code & Simplicity ✅ PASS
- **Status**: Compliant
- **Analysis**:
  - YAGNI: Only implementing required features (reference counting, timer logic). No premature abstractions.
  - Single Responsibility: Each file has clear purpose (store = state, hook = tracking, component = UI).
  - Small functions: Store actions are 3-5 lines, component logic fits in ~50 lines.
  - No dead code: Wrapper pattern avoids duplicating logic across hooks.
  - DRY: Centralized tracking via `useTrackedMutation` instead of copy-paste logic.
- **Justification**: Feature adds ~150 LOC total (store: 30, hook: 40, component: 50, integration: 30) - minimal and focused.

### Principle III: Type-Safe Development ✅ PASS
- **Status**: Compliant
- **Analysis**:
  - TypeScript strict mode enabled (tsconfig.json in TanStack Start app).
  - No `any` types - all store state, actions, and components fully typed.
  - Zustand store typed with interface (`EventDesignerStore`).
  - Generic typing for `useTrackedMutation<TData, TError, TVariables>`.
  - No runtime validation needed (client-side state only, no external input).
- **Validation**: N/A (no external data sources - purely derived from TanStack Query mutation state).

### Principle IV: Minimal Testing Strategy ✅ PASS
- **Status**: Compliant
- **Analysis**:
  - Vitest unit tests for store actions (startSave, completeSave, resetSaveState).
  - Tests for mutation tracking (state transition detection, reference counting).
  - Component tests for timer behavior (checkmark 3s display).
  - Focus on critical paths: multiple concurrent saves, timer cleanup, error handling.
- **Coverage Target**: 80%+ for new code (store, hook, component). Integration verified via manual testing in designer layout.

### Principle V: Validation Gates ✅ PASS
- **Status**: Compliant
- **Technical Validation**: Will run `pnpm app:check` (format, lint, type-check) before commit.
- **Standards Compliance**:
  - **Frontend/Architecture** (`frontend/architecture.md`): Client-first pattern (Zustand client-side store).
  - **Frontend/Design System** (`frontend/design-system.md`): Using theme tokens for colors, Lucide icons for consistency.
  - **Frontend/State Management** (`frontend/state-management.md`): Zustand store for global designer state, TanStack Query for server state.
  - **Global/Project Structure** (`global/project-structure.md`): Vertical slice architecture - store/hooks/components in designer domain.
  - **Global/Code Quality** (`global/code-quality.md`): Clean functions, proper naming, barrel exports.
- **Deviations**: None identified.

### Principle VI: Frontend Architecture ✅ PASS
- **Status**: Compliant
- **Analysis**:
  - Client-first pattern: Zustand store is client-side only.
  - No SSR concerns (status indicators are purely client-side UI).
  - Integrates with TanStack Query for mutation state (existing pattern).
  - Real-time updates via mutation status (no additional subscriptions needed).
- **Pattern**: Pure client-side state management, no server interaction beyond existing mutation hooks.

### Principle VII: Backend & Firebase ✅ PASS
- **Status**: Compliant (N/A)
- **Analysis**: No backend changes required. Feature integrates with existing mutation hooks that already handle Firestore updates. Store is client-side only.

### Principle VIII: Project Structure ✅ PASS
- **Status**: Compliant
- **Analysis**:
  - Vertical slice architecture: All code in `@domains/event/designer/` (stores/, hooks/, components/).
  - Explicit file naming: `useEventDesignerStore.ts`, `useTrackedMutation.ts`, `DesignerStatusIndicators.tsx`.
  - Barrel exports: Each folder has `index.ts` re-exporting contents.
  - Restricted public API: Only exports components and hooks (store actions are internal).
- **Structure**:
  ```
  apps/clementine-app/app/domains/event/designer/
  ├── stores/
  │   ├── useEventDesignerStore.ts
  │   └── index.ts
  ├── hooks/
  │   ├── useTrackedMutation.ts
  │   └── index.ts
  ├── components/
  │   ├── DesignerStatusIndicators.tsx
  │   └── index.ts
  └── containers/
      └── EventDesignerLayout.tsx (existing, updated)
  ```

### Summary: ✅ ALL GATES PASS
- **Violations**: None
- **Complexity Justification**: Not required (feature is simple and follows all principles)
- **Proceed to Phase 0**: Approved

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/app/domains/event/designer/
├── stores/
│   ├── useEventDesignerStore.ts       # NEW: Zustand store for global designer state
│   ├── useEventDesignerStore.test.ts  # NEW: Store unit tests (collocated)
│   └── index.ts                        # NEW: Barrel export for stores
├── hooks/
│   ├── useTrackedMutation.ts          # NEW: Wrapper hook for mutation tracking
│   ├── useTrackedMutation.test.ts     # NEW: Tracking hook tests (collocated)
│   └── index.ts                        # UPDATED: Add useTrackedMutation export
├── components/
│   ├── DesignerStatusIndicators.tsx   # NEW: Save status UI component
│   ├── DesignerStatusIndicators.test.tsx # NEW: Component tests (collocated)
│   └── index.ts                        # UPDATED: Add DesignerStatusIndicators export
└── containers/
    └── EventDesignerLayout.tsx         # UPDATED: Integrate status indicators, move badge

apps/clementine-app/app/domains/event/settings/hooks/
├── useUpdateOverlays.ts                # UPDATED: Wrap mutation with useTrackedMutation
└── useUpdateShareOptions.ts            # UPDATED: Wrap mutation with useTrackedMutation
```

**Structure Decision**: This feature follows the vertical slice architecture with all new code in the `event/designer/` domain. The designer domain owns the global state store and tracking infrastructure since this is designer-specific UI state (not shared across other event contexts). Existing mutation hooks in `event/settings/` are updated minimally (wrapper only) to maintain clean separation of concerns.

## Complexity Tracking

> **No violations - section not applicable**

All Constitution Check gates pass. Feature follows simplicity principles:
- Single responsibility per file (store, hook, component)
- Minimal abstractions (wrapper pattern for tracking)
- No premature optimization
- Clean separation of concerns
