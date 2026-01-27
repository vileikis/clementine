# Research: Flatten Project/Event Structure

**Feature**: 042-flatten-structure-refactor
**Date**: 2026-01-26

## Executive Summary

Research confirms the flattening approach is sound. The codebase has clear separation between project metadata and event configuration. The event schema (`ProjectEventFull`) contains fields that logically belong on the project itself. All `eventId` references can be safely removed since sessions already have `projectId` and the config will live directly on the project.

---

## Decision 1: Schema Merge Strategy

**Decision**: Merge `ProjectEventFull` fields directly into `Project` schema.

**Rationale**:
- `ProjectEventFull` contains only 8 fields (id, name, status, timestamps, draftConfig, publishedConfig, versions)
- `Project` contains only 8 fields (id, name, workspaceId, status, type, activeEventId, timestamps)
- Combined schema will have ~14 fields (removing redundant id, name, and activeEventId)
- The `projectEventConfigSchema` is 95% of the actual configuration - this becomes `projectConfigSchema`

**Alternatives Considered**:
1. Keep events but make them 1:1 with projects - Rejected: Adds unnecessary abstraction
2. Promote "event" to top-level - Rejected: "Event" naming collision in code, 40-60 hours vs 15-22

**Code Evidence**:
```typescript
// Current Project (packages/shared/src/schemas/project/project.schema.ts)
projectSchema = {
  id, name, workspaceId,
  status: 'draft' | 'live' | 'deleted',
  type: 'standard' | 'ghost',
  activeEventId: string | null,  // REMOVE
  deletedAt, createdAt, updatedAt
}

// Current ProjectEventFull (packages/shared/src/schemas/event/project-event.schema.ts)
projectEventFullSchema = {
  id, name, status,
  draftConfig: ProjectEventConfig | null,
  publishedConfig: ProjectEventConfig | null,
  draftVersion, publishedVersion, publishedAt,
  createdAt, updatedAt, deletedAt
}

// NEW Combined Project Schema
projectSchema = {
  // Identity
  id, name, workspaceId,

  // Status
  status: 'draft' | 'live' | 'deleted',
  type: 'standard' | 'ghost',

  // Configuration (from ProjectEventFull)
  draftConfig: ProjectConfig | null,
  publishedConfig: ProjectConfig | null,

  // Versioning (from ProjectEventFull)
  draftVersion: number,
  publishedVersion: number | null,
  publishedAt: number | null,

  // Timestamps
  createdAt, updatedAt, deletedAt
}
```

---

## Decision 2: Session eventId Handling

**Decision**: Remove `eventId` field from session schema entirely.

**Rationale**:
- Sessions already have `projectId` and `experienceId` which provide all necessary context
- The `eventId` was nullable anyway (null for preview sessions)
- Analytics can be derived from `projectId` alone
- Config source is determined by `configSource: 'draft' | 'published'` field, not eventId

**Code Evidence**:
```typescript
// Current Session Schema (packages/shared/src/schemas/session/session.schema.ts)
sessionSchema = {
  id,
  projectId: z.string(),           // KEEP - links to project
  workspaceId: z.string(),         // KEEP - for analytics
  eventId: z.string().nullable(),  // REMOVE - redundant
  experienceId: z.string(),        // KEEP - specific experience
  mode: 'preview' | 'guest',
  configSource: 'draft' | 'published',  // KEEP - determines which config
  // ... rest
}
```

**Migration Impact**:
- Existing sessions with `eventId` values will have the field ignored
- Firestore doesn't require field removal - just stop writing it
- Security rules don't reference `eventId`

---

## Decision 3: Route Structure

**Decision**: Flatten event routes under project routes using config-focused naming.

**Rationale**:
- Current routes: `/workspace/$slug/projects/$projectId/events/$eventId/welcome`
- New routes: `/workspace/$slug/projects/$projectId/welcome`
- Reduces URL depth by 2 segments
- Aligns URL structure with data structure (project has config)

**Current Route Files** (to be deleted/moved):
```
apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/
├── $projectId.events/
│   ├── $eventId.tsx           → DELETE (layout)
│   ├── $eventId.index.tsx     → DELETE (redirect)
│   ├── $eventId.welcome.tsx   → MOVE to $projectId.welcome.tsx
│   ├── $eventId.share.tsx     → MOVE to $projectId.share.tsx
│   ├── $eventId.theme.tsx     → MOVE to $projectId.theme.tsx
│   ├── $eventId.settings.tsx  → MOVE to $projectId.settings.tsx
│   └── index.tsx              → DELETE (events list)
```

