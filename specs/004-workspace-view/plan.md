# Implementation Plan: Workspace View & Settings (Admin)

**Branch**: `004-workspace-view` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-workspace-view/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement admin workspace view with slug-based routing, editable workspace settings (name and slug), friendly 404 states, workspace context display in sidebar, projects placeholder page, and automatic last-visited workspace session persistence using localStorage. Core features include workspace resolution by slug, real-time workspace updates, slug uniqueness validation, and seamless workspace continuity across sessions.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Auth, Firestore, Admin), TanStack Router 1.132, TanStack Query 5.66, Zustand 5.x (persist middleware), Zod 4.1, shadcn/ui, Radix UI, Tailwind CSS 4
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (media), localStorage (browser session persistence)
**Testing**: Vitest 3.0, Testing Library
**Target Platform**: Web (modern browsers), mobile-first responsive design (320px-768px primary viewport)
**Project Type**: Web application (full-stack TanStack Start)
**Performance Goals**: <2s workspace resolution, <1s workspace updates, <100ms localStorage write, <1s automatic redirect
**Constraints**: Client-first architecture (90% client-side code), Firebase security rules enforcement, admin-only access, strict TypeScript mode, no `any` types
**Scale/Scope**: Multi-workspace application, 4 main routes (/workspace/[slug], /workspace/[slug]/settings, /workspace/[slug]/projects, /), real-time Firestore updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First Design ✅ PASS

- **Primary viewport**: 320px-768px targeted for admin interface
- **Touch targets**: All interactive elements (buttons, form fields, links) will meet 44x44px minimum
- **Performance**: <2s workspace load, <1s updates aligns with <2s on 4G requirement
- **Testing**: Will test on mobile devices before completion

### II. Clean Code & Simplicity ✅ PASS

- **YAGNI**: Only implementing required features (no slug history, no undo/redo, no workspace deletion)
- **Single Responsibility**: Each component/hook does one thing (WorkspaceSelector for display, useWorkspace for data, workspace routes for routing)
- **Small functions**: Will keep functions focused and <30 lines
- **DRY**: Extract common logic for workspace resolution, slug validation, icon generation

### III. Type-Safe Development ✅ PASS

- **TypeScript strict mode**: Already enabled in project
- **No `any` escapes**: All types explicitly defined using existing Workspace schemas
- **Strict null checks**: Handled in all workspace resolution logic
- **Zod validation**: Using existing `workspaceSchema`, `slugSchema` for runtime validation
- **Server-side validation**: Slug uniqueness check and updates through Firestore security rules + server validation

### IV. Minimal Testing Strategy ✅ PASS

- **Vitest unit tests**: Will test workspace resolution logic, slug validation, icon generation, localStorage persistence
- **Test behavior**: Focus on user-facing behavior (workspace navigation, settings updates, session persistence)
- **Critical paths**: Workspace resolution, slug uniqueness, session persistence are critical and will have 90%+ coverage
- **Coverage goals**: Target 70%+ overall for this feature

### V. Validation Gates ✅ PASS

- **Pre-commit validation**: Will run `pnpm app:check` before every commit
- **Standards compliance**: Will review against applicable standards:
  - `frontend/design-system.md` - Theme tokens for workspace selector
  - `frontend/component-libraries.md` - Use shadcn/ui for form components
  - `global/project-structure.md` - Follow vertical slice architecture for workspace domain
  - `global/code-quality.md` - Validation workflow
  - `global/security.md` - Input validation, XSS prevention
  - `backend/firestore.md` - Firestore client patterns
  - `backend/firestore-security.md` - Security rules for workspace collection

### VI. Frontend Architecture ✅ PASS

- **Client-first pattern**: Using Firebase client SDKs for all workspace data operations
- **SSR strategy**: SSR only for entry routes (/, /workspace) for redirect logic
- **Security enforcement**: Firestore rules will enforce admin-only access
- **Real-time updates**: Using `onSnapshot` for workspace data in settings page
- **TanStack Query**: Client-side data fetching with caching for workspace resolution

### VII. Backend & Firebase ✅ PASS

- **Client SDK**: All workspace reads and real-time subscriptions use client SDK
- **Admin SDK**: Only for SSR context server functions (workspace resolution for redirects)
- **Security rules**: `workspaces` collection rules allow reads for admins, deny direct writes (force validation through server functions)
- **Public URLs**: N/A for this feature (no media storage)

### VIII. Project Structure ✅ PASS

- **Vertical slice**: Workspace feature already exists in `src/domains/workspace/`
- **Organized by concern**: Following existing structure (schemas/, types/, constants/, components/, hooks/, actions/)
- **Explicit naming**: Will use `workspace.[purpose].[ext]` pattern
- **Barrel exports**: Every folder will have `index.ts` re-exports
- **Restricted public API**: Only export components, hooks, types (NOT actions, schemas, repositories)

### Overall Assessment: ✅ ALL GATES PASS

