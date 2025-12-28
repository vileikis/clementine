# Implementation Plan: Admin Workspace Management

**Branch**: `003-workspace-list` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-workspace-list/spec.md`

## Summary

Implement admin workspace management with slug-based routing in the TanStack Start application using client-first architecture. Admins can view, create, access, and soft-delete workspaces through `/admin/workspaces` list and `/workspace/[slug]` detail pages. Uses Firebase Firestore **client SDK** for all data operations with admin-only access enforced via **Firestore security rules**. Slug uniqueness is enforced client-side using Firestore transactions with atomicity guaranteed at database level, preventing duplicates even under concurrent load. No server functions required - aligns with project's client-first architectural standard.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Auth, Firestore, Admin), TanStack Router 1.132, TanStack Query 5.66
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (media)
**Testing**: Vitest 3.0.5
**Target Platform**: Web (TanStack Start SSR + client-side, mobile-first responsive)
**Project Type**: Web application (TanStack Start monorepo workspace)
**Performance Goals**:
- List page load < 2 seconds
- Workspace creation end-to-end < 30 seconds
- Slug validation response < 500ms
- Real-time updates via Firestore `onSnapshot` < 1 second
**Constraints**:
- Mobile-first (320px-768px primary viewport)
- Admin-only access (Firebase custom claims)
- Slug uniqueness enforced server-side (transaction-based)
- Soft delete only (no hard deletes)
- Case-insensitive slug matching
**Scale/Scope**:
- Initial: 10-50 workspaces expected
- Growth: 500+ workspaces (pagination required)
- Concurrent creation: Support 100+ simultaneous requests without duplicate slugs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅
- Primary viewport: 320px-768px (list + forms optimized for mobile)
- Touch targets: 44x44px minimum for all buttons/links
- Test requirement: Manual testing on mobile devices before completion
- Performance: List load < 2 seconds on 4G, no heavy operations on mobile

### Principle II: Clean Code & Simplicity ✅
- YAGNI: Implement only list, create, soft delete (no restore, no slug rename)
- Single Responsibility: Separate components for list, empty state, creation form, confirmation modal
- Small functions: Keep workspace operations focused (~30 lines max)
- No dead code: Remove mock workspace data after implementation
- DRY: Extract slug validation, timestamp helpers only when used 3+ times

### Principle III: Type-Safe Development ✅
- TypeScript strict mode: Already enabled in TanStack Start app
- No `any` types: All workspace operations fully typed
- Zod validation: Runtime validation for all inputs (name, slug, create/update operations)
- Server-side validation: Required for workspace creation (enforce uniqueness)
- Client-side validation: Optional UX-only (slug format preview, name length)

### Principle IV: Minimal Testing Strategy ✅
- Vitest unit tests: Focus on slug generation, validation, uniqueness check logic
- Critical paths: Test workspace creation flow, soft delete, admin guards
- Coverage goals: 70%+ overall, 90%+ for slug uniqueness enforcement
- No E2E: Rely on manual testing for UI flows

### Principle V: Validation Gates ✅
**Technical Validation**:
- Before commit: `pnpm app:check` (format, lint, type-check)
- Validation loop: Must pass cleanly before marking complete
- Dev server: Test all routes load without errors

**Standards Compliance**:
- `frontend/design-system.md`: Use theme tokens (no hard-coded colors)
- `frontend/component-libraries.md`: Use shadcn/ui components (Button, Input, Sheet)
- `global/project-structure.md`: Follow vertical slice architecture (domains/workspace, domains/admin/workspace)
- `global/code-quality.md`: Clean code, proper naming, no dead code
- `backend/firestore.md`: Client SDK for reads, Admin SDK for writes
- `backend/firestore-security.md`: Enforce admin-only access via rules

### Principle VI: Frontend Architecture ✅
- Client-first pattern: Use Firebase client SDK for real-time workspace list (`onSnapshot`)
- SSR strategy: Server-render `/admin/workspaces` for SEO/initial load only
- Security enforcement: Firestore rules deny writes, force mutations through server functions
- Real-time by default: List auto-updates when workspaces created/deleted
- TanStack Query: Cache workspace data, invalidate on mutations

### Principle VII: Backend & Firebase ✅
- Client SDK: Read workspaces collection with `onSnapshot` for real-time list
- Admin SDK: Create/update/delete operations in server functions only
- Security rules: Allow reads for admins, deny writes (force through server functions)
- Slug uniqueness: Enforce via transaction in server function (not client-side)

### Principle VIII: Project Structure ✅
- Vertical slice: Create `domains/workspace` (workspace entity) and `domains/admin/workspace` (admin UI) feature modules
- Technical organization: Group by purpose (actions/, schemas/, types/, components/)
- File naming: `workspace.[purpose].[ext]` pattern
- Barrel exports: `index.ts` re-exports in each folder
- Restricted API: Export only components, hooks, types (NOT actions/schemas)

**Gate Status**: ✅ PASS - No constitution violations. Feature aligns with all principles.

## Project Structure

### Documentation (this feature)

```text
specs/003-workspace-list/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── workspace-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (apps/clementine-app)

