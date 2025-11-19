# Data Model: Remove Scenes Dependency

**Feature**: 001-remove-scenes
**Date**: 2025-11-19
**Status**: Complete

## Overview

This document describes the simplified data model after removing the legacy Scenes architecture. Since this is a **removal** feature, the focus is on documenting what changes to existing entities, not creating new ones.

## Modified Entities

### Event (Modified)

**Firestore Path**: `/events/{eventId}`

**Description**: Root event configuration representing a digital photobooth experience. Previously contained `currentSceneId` field that linked to a scene document. This field is **removed** in the updated schema.

**Schema Changes**:

| Field                          | Type              | Before | After | Notes                                   |
|--------------------------------|-------------------|--------|-------|-----------------------------------------|
| `id`                           | string            | ✓      | ✓     | Unchanged                               |
| `title`                        | string            | ✓      | ✓     | Unchanged                               |
| `brandColor`                   | string            | ✓      | ✓     | Unchanged                               |
| `showTitleOverlay`             | boolean           | ✓      | ✓     | Unchanged                               |
| `status`                       | enum              | ✓      | ✓     | Unchanged                               |
| **`currentSceneId`**           | **string**        | **✓**  | **✗** | **REMOVED - obsolete field**            |
| `companyId`                    | string \| null    | ✓      | ✓     | Unchanged                               |
| `joinPath`                     | string            | ✓      | ✓     | Unchanged                               |
| `qrPngPath`                    | string            | ✓      | ✓     | Unchanged                               |
| `welcomeTitle`                 | string?           | ✓      | ✓     | Unchanged                               |
| `welcomeDescription`           | string?           | ✓      | ✓     | Unchanged                               |
| `welcomeCtaLabel`              | string?           | ✓      | ✓     | Unchanged                               |
| `welcomeBackgroundImagePath`   | string?           | ✓      | ✓     | Unchanged                               |
| `welcomeBackgroundColorHex`    | string?           | ✓      | ✓     | Unchanged                               |
| `endHeadline`                  | string?           | ✓      | ✓     | Unchanged                               |
| `endBody`                      | string?           | ✓      | ✓     | Unchanged                               |
| `endCtaLabel`                  | string?           | ✓      | ✓     | Unchanged                               |
| `endCtaUrl`                    | string?           | ✓      | ✓     | Unchanged                               |
| `shareAllowDownload`           | boolean           | ✓      | ✓     | Unchanged                               |
| `shareAllowSystemShare`        | boolean           | ✓      | ✓     | Unchanged                               |
| `shareAllowEmail`              | boolean           | ✓      | ✓     | Unchanged                               |
| `shareSocials`                 | array             | ✓      | ✓     | Unchanged                               |
| `surveyEnabled`                | boolean           | ✓      | ✓     | Unchanged                               |
| `surveyRequired`               | boolean           | ✓      | ✓     | Unchanged                               |
| `surveyStepsCount`             | number            | ✓      | ✓     | Unchanged                               |
| `surveyStepsOrder`             | array<string>     | ✓      | ✓     | Unchanged                               |
| `experiencesCount`             | number            | ✓      | ✓     | Unchanged                               |
| `sessionsCount`                | number            | ✓      | ✓     | Unchanged                               |
| `readyCount`                   | number            | ✓      | ✓     | Unchanged                               |
| `sharesCount`                  | number            | ✓      | ✓     | Unchanged                               |
| `createdAt`                    | timestamp         | ✓      | ✓     | Unchanged                               |
| `updatedAt`                    | timestamp         | ✓      | ✓     | Unchanged                               |

**Validation Rules**:
- All existing validation remains except `currentSceneId` is no longer validated or required
- Legacy documents may still contain `currentSceneId` in Firestore but application will ignore it

**TypeScript Type Changes**:
```typescript
// BEFORE
export type Event = {
  id: string;
  title: string;
  currentSceneId: string; // REMOVE THIS
  // ... other fields
};

// AFTER
export type Event = {
  id: string;
  title: string;
  // currentSceneId removed
  // ... other fields
};
```

**Zod Schema Changes**:
```typescript
// BEFORE
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  currentSceneId: z.string(), // REMOVE THIS
  // ... other fields
});

// AFTER
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  // currentSceneId removed
  // ... other fields
});
```

---

### Experience (Unchanged, but now primary for AI config)

**Firestore Path**: `/events/{eventId}/experiences/{experienceId}`

**Description**: Interactive experience within an event (photo/video/gif/wheel). This entity **already contains** all AI configuration fields that were previously stored in scenes. No schema changes needed.

**AI Configuration Fields** (already present):

| Field                      | Type              | Required | Description                                  |
|----------------------------|-------------------|----------|----------------------------------------------|
| `aiEnabled`                | boolean           | Yes      | Whether AI transformation is enabled         |
| `aiModel`                  | string?           | No       | AI model to use (e.g., "flux-1.1-pro")       |
| `aiPrompt`                 | string?           | No       | Prompt for AI transformation (max 600 chars) |
| `aiReferenceImagePaths`    | array<string>?    | No       | Storage paths/URLs for reference images      |
| `aiAspectRatio`            | enum              | Yes      | Output aspect ratio ("1:1", "16:9", "9:16")  |

