# Implementation Plan: Unified Preview Runtime

**Branch**: `008-preview-runtime` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-preview-runtime/spec.md`

## Summary

Enhance the Journey Editor's preview panel to support both mobile (375px) and desktop (900px) viewport modes with a toggle switcher. This builds on the existing preview system by adding viewport abstraction, mock session data injection, and enhanced step rendering—preparing the foundation for the future guest runtime (PRD #3).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, @dnd-kit/core, react-hook-form, zod
**Storage**: Firebase Firestore (read-only for preview)
**Testing**: Jest with React Testing Library
**Target Platform**: Web (responsive: mobile 320px-768px primary, desktop 1024px+)
**Project Type**: Web application (Next.js monorepo - `web/` workspace)
**Performance Goals**: Viewport toggle < 500ms, real-time preview updates < 1s
**Constraints**: Preview is read-only (no Firestore writes), uses mock data for camera/transforms
**Scale/Scope**: 11 step types, single event at a time, ~10-50 steps per journey

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Preview defaults to mobile view (375px), mobile is primary experience
- [x] **Clean Code & Simplicity**: Enhances existing preview system, no new architectural patterns
- [x] **Type-Safe Development**: TypeScript strict mode, Zod schemas for step/theme validation already exist
- [x] **Minimal Testing Strategy**: Will add unit tests for new components (ViewSwitcher, mock data utilities)
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test validation before completion
- [x] **Firebase Architecture Standards**: Preview is read-only using Client SDK, no new write operations
- [x] **Feature Module Architecture**: Enhances existing `features/steps/` module, follows vertical slice pattern

**Complexity Violations**: None - this feature enhances existing architecture without introducing new patterns.

## Project Structure

### Documentation (this feature)

```text
specs/008-preview-runtime/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── features/
│   └── steps/
│       ├── components/
│       │   └── preview/
│       │       ├── DeviceFrame.tsx           # RENAME + ENHANCE: viewport mode support
│       │       ├── ViewSwitcher.tsx         # NEW: mobile/desktop toggle
│       │       ├── PreviewRuntime.tsx       # NEW: runtime wrapper with mock data
│       │       └── steps/                   # EXISTING: 11 step preview components
│       ├── utils/
│       │   └── mock-session.ts              # NEW: mock session data generator
│       └── types/
│           └── preview.types.ts             # NEW: preview-specific types
├── features/
│   └── journeys/
│       └── components/
│           └── editor/
│               └── StepPreview.tsx          # ENHANCE: integrate PreviewRuntime
└── components/
    └── step-primitives/                     # EXISTING: shared UI primitives
```

**Structure Decision**: Enhances existing `features/steps/` module with preview runtime components. New files follow existing naming conventions and barrel export patterns.

## Complexity Tracking

> No violations - feature uses existing architectural patterns.

---

## Phase 0: Research

### Research Tasks

Based on Technical Context analysis, research required for:

1. **Viewport Mode Implementation**: Best practices for responsive preview containers in React
2. **Mock Data Patterns**: How to generate realistic mock session data for preview
3. **Animation Handling**: Processing step loading animation + Capture step placeholder

See [`research.md`](./research.md) for findings.

---

## Phase 1: Design

### Architecture Decisions

#### A1: Viewport Mode State Management

**Decision**: Local state in `JourneyEditor` component, passed down to preview components.

**Rationale**:
- Viewport mode is UI-only state, doesn't need persistence
- Simple useState hook is sufficient
- Follows existing pattern of state management in JourneyEditor

**Alternatives Rejected**:
- Context provider: Overkill for single component tree
- URL query params: Unnecessary persistence for preview mode

#### A2: Preview Runtime Wrapper

**Decision**: Create `PreviewRuntime` component that wraps step previews with mock session context.

**Rationale**:
- Centralizes mock data injection
- Provides clean abstraction for future guest runtime reuse
- Separates preview concerns from editor concerns

#### A3: DeviceFrame (rename from SimulatorScreen)

**Decision**: Rename `SimulatorScreen` to `DeviceFrame` and extend with `viewportMode` prop.

**Rationale**:
- `DeviceFrame` is clearer naming - it's the device-shaped bezel/frame
- Maintains backward compatibility with simple rename
- Minimal code changes to existing component
- Clear separation: mobile (375px) vs desktop (900px)

### Data Model

See [`data-model.md`](./data-model.md) for entity definitions.

### Contracts

No new API contracts required - this feature is UI-only with read-only Firestore access.

### Quickstart

See [`quickstart.md`](./quickstart.md) for implementation guide.
