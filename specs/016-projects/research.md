# Research: Projects - Foundation for Nested Events

**Date**: 2025-12-02
**Feature**: [spec.md](spec.md)

## Overview

This document captures research findings and decisions for refactoring the Events feature module to Projects as part of Phase 4 of the scalable architecture roadmap.

## Research Topics

### 1. Firestore Collection Rename Strategy

**Decision**: Manual code refactor + data migration script

**Rationale**:
- Firestore does not support native collection renaming
- Two approaches considered: (1) manual refactor + data migration, (2) dual-write period with gradual migration
- Manual refactor chosen because this is early-stage product with limited production data
- Data migration can be done via Firebase Admin SDK script that copies documents from `/events/{eventId}` to `/projects/{projectId}` with field renaming

**Alternatives Considered**:
- **Dual-write approach**: Write to both `/events` and `/projects` during transition period - rejected because it adds unnecessary complexity for a small dataset and requires maintaining two codepaths
- **Firestore view/alias**: Not supported by Firebase - rejected as not feasible
- **Keep old collection name**: Would create semantic confusion between old "Events" (now Projects) and new "Events" (nested in Phase 5) - rejected for clarity

**Implementation Notes**:
- Migration script will:
  1. Read all documents from `/events` collection
  2. Transform document fields (`ownerId` → `companyId`, `joinPath` → `sharePath`, `activeJourneyId` → `activeEventId`)
  3. Write to `/projects` collection with same document ID
  4. Verify data integrity (count matches, spot-check documents)
  5. Delete old `/events` collection after verification
- Guest flow continuity: Share paths (`sharePath`) remain the same, guest routing logic updated to read from `/projects` instead of `/events`

### 2. Feature Module Refactor Best Practices

**Decision**: Follow existing feature module structure, rename files systematically

**Rationale**:
- Clementine already uses feature module architecture (`features/events/` → `features/projects/`)
- Existing structure follows vertical slice pattern with technical concern organization (actions/, repositories/, schemas/, components/, hooks/, types/)
- Best practice: Preserve structure, rename files and directories systematically to maintain consistency

**Alternatives Considered**:
- **Restructure during rename**: Reorganize feature module layout while renaming - rejected because it conflates two changes (rename + restructure) and increases risk of bugs
- **Keep old feature module**: Create new `features/projects/` alongside `features/events/` - rejected because it creates duplication and semantic confusion

**Implementation Pattern**:
```
1. Rename directory: features/events/ → features/projects/
2. Rename files: events.*.ts → projects.*.ts (preserving technical concern suffix)
3. Update imports: @/features/events → @/features/projects
4. Rename types: Event → Project, EventTheme → ProjectTheme, etc.
5. Rename variables: event → project, events → projects, etc.
6. Update JSDoc comments and string literals
7. Run TypeScript compiler to catch remaining references
```

### 3. Guest Flow Continuity During Rename

**Decision**: Update guest routing logic to read from `/projects` collection

**Rationale**:
- Guest flow currently works as: Guest visits `sharePath` → loads Event → resolves `activeJourneyId` → loads Journey (Experience)
- After rename: Guest visits `sharePath` → loads Project → resolves `activeEventId` → loads Experience
- Share links remain valid because `sharePath` values are preserved during migration
- Routing logic update is straightforward: change Firestore collection reference from `/events` to `/projects`

**Alternatives Considered**:
- **URL redirect mapping**: Maintain old share paths and redirect to new ones - rejected because share paths are not changing, only the collection name
- **Backwards compatibility layer**: Support both `/events` and `/projects` reads - rejected because this is a breaking rename with no need for backwards compatibility

**Implementation Notes**:
- Guest routing currently lives in: [NEEDS INVESTIGATION - likely in app/(public) or guest feature module]
- Update Firestore query: `db.collection('events').where('sharePath', '==', path)` → `db.collection('projects').where('sharePath', '==', path)`
- Test guest flow after deployment with existing share links to verify continuity

### 4. UI Component Reuse Strategy

**Decision**: Rename existing components, preserve business logic and styling

**Rationale**:
- Existing components (`EventCard`, `EventForm`, `EventStatusSwitcher`) are well-tested and follow design system
- Renaming components is safer than rewriting them
- Visual design and UX patterns remain the same (Projects are conceptually the same as old Events)

**Alternatives Considered**:
- **Rewrite components from scratch**: Would allow cleanup/refactor - rejected because it introduces unnecessary risk and delays delivery
- **Keep old component names**: Use `EventCard` for projects - rejected because it creates semantic confusion

