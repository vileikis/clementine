# Implementation Quickstart: Projects

**Feature**: Projects - Foundation for Nested Events
**Date**: 2025-12-02
**Branch**: `001-projects`

## Overview

This quickstart guide provides a high-level implementation roadmap for refactoring the Events feature module to Projects. This is Phase 4 of the scalable architecture roadmap.

## Prerequisites

- **Phase 0 Complete**: Company context established (`/companies` collection, company workspace UI)
- **Phase 1 Complete**: AI Presets refactor (old `experiences` → `aiPresets`)
- **Development Environment**: Node.js 18+, pnpm, Firebase CLI
- **Access**: Firebase project with Admin SDK credentials

## Implementation Phases

### Phase 1: Data Model & Migration Script

**Objective**: Rename Firestore collection and update data model types

**Tasks**:
1. Create migration script (`scripts/migrate-events-to-projects.ts`):
   - Read all documents from `/events` collection
   - Transform fields: `ownerId` → `companyId`, `joinPath` → `sharePath`, `activeJourneyId` → `activeEventId`
   - Write to `/projects` collection (preserve document IDs)
   - Verify data integrity (document count, spot checks)
   - Optionally delete old `/events` collection after verification
2. Update Firestore indexes in `firebase.json`:
   - Add composite indexes for `companyId + status + updatedAt`
   - Add index for `sharePath`
3. Run migration script in staging environment
4. Verify migration with manual Firestore queries

**Files Created/Modified**:
- `scripts/migrate-events-to-projects.ts` (new)
- `firebase.json` (update indexes)

**Validation**:
- [ ] Migration script completes without errors
- [ ] Document count matches between `/events` and `/projects`
- [ ] Spot-check 10 random documents for field correctness
- [ ] All Firestore indexes created successfully

---

### Phase 2: Feature Module Refactor

**Objective**: Rename `features/events/` → `features/projects/` with systematic file updates

**Tasks**:
1. Rename directory: `features/events/` → `features/projects/`
2. Update types (`types/event.types.ts` → `types/project.types.ts`):
   - `Event` → `Project`
   - `EventStatus` → `ProjectStatus`
   - `EventTheme` → `ProjectTheme` (and nested types)
3. Update schemas (`schemas/events.schemas.ts` → `schemas/projects.schemas.ts`):
   - `eventSchema` → `projectSchema`
   - `eventThemeSchema` → `projectThemeSchema`
   - Update field names in schema definitions
4. Update repositories (`repositories/events.ts` → `repositories/projects.ts`):
   - Collection reference: `events` → `projects`
   - Function names: `getEvent` → `getProject`, `listEvents` → `listProjects`
   - Type references: `Event` → `Project`
5. Update actions (create new `actions/projects.actions.ts`):
   - Implement Server Actions per contract (see `contracts/projects.actions.md`)
   - Use Admin SDK for all mutations
   - Implement QR code generation
6. Update components (rename all `Event*` → `Project*`, PascalCase file names):
   - `EventCard.tsx` → `ProjectCard.tsx`
   - `EventForm.tsx` → `ProjectForm.tsx`
   - `EventStatusSwitcher.tsx` → `ProjectStatusSwitcher.tsx`
   - `EventBreadcrumb.tsx` → `ProjectBreadcrumb.tsx`
   - `EventTabs.tsx` → `ProjectTabs.tsx`
   - `DeleteEventButton.tsx` → `DeleteProjectButton.tsx`
   - `EditableEventName.tsx` → `EditableProjectName.tsx`
   - etc. (see component list in plan.md)
7. Update hooks (camelCase file names):
   - `useEvent.ts` → `useProject.ts`
   - `useEvents.ts` → `useProjects.ts`
8. Update barrel exports (`index.ts` files)
9. Search codebase for remaining references to `event` (case-insensitive) and update

**Files Created/Modified**:
- `web/src/features/projects/*` (entire directory renamed/updated)

**Validation**:
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] All imports resolved correctly
- [ ] No references to `features/events` remain in codebase
- [ ] All tests updated and passing (`pnpm test`)

---

### Phase 3: UI Implementation

**Objective**: Build Projects List and Project Details pages

**Tasks**:
1. Create Projects List page (`app/(authenticated)/projects/page.tsx`):
   - Use `useProjects` hook for real-time subscription
   - Render `ProjectCard` components in grid layout
   - Add "Create Project" button
   - Handle empty state
   - Mobile-first responsive design (320px-768px primary)
2. Create Project Details page (`app/(authenticated)/projects/[projectId]/page.tsx`):
   - Use `useProject` hook for real-time subscription
   - Render `ProjectDetailsHeader` with status switcher
   - Implement tab navigation (Events, Distribute)
   - Events tab: Placeholder message "Coming in Phase 5"
   - Distribute tab: Share link display, QR code, copy/download buttons
3. Update navigation/breadcrumbs to reference Projects instead of Events
4. Remove old Event pages/routes (if any)

**Files Created/Modified**:
- `app/(authenticated)/projects/page.tsx` (new)
- `app/(authenticated)/projects/[projectId]/page.tsx` (new)
- Navigation components (update links)

**Validation**:
- [ ] Projects List page loads and displays projects
- [ ] Create Project button opens form and creates project successfully
- [ ] Project Details page loads with correct tabs
- [ ] Events tab shows placeholder message
- [ ] Distribute tab shows share link and QR code
- [ ] Copy link button works (copies to clipboard)
- [ ] Download QR button downloads image
- [ ] Mobile layout works on 320px viewport
- [ ] All touch targets ≥44x44px

