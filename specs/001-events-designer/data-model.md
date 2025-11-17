# Data Model: Events Designer

**Feature**: Events Designer
**Date**: 2025-11-17
**Status**: Complete

## Overview

This feature does **not introduce new data models**. It reuses existing entities (Event, Experience) and focuses on routing and UI improvements. This document describes the existing models used, validation schemas, and state transitions.

---

## Firestore Structure

### Collection Hierarchy

```
/events/{eventId}
└── /experiences/{experienceId}
```

**No changes to Firestore structure**. The feature uses existing subcollection pattern.

---

## TypeScript Interfaces

### Experience (Existing)

**Location**: `web/src/lib/types/firestore.ts`

```typescript
export type ExperienceType = "photo" | "video" | "gif" | "wheel";

export interface Experience {
  id: string;
  eventId: string;

  // Basic configuration
  label: string;              // User-provided name
  type: ExperienceType;       // Experience type
  enabled: boolean;           // Visibility toggle

  // Preview configuration
  previewPath?: string;
  previewType?: PreviewType;

  // Capture configuration
  allowCamera: boolean;
  allowLibrary: boolean;
  maxDurationMs?: number;
  frameCount?: number;
  captureIntervalMs?: number;

  // Overlay configuration
  overlayFramePath?: string;
  overlayLogoPath?: string;

  // AI transformation configuration
  aiEnabled: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[];

  createdAt: number;          // Unix timestamp (ms)
  updatedAt: number;          // Unix timestamp (ms)
}
```

**Fields Used by Events Designer**:
- `label`: Displayed in sidebar, edited in inline form
- `type`: Selected in inline form, determines experience behavior
- `enabled`: Determines if experience appears in guest flow
- `createdAt`: Used for sorting experiences in sidebar
- `id`: Used in dynamic routes (`/experiences/[experienceId]`)

**Fields Not Modified by Events Designer**:
All other fields are managed by the experience editor (existing functionality).

---

## Validation Schemas

### Create Experience Input (Existing - needs enhancement)

**Location**: `web/src/lib/schemas/firestore.ts` (already exists, needs .trim() and error messages)

```typescript
import { z } from "zod";

/**
 * Validation schema for experience creation form.
 * Enforces Constitution Principle III (Type-Safe Development).
 */
export const createExperienceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(50, "Experience name must be 50 characters or less"),

  type: z.enum(["photo", "video", "gif", "wheel"], {
    errorMap: () => ({ message: "Please select an experience type" }),
  }),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
```

**Validation Rules**:
- **label**:
  - Trimmed before validation (handles whitespace-only input - FR-012)
  - Minimum 1 character after trimming
  - Maximum 50 characters (reasonable UI limit)
  - Required field

- **type**:
  - Must be one of: "photo", "video", "gif", "wheel"
  - Required field
  - Custom error message for better UX

**Usage**:
- **Server-side**: Server Actions validate with `schema.safeParse(data)`
- **Client-side**: React Hook Form uses `zodResolver(createExperienceSchema)`

---

## State Transitions

### Experience Creation Flow

```
┌─────────────────┐
│ User navigates  │
│ to /create      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Form displayed  │
│ (empty state)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ User fills name │─────▶│ Submit disabled  │
│ (no type yet)   │      │ (validation fail)│
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ User selects    │─────▶│ Submit enabled   │
│ type            │      │ (validation pass)│
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │ User clicks      │
         │               │ Submit           │
         │               └────────┬─────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │ Server Action    │
         │               │ validates again  │
         │               └────────┬─────────┘
         │                        │
         │          ┌─────────────┴──────────────┐
         │          │                            │
         ▼          ▼                            ▼
┌─────────────────┐              ┌──────────────────────┐
│ Validation fail │              │ Validation pass      │
│ (show errors)   │              │ Create in Firestore  │
└─────────────────┘              └──────────┬───────────┘
                                           │
                                           ▼
                                 ┌──────────────────────┐
                                 │ Firestore creates    │
                                 │ document with ID     │
                                 └──────────┬───────────┘
                                           │
                                           ▼
                                 ┌──────────────────────┐
                                 │ Redirect to          │
                                 │ /experiences/:id     │
                                 └──────────┬───────────┘
                                           │
                                           ▼
                                 ┌──────────────────────┐
                                 │ Experience editor    │
                                 │ loads new experience │
                                 └──────────────────────┘
```

