# Implementation Plan: Transform Cleanup & Guardrails

**Branch**: `063-transform-cleanup` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/063-transform-cleanup/spec.md`

## Summary

Remove deprecated transform nodes code paths and add fail-fast guardrails for the outcome-based architecture. Research confirms the outcome-based system is already fully implemented - this cleanup removes dead code, prevents silent fallbacks to deprecated fields, and adds validation guardrails at job creation and execution time.

**Key Insight**: The "Generate" tab and Transform Nodes UI have **already been removed**. This work focuses on:
1. Removing residual dead code and references
2. Adding validation guardrails to prevent processing invalid data
3. Removing silent fallbacks to deprecated fields
4. Adding development-only deprecation warnings
5. Updating documentation

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode, ES2022 target)
**Primary Dependencies**:
- Frontend: TanStack Start 1.132, React 19, Zustand 5, Zod 4.1
- Backend: Firebase Cloud Functions v2, Firebase Admin SDK, Zod 4.1
**Storage**: Firebase Firestore (NoSQL), Firebase Storage
**Testing**: Vitest (frontend), Jest patterns
**Target Platform**: Web (mobile-first), Node.js 22 (Cloud Functions)
**Project Type**: Monorepo (pnpm workspace) with frontend app + cloud functions
**Performance Goals**: Job creation validation < 100ms, clear error messages
**Constraints**: Non-retryable errors only, no silent fallbacks
**Scale/Scope**: ~15 files to modify, no new files needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design
✅ **Pass** - No UI changes; this is backend/cleanup work

### Principle II: Clean Code & Simplicity
✅ **Pass** - This work removes complexity (dead code) and adds straightforward validation

### Principle III: Type-Safe Development
✅ **Pass** - All validation uses Zod schemas; strict TypeScript maintained

### Principle IV: Minimal Testing Strategy
✅ **Pass** - Focus on critical paths (job creation/execution validation)

### Principle V: Validation Gates
✅ **Pass** - Must run `pnpm app:check` and `pnpm functions:build` before commit

### Principle VI: Frontend Architecture
✅ **Pass** - Client-first architecture maintained; no new server code in frontend

### Principle VII: Backend & Firebase
✅ **Pass** - Cloud Functions use Admin SDK appropriately; security rules unchanged

### Principle VIII: Project Structure
✅ **Pass** - Follows existing domain structure; removes dead code only

### Standards Compliance
- **Global**: `code-quality.md`, `security.md` - All validation uses non-retryable errors
- **Backend**: `firestore.md`, `firebase-functions.md` - Follows existing CF patterns

**No constitution violations. No complexity tracking needed.**

## Project Structure

### Documentation (this feature)

```text
specs/063-transform-cleanup/
├── plan.md              # This file
├── research.md          # Completed - codebase analysis
├── data-model.md        # Phase 1 - entity changes
├── quickstart.md        # Phase 1 - dev onboarding
├── contracts/           # Phase 1 - API validation contracts
└── tasks.md             # Phase 2 - implementation tasks
```

### Source Code (repository root)

```text
# Frontend (TanStack Start app)
apps/clementine-app/
├── src/domains/experience/
│   ├── runtime/
│   │   ├── stores/experienceRuntimeStore.ts    # Remove fallback to answers
│   │   └── hooks/useRuntime.ts                 # Already clean
│   ├── designer/
│   │   └── hooks/usePublishExperience.ts       # Remove transformNodes handling
│   ├── shared/
│   │   ├── utils/hasTransformConfig.ts         # Add deprecation warnings
│   │   └── hooks/useCreateExperience.ts        # Remove transformNodes init
│   └── transform/                              # Evaluate for removal
└── src/domains/session/
    └── shared/hooks/useUpdateSessionProgress.ts # Clean up deprecated params

# Cloud Functions
functions/
├── src/callable/
│   └── startTransformPipeline.ts               # Add validation guardrails
├── src/services/transform/
│   ├── engine/runOutcome.ts                    # Validation already present
│   └── outcomes/imageOutcome.ts                # Add empty prompt check
└── src/repositories/
    └── job.ts                                  # Validation helpers

# Shared Package (START HERE)
packages/shared/
└── src/schemas/
    ├── session/session.schema.ts               # Remove answers, capturedMedia fields + related schemas
    ├── experience/experience.schema.ts         # Remove transformNodes field + import
    ├── experience/transform.schema.ts          # Evaluate for removal
    └── experience/nodes/                       # Evaluate for removal

# Documentation
apps/clementine-app/src/app/
└── workspace/$workspaceSlug.experiences/$experienceId.tsx  # Fix comment
functions/
└── README.md                                   # Review for accuracy
```

**Structure Decision**: Existing monorepo structure maintained. This is cleanup work affecting existing files across frontend, backend, and shared packages. No new modules or directories needed.

## Complexity Tracking

> No constitution violations requiring justification.

N/A - All changes follow existing patterns and reduce complexity.