---

### Phase 4: Guest Flow Update

**Objective**: Update guest routing to read from `/projects` collection

**Tasks**:
1. Find guest routing logic (likely in `app/(public)/` or guest feature module)
2. Update Firestore query: `collection('events')` → `collection('projects')`
3. Update field references: `event` → `project`, `joinPath` → `sharePath`
4. Verify guest flow end-to-end:
   - Guest visits existing share link
   - Project loads from `/projects` collection
   - Active experience loads via `activeEventId`
   - Guest can complete experience flow

**Files Modified**:
- Guest routing file (TBD - needs investigation)

**Validation**:
- [ ] Existing share links continue to work
- [ ] Guest flow loads project correctly
- [ ] Active experience loads correctly
- [ ] No broken links or 404 errors

---

### Phase 5: Testing & Validation

**Objective**: Comprehensive testing before deployment

**Tasks**:
1. Run validation loop:
   - `pnpm lint` (fix all errors/warnings)
   - `pnpm type-check` (fix all TypeScript errors)
   - `pnpm test` (ensure all tests pass)
2. Manual testing:
   - Admin: Create project, update name, change status, soft delete
   - Admin: View projects list, navigate to details, use tabs
   - Admin: Copy share link, download QR code
   - Guest: Visit share link, complete experience flow
3. Performance testing:
   - Projects List page load time < 2 seconds
   - Project creation < 1 minute
   - QR generation < 5 seconds
4. Mobile testing:
   - Test on real mobile device (iOS or Android)
   - Verify responsive layout (320px, 375px, 768px viewports)
   - Verify touch target sizes ≥44x44px

**Validation**:
- [ ] All lint errors fixed
- [ ] All TypeScript errors fixed
- [ ] All tests passing
- [ ] Manual testing checklist complete
- [ ] Performance targets met
- [ ] Mobile testing complete

---

### Phase 6: Deployment

**Objective**: Deploy to production with migration

**Tasks**:
1. Deploy Firebase indexes (if not already deployed):
   ```bash
   firebase deploy --only firestore:indexes
   ```
2. Run migration script in production (dry-run first):
   ```bash
   node scripts/migrate-events-to-projects.ts --dry-run
   node scripts/migrate-events-to-projects.ts
   ```
3. Deploy code changes:
   ```bash
   pnpm build
   pnpm deploy  # or platform-specific deploy command
   ```
4. Verify deployment:
   - Check admin dashboard loads projects
   - Check guest flow with existing share links
   - Monitor logs for errors
5. Delete old `/events` collection (after 24-48 hour verification period):
   ```bash
   node scripts/delete-old-events-collection.ts
   ```

**Validation**:
- [ ] Migration completed successfully
- [ ] Code deployed without errors
- [ ] Admin dashboard functional
- [ ] Guest flow functional
- [ ] No critical errors in logs
- [ ] Old `/events` collection deleted (after verification period)

---

## Key Files Reference

### Feature Module Structure
```
web/src/features/projects/
├── actions/
│   └── projects.actions.ts          # Server Actions (Admin SDK)
├── repositories/
│   └── projects.repository.ts       # Firestore queries (Client SDK)
├── schemas/
│   ├── project.schema.ts            # Zod validation schemas
│   └── index.ts
├── components/
│   ├── ProjectCard.tsx              # Project list item
│   ├── ProjectForm.tsx              # Create/edit form
│   ├── ProjectStatusBadge.tsx       # Status indicator
│   ├── ProjectDetailsHeader.tsx     # Details page header
│   ├── ProjectEventsTab.tsx         # Events tab (placeholder)
│   ├── ProjectDistributeTab.tsx     # Distribute tab (share/QR)
│   └── index.ts
├── hooks/
│   ├── useProject.ts                # Single project subscription
│   ├── useProjects.ts               # Projects list subscription
│   └── index.ts
├── types/
│   ├── project.types.ts             # TypeScript types
│   └── index.ts
├── constants.ts                     # Feature-local constants
└── index.ts                         # Public API (components, hooks, types only)
```

### Page Routes
```
app/(authenticated)/
└── projects/
    ├── page.tsx                     # Projects List page
    └── [projectId]/
        └── page.tsx                 # Project Details page (tabs)
```

### Scripts
```
scripts/
├── migrate-events-to-projects.ts    # Migration script
└── delete-old-events-collection.ts  # Cleanup script (post-verification)
```

## Common Issues & Solutions

### Issue: TypeScript errors after rename
**Solution**: Run global search/replace for `Event` → `Project` in feature module, update all imports

### Issue: Firestore query fails after migration
**Solution**: Verify collection name updated to `projects`, check indexes deployed

### Issue: Guest flow broken after deployment
**Solution**: Check guest routing file updated to use `projects` collection, verify share paths preserved

### Issue: QR code generation fails
**Solution**: Check Firebase Storage permissions, verify QR library installed, check network access

### Issue: Real-time subscriptions not working
**Solution**: Verify Client SDK initialized, check Firestore security rules allow reads

## Next Steps

After completing this implementation:
1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.implement` to execute tasks systematically
3. Create pull request with comprehensive testing
4. Deploy to production following Phase 6 checklist
5. Monitor for 24-48 hours before deleting old `/events` collection
6. Document lessons learned for Phase 5 (nested Events)

## Resources

- **Spec**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/](contracts/)
- **Research**: [research.md](research.md)
- **Constitution**: `.specify/memory/constitution.md`
- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **Next.js Docs**: https://nextjs.org/docs
