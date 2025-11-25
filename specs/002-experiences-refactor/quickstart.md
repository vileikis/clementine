# Quickstart: Experiences Feature Refactor

**Date**: 2025-11-25
**Feature**: 002-experiences-refactor

## Prerequisites

- Node.js 18+
- pnpm installed
- Firebase project configured
- Access to Clementine codebase

## Getting Started

### 1. Checkout Feature Branch

```bash
git checkout 002-experiences-refactor
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

Navigate to `http://localhost:3000`

## Key Files to Modify

This is a refactor of the **existing** `web/src/features/experiences/` module (43 files).

### 1. Schema Updates (MAJOR)

**File**: `schemas/experiences.schemas.ts`

Changes needed:
- Replace `eventId` with `companyId` + `eventIds[]`
- Replace `label` with `name`
- Remove `hidden` field
- Split `aiConfig` into `aiPhotoConfig` (keep for photo/gif)
- Rename `previewPath` → `previewMediaUrl`
- Rename `config` → `captureConfig`
- Update all type exports

### 2. Server Actions (MODIFY EXISTING)

**Directory**: `actions/`

Files to modify:
- `photo-create.ts` - Update to use `companyId`, `eventIds[]`, `name`
- `photo-update.ts` - Update field names
- `gif-create.ts` - Update to use `companyId`, `eventIds[]`, `name`
- `gif-update.ts` - Update field names
- `shared.ts` - Update delete to use `companyId` auth, add attach/detach actions
- `types.ts` - Update action types
- `photo-media.ts` - Review storage paths

### 3. Repository (MODIFY)

**File**: `repositories/experiences.repository.ts`

Changes needed:
- Update queries to use `eventIds` array-contains instead of subcollection
- Change collection path from subcollection to `/experiences`
- Update `getExperiencesByEventId` to use new query pattern
- Update `subscribeToExperiencesByEventId` to use new query pattern

### 4. Components (FIELD RENAMES)

**Directory**: `components/`

Key files to update:
- `shared/BaseExperienceFields.tsx` - `label` → `name`
- `shared/ExperienceEditor.tsx` - Field name updates
- `shared/ExperiencesList.tsx` - Query updates
- `shared/ExperiencesSidebar.tsx` - Query updates
- `shared/AITransformSettings.tsx` - `aiConfig` → `aiPhotoConfig`
- `photo/PhotoExperienceEditor.tsx` - `aiConfig` → `aiPhotoConfig`
- `gif/GifExperienceEditor.tsx` - `aiConfig` → `aiPhotoConfig`

### 5. Types

**File**: `types/experiences.types.ts`

- Update to match new schema structure

## Validation Commands

Run these before committing:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests
pnpm test
```

## Testing the Feature

### 1. Create Experience

1. Navigate to Event Studio > Design Tab
2. Click "Add Experience" button
3. Fill in name, select type
4. Save and verify:
   - Document created in `/experiences` collection
   - `eventIds` contains current event ID
   - `companyId` matches user's company

### 2. View Experiences

1. Navigate to Event Studio > Design Tab
2. Verify experiences load for current event
3. Check empty state when no experiences exist

### 3. Update Experience

1. Select an experience
2. Modify name or config
3. Save and verify changes persist
4. Check that other events see the update

### 4. Delete Experience

1. Select an experience
2. Click delete
3. Confirm deletion
4. Verify:
   - Document removed from Firestore
   - Storage assets cleaned up
   - Experience no longer appears in any event

## Firestore Index

Add this index in Firebase Console or via CLI:

```json
{
  "collectionGroup": "experiences",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "eventIds", "arrayConfig": "CONTAINS" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Common Issues

### Query Returns No Results

- Ensure Firestore index is deployed
- Check that `eventIds` array contains the event ID
- Verify `companyId` matches user's authorized company

### Type Errors After Schema Update

- Run `pnpm type-check` to identify all type errors
- Update components to use new field names (`name` instead of `label`)
- Update AI config access (`aiPhotoConfig` instead of `aiConfig`)

### Storage Assets Not Deleted

- Check Firebase Storage rules allow delete operations
- Verify storage action has correct file paths
- Check console for storage errors

## Architecture Reference

```
┌─────────────────────────────────────────────────────────────┐
│                     Event Studio UI                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Experience  │  │ Experience  │  │   Experience        │  │
│  │    List     │→ │   Editor    │→ │   Server Actions    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firestore                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  /experiences/{experienceId}                            ││
│  │  ├── companyId: string                                  ││
│  │  ├── eventIds: string[]  ◄── array-contains queries     ││
│  │  ├── name: string                                       ││
│  │  ├── type: photo | video | gif                          ││
│  │  ├── aiPhotoConfig: {...}  (for photo/gif)              ││
│  │  └── aiVideoConfig: {...}  (for video)                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```
