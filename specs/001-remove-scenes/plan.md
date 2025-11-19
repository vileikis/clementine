# Implementation Plan: Remove Scenes Dependency

**Branch**: `001-remove-scenes` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-remove-scenes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fully eliminate the legacy Scenes architecture from the Events domain by removing the `/events/{eventId}/scenes` subcollection, all scene-related code, types, and Firestore paths. The Experience collection already contains all necessary AI configuration fields (aiEnabled, aiModel, aiPrompt, aiReferenceImagePaths, aiAspectRatio), making scenes obsolete. This refactoring simplifies the codebase by removing ~24 files referencing scenes, updating Firestore rules to deny scene access, and ensuring Event Builder and guest flows operate solely on experiences.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19
**Primary Dependencies**: Firebase (Firestore + Storage), Zod 4.x for validation, Tailwind CSS v4, shadcn/ui
**Storage**: Firebase Firestore (NoSQL document database), Firebase Storage (image/media assets)
**Testing**: Jest for unit tests, React Testing Library for component tests, co-located test files
**Target Platform**: Web (Next.js), mobile-first responsive design (320px-768px primary viewport)
**Project Type**: Web monorepo (pnpm workspace) with two packages: `web/` (Next.js app), `functions/` (Cloud Functions placeholder)
**Performance Goals**: No new performance requirements - maintaining existing page load < 2s on 4G, AI transformation < 60s
**Constraints**: Must maintain backward compatibility with existing events (ignore legacy `currentSceneId` field if present), no data migration required
**Scale/Scope**: Removing ~24 files containing scene references, updating Firestore rules, ensuring zero TypeScript errors post-removal

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: No new UI components - existing mobile-first Event Builder and guest flows remain unchanged
- [x] **Clean Code & Simplicity**: This is a **simplification** feature - removing legacy code, reducing complexity, no new abstractions added
- [x] **Type-Safe Development**: Removing scene types maintains strict mode, no `any` escapes, existing Zod schemas remain
- [x] **Minimal Testing Strategy**: Existing tests will be updated/removed, no new test coverage required beyond ensuring build passes
- [x] **Validation Loop Discipline**: Plan includes final validation tasks (lint, type-check, test, build verification)
- [x] **Firebase Architecture Standards**: Removing scene subcollection simplifies Firebase architecture, no new patterns introduced
- [x] **Technical Standards**: Adheres to `standards/global/coding-style.md` (removing dead code), `standards/backend/firebase.md` (updating security rules)

**Complexity Violations**: NONE - This feature actively reduces complexity by removing legacy architecture.

## Project Structure

### Documentation (this feature)

```text
specs/001-remove-scenes/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (will be generated)
├── data-model.md        # Phase 1 output (will be generated)
├── quickstart.md        # Phase 1 output (will be generated)
├── contracts/           # Phase 1 output (N/A for this feature - no new API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/
├── features/
│   ├── events/
│   │   ├── actions/
│   │   │   ├── scenes.ts                    # TO REMOVE - Scene server actions
│   │   │   ├── events.ts                    # TO UPDATE - Remove currentSceneId references
│   │   │   └── events.test.ts               # TO UPDATE - Remove scene-related tests
│   │   ├── repositories/
│   │   │   ├── scenes.ts                    # TO REMOVE - Scene repository
│   │   │   ├── scenes.test.ts               # TO REMOVE - Scene repository tests
│   │   │   ├── events.ts                    # TO UPDATE - Remove scene imports
│   │   │   └── events.test.ts               # TO UPDATE - Remove scene test cases
│   │   ├── lib/
│   │   │   ├── schemas.ts                   # TO UPDATE - Remove sceneSchema, currentSceneId from eventSchema
│   │   │   └── validation.ts                # TO UPDATE - Remove scene validation logic
│   │   ├── types/
│   │   │   └── event.types.ts               # TO UPDATE - Remove Scene type, currentSceneId from Event type
│   │   └── index.ts                         # TO UPDATE - Remove scene exports
│   ├── experiences/
│   │   └── components/photo/
│   │       ├── PromptEditor.tsx             # TO REVIEW - May have scene references (comments/docs)
│   │       └── RefImageUploader.tsx         # TO REVIEW - May have scene references (comments/docs)
│   ├── guest/
│   │   └── components/
│   │       └── GuestFlowContainer.tsx       # TO UPDATE - Remove scene-based navigation logic
│   └── sessions/
│       └── lib/
│           ├── repository.ts                # TO REVIEW - May have scene references
│           ├── repository.test.ts           # TO REVIEW - May have scene test cases
│           ├── actions.ts                   # TO REVIEW - May have scene references
│           └── validation.ts                # TO REVIEW - May have scene validation
├── app/(studio)/events/[eventId]/
│   └── scene/
│       └── page.tsx                         # TO REMOVE - Scene page route
├── lib/
│   ├── storage/
│   │   └── upload.ts                        # TO REVIEW - May have scene-specific upload logic
│   ├── types/
│   │   └── firestore.ts                     # TO UPDATE - Remove scene type references
│   └── ai/providers/
│       └── google-ai.ts                     # TO REVIEW - May reference scenes (likely just comments)

firestore.rules                              # TO UPDATE - Add deny rules for /events/{eventId}/scenes paths
```

**Structure Decision**: This is a Web application monorepo (pnpm workspace). The `web/` workspace contains the Next.js app with feature-based organization. Scene removal primarily affects:
- **`web/src/features/events/`** - Core scene logic (repositories, actions, schemas, types)
- **`web/src/features/guest/`** - Guest flow navigation
- **`web/src/app/(studio)/events/[eventId]/scene/`** - Admin scene page (entire directory removed)
- **`firestore.rules`** - Security rules at repo root

## Complexity Tracking

**No violations** - This feature actively reduces complexity.

---

## Post-Design Constitution Check Re-Evaluation

After completing Phase 0 (Research) and Phase 1 (Design), re-verify compliance:

- [x] **Mobile-First Responsive Design**: ✓ CONFIRMED - No UI changes, mobile-first design preserved
- [x] **Clean Code & Simplicity**: ✓ CONFIRMED - Removes ~24 files, simplifies architecture, reduces technical debt
- [x] **Type-Safe Development**: ✓ CONFIRMED - TypeScript strict mode maintained, Zod schemas simplified (removing sceneSchema)
- [x] **Minimal Testing Strategy**: ✓ CONFIRMED - Tests will be removed/updated with existing code, no new test requirements
- [x] **Validation Loop Discipline**: ✓ CONFIRMED - quickstart.md Phase 9 includes complete validation loop (lint, type-check, test, build)
- [x] **Firebase Architecture Standards**: ✓ CONFIRMED - Firestore rules updated with explicit deny pattern, Admin SDK usage unchanged
- [x] **Technical Standards**: ✓ CONFIRMED - Follows coding-style.md (remove dead code), firebase.md (security rules), conventions.md (git workflow)

**Design Assessment**: The research and design phases have confirmed this is a straightforward code removal feature with no architectural changes, no new dependencies, and no complexity additions. The removal strategy (top-down: UI → Actions → Data → Types → Rules) minimizes intermediate broken states and follows TypeScript compiler guidance.

**Gate Status**: ✅ PASSED - Proceed to Phase 2 (Tasks generation via `/speckit.tasks`)
