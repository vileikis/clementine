# Implementation Plan: Router Simplification

**Branch**: `014-router-simplify` | **Date**: 2024-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-router-simplify/spec.md`

## Summary

Simplify the workspace routing architecture by consolidating 4 duplicate route group layouts into a single layout at `(workspace)/[companySlug]/layout.tsx`. Each layout currently fetches company data and renders the Sidebar independently. The new structure will fetch company once in the top-level layout and implement page-based breadcrumbs via a helper function, reducing maintenance overhead and eliminating duplicate data fetches.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
**Storage**: Firebase Firestore (existing, no changes needed)
**Testing**: Jest + React Testing Library (co-located tests)
**Target Platform**: Web (mobile-first 320px-768px, then tablet/desktop)
**Project Type**: Web monorepo (pnpm workspaces) - web/ workspace
**Performance Goals**: Page loads < 2 seconds on 4G, no regression from current structure
**Constraints**: URL structure must remain unchanged; only internal file organization changes
**Scale/Scope**: 4 layouts to consolidate, ~15 pages to migrate, 1 new breadcrumb helper

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Breadcrumbs will support mobile viewport with truncation/scroll; touch targets ≥44x44px maintained
- [x] **Clean Code & Simplicity**: Reducing 4 layouts to 1 is pure simplification; no new abstractions beyond breadcrumb helper
- [x] **Type-Safe Development**: TypeScript strict mode; Breadcrumb types will be explicitly defined; existing Zod schemas reused
- [x] **Minimal Testing Strategy**: Unit tests for breadcrumb helper function only (critical utility); existing layout tests remain
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test before completion
- [x] **Firebase Architecture Standards**: No Firebase changes; uses existing server actions with Admin SDK
- [x] **Feature Modules**: Breadcrumb helper is a shared utility in `lib/`, not a feature module (cross-cutting concern)
- [x] **Technical Standards**: Follows Next.js App Router patterns, existing component structure

**Complexity Violations**: None. This feature reduces complexity.

## Project Structure

### Documentation (this feature)

```text
specs/014-router-simplify/
├── plan.md              # This file
├── research.md          # Phase 0 output - current structure analysis
├── data-model.md        # Phase 1 output - Breadcrumb type definition
├── quickstart.md        # Phase 1 output - migration guide
├── contracts/           # N/A - no API endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── app/(workspace)/
│   └── [companySlug]/              # NEW: Consolidated layout
│       ├── layout.tsx              # Single layout (company fetch + Sidebar)
│       ├── page.tsx                # Dashboard (from company route group)
│       ├── projects/page.tsx       # Projects list
│       ├── exps/
│       │   ├── page.tsx            # Experiences list
│       │   └── [expId]/page.tsx    # Experience detail
│       ├── analytics/page.tsx
│       ├── settings/page.tsx
│       └── [projectId]/            # Project routes
│           ├── page.tsx            # Project detail
│           ├── events/page.tsx
│           ├── distribute/page.tsx
│           ├── results/page.tsx
│           └── [eventId]/          # Event routes
│               ├── page.tsx        # Event detail
│               ├── experiences/page.tsx
│               └── theme/page.tsx
├── lib/
│   └── breadcrumbs.ts              # NEW: Breadcrumb builder helper
├── components/shared/
│   └── Breadcrumbs.tsx             # EXISTING: No changes needed
└── features/sidebar/
    └── components/
        └── ContentHeader.tsx       # EXISTING: No changes needed
```

**Structure Decision**: Flatten the existing 4 route groups `(company)`, `(project)`, `(event)`, `(experience)` into a single route tree under `[companySlug]/`. The route group parentheses are removed since they were only used to provide multiple layouts—with a single layout, they're unnecessary.

## Migration Strategy

### Phase-by-Phase Migration

1. **Create new unified layout** at `(workspace)/[companySlug]/layout.tsx`
2. **Create breadcrumb helper** at `lib/breadcrumbs.ts`
3. **Migrate pages by route group** (atomic per group):
   - Company pages → update to use page-based breadcrumbs
   - Project pages → move to `[projectId]/`, add breadcrumbs
   - Event pages → move to `[projectId]/[eventId]/`, add breadcrumbs
   - Experience pages → move to `exps/[expId]/`, add breadcrumbs
4. **Delete old route group layouts** after each group is migrated
5. **Validation** after each migration step

### URL Mapping (Before → After)

| Current Path | New Internal Path | URL (unchanged) |
|-------------|------------------|-----------------|
| `(company)/[companySlug]/page.tsx` | `[companySlug]/page.tsx` | `/{slug}` |
| `(company)/[companySlug]/projects/page.tsx` | `[companySlug]/projects/page.tsx` | `/{slug}/projects` |
| `(project)/[companySlug]/[projectId]/page.tsx` | `[companySlug]/[projectId]/page.tsx` | `/{slug}/{projectId}` |
| `(event)/[companySlug]/[projectId]/[eventId]/page.tsx` | `[companySlug]/[projectId]/[eventId]/page.tsx` | `/{slug}/{projectId}/{eventId}` |
| `(experience)/[companySlug]/exps/[expId]/page.tsx` | `[companySlug]/exps/[expId]/page.tsx` | `/{slug}/exps/{expId}` |

## Complexity Tracking

> No complexity violations. This feature reduces complexity by consolidating 4 identical layouts into 1.
