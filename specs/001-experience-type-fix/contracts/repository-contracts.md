# Repository Contracts: Experience Repository

**Branch**: `001-experience-type-fix`
**Date**: 2025-11-20
**Phase**: Phase 1 - Design & Contracts

## Overview

This document specifies the contract changes for the Experience repository (`web/src/features/experiences/lib/repository.ts`) after type system consolidation. The repository will use `PhotoExperience` type from `schemas.ts` with Zod validation on all read operations.

## Contract Changes Summary

| Function | Before | After | Breaking Change |
|----------|--------|-------|-----------------|
| `createExperience` | Returns `string` (id) | Returns `string` (id) | No |
| `updateExperience` | Accepts `Partial<Experience>` | Accepts `Partial<PhotoExperience>` | Yes (type change) |
| `deleteExperience` | Returns `Promise<void>` | Returns `Promise<void>` | No |
| `getExperience` | Returns `Experience \| null` | Returns `PhotoExperience \| null` | Yes (type change) |
| `listExperiences` | Returns `Experience[]` | Returns `PhotoExperience[]` | Yes (type change) |

## Function Contracts

### `createExperience`

**Purpose**: Creates a new photo experience document in Firestore.

#### Before
```typescript
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo" | "video" | "gif" | "wheel";
    enabled: boolean;
    aiEnabled: boolean;
  }
): Promise<string>
```

#### After
```typescript
export async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo";  // Literal type (only photo supported)
    enabled: boolean;
  }
): Promise<string>
```

**Changes**:
- Input `data.type` restricted to `"photo"` literal (only photo experiences supported)
- Removed `aiEnabled` from input (now part of nested `aiConfig` with defaults)
- Function creates document with new schema structure (nested `config` and `aiConfig`)

**Default Values** (applied at creation):
```typescript
{
  id: generatedId,
  eventId: eventId,
  label: data.label,
  type: "photo",
  enabled: data.enabled,
  hidden: false,

  config: {
    countdown: 3,
    overlayFramePath: null
  },

  aiConfig: {
    enabled: false,
    model: null,
    prompt: null,
    referenceImagePaths: null,
    aspectRatio: "1:1"
  },

  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

**Breaking**: No (input shape simplified, but compatible)

**Validation**: Input validated by caller (Server Action using `createPhotoExperienceSchema`)

---

### `updateExperience`

**Purpose**: Updates an existing photo experience document.

#### Before
```typescript
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: Partial<Experience>
): Promise<void>
```

#### After
```typescript
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: Partial<PhotoExperience>
): Promise<void>
```

**Changes**:
- Parameter `data` type changed from `Partial<Experience>` to `Partial<PhotoExperience>`
- Accepts nested `config` and `aiConfig` objects instead of flat fields
- No longer accepts legacy fields (`countdownEnabled`, `aiEnabled`, etc.)

**Example Input** (nested structure):
```typescript
await updateExperience("evt_123", "exp_456", {
  label: "Updated Label",
  config: {
    countdown: 5,
    overlayFramePath: "https://..."
  },
  aiConfig: {
    enabled: true,
    model: "nanobanana"
  }
});
```

**Breaking**: Yes (type shape changed - flat to nested)

**Validation**: Input validated by caller (Server Action using `updatePhotoExperienceSchema`)

---

### `deleteExperience`

**Purpose**: Deletes a photo experience document.

#### Before
```typescript
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<void>
```

#### After
```typescript
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<void>
```

**Changes**: None (type-agnostic operation)

**Breaking**: No

**Side Effects**:
- Decrements parent event's `experiencesCount`
- Does NOT delete related media (caller's responsibility via `deletePreviewMedia` action)

---

### `getExperience`

**Purpose**: Retrieves a single photo experience document by ID.

#### Before
```typescript
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<Experience | null>
```

#### After
```typescript
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<PhotoExperience | null>
```

**Changes**:
- Return type changed from `Experience` to `PhotoExperience`
- **NEW**: Adds Zod validation via `photoExperienceSchema.parse()`
- Type assertion (`as Experience`) replaced with runtime validation

**Implementation Pattern**:
```typescript
export async function getExperience(
  eventId: string,
  experienceId: string
): Promise<PhotoExperience | null> {
  const doc = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .doc(experienceId)
    .get();

  if (!doc.exists) {
    return null;
  }

  // ✅ NEW: Validate with Zod schema
  return photoExperienceSchema.parse({
    id: doc.id,
    ...doc.data(),
  });
}
```

**Breaking**: Yes (return type changed)

**Error Behavior**:
- Throws `ZodError` if document doesn't match schema
- Returns `null` if document doesn't exist
- Caller must handle validation errors

---

### `listExperiences`

**Purpose**: Retrieves all photo experiences for an event.

#### Before
```typescript
export async function listExperiences(
  eventId: string
): Promise<Experience[]>
```

#### After
```typescript
export async function listExperiences(
  eventId: string
): Promise<PhotoExperience[]>
```

**Changes**:
- Return type changed from `Experience[]` to `PhotoExperience[]`
- **NEW**: Adds Zod validation via `photoExperienceSchema.parse()` for each document
- Type assertion removed in favor of validation

**Implementation Pattern**:
```typescript
export async function listExperiences(
  eventId: string
): Promise<PhotoExperience[]> {
  const snapshot = await db
    .collection("events")
    .doc(eventId)
    .collection("experiences")
    .orderBy("createdAt", "asc")
    .get();

  // ✅ NEW: Validate each document with Zod schema
  return snapshot.docs.map((doc) =>
    photoExperienceSchema.parse({
      id: doc.id,
      ...doc.data(),
    })
  );
}
```

**Breaking**: Yes (return type changed)

**Error Behavior**:
- Throws `ZodError` if any document doesn't match schema (fails fast)
- Returns empty array `[]` if no experiences exist
- Caller must handle validation errors

## Error Handling

### Zod Validation Errors

**When thrown**:
- `getExperience`: If document exists but schema validation fails
- `listExperiences`: If any document fails schema validation

**Error Type**: `ZodError`

**Error Structure**:
```typescript
{
  issues: [
    {
      code: "invalid_type",
      expected: "number",
      received: "undefined",
      path: ["config", "countdown"],
      message: "Required"
    }
  ]
}
```

**Caller Responsibility**:
- Server Actions: Catch `ZodError` and convert to user-friendly `ActionResponse`
- Components: Should never call repository directly (use Server Actions)

**Example Error Handling** (in Server Action):
```typescript
"use server";