**New Route Files**:
```
apps/clementine-app/src/app/routes/workspace/$workspaceSlug.projects/
├── $projectId.tsx              → MODIFY (add designer layout)
├── $projectId.index.tsx        → MODIFY (redirect to welcome or show overview)
├── $projectId.welcome.tsx      → NEW (from $eventId.welcome.tsx)
├── $projectId.share.tsx        → NEW (from $eventId.share.tsx)
├── $projectId.theme.tsx        → NEW (from $eventId.theme.tsx)
├── $projectId.settings.tsx     → NEW (from $eventId.settings.tsx)
```

---

## Decision 4: Domain Reorganization

**Decision**: Rename `event` domain to `project-config` (not merge into `project`).

**Rationale**:
- Renaming is simpler than merging dozens of files
- Avoids import path conflicts with existing `project/` domain
- "project-config" clearly describes purpose: UI for designing/configuring projects
- Hooks just need `eventId` param removed, not relocated
- Merging would be high-risk refactor with marginal benefit

**Current Structure**:
```
apps/clementine-app/src/domains/
├── event/
│   ├── shared/             # Query options, hooks, utils
│   ├── designer/           # Designer layout, publish hook
│   ├── theme/              # Theme editor
│   ├── welcome/            # Welcome editor
│   ├── share/              # Share editor
│   ├── settings/           # Settings editor (overlays, share options)
│   └── experiences/        # Experience picker config
├── project/
│   ├── shared/             # Project query, hooks
│   └── events/             # Event list, create/delete (DELETE)
```

**New Structure**:
```
apps/clementine-app/src/domains/
├── project/
│   └── shared/             # Project queries, hooks (useProject enhanced)
├── project-config/       # RENAMED from event/
│   ├── shared/             # Remove eventId from hooks
│   ├── designer/           # usePublishEvent → usePublishProjectConfig
│   ├── theme/              # Remove eventId param
│   ├── welcome/            # Remove eventId param
│   ├── share/              # Remove eventId param
│   ├── settings/           # Remove eventId param
│   └── experiences/        # Remove eventId param
```

---

## Decision 5: Naming Convention Changes

**Decision**: Replace all "event" terminology with "project-config" or "project" terminology in the renamed domain.

**Rationale**:
- Consistency with data model (no more events)
- Clearer intent in code
- Avoid confusion between old and new patterns

### Hook Renames

| Current | New |
|---------|-----|
| `useProjectEvent(projectId, eventId)` | `useProject(projectId)` (enhanced, in project/shared) |
| `useProjectEvents(projectId)` | DELETE - no longer needed |
| `useCreateProjectEvent()` | DELETE - config created with project |
| `useDeleteProjectEvent()` | DELETE - use soft delete project |
| `useActivateProjectEvent()` | DELETE - no events to activate |
| `useRenameProjectEvent()` | DELETE - rename project instead |
| `usePublishEvent()` | `usePublishProjectConfig()` |
| `useUpdateEventConfig()` | `useUpdateProjectConfig()` |
| `useUpdateTheme()` | `useUpdateTheme()` (remove eventId param) |
| `useUpdateWelcome()` | `useUpdateWelcome()` (remove eventId param) |
| `useUpdateShare()` | `useUpdateShare()` (remove eventId param) |
| `updateEventConfigField()` | `updateProjectConfigField()` |

### Component Renames

| Current | New |
|---------|-----|
| `EventDesignerLayout` | `ProjectConfigDesignerLayout` |
| `EventDesignerSidebar` | `ProjectConfigDesignerSidebar` |
| `EventSettingsPage` | `ProjectConfigSettingsPage` |
| `ProjectEventItem` | DELETE - no event list |
| `ProjectEventsList` | DELETE - no event list |

### File Renames (within project-config/)

| Current | New |
|---------|-----|
| `useProjectEvent.ts` | `useProjectConfig.ts` |
| `project-event.query.ts` | `project-config.query.ts` |
| `EventDesignerLayout.tsx` | `ProjectConfigDesignerLayout.tsx` |
| `EventDesignerSidebar.tsx` | `ProjectConfigDesignerSidebar.tsx` |
| `EventSettingsPage.tsx` | `ProjectConfigSettingsPage.tsx` |

### Utility/Lib Renames

| Current | New |
|---------|-----|
| `updateEventConfigField.ts` | `updateProjectConfigField.ts` |

---

## Decision 6: Firestore Security Rules

**Decision**: Remove events subcollection rules block entirely.

**Rationale**:
- Events subcollection will no longer exist
- Project rules already handle admin/user access
- Config is embedded in project document, same rules apply

