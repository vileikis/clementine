# Research: Experiences Feature Refactor

**Date**: 2025-11-25
**Feature**: 002-experiences-refactor

## Overview

This document captures research findings and technical decisions for refactoring the **existing** Experiences feature module (`web/src/features/experiences/`).

**Existing codebase context**:
- 43 files in the experiences module
- Type-specific actions: `photo-create.ts`, `gif-create.ts`, `photo-update.ts`, `gif-update.ts`
- Component hierarchy: `shared/`, `photo/`, `gif/` subdirectories
- Current schema uses `eventId`, `label`, `hidden`, unified `aiConfig`

## Research Tasks

### 1. Firestore Query Pattern for `eventIds` Array

**Question**: Best approach for querying experiences by event ID using `array-contains`.

**Decision**: Use Firestore `array-contains` query operator

**Rationale**:
- Native Firestore support for array membership queries
- Single index on `eventIds` field supports the query
- Returns all experiences where the array contains the specified event ID

**Implementation**:
```typescript
// Query experiences for an event
const experiencesRef = collection(db, 'experiences');
const q = query(experiencesRef, where('eventIds', 'array-contains', eventId));
```

**Alternatives Considered**:
1. **Subcollection per event** - Rejected: violates normalized design, duplicates data
2. **Event stores experienceIds[]** - Rejected: requires two-step fetch, orphan cleanup on delete

---

### 2. Type-Specific AI Configuration Schema

**Question**: How to structure type-specific AI configs (`aiPhotoConfig` vs `aiVideoConfig`).

**Decision**: Use optional discriminated fields based on experience type

**Rationale**:
- Photo/GIF experiences use `aiPhotoConfig` (image generation models)
- Video experiences use `aiVideoConfig` (video generation models with additional fields)
- GIF uses photo config because it generates frames via image models
- Cleaner validation - each config type has its own schema

**Implementation**:
```typescript
// Photo/GIF experiences
aiPhotoConfig?: {
  enabled: boolean;
  model?: string | null;
  prompt?: string | null;
  referenceImageUrls?: string[] | null;
  aspectRatio?: AspectRatio;
};

// Video experiences
aiVideoConfig?: {
  enabled: boolean;
  model?: string | null;
  prompt?: string | null;
  referenceImageUrls?: string[] | null;
  aspectRatio?: AspectRatio;
  duration?: number | null;
  fps?: number | null;
};
```

**Alternatives Considered**:
1. **Single unified `aiConfig`** - Rejected: video-specific fields (duration, fps) don't apply to photos
2. **Discriminated union at root** - Already using for experience type; nested config keeps it cleaner

---

### 3. Firestore Index Requirements

**Question**: What indexes are needed for the new query patterns?

**Decision**: Single composite index on `eventIds` (array) + `companyId`

**Rationale**:
- Primary query: `where('eventIds', 'array-contains', eventId)` - requires array index
- Secondary query: `where('companyId', '==', companyId)` - simple equality, auto-indexed
- Future: combined queries may need composite index

**Implementation**:
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "experiences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Alternatives Considered**:
1. **No indexes** - Rejected: `array-contains` requires explicit index for ordering
2. **Multiple single-field indexes** - Rejected: composite needed for sorted results

---

### 4. Schema Migration Strategy

**Question**: How to handle existing schema fields during refactor.

**Decision**: Clean break - no backward compatibility

**Rationale**:
- User explicitly stated no backward compatibility required
- Simpler implementation without migration logic
- Legacy code already isolated in `legacy-features/`

**Implementation**:
- Remove fields: `eventId`, `label`, `hidden`
- Add fields: `companyId`, `eventIds[]`, `name`
- Rename: `label` → `name`
- Restructure: `aiConfig` → `aiPhotoConfig`/`aiVideoConfig`

**Alternatives Considered**:
1. **Gradual migration with dual-write** - Rejected: unnecessary complexity, no existing production data
2. **Runtime field transformation** - Rejected: adds ongoing maintenance burden

---

### 5. Storage Asset Cleanup Pattern

**Question**: How to handle storage cleanup when deleting experiences.

**Decision**: Use existing `@/lib/storage/actions.ts` infrastructure

**Rationale**:
- Storage actions already exist and follow established patterns
- Delete action should clean up: previewMediaUrl, referenceImageUrls
- Fire-and-forget cleanup is acceptable (orphaned files are low cost)

**Implementation**:
```typescript
// In deleteExperience action
async function deleteExperience(experienceId: string) {
  const experience = await getExperience(experienceId);

  // Delete storage assets
  if (experience.previewMediaUrl) {
    await deleteStorageFile(experience.previewMediaUrl);
  }
  if (experience.aiPhotoConfig?.referenceImageUrls) {
    await Promise.all(
      experience.aiPhotoConfig.referenceImageUrls.map(deleteStorageFile)
    );
  }

  // Delete Firestore document
  await deleteDoc(doc(db, 'experiences', experienceId));
}
```

**Alternatives Considered**:
1. **Cloud Function trigger** - Rejected: adds infrastructure complexity for simple cleanup
2. **No cleanup** - Rejected: would accumulate orphaned storage files

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Event-Experience relationship | `experience.eventIds[]` with `array-contains` | Simple query, no cascade updates on delete |
| AI config structure | Type-specific (`aiPhotoConfig`/`aiVideoConfig`) | Clean separation of photo vs video fields |
| Firestore indexes | Composite on `eventIds` + `createdAt` | Supports sorted queries by event |
| Migration strategy | Clean break, no backward compatibility | Simplicity, no production data |
| Storage cleanup | Use existing storage actions | Reuse established patterns |

## Open Questions

None - all technical decisions resolved.
