# Implementation Plan: Company Context Architecture

**Branch**: `012-company-context` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-company-context/spec.md`

## Summary

Transform Clementine from a flat admin structure into a company-centric multi-tenant architecture where all work happens "inside a selected company". This involves:
1. Adding URL-friendly slugs to companies (e.g., `/acme-corp` instead of `/abc123`)
2. Creating a reusable navigation system (breadcrumbs + context-specific tabs)
3. Implementing flat route groups to prevent layout stacking across contexts

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Zod 4.x
**Storage**: Firebase Firestore (existing `/companies` collection)
**Testing**: Jest for unit tests (co-located with source files)
**Target Platform**: Web (mobile-first 320px-768px, tablet 768px+, desktop 1024px+)
**Project Type**: pnpm monorepo with `web/` workspace
**Performance Goals**: Page load < 2 seconds on 4G, navigation context switches < 500ms
**Constraints**: Mobile-first responsive design, TypeScript strict mode, no `any` escapes
**Scale/Scope**: Multi-tenant architecture supporting multiple companies with isolated contexts

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px). Navigation tabs will be horizontally scrollable on mobile.
- [x] **Clean Code & Simplicity**: No premature optimization. Reusing existing EditorBreadcrumbs pattern, extending existing Company feature module.
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for slug input, typed route parameters.
- [x] **Minimal Testing Strategy**: Jest unit tests for slug generation utility and slug uniqueness validation.
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion.
- [x] **Firebase Architecture Standards**: Admin SDK for slug lookup/writes via Server Actions, existing repository pattern extended.
- [x] **Feature Module Architecture**: Extending existing `features/companies/` module with new slug field, new navigation components in `components/shared/`.
- [x] **Technical Standards**: Following existing routing patterns, component patterns (EditorBreadcrumbs, EventTabs).

**Complexity Violations**: None - using existing patterns and extending established modules.

## Project Structure

### Documentation (this feature)

```text
specs/012-company-context/
├── plan.md              # This file
├── research.md          # Phase 0: Codebase research findings
├── data-model.md        # Phase 1: Company schema extension
├── quickstart.md        # Phase 1: Development quickstart
├── contracts/           # Phase 1: No external API contracts (internal routing)
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
web/src/
├── features/companies/
│   ├── constants.ts            # MODIFY: Add SLUG_LENGTH, SLUG_PATTERN
│   ├── types/
│   │   └── companies.types.ts  # MODIFY: Add slug field
│   ├── schemas/
│   │   └── companies.schemas.ts # MODIFY: Add slug validation
│   ├── repositories/
│   │   └── companies.repository.ts # MODIFY: Add getCompanyBySlug
│   ├── actions/
│   │   └── companies.actions.ts # MODIFY: Add getCompanyBySlugAction
│   └── components/
│       ├── CompanyForm.tsx     # MODIFY: Add slug input field
│       └── CompanyCard.tsx     # MODIFY: Link uses slug
│
├── lib/utils/
│   └── slug.ts                 # NEW: Slug generation utility
│
├── components/shared/
│   ├── Breadcrumbs.tsx         # RENAME from EditorBreadcrumbs + change separator
│   ├── NavTabs.tsx             # NEW: Generic tab navigation
│   └── AppNavbar.tsx           # NEW: Combined breadcrumbs + tabs
│
└── app/
    ├── (workspace)/
    │   ├── page.tsx            # NEW: Companies list (root /)
    │   │
    │   ├── (company)/[companySlug]/
    │   │   ├── layout.tsx      # NEW: Company navbar
    │   │   ├── page.tsx        # NEW: Redirect to /projects
    │   │   ├── projects/page.tsx    # NEW: Placeholder
    │   │   ├── exps/page.tsx        # NEW: Placeholder
    │   │   └── settings/page.tsx    # NEW: CompanyForm
    │   │
    │   ├── (project)/[companySlug]/[projectId]/
    │   │   ├── layout.tsx      # NEW: Project navbar
    │   │   ├── page.tsx        # NEW: Redirect to /events
    │   │   ├── events/page.tsx      # NEW: Placeholder
    │   │   ├── distribute/page.tsx  # NEW: Placeholder
    │   │   └── results/page.tsx     # NEW: Placeholder
    │   │
    │   ├── (event)/[companySlug]/[projectId]/[eventId]/
    │   │   ├── layout.tsx      # NEW: Event navbar
    │   │   ├── page.tsx        # NEW: Redirect to /experiences
    │   │   ├── experiences/page.tsx # NEW: Placeholder
    │   │   └── theme/page.tsx       # NEW: Placeholder
    │   │
    │   └── (experience)/[companySlug]/exps/[expId]/
    │       ├── layout.tsx      # NEW: Experience navbar (breadcrumbs only)
    │       └── page.tsx        # NEW: Placeholder
    │
    └── (admin)/                # KEEP: Existing routes preserved
```

**Structure Decision**: Extending existing pnpm monorepo structure. New routes use flat route groups `(workspace)` with isolated contexts `(company)`, `(project)`, `(event)`, `(experience)` to prevent layout inheritance/stacking.

## Complexity Tracking

No violations - this feature follows existing patterns:
- Company module extension follows feature-module architecture
- Navigation components follow EditorBreadcrumbs/EventTabs patterns
- Route groups follow Next.js 16 App Router conventions