No constitution violations. Feature follows all core principles and architectural patterns. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/
├── src/
│   ├── domains/
│   │   ├── navigation/
│   │   │   ├── components/
│   │   │   │   ├── Sidebar.tsx                 # EXISTING - Already handles area switching
│   │   │   │   ├── WorkspaceSelector.tsx       # UPDATED - Fetch real workspace data by slug
│   │   │   │   └── WorkspaceNav.tsx            # UPDATED - Use real workspaceSlug from params
│   │   │   └── lib/
│   │   │       └── getWorkspaceInitials.ts     # UPDATED - Fix to match spec (1-2 letters)
│   │   └── workspace/
│   │       ├── components/
│   │       │   ├── WorkspaceSettingsForm.tsx   # NEW - Form for name/slug editing
│   │       │   └── WorkspaceSettingsForm.test.tsx  # NEW - Co-located test
│   │       ├── hooks/
│   │       │   ├── useWorkspace.ts             # NEW - Fetch workspace by slug
│   │       │   ├── useWorkspace.test.ts        # NEW - Co-located test
│   │       │   ├── useUpdateWorkspace.ts       # NEW - Update workspace mutation
│   │       │   └── useUpdateWorkspace.test.ts  # NEW - Co-located test
│   │       ├── store/
│   │       │   ├── useWorkspaceStore.ts        # NEW - Zustand store for lastVisitedWorkspaceSlug
│   │       │   └── useWorkspaceStore.test.ts   # NEW - Co-located test
│   │       ├── actions/
│   │       │   ├── updateWorkspace.ts          # NEW - Server action for workspace updates
│   │       │   └── updateWorkspace.test.ts     # NEW - Co-located test
│   │       ├── schemas/
│   │       │   └── workspace.schemas.ts        # UPDATED - Add updateWorkspaceSchema
│   │       ├── types/
│   │       │   └── workspace.types.ts          # UPDATED - Add UpdateWorkspaceInput
│   │       ├── constants/
│   │       │   └── workspace.constants.ts      # EXISTING - Already defined
│   │       └── index.ts                        # UPDATED - Export new hooks/components
│   ├── app/
│   │   ├── index.tsx                           # UPDATED - Add redirect logic for lastVisitedWorkspaceSlug
│   │   ├── workspace.tsx                       # NEW - Workspace index redirect
│   │   └── workspace/
│   │       ├── $workspaceSlug.tsx              # UPDATED - Workspace resolution in beforeLoad
│   │       ├── $workspaceSlug.index.tsx        # EXISTING - Landing page for workspace
│   │       ├── $workspaceSlug.settings.tsx     # NEW - Workspace settings page
│   │       └── $workspaceSlug.projects.tsx     # EXISTING - Projects placeholder
│   ├── shared/
│   │   └── components/
│   │       └── NotFound.tsx                    # UPDATED - Generic 404 component with props
│   └── integrations/
│       └── firebase/
│           └── client.ts                       # EXISTING - Firestore client SDK

firestore.rules                                 # UPDATED - Add workspace collection rules
```

**Structure Decision**: This is a web application using TanStack Start with domain-driven design. The workspace feature spans two domains:

- **Navigation Domain** (`/domains/navigation/`) - UI layer for workspace context (WorkspaceSelector, WorkspaceNav, Sidebar). Consumes workspace data but doesn't own it.
- **Workspace Domain** (`/domains/workspace/`) - Data layer for workspace operations (hooks, store, actions, schemas, types). Provides data to navigation components.

This separation maintains clear boundaries: navigation handles UI/UX, workspace handles business logic and data. Routes in `src/app/workspace/` are thin wrappers that coordinate between domains. Tests are co-located with their modules for easier maintenance.

## Complexity Tracking

> **No violations** - All constitution gates passed. No complexity justification required.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 (Design & Contracts) completion*

### Design Artifacts Generated

1. ✅ **research.md** - Technical decisions and best practices
2. ✅ **data-model.md** - Entity schemas and relationships
3. ✅ **contracts/workspace-api.md** - API contracts and signatures
4. ✅ **quickstart.md** - Developer onboarding guide
5. ✅ **Agent context updated** - CLAUDE.md amended with new technologies

### Constitution Compliance Re-Verification

**I. Mobile-First Design** ✅ PASS
- Design uses responsive shadcn/ui components (mobile-first by default)
- All touch targets meet 44x44px minimum (Button, Input, Form controls)
- Performance goals remain achievable (<2s load, <1s updates)

**II. Clean Code & Simplicity** ✅ PASS
- Component design follows single responsibility (WorkspaceSelector for display, WorkspaceSettingsForm for editing, WorkspaceIcon for icon)
- No premature abstractions added
- Utility functions kept simple (generateWorkspaceIcon is <10 lines)

**III. Type-Safe Development** ✅ PASS
- All API contracts fully typed with TypeScript + Zod
- No `any` types in design
- Runtime validation with Zod for all server inputs

**IV. Minimal Testing Strategy** ✅ PASS
- Test plan focuses on behavior (icon generation, slug validation, session persistence)
- Critical paths identified (workspace resolution, slug uniqueness)
- Coverage goals maintained (70%+ overall, 90%+ critical)

**V. Validation Gates** ✅ PASS
- Standards compliance verified against applicable standards
- Technical validation approach defined (pre-commit hooks)
- Manual standards review planned

**VI. Frontend Architecture** ✅ PASS
- Design uses Firebase client SDK for all reads (useWorkspace, checkSlugUniqueness)
- Server actions only for validated writes (updateWorkspace)
- Real-time ready (can extend with onSnapshot)
- TanStack Query for caching and state management

**VII. Backend & Firebase** ✅ PASS
- Client SDK pattern confirmed in API contracts
- Admin SDK reserved for server functions only
- Security rules designed (admin-only access, deny direct writes)

**VIII. Project Structure** ✅ PASS
- Vertical slice architecture maintained in design
- All new files follow `[domain].[purpose].[ext]` pattern
- Barrel exports planned for all new modules
- Public API restricted (components, hooks, types only)

### Overall Post-Design Assessment: ✅ ALL GATES PASS

**No new violations introduced during design phase.**

The design artifacts confirm:
- Client-first architecture preserved
- Type safety throughout
- Simple, focused components
- Security enforced via Firestore rules
- Mobile-first responsive design
- No unnecessary complexity

**Ready to proceed to Phase 2: Task Generation** (`/speckit.tasks` command)
