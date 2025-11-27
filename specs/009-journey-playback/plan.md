# Implementation Plan: Journey Playback Mode

**Branch**: `009-journey-playback` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-journey-playback/spec.md`

## Summary

Implement a step-by-step playback mode for the Journey Editor that allows creators to preview their entire journey as guests will experience it. The feature builds on the existing PreviewRuntime (008-preview-runtime) by adding a JourneyPlaybackController for navigation, a MockSession for persistent state across steps, and a PreviewNavigationBar for creator controls.

Key technical approach:
- Extend existing PreviewRuntime with playback mode support
- Create JourneyPlaybackController hook to manage step indexing and navigation
- Implement MockSession state management for cross-step data persistence
- Add PreviewNavigationBar component with Back/Next/Restart/Exit controls
- Support auto-advance for Capture and Processing steps

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: N/A (ephemeral in-memory state only - no Firestore writes)
**Testing**: Jest for unit tests, co-located with source files
**Target Platform**: Web browser (mobile-first 320px-768px, desktop support)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Step transitions < 100ms, auto-advance delay 1-2 seconds
**Constraints**: No backend calls during playback, all state ephemeral
**Scale/Scope**: 11 step types, single journey playback, creator-only feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px for nav buttons, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: Extends existing PreviewRuntime, single-purpose components, no over-engineering
- [x] **Type-Safe Development**: TypeScript strict mode, typed MockSession interface, discriminated union for steps
- [x] **Minimal Testing Strategy**: Jest unit tests for JourneyPlaybackController and MockSession hooks
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test validation before completion
- [x] **Firebase Architecture Standards**: Read-only from Firestore (Client SDK), no writes, ephemeral state only
- [x] **Technical Standards**: Follows feature-modules.md vertical slice architecture, existing step renderers reused

**Complexity Violations**: None - feature extends existing patterns without introducing new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/009-journey-playback/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/features/steps/
├── components/
│   └── preview/
│       ├── PreviewRuntime.tsx       # Existing - extend with playback mode
│       ├── PlaybackMode.tsx         # NEW: Wrapper for playback experience
│       ├── PreviewNavigationBar.tsx # NEW: Back/Next/Restart/Exit controls
│       ├── DeviceFrame.tsx          # Existing - no changes
│       ├── ViewSwitcher.tsx         # Existing - no changes
│       └── steps/                   # Existing 11 step renderers - minor enhancements
│           ├── CaptureStep.tsx      # Enhance: support interactive mock capture
│           ├── ProcessingStep.tsx   # Enhance: emit completion event
│           └── [other steps].tsx    # Enhance: interactive inputs
├── hooks/
│   ├── useJourneyPlayback.ts        # NEW: Playback controller hook
│   └── useMockSession.ts            # NEW: Mock session state management
├── types/
│   ├── preview.types.ts             # Existing - extend MockSessionData
│   └── playback.types.ts            # NEW: Playback-specific types
└── index.ts                         # Update exports

web/src/features/journeys/
├── components/
│   └── editor/
│       ├── JourneyEditor.tsx        # Existing - render PlaybackMode overlay
│       └── JourneyEditorHeader.tsx  # Existing - add "Play Journey" button
```

**Structure Decision**: Extends existing `features/steps/` module with playback-specific components and hooks. Follows vertical slice architecture - all playback code lives within the steps feature since step rendering is the core concern. Integration point in `features/journeys/` for the "Play Journey" button.

## Complexity Tracking

> No violations - feature extends existing patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