export async function getExperienceAction(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<PhotoExperience>> {
  try {
    const experience = await getExperience(eventId, experienceId);

    if (!experience) {
      return {
        success: false,
        error: "Experience not found"
      };
    }

    return {
      success: true,
      data: experience
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: "Invalid experience data in database"
      };
    }

    return {
      success: false,
      error: "Failed to retrieve experience"
    };
  }
}
```

## Import Changes

### Before
```typescript
import type { Experience } from "../types/experience.types";
```

### After
```typescript
import { photoExperienceSchema, type PhotoExperience } from "./schemas";
```

**Changes**:
- Import from `./schemas` instead of `../types/experience.types`
- Import both schema (for validation) and type (for TypeScript)
- Type import uses `type` keyword (compile-time only)

## Migration Impact

### Affected Callers

**Direct callers** (must be updated):
1. `actions/photo-create.ts` - Already uses new schema
2. `actions/photo-update.ts` - Already uses new schema (will simplify)
3. `actions/shared.ts` - Delete action (type-agnostic, no changes)
4. `actions/legacy.ts` - Deprecated (add warning)

**Indirect callers** (via Server Actions):
- All UI components use Server Actions (no direct repository access)
- No component changes required for repository contract changes

### Testing Requirements

**Unit Tests** (repository layer):
- Create experience with new schema structure
- Update experience with nested `config` and `aiConfig`
- Get experience validates against schema (positive test)
- Get experience throws ZodError for invalid data (negative test)
- List experiences validates all documents (positive test)
- List experiences throws ZodError for any invalid document (negative test)

**Integration Tests** (Server Actions):
- Full CRUD flow with new schema
- Error handling for validation failures
- Verify Firestore documents match schema

## Performance Considerations

### Validation Overhead

**Zod parsing performance**:
- Single document: ~1-5ms per `parse()` call
- List of 10 documents: ~10-50ms total
- List of 100 documents: ~100-500ms total

**Acceptable overhead**: <10ms per document read is negligible compared to Firestore network latency (~50-200ms).

**Optimization**: Not needed at current scale (events rarely have >10 experiences).

### Future Optimization (if needed)

If validation becomes a bottleneck (unlikely):
1. Use `safeParse()` instead of `parse()` (doesn't throw, returns result object)
2. Validate only on mutation (trust database integrity)
3. Cache validated schemas in memory (with TTL)

**Current decision**: Full validation on every read (defense in depth, ensures data integrity).

## Rollback Plan

If type migration causes issues:

1. **Code rollback**: `git revert` all commits in feature branch
2. **Data rollback**: Restore Firestore backup (if created before data wipe)
3. **Partial rollback**: Keep new schema, revert validation if performance issues arise

**Recommended**: Test thoroughly in development before merging to main.

## References

- **Repository Implementation**: `web/src/features/experiences/lib/repository.ts`
- **Schema Definition**: `web/src/features/experiences/lib/schemas.ts`
- **Server Actions**: `web/src/features/experiences/actions/photo-*.ts`
- **Data Model**: `specs/001-experience-type-fix/data-model.md`
- **Research Findings**: `specs/001-experience-type-fix/research.md`
