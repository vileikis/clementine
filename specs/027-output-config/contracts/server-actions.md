# Server Actions Contract: Event Frame Overlay Configuration

**Feature**: 027-output-config
**Date**: 2025-12-15

## Overview

This document defines the server action contracts for overlay configuration. All actions follow the established pattern in `web/src/features/events/actions/events.actions.ts`.

---

## Response Type

All actions return the standard `ActionResponse` type:

```typescript
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

---

## Actions

### updateEventOverlayAction

Updates the overlay configuration for an event. Supports partial updates - only specified fields are updated.

**Location**: `web/src/features/events/actions/events.actions.ts`

#### Signature

```typescript
export async function updateEventOverlayAction(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<ActionResponse<void>>
```

#### Input Schema

```typescript
const updateEventOverlayInputSchema = z.object({
  square: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
  story: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
})

type UpdateEventOverlayInput = z.infer<typeof updateEventOverlayInputSchema>
```

#### Example Requests

**Enable square frame:**
```typescript
await updateEventOverlayAction(projectId, eventId, {
  square: { enabled: true }
})
```

**Upload and enable story frame:**
```typescript
await updateEventOverlayAction(projectId, eventId, {
  story: {
    frameUrl: "https://storage.googleapis.com/...",
    enabled: true
  }
})
```

**Remove square frame:**
```typescript
await updateEventOverlayAction(projectId, eventId, {
  square: {
    frameUrl: null,
    enabled: false
  }
})
```

**Update both aspect ratios:**
```typescript
await updateEventOverlayAction(projectId, eventId, {
  square: { enabled: true },
  story: { enabled: false }
})
```

#### Response

**Success:**
```typescript
{ success: true, data: undefined }
```

**Error - Event not found:**
```typescript
{
  success: false,
  error: { code: "NOT_FOUND", message: "Event not found" }
}
```

**Error - Validation failed:**
```typescript
{
  success: false,
  error: { code: "VALIDATION_ERROR", message: "Invalid overlay configuration" }
}
```

**Error - Unauthorized:**
```typescript
{
  success: false,
  error: { code: "UNAUTHORIZED", message: "Not authorized" }
}
```

#### Implementation Notes

1. Verify admin authentication with `verifyAdminSecret()`
2. Validate input with `updateEventOverlayInputSchema`
3. Call repository function `updateEventOverlay()`
4. Revalidate path: `/[companySlug]/[projectId]/[eventId]/overlays`
5. Return success/error response

---

## Repository Function

### updateEventOverlay

**Location**: `web/src/features/events/repositories/events.repository.ts`

#### Signature

```typescript
export async function updateEventOverlay(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<void>
```

#### Implementation

Uses Firestore dot-notation for partial updates:

```typescript
export async function updateEventOverlay(
  projectId: string,
  eventId: string,
  data: UpdateEventOverlayInput
): Promise<void> {
  const eventRef = getEventRef(projectId, eventId)

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  }

  // Square frame updates
  if (data.square !== undefined) {
    if (data.square.enabled !== undefined) {
      updateData["overlay.frames.square.enabled"] = data.square.enabled
    }
    if (data.square.frameUrl !== undefined) {
      updateData["overlay.frames.square.frameUrl"] = data.square.frameUrl
    }
  }

  // Story frame updates
  if (data.story !== undefined) {
    if (data.story.enabled !== undefined) {
      updateData["overlay.frames.story.enabled"] = data.story.enabled
    }
    if (data.story.frameUrl !== undefined) {
      updateData["overlay.frames.story.frameUrl"] = data.story.frameUrl
    }
  }

  await eventRef.update(updateData)
}
```

---

## Image Upload

Frame images are uploaded using the existing `uploadImage` server action with a new destination type.

### Extended Destinations

**Location**: `web/src/lib/storage/actions.ts`

Add `"frames"` to the allowed destinations:

```typescript
type UploadDestination =
  | "welcome"
  | "experience-preview"
  | "experience-overlay"
  | "ai-reference"
  | "logos"
  | "backgrounds"
  | "frames"  // NEW

export async function uploadImage(
  file: File,
  destination: UploadDestination
): Promise<ActionResponse<{ path: string; url: string }>>
```

### Storage Path

Frames are stored at:
```
media/{companyId}/frames/{timestamp}-{filename}
```

---

## Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| `NOT_FOUND` | 404 | Event does not exist |
| `VALIDATION_ERROR` | 400 | Input schema validation failed |
| `UNAUTHORIZED` | 401 | Admin authentication failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Revalidation Paths

After successful overlay update, revalidate:

```typescript
revalidatePath(`/${companySlug}/${projectId}/${eventId}/overlays`)
```

This ensures the overlays page reflects the latest configuration.
