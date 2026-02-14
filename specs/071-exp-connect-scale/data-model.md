# Data Model: Experience Loading Refactor — Scalable Connect & Fetch

**Branch**: `071-exp-connect-scale` | **Date**: 2026-02-14

## Overview

No new data entities are introduced. This feature refactors how existing entities are queried and consumed. All entities below already exist in the codebase.

## Existing Entities (No Changes)

### Experience

**Collection**: `workspaces/{workspaceId}/experiences`
**Schema**: `packages/shared/src/schemas/experience/experience.schema.ts`

| Field | Type | Notes |
|-------|------|-------|
| id | string | Document ID |
| name | string | Display name (1–100 chars) |
| status | `'active' \| 'deleted'` | Soft-delete pattern |
| profile | `'freeform' \| 'survey' \| 'story'` | Determines slot compatibility |
| media | `{ url: string, ... } \| null` | Thumbnail/cover image |
| createdAt | number | Unix ms — used for ordering |
| updatedAt | number | Unix ms |
| draft | ExperienceConfig | Draft configuration |
| published | ExperienceConfig \| null | Published configuration |

**Relevant Indexes**: `status` + `profile` + `createdAt` (composite index for slot queries).

### MainExperienceReference

**Location**: Embedded in `Project.draftConfig.experiences.main[]`
**Schema**: `packages/shared/src/schemas/project/experiences.schema.ts`

| Field | Type | Notes |
|-------|------|-------|
| experienceId | string | References Experience.id |
| enabled | boolean | Whether shown to guests |
| applyOverlay | boolean | Main slot only |

### ExperienceCardData

**Location**: `apps/clementine-app/src/domains/project-config/welcome/components/ExperienceCard.tsx`
**Purpose**: Minimal projection for preview display

| Field | Type | Notes |
|-------|------|-------|
| id | string | Experience.id |
| name | string | Experience.name |
| thumbnailUrl | string \| null | Experience.media?.url ?? null |

## Query Changes

### Query 1: WelcomeEditorPage — Fetch by IDs (Existing Query, New Consumer)

**Before**: `useExperiencesForSlot(workspaceId, 'main')` — loads all active experiences with compatible profiles.

**After**: `useExperiencesByIds(workspaceId, mainExperienceIds)` — loads only the connected experiences.

**Firestore Query** (unchanged — already exists in `experiencesByIdsQuery`):
```
collection: workspaces/{workspaceId}/experiences
where: documentId() in [id1, id2, ...]
where: status == 'active'
```

**Read Reduction**: From O(all compatible experiences) to O(connected experiences) — typically 1–10 docs.

### Query 2: ConnectExperienceDrawer — Paginated Slot Query (New)

**Before**: Single query loading all compatible experiences.

**After**: Cursor-based paginated query loading `pageSize` experiences per page.

**Firestore Query** (per page):
```
collection: workspaces/{workspaceId}/experiences
where: status == 'active'
where: profile in [SLOT_PROFILES[slot]]
orderBy: createdAt desc
limit: pageSize (default 20)
startAfter: lastDocSnapshot (null for first page)
```

**Required Index**: Already exists — `status` + `profile` + `createdAt desc` composite index is used by the current `useExperiencesForSlot` query.

## Data Flow Changes

### WelcomeEditorPage (Before)

```
useExperiencesForSlot(workspaceId, 'main')
  → ALL active experiences with main-compatible profiles
    → Map to ExperienceCardData[] via experienceMap lookup
      → WelcomeRenderer / WelcomeConfigPanel
```

### WelcomeEditorPage (After)

```
project.draftConfig.experiences.main
  → Extract experienceIds via useMemo
    → useExperiencesByIds(workspaceId, experienceIds)
      → Map to ExperienceCardData[] via experienceMap lookup
        → WelcomeRenderer / WelcomeConfigPanel
```

### ConnectExperienceDrawer (Before)

```
useExperiencesForSlot(workspaceId, slot)
  → ALL active slot-compatible experiences (with real-time listener)
    → Client-side search filter
      → ConnectExperienceItem list
```

### ConnectExperienceDrawer (After)

```
usePaginatedExperiencesForSlot(workspaceId, slot, { pageSize })
  → Page 1 of slot-compatible experiences
    → User clicks "Load More" → Page 2 appended → Page 3...
      → Client-side search filter (across all loaded pages)
        → ConnectExperienceItem list + Load More button
```
