# Implementation Plan: Experience Data Layer & Library

**Branch**: `021-experience-data-library` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-experience-data-library/spec.md`

## Summary

Enable workspace admins to create and manage AI photo experiences through a dedicated Experience Library UI. This involves updating existing experience schemas to use workspace-scoped paths, implementing CRUD hooks with TanStack Query, building the library list page with profile filtering, creating the experience creation form, and adding editor shell routes for future E2 step editing.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Zustand 5.0.9, Zod 4.1.12, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK) - workspace subcollection pattern `/workspaces/{workspaceId}/experiences/{experienceId}`
**Testing**: Vitest 3.0.5 + Testing Library React 16.2.0
**Target Platform**: Web (mobile-first), TanStack Start SPA with SSR for SEO
**Project Type**: Web monorepo (apps/clementine-app)
**Performance Goals**: Page load < 3s, CRUD feedback < 500ms, filter updates < 1s (per SC-001 to SC-005)
**Constraints**: Mobile-first (320px-768px primary), 44x44px touch targets, client-first architecture
**Scale/Scope**: Support 100+ experiences per workspace without pagination degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Mobile-First Design** | ✅ PASS | All UI components designed for 320px-768px primary viewport, 44x44px touch targets for interactive elements |
| **II. Clean Code & Simplicity** | ✅ PASS | Following existing domain patterns (workspace/projects), minimal abstractions, single responsibility per hook/component |
| **III. Type-Safe Development** | ✅ PASS | TypeScript strict mode, Zod schemas for all Firestore documents, runtime validation at boundaries |
| **IV. Minimal Testing Strategy** | ✅ PASS | Unit tests for hooks (critical CRUD paths), component tests for key interactions, following existing test patterns |
| **V. Validation Gates** | ✅ PASS | Will run `pnpm app:check` before commits, review against design-system.md and component-libraries.md |
| **VI. Frontend Architecture** | ✅ PASS | Client-first pattern with Firebase client SDK, TanStack Query for data fetching, Firestore security rules for authorization |
| **VII. Backend & Firebase** | ✅ PASS | Client SDK for reads/real-time, security rules enforce admin-only writes, full URLs for media |
| **VIII. Project Structure** | ✅ PASS | Vertical slice in `domains/experience/`, explicit file naming, barrel exports |

**Gate Result**: PASS - No violations requiring justification

### Post-Design Re-evaluation (2026-01-12)

After Phase 1 design artifacts (data-model.md, contracts/, quickstart.md), all principles remain compliant:

- **Data model** follows existing Firestore subcollection patterns (VII compliant)
- **API contracts** use client-first hooks with TanStack Query (VI compliant)
- **Implementation phases** maintain single responsibility and minimal abstractions (II compliant)
- **Zod schemas** provide runtime validation for all external data (III compliant)
- **No new complexity** introduced requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/021-experience-data-library/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── experience-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── experience.schema.ts      # UPDATE: new profiles, media field
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── experience.types.ts
│   │   │   ├── profile.types.ts          # UPDATE: new profile definitions
│   │   │   └── index.ts
│   │   ├── queries/
│   │   │   ├── experience.query.ts       # NEW: queryOptions factories
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useWorkspaceExperiences.ts # NEW: list with real-time
│   │   │   ├── useWorkspaceExperience.ts  # NEW: single doc
│   │   │   ├── useCreateExperience.ts     # NEW: mutation
│   │   │   ├── useUpdateExperience.ts     # NEW: mutation
│   │   │   ├── useDeleteExperience.ts     # NEW: mutation
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── library/
│   │   ├── containers/
│   │   │   ├── ExperiencesPage.tsx        # NEW: list page
│   │   │   ├── CreateExperiencePage.tsx   # NEW: create form
│   │   │   ├── ExperienceEditorPage.tsx   # NEW: shell only
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── ExperienceListItem.tsx     # NEW: card/row item
│   │   │   ├── ExperienceListEmpty.tsx    # NEW: empty states
│   │   │   ├── CreateExperienceForm.tsx   # NEW: name + profile
│   │   │   ├── ProfileBadge.tsx           # NEW: colored badge
│   │   │   ├── ProfileSelector.tsx        # NEW: radio/select
│   │   │   ├── RenameExperienceDialog.tsx # NEW: rename dialog
│   │   │   ├── DeleteExperienceDialog.tsx # NEW: confirm dialog
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── app/workspace/
│   └── $workspaceSlug.experiences/
│       ├── index.tsx                      # NEW: list route
│       ├── create.tsx                     # NEW: create route
│       └── $experienceId.tsx              # NEW: editor route

firebase/
└── firestore.rules                        # UPDATE: experience rules
```

**Structure Decision**: Following existing workspace/projects pattern with vertical slice architecture. Experience domain already has `shared/` scaffolding from Phase 0 - we extend it with hooks, queries, and add new `library/` subdomain for UI components.

## Complexity Tracking

> No violations - complexity tracking not required.
