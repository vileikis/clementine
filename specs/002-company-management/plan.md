# Implementation Plan: Company Management (Admin Dashboard)

**Branch**: `002-company-management` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-company-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add company management to the admin dashboard, enabling admins to organize events by brand/client. Admins can create, edit, soft-delete companies, and associate events with companies. Events can be filtered by company. Soft deletion ensures data safety while hiding deleted companies from UI and disabling their events' guest access.

**Technical Approach**: Extend existing Firestore schema with `companies` collection, add `companyId` reference to events, build new Companies tab with CRUD operations, extend Events tab with filtering. Follow existing patterns: Server Actions for mutations, repository layer for Firestore operations, Zod schemas for validation, mobile-first responsive UI.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Firebase Admin SDK 13.x, Zod 4.x, Tailwind CSS v4, shadcn/ui
**Storage**: Firestore (companies collection, events collection extended with companyId)
**Testing**: Jest 30.x with React Testing Library, co-located test files
**Target Platform**: Web (Next.js App Router), mobile-first (320px-768px primary)
**Project Type**: Web application (monorepo: web/ workspace)
**Performance Goals**: Company filter < 2 seconds for 1000 events, company deletion propagates to guest links within 1 second
**Constraints**: ADMIN_SECRET authentication required, mobile viewport primary, no duplicate company names
**Scale/Scope**: < 100 companies per admin (MVP assumption), support legacy events without company

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
  - Companies table responsive (cards on mobile), filter dropdown mobile-friendly, modals fit viewport
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
  - Following existing patterns (repositories, Server Actions), no new architectural layers
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
  - Company schema with Zod validation, status enum type-safe, companyId nullable reference
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
  - Repository tests, Server Action tests, component tests for Companies tab
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
  - Validation loop in Polish phase (Phase 3 of tasks)
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced
  - Following global/ (coding-style, conventions, validation, error-handling)
  - Following frontend/ (css, responsive, accessibility, components)
  - Following backend/ (firebase, api)
  - Following testing/ (test-writing)