**Status**: NO CHANGES NEEDED - Experience schema is complete and serves as the source of truth for AI configuration.

---

## Removed Entities

### Scene (REMOVED)

**Firestore Path**: `/events/{eventId}/scenes/{sceneId}` - **NO LONGER ACCESSIBLE**

**Description**: Legacy POC structure that previously held AI prompt configuration. Fully deprecated and replaced by Experience entity.

**Previous Schema** (for reference):
```typescript
export type Scene = {
  id: string;
  eventId: string;
  prompt: string | null;              // Moved to Experience.aiPrompt
  referenceImagePath: string | null;  // Moved to Experience.aiReferenceImagePaths
  createdAt: number;
  updatedAt: number;
};
```

**Migration Status**: Not migrated - scenes were a POC that never reached production use. Experience entities already contain the necessary AI configuration.

**Access Control**: Firestore security rules will explicitly deny all reads and writes to `/events/{eventId}/scenes` paths.

---

## Entity Relationships

### Before (with Scenes)

```
Event
├── currentSceneId ───► Scene (AI config: prompt, referenceImagePath)
└── experiences/ (subcollection)
    └── Experience (partial AI config)
```

### After (Scenes removed)

```
Event
└── experiences/ (subcollection)
    └── Experience (complete AI config: aiPrompt, aiReferenceImagePaths, aiModel, aiAspectRatio)
```

**Key Change**: Event no longer references a separate Scene entity. All AI configuration is self-contained within each Experience.

---

## Validation Rules

### Event Validation Changes

**Remove**:
- Validation for `currentSceneId` field (no longer exists)
- Any logic that checks if `currentSceneId` references a valid scene document

**Keep**:
- All other existing event validation rules unchanged

### Experience Validation (No Changes)

Experience validation already includes AI field validation:
- `aiPrompt` max length: 600 characters
- `aiReferenceImagePaths` array of strings (storage paths/URLs)
- `aiAspectRatio` must be one of: "1:1", "16:9", "9:16"

---

## Database Queries Affected

### Queries to Remove

1. **Get Scene**:
   ```typescript
   // REMOVE THIS
   db.collection("events").doc(eventId)
     .collection("scenes").doc(sceneId).get();
   ```

2. **Update Scene**:
   ```typescript
   // REMOVE THIS
   db.collection("events").doc(eventId)
     .collection("scenes").doc(sceneId).update({...});
   ```

3. **List Scenes**:
   ```typescript
   // REMOVE THIS
   db.collection("events").doc(eventId)
     .collection("scenes").get();
   ```

### Queries Using currentSceneId

**Remove** or **update** any queries that:
- Read `currentSceneId` from event documents
- Filter events by `currentSceneId`
- Use `currentSceneId` for navigation or state management

---

## Firestore Security Rules Changes

### Before

```javascript
match /events/{eventId} {
  allow read: if true;
  allow write: if isAdmin();

  match /scenes/{sceneId} {
    allow read: if true;
    allow write: if isAdmin();
  }

  match /experiences/{experienceId} {
    allow read: if true;
    allow write: if isAdmin();
  }
}
```

### After

```javascript
match /events/{eventId} {
  allow read: if true;
  allow write: if isAdmin();

  // Explicitly deny all access to legacy scenes subcollection
  match /scenes/{sceneId} {
    allow read, write: if false;
  }

  match /experiences/{experienceId} {
    allow read: if true;
    allow write: if isAdmin();
  }
}
```

**Rationale**: Explicit `if false` rule prevents any future reads or writes to the scenes subcollection, enforcing deprecation at the security layer.

---

## Migration Strategy

**No data migration required** (as specified in feature requirements).

**Backward Compatibility**:
- Legacy event documents may still contain `currentSceneId` field in Firestore
- Application code will ignore this field (not read, not validated, not written)
- No errors will occur if old events still have `currentSceneId` present

---

## Impact Summary

### Removals
- ✗ Event.currentSceneId field
- ✗ Scene entity (entire subcollection)
- ✗ sceneSchema (Zod validation)
- ✗ Scene TypeScript type
- ✗ All scene-related queries and mutations

### Unchanged
- ✓ Event entity (all other fields remain)
- ✓ Experience entity (already has complete AI config)
- ✓ All other subcollections (sessions, surveySteps, etc.)

### Additions
- ✓ Firestore deny rules for `/events/{eventId}/scenes` paths

---

## Standards Compliance

This data model aligns with:
- **Constitution Principle VI (Firebase Architecture)**: Experience schema in `web/src/lib/schemas/` contains all validation logic
- **Standards: backend/firebase.md**: Security rules follow "allow reads, deny writes" pattern (explicit deny for scenes)
- **Standards: global/conventions.md**: Data model simplification reduces cognitive load and maintenance burden

---

## Next Steps

Proceed to Phase 1 continuation: Generate quickstart.md for developers working with the simplified Event + Experience data model.