### State Machine

| Current State | Event | Next State | Side Effects |
|---------------|-------|------------|--------------|
| Empty Form | User enters name | Name Filled | Check if type also filled → enable/disable submit |
| Empty Form | User selects type | Type Selected | Check if name also filled → enable/disable submit |
| Name Filled | User selects type | Ready to Submit | Enable submit button |
| Type Selected | User enters name | Ready to Submit | Enable submit button |
| Ready to Submit | User clicks Submit | Submitting | Disable form, show loading |
| Submitting | Server validation fails | Error State | Show error messages, re-enable form |
| Submitting | Server validation passes | Creating | Write to Firestore |
| Creating | Firestore write succeeds | Redirecting | Navigate to `/experiences/:newId` |
| Creating | Firestore write fails | Error State | Show error toast, re-enable form |

---

## Firestore Operations

### Create Experience

**Collection**: `/events/{eventId}/experiences`

**Initial Document Data**:
```typescript
{
  id: <auto-generated>,
  eventId: eventId,

  // From form
  label: trimmed(input.label),
  type: input.type,

  // Defaults
  enabled: true,
  allowCamera: true,
  allowLibrary: true,
  aiEnabled: false,

  // Timestamps
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

**Server Action Pattern**:
```typescript
export async function createExperienceAction(
  eventId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const validated = createExperienceSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.flatten() };
  }

  // 2. Create in Firestore
  const docRef = await addDoc(
    collection(db, "events", eventId, "experiences"),
    {
      eventId,
      label: validated.data.label,
      type: validated.data.type,
      enabled: true,
      allowCamera: true,
      allowLibrary: true,
      aiEnabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  );

  // 3. Increment experiencesCount on parent event
  await updateDoc(doc(db, "events", eventId), {
    experiencesCount: increment(1),
  });

  return { success: true, data: { id: docRef.id } };
}
```

### Read Experiences (Real-time)

**Query**: `query(collection(db, "events", eventId, "experiences"), orderBy("createdAt", "asc"))`

**Subscription Location**: Design layout component (persists across routes)

**Purpose**: Populate sidebar experiences list with real-time updates

---

## Type Safety Matrix

| Input Source | Validation | TypeScript Type | Zod Schema |
|--------------|------------|-----------------|------------|
| Form (client) | Optional (UX) | `CreateExperienceInput` | `createExperienceSchema` |
| Server Action | **Required** | `unknown` → validated | `createExperienceSchema.safeParse()` |
| Firestore read | Type assertion | `Experience` | N/A (trusted source) |
| Route params | Runtime check | `{ eventId: string, experienceId: string }` | URL validation in page component |

**Constitution Compliance**:
- ✅ **TSR-001**: Form validated with Zod schema
- ✅ **TSR-002**: Route params validated (`notFound()` if invalid)
- ✅ **TSR-003**: Experience type restricted to enum values

---

## Migration Notes

**No database migration required**. The Experience model already exists with all necessary fields.

**Existing Data Compatibility**:
- All existing experiences will work with new routing
- Existing Server Actions (`createExperience`, `updateExperience`, `deleteExperience`) remain functional
- Sidebar will display all existing experiences immediately

---

## Testing Considerations

### Unit Tests

- **createExperienceSchema**:
  - ✅ Valid input (name + type)
  - ✅ Empty name (should fail)
  - ✅ Whitespace-only name (should fail after trim)
  - ✅ Missing type (should fail)
  - ✅ Invalid type value (should fail)
  - ✅ Name >50 characters (should fail)

- **createExperienceAction**:
  - ✅ Valid input creates document
  - ✅ Invalid input returns error
  - ✅ increments experiencesCount
  - ✅ Returns document ID on success

### Integration Tests

- **Experience creation flow**:
  - ✅ Submit disabled until both fields valid
  - ✅ Submit enabled when both fields valid
  - ✅ Successful creation redirects to editor
  - ✅ Firestore error shows toast
  - ✅ New experience appears in sidebar

---

## Summary

- **No new data models**: Reuses existing Experience interface
- **Validation added**: Zod schema for creation form (Constitution-compliant)
- **State transitions defined**: Clear flow from empty form to created experience
- **Type safety enforced**: Server-side validation mandatory, client-side optional
- **Backward compatible**: No breaking changes to existing data

**Next**: Proceed to contracts/ directory for API contract definitions.