```text
apps/clementine-app/
├── src/
│   ├── domains/
│   │   ├── workspace/                    # Workspace domain (entity + workspace-scoped operations)
│   │   │   ├── types/
│   │   │   │   └── workspace.types.ts    # Workspace, WorkspaceStatus interfaces
│   │   │   ├── schemas/
│   │   │   │   └── workspace.schemas.ts  # Zod schemas for validation
│   │   │   ├── constants/
│   │   │   │   └── workspace.constants.ts # WORKSPACE_NAME, SLUG constraints
│   │   │   ├── utils/
│   │   │   │   └── workspace.utils.ts    # Workspace-specific helpers (if needed)
│   │   │   └── index.ts                  # Barrel export (types, schemas only)
│   │   │
│   │   └── admin/                        # Admin domain (platform admin features)
│   │       └── workspace/                # Workspace management (admin context)
│   │           ├── hooks/
│   │           │   ├── useWorkspaces.ts       # List all workspaces (admin only)
│   │           │   ├── useCreateWorkspace.ts  # Create workspace (admin only)
│   │           │   └── useDeleteWorkspace.ts  # Delete workspace (admin only)
│   │           ├── components/
│   │           │   ├── WorkspaceList.tsx     # List of active workspaces
│   │           │   ├── WorkspaceListEmpty.tsx # Empty state
│   │           │   ├── WorkspaceListItem.tsx  # Single workspace item
│   │           │   ├── CreateWorkspaceSheet.tsx # Creation form (Sheet component)
│   │           │   └── DeleteWorkspaceDialog.tsx # Confirmation modal
│   │           ├── containers/
│   │           │   └── WorkspacesPage.tsx    # Page container (data fetching)
│   │           └── index.ts              # Barrel export
│   │
│   ├── routes/
│   │   ├── admin/
│   │   │   └── workspaces.tsx           # /admin/workspaces route
│   │   └── workspace/
│   │       └── $workspaceSlug.tsx       # /workspace/[slug] route (dynamic)
│   │
│   └── shared/
│       └── utils/
│           └── slug-utils.ts            # (EXISTING) generateSlug, isValidSlug
│
└── tests/
    ├── unit/
    │   ├── workspace.schemas.test.ts    # Zod schema validation tests
    │   ├── admin-workspace-hooks.test.ts # Admin hook tests (useWorkspaces, useCreateWorkspace, useDeleteWorkspace)
    │   └── slug-utils.test.ts           # Slug generation/validation tests
    └── integration/
        └── workspace-creation.test.ts   # End-to-end workspace creation flow
```

**Structure Decision**: Web application (TanStack Start) with vertical slice architecture organized by capability. Feature code is split between:
- **`domains/workspace`**: Shared workspace entity (types, schemas, constants, utils) - the core data model
- **`domains/admin/workspace`**: Admin-scoped operations (CRUD hooks, admin UI components)
- **Future workspace-scoped features**: Will use `domains/workspace/hooks/` for workspace-specific operations (e.g., useCurrentWorkspace, useUpdateWorkspace)

This capability-based separation allows:
- Workspace domain provides shared entity definition (types, schemas) reused across contexts
- Admin domain is self-contained (hooks + UI for admin-only operations: list all, create, delete)
- Future workspace domain hooks will handle workspace-scoped operations (get one, update settings)
- Admin domain can grow with other platform features (users, analytics, etc.)
- Event domain (future) will handle event editing without bloating workspace domain
Routes are thin wrappers that import from domains. Follows `standards/global/project-structure.md` and `standards/frontend/architecture.md` (mutations via dedicated hooks). Testing organized by type (unit vs integration) with focus on critical paths per Principle IV.

