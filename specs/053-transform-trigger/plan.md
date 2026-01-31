# Implementation Plan: Transform Pipeline Trigger on Experience Completion

**Branch**: `053-transform-trigger` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/053-transform-trigger/spec.md`

## Summary

Trigger the transform pipeline callable function when a guest completes a main experience with configured transform (nodes.length > 0). Update SharePage to show real-time job status from session subscription. Update ExperiencePreviewModal to show transform job progress after completion. Pregate/preshare experiences never trigger transform.

**Key Decision**: Use Firebase `httpsCallable` instead of raw fetch. This requires converting the backend function from `onRequest` to `onCall`.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Query 5.66.5, Firebase SDK 12.5.0, Zustand 5.x, React 19.2.0
**Storage**: Firebase Firestore (session.jobStatus, session.jobId fields)
**Testing**: Vitest (unit tests)
**Target Platform**: Web (mobile-first), Firebase Functions (europe-west1)
**Project Type**: Monorepo (apps/clementine-app + functions/)
**Performance Goals**: Real-time job status updates within 2 seconds of change
**Constraints**: Fire-and-forget HTTP call (don't block navigation), maintain existing UX flows
**Scale/Scope**: Guest-facing pages (SharePage, ExperiencePage), Preview modal, 1 HTTP endpoint integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | SharePage and PreviewModal already mobile-first, no layout changes needed |
| II. Clean Code & Simplicity | ✅ PASS | Adding single hook for HTTP trigger, reusing existing patterns |
| III. Type-Safe Development | ✅ PASS | Using existing Zod schemas (JobStatus), typed hooks |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical path: transform trigger logic |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` before completion |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firestore real-time subscriptions |
| VII. Backend & Firebase | ✅ PASS | Using existing HTTP endpoint, client SDK for reads |
| VIII. Project Structure | ✅ PASS | Following vertical slice in session/guest domains |

**Standards to Review Before Implementation:**
- `frontend/architecture.md` - Client-first patterns
- `backend/firebase-functions.md` - HTTP endpoint integration
- `global/code-quality.md` - Validation workflows

## Project Structure

### Documentation (this feature)

```text
specs/053-transform-trigger/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── start-transform-pipeline.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── integrations/
│   └── firebase/
│       └── client.ts                              # MODIFY: Add functions export
├── domains/
│   ├── experience/
│   │   ├── transform/
│   │   │   ├── hooks/
│   │   │   │   ├── useStartTransformPipeline.ts  # NEW: Callable trigger hook
│   │   │   │   └── index.ts                       # NEW: Export hook
│   │   │   └── index.ts                           # NEW: Domain barrel export
│   │   ├── preview/
│   │   │   ├── components/
│   │   │   │   ├── JobStatusDisplay.tsx          # NEW: Job status display for preview
│   │   │   │   └── index.ts                       # MODIFY: Add export
│   │   │   └── containers/
│   │   │       └── ExperiencePreviewModal.tsx     # MODIFY: Job status display
│   │   └── shared/
│   │       └── utils/
│   │           └── hasTransformConfig.ts          # NEW: Helper function
│   └── guest/
│       └── containers/
│           ├── ExperiencePage.tsx                 # MODIFY: Add transform trigger
│           └── SharePage.tsx                      # MODIFY: Session subscription + job status

functions/src/
├── callable/
│   └── startTransformPipeline.ts                  # NEW: onCall version
├── http/
│   └── startTransformPipeline.ts                  # DEPRECATE: Keep for reference, remove later
└── index.ts                                       # MODIFY: Export callable version
```

**Structure Decision**:
- `useStartTransformPipeline` in `experience/transform/` - groups all transform-related code
- `JobStatusDisplay` in `experience/preview/components/` - preview-specific component
- Use Firebase `httpsCallable` pattern - no separate service file needed
- Remove `stepId` from request - transform is now a standalone field

## Complexity Tracking

> No violations - implementation follows existing patterns with minimal new code.

---

## Phase 0: Research

### Research Tasks Completed

1. **HTTP Endpoint Integration Pattern** - How to call startTransformPipeline from frontend
2. **Session Job Status Flow** - How jobStatus field updates via Firestore
3. **Existing Completion Patterns** - How ExperienceRuntime handles onComplete callback
4. **Transform Config Detection** - Where to check if experience has transform

### Findings

See [research.md](./research.md) for detailed findings.

---

## Phase 1: Design

### Key Design Decisions

1. **Where to trigger transform**: In `handleExperienceComplete` callback in ExperiencePage.tsx (after `markExperienceComplete`, before navigation)

2. **Transform detection**: Check `experience.published?.transform?.nodes?.length > 0` to determine if transform should be triggered

3. **Firebase Callable Function**: Use `httpsCallable` instead of raw fetch for cleaner integration:
   - Convert backend from `onRequest` to `onCall`
   - Add `functions` export to `client.ts`
   - Hook uses `httpsCallable(functions, 'startTransformPipeline')`

4. **Fire-and-forget pattern**: Callable invocation does not block navigation. Job status is tracked via session subscription on SharePage.

5. **Shared JobStatusDisplay component**: Reusable component for displaying friendly job status text with spinner/completion states.

### Data Model

See [data-model.md](./data-model.md) for entity relationships.

### Contracts

See [contracts/start-transform-pipeline.yaml](./contracts/start-transform-pipeline.yaml) for API contract.

### Quickstart

See [quickstart.md](./quickstart.md) for implementation walkthrough.