**Component Mapping**:
```
EventCard → ProjectCard (list item)
EventForm → ProjectForm (create/edit form)
EventStatusSwitcher → ProjectStatusSwitcher (status badge/dropdown)
EventBreadcrumb → ProjectBreadcrumb (navigation)
EventTabs → ProjectTabs (project details tabs)
DeleteEventButton → DeleteProjectButton
EditableEventName → EditableProjectName
```

### 5. Testing Strategy for Refactor

**Decision**: Update existing tests to use Project terminology, add new tests for UI changes

**Rationale**:
- Existing tests cover critical paths (event creation, status transitions, soft delete)
- Test behavior remains the same, only entity names change
- New UI components (Events tab placeholder, Distribute tab) require new tests

**Test Coverage Plan** (tests co-located next to source files):
```
Unit Tests (preserve + update):
- actions/projects.actions.test.ts (next to projects.actions.ts)
  → test Server Actions (createProject, updateProject, deleteProject)
- repositories/projects.repository.test.ts (next to projects.repository.ts)
  → test Firestore queries (getProject, listProjects)

Component Tests (preserve + update):
- components/ProjectCard.test.tsx (next to ProjectCard.tsx)
  → test rendering, click navigation
- components/ProjectForm.test.tsx (next to ProjectForm.tsx)
  → test form validation, submission
- components/ProjectStatusSwitcher.test.tsx (next to ProjectStatusSwitcher.tsx)
  → test status transitions

New Component Tests:
- components/ProjectEventsTab.test.tsx (next to ProjectEventsTab.tsx)
  → test placeholder message
- components/ProjectDistributeTab.test.tsx (next to ProjectDistributeTab.tsx)
  → test share link copy, QR download

Hook Tests:
- hooks/useProjects.test.ts (next to useProjects.ts)
  → test real-time subscription, filtering
- hooks/useProject.test.ts (next to useProject.ts)
  → test single project subscription

Integration Tests (manual):
- Guest flow: Visit share link → verify Project loads → verify Experience loads
- Admin flow: Create project → verify appears in list → update status → verify persistence
```

### 6. Migration Rollback Strategy

**Decision**: Keep migration script reversible with rollback capability

**Rationale**:
- Early-stage product with small dataset allows for safe rollback
- If migration fails or bugs discovered, can restore from `/events` collection backup

**Rollback Plan**:
```
1. Before migration: Export all documents from `/events` to JSON backup file
2. Run migration script with dry-run mode (log changes without writing)
3. Run migration with write mode
4. Verify data integrity
5. If issues found: Restore from backup, fix bugs, re-run migration
6. After successful verification: Delete `/events` collection
```

## Technology Stack Decisions

All technologies already in use - no new dependencies required:

- **Language**: TypeScript 5.x (strict mode) - existing
- **Framework**: Next.js 16 (App Router), React 19 - existing
- **Database**: Firebase Firestore - existing (collection rename only)
- **Storage**: Firebase Storage - existing (same path pattern)
- **Validation**: Zod 4.x - existing (rename schemas)
- **Testing**: Jest + React Testing Library - existing
- **UI Components**: shadcn/ui, Tailwind CSS v4 - existing (rename usage)

## Open Questions Resolved

### Q1: How to handle temporary field preservation (`theme`, `publishStartAt`, `publishEndAt`)?
**Answer**: Keep fields at Project level during Phase 4, document as "temporary" in comments and types. Will be removed and moved to nested Events in Phase 5. This avoids breaking guest flow and allows Phase 4 to focus solely on the rename/refactor.

### Q2: What happens to `activeEventId` semantics during Phase 4?
**Answer**: Field is named `activeEventId` (preparing for Phase 5) but still points to Experience IDs during Phase 4. This is intentional - the field name is semantically incorrect during Phase 4 but correct after Phase 5. Alternative naming (`activeExperienceId` → `activeEventId` in Phase 5) would require two renames. Accepted tradeoff: temporary semantic incorrectness for simpler migration path.

### Q3: How to ensure guest links don't break during deployment?
**Answer**: Deploy in single atomic update: (1) run migration script to copy data, (2) deploy code changes, (3) verify guest flow, (4) delete old collection. Guest downtime < 1 minute during deployment window.

## Next Steps

With all research completed and decisions documented, ready to proceed to Phase 1 (Design & Contracts):
1. Generate `data-model.md` with Project entity schema
2. Generate API contracts (`contracts/`) for Server Actions
3. Generate `quickstart.md` with implementation overview
4. Update agent context with any new technology (none in this case)