**Complexity Violations** (if any): None - feature follows existing patterns without new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/002-company-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── companies.ts              # NEW: Server Actions for company CRUD
│   │   │   └── events.ts                 # MODIFIED: Add companyId to create/update
│   │   ├── events/
│   │   │   ├── page.tsx                  # MODIFIED: Add company filter UI
│   │   │   └── layout.tsx                # MODIFIED: Add Companies tab navigation
│   │   ├── companies/                    # NEW: Companies management pages
│   │   │   ├── page.tsx                  # NEW: Companies list view
│   │   │   └── [companyId]/
│   │   │       └── page.tsx              # NEW: Company detail/edit view
│   │   └── join/
│   │       └── [eventId]/
│   │           └── page.tsx              # MODIFIED: Check company.status, return error if deleted
│   ├── components/
│   │   ├── organizer/
│   │   │   ├── EventCard.tsx             # MODIFIED: Display company name
│   │   │   ├── CompanyCard.tsx           # NEW: Company list item component
│   │   │   ├── CompanyForm.tsx           # NEW: Create/edit company modal
│   │   │   ├── CompanyFilter.tsx         # NEW: Company filter dropdown
│   │   │   └── DeleteCompanyDialog.tsx   # NEW: Soft delete confirmation
│   │   └── ui/                           # Existing shadcn/ui components (reused)
│   ├── lib/
│   │   ├── repositories/
│   │   │   ├── companies.ts              # NEW: Company CRUD operations (Firestore)
│   │   │   ├── companies.test.ts         # NEW: Repository tests
│   │   │   └── events.ts                 # MODIFIED: Add companyId field handling
│   │   ├── schemas/
│   │   │   ├── firestore.ts              # MODIFIED: Add companySchema
│   │   │   └── validation.ts             # NEW: Company input validation schemas
│   │   ├── types/
│   │   │   └── firestore.ts              # MODIFIED: Add Company interface, extend Event
│   │   └── hooks/
│   │       └── use-companies.ts          # NEW: Client-side company data hook (if needed)
│   └── __tests__/
│       └── companies/                    # NEW: Integration tests for company flows
│           ├── crud.test.ts
│           └── event-association.test.ts
└── package.json                          # No changes (dependencies already present)
```

**Structure Decision**: Web application structure (Option 2 simplified as monorepo single web/ workspace). Following existing Next.js App Router patterns: Server Actions in `app/actions/`, repositories in `lib/repositories/`, types in `lib/types/`, components in `components/organizer/` for admin UI. All new files follow established conventions.

## Complexity Tracking

No complexity violations - feature extends existing patterns without new architectural layers.

---

## Phase 0: Research & Technical Decisions

**Objective**: Resolve all unknowns from Technical Context, research best practices, document technology decisions.

### Research Tasks

1. **Firestore Soft Deletion Patterns**
   - How to implement soft deletion with status field
   - Query filtering for non-deleted records
   - Index requirements for status + name uniqueness

2. **Company-Event Relationship in Firestore**
   - Denormalization strategy (store company name in events?)
   - Query patterns for filtering events by company
   - Performance implications of filtering 1000+ events

3. **Next.js Tab Navigation Patterns**
   - Client-side state for active tab vs URL-based
   - Accessibility best practices for tab components
   - Mobile-responsive tab navigation

4. **Company Name Uniqueness Enforcement**
   - Firestore unique constraint patterns (no native support)
   - Transaction-based uniqueness check
   - Handling race conditions

5. **Guest Link Validation on Soft Delete**
   - Efficient lookup: event → company → status check
   - Caching strategy for company status
   - Error UX when link is disabled

**Output**: `research.md` documenting decisions and rationale for each area

---

## Phase 1: Design Artifacts

**Prerequisites**: `research.md` complete

### 1. Data Model (`data-model.md`)

Extract entities from spec and research:

- **Company** entity (new collection: `companies/`)
  - Fields: id, name (unique), status, deletedAt, optional metadata
  - Indexes: status, name (for uniqueness check)
  - Relationships: One-to-many with events

- **Event** entity (extend existing `events/`)
  - Add field: companyId (nullable string reference)
  - Query patterns: filter by companyId, filter by null companyId

- **Validation schemas** (Zod)
  - Company creation: name required, unique check
  - Company update: name required, unique check excluding self
  - Event creation/update: companyId optional, must reference existing company

### 2. API Contracts (`contracts/`)

Generate Server Actions based on functional requirements:

- **Company Actions** (`actions/companies.ts`)
  - `createCompanyAction(input: { name, ...optional })`
  - `updateCompanyAction(companyId, input: { name })`
  - `deleteCompanyAction(companyId)` (soft delete)
  - `listCompaniesAction()` (exclude deleted)
  - `getCompanyAction(companyId)`
  - `getCompanyEventCountAction(companyId)`

- **Event Actions** (extend `actions/events.ts`)
  - `createEventAction(input)` - add companyId field
  - `updateEventAction(eventId, input)` - allow companyId update
  - `listEventsAction(filters?: { companyId? })` - add filtering

**Output**: OpenAPI-style documentation in `contracts/server-actions.yaml`

### 3. Authentication Infrastructure (`auth/`)

Admin authentication system (ADMIN_SECRET-based):

- **Auth Utility** (`lib/auth.ts`)
  - `verifyAdminSecret()` - Cookie/header validation helper
  - Returns `{ authorized: true }` or `{ authorized: false, error: string }`
  - Used by all Server Actions requiring admin access

- **Login Page** (`app/login/page.tsx`)
  - Simple form: password input field
  - Client component with form submission
  - Sets `ADMIN_SECRET` cookie on successful login
  - Redirects to `/events` after login

- **Login Server Action** (`app/actions/auth.ts`)
  - `loginAction(password: string)` - Validates against `process.env.ADMIN_SECRET`
  - Sets HTTP-only cookie with SameSite and Secure flags
  - Returns success/failure

- **Logout Functionality**
  - `logoutAction()` - Clears ADMIN_SECRET cookie
  - Redirects to `/login`

- **Protected Routes**
  - Apply `verifyAdminSecret()` to all existing event/scene Server Actions
  - Apply to all new company Server Actions
  - Guest routes (`/join/*`) remain public

**Security Notes**:
- POC uses simple shared secret (ADMIN_SECRET env var)
- Production should upgrade to session tokens or Firebase Auth
- HTTP-only cookies prevent XSS attacks
- SameSite=Lax prevents CSRF

### 4. Quickstart Guide (`quickstart.md`)

Developer setup for this feature:
- Database schema setup (Firestore indexes)
- Environment variables (ADMIN_SECRET required)
- Running local dev server
- Admin login flow
- Testing company CRUD flows
- Testing event-company association

### 5. Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- Company entity to context
- New Server Actions
- UI components for Companies tab

---

## Phase 2: Task Generation

**Not created by `/speckit.plan` - use `/speckit.tasks` command**

Tasks will be organized by user story priority (P1 → P3) from spec.md.

Expected task structure:
1. **Setup & Schema** (P0)
   - Firestore schema changes (Company entity, Event.companyId)
   - Zod validation schemas
   - TypeScript types

2. **Core CRUD** (P1 tasks)
   - Company repository (create, read, list, soft delete)
   - Company Server Actions
   - Companies tab UI (list, create modal, edit modal)
   - Event creation with company selector

3. **Filtering & Navigation** (P2 tasks)
   - Company filter on Events tab
   - Event list shows company name
   - Company detail page with event links
   - Navigation between Companies/Events tabs

4. **Reassignment & Cleanup** (P3 tasks)
   - Edit event company association
   - Delete company soft deletion flow
   - Guest link validation (check company.status)
   - Legacy event migration

5. **Polish** (P4)
   - Mobile responsive testing
   - Validation loop (lint, type-check, test)
   - Edge case handling
   - Documentation

---

## Post-Phase 1 Constitution Re-Check

After completing design artifacts (data-model.md, contracts/, quickstart.md):

- [x] **Mobile-First Responsive Design**: Confirmed - Companies table uses cards on mobile, filter dropdown sized appropriately, modals constrained to viewport
- [x] **Clean Code & Simplicity**: Confirmed - No new patterns introduced, reusing Server Actions + repositories + Zod validation
- [x] **Type-Safe Development**: Confirmed - Company schema strict typed, status enum, companyId nullable FK
- [x] **Minimal Testing Strategy**: Confirmed - Repository tests, Server Action tests, component tests planned
- [x] **Validation Loop Discipline**: Confirmed - Polish phase includes full validation loop
- [x] **Technical Standards**: Confirmed - Following all applicable standards from `standards/` directory

**Result**: ✅ All constitution checks pass. Proceed to Phase 2 (task generation with `/speckit.tasks`).

---

## Next Steps

1. Review this plan for completeness
2. Execute Phase 0: Research (document findings in `research.md`)
3. Execute Phase 1: Design (generate `data-model.md`, `contracts/`, `quickstart.md`)
4. Run `/speckit.tasks` to generate dependency-ordered task list
5. Execute tasks via `/speckit.implement`