## Complexity Tracking

*No violations - this section is not needed.*

---

## Phase 0: Outline & Research

### Research Tasks

1. **Slug Uniqueness Enforcement Strategy**
   - **Question**: How to enforce case-insensitive slug uniqueness in Firestore under concurrent load?
   - **Options**: Client-side check (race condition risk), server transaction, Firestore composite index with lowercase slug field
   - **Research focus**: Best practices for unique constraint enforcement in NoSQL databases

2. **Workspace Resolution Performance**
   - **Question**: How to efficiently query Firestore for slug-based workspace lookup?
   - **Options**: Query by slug field, maintain slug→id index, use slug as document ID
   - **Research focus**: Firestore query patterns for slug-based routing

3. **Real-Time Updates Strategy**
   - **Question**: Should workspace list use `onSnapshot` for real-time updates or periodic polling?
   - **Options**: Firestore `onSnapshot`, TanStack Query polling, manual refresh only
   - **Research focus**: Real-time data patterns in TanStack Start with Firebase

4. **Server Function Security**
   - **Question**: How to validate admin claims in server functions?
   - **Options**: Session-based (current pattern), verify ID token, trust client claims
   - **Research focus**: Best practices for admin validation in TanStack Start server functions

5. **Soft Delete Query Performance**
   - **Question**: How to efficiently filter deleted workspaces from queries?
   - **Options**: Composite index (status + createdAt), client-side filter, separate collections
   - **Research focus**: Firestore index strategies for status-based filtering

### Research Output

Research findings will be documented in `research.md` with:
- Decision made for each question
- Rationale (why chosen over alternatives)
- Alternatives considered (what was rejected and why)
- Implementation guidance (how to implement the decision)

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

Extract entities from feature spec:

**Workspace Entity**:
- Fields: id, name, slug, status, deletedAt, createdAt, updatedAt
- Validation: Zod schema with constraints from requirements
- State transitions: active → deleted (no restoration)
- Relationships: None (self-contained entity)

**Admin User** (existing):
- Custom claim: `admin: true`
- Session validation: Server-side in `requireAdmin()` guard

### API Contracts (`/contracts/workspace-api.yaml`)

Generate OpenAPI 3.0 spec for workspace operations:

**Endpoints**:
1. `GET /api/workspaces` - List active workspaces (admin only)
2. `POST /api/workspaces` - Create workspace (admin only, server function)
3. `GET /api/workspaces/:slug` - Get workspace by slug (admin only)
4. `PATCH /api/workspaces/:id/delete` - Soft delete workspace (admin only, server function)

**Request/Response Schemas**:
- CreateWorkspaceInput: `{ name: string, slug?: string }`
- WorkspaceResponse: Workspace entity
- WorkspaceListResponse: `{ workspaces: Workspace[] }`
- ErrorResponse: `{ error: string, code: string }`

### Implementation Guide (`quickstart.md`)

Step-by-step guide for implementing workspace management:
1. Set up Firestore collection and security rules
2. Create workspace domain (types, schemas, server functions)
3. Implement admin UI components (list, create, delete)
4. Add routes and navigation
5. Test admin flow end-to-end
6. Deploy Firestore rules and indexes

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update `CLAUDE.md` with:
- New technologies: None (all already in use)
- Recent changes: 003-workspace-list feature using TanStack Start + Firebase patterns

---

## Notes

- **Client-first architecture**: All workspace operations use Firestore **client SDK**, no server functions needed
- **Existing utilities**: `slug-utils.ts` already exists with `generateSlug()` and `isValidSlug()` - reuse these
- **Existing patterns**: Auth domain provides reference for route guards and domain structure
- **Security**: Enforced via **Firestore security rules** (admin-only, data validation), not server code
- **Mock data cleanup**: Remove `mockWorkspaces.ts` from navigation domain after implementation
- **Next.js reference**: `web/src/features/companies` serves as reference for workspace/company patterns (but use client SDK, not server actions)
- **Performance**: Pagination required when workspace count exceeds 50 (implement in future iteration if needed)