**Current Rules** (firebase/firestore.rules:77-88):
```javascript
// Project events subcollection (simple admin-only checks)
match /events/{eventId} {
  allow read, create, update: if isAdmin();
  allow read: if isAnyUser();
  allow delete: if false;
}
```

**Action**: Delete entire block. No replacement needed.

---

## Decision 7: Data Migration Strategy

**Decision**: Write a Cloud Function migration script using Admin SDK.

**Rationale**:
- Firestore transactions ensure atomicity
- Can run against production safely
- Preserves audit trail (don't delete old events immediately)

**Migration Steps**:
1. Read all projects
2. For each project with `activeEventId`:
   a. Fetch the active event document
   b. Copy `draftConfig`, `publishedConfig`, `draftVersion`, `publishedVersion`, `publishedAt` to project
   c. Remove `activeEventId` from project
   d. Mark event as `status: 'migrated'` (for tracking)
3. Log results for verification

**Script Location**: `functions/scripts/migrations/042-flatten-events.ts`

---

## Decision 8: Backward Compatibility Period

**Decision**: No backward compatibility period - clean break.

**Rationale**:
- Single development team (no external consumers)
- Feature flag not needed (deploy all changes together)
- TypeScript compiler will catch all missed references
- Simpler implementation without dual paths

**Deployment Strategy**:
1. Deploy migration script (run before frontend)
2. Deploy backend changes (functions)
3. Deploy frontend changes
4. Verify all flows work
5. Schedule cleanup of old event documents (7 days later)

---

## Files Requiring Changes

### Packages/Shared (Schema Layer)

| File | Action | Notes |
|------|--------|-------|
| `schemas/project/project.schema.ts` | MODIFY | Add config fields, remove activeEventId |
| `schemas/project/project-config.schema.ts` | CREATE | Move from `event/project-event-config.schema.ts` |
| `schemas/project/experiences.schema.ts` | CREATE | Move from `event/experiences.schema.ts` |
| `schemas/project/index.ts` | MODIFY | Export new schemas |
| `schemas/event/` | DELETE | Entire folder after moving files |
| `schemas/session/session.schema.ts` | MODIFY | Remove eventId field |
| `schemas/index.ts` | MODIFY | Update exports, remove event imports |

### Functions (Backend)

| File | Action | Notes |
|------|--------|-------|
| `src/repositories/session.ts` | MODIFY | Remove eventId handling |
| `src/repositories/job.ts` | VERIFY | Check for eventId references |
| `src/services/*` | VERIFY | Check for event fetches |
| `scripts/migrations/042-flatten-events.ts` | CREATE | Migration script |

### Apps/Clementine-App (Frontend)

#### Routes
| File | Action | Notes |
|------|--------|-------|
| `routes/workspace/$workspaceSlug.projects/$projectId.events/*` | DELETE | All files |
| `routes/workspace/$workspaceSlug.projects/$projectId.tsx` | MODIFY | Add designer layout |
| `routes/workspace/$workspaceSlug.projects/$projectId.welcome.tsx` | CREATE | From event route |
| `routes/workspace/$workspaceSlug.projects/$projectId.share.tsx` | CREATE | From event route |
| `routes/workspace/$workspaceSlug.projects/$projectId.theme.tsx` | CREATE | From event route |
| `routes/workspace/$workspaceSlug.projects/$projectId.settings.tsx` | CREATE | From event route |

#### Domains
| File | Action | Notes |
|------|--------|-------|
| `domains/event/` | RENAME | → `domains/project-config/` |
| `domains/project/shared/hooks/useProject.ts` | MODIFY | Return full config |
| `domains/project/shared/queries/project.query.ts` | MODIFY | Include config in response |
| `domains/project/events/*` | DELETE | Event CRUD hooks no longer needed |
| `domains/project-config/**/*` | MODIFY | Remove eventId param from all hooks |

### Firebase

| File | Action | Notes |
|------|--------|-------|
| `firebase/firestore.rules` | MODIFY | Remove events match block |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed eventId references | Medium | Low | TypeScript strict mode catches all |
| Guest flow broken | Low | High | Manual E2E testing before deploy |
| Preview flow broken | Low | Medium | Test admin preview after migration |
| Migration data loss | Low | High | Read-only first pass, verify before write |
| Performance regression | Low | Low | Actually improves (fewer queries) |

---

## Open Questions (Resolved)

1. **Q: Should we keep eventId in sessions for analytics?**
   A: No. Sessions have projectId which is sufficient for analytics grouping.

2. **Q: Should we version the migration?**
   A: No. Single atomic migration, no need for versioning.

3. **Q: What about in-progress sessions during migration?**
   A: Sessions are self-contained. Migration updates project, sessions continue working.
