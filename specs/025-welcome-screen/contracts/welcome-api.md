# API Contracts: Welcome Screen Customization

**Feature**: 025-welcome-screen
**Date**: 2024-12-11

## Overview

This document defines the server action contracts for welcome screen customization. All mutations use Next.js Server Actions with Admin SDK (following Constitution Principle VI).

---

## Server Actions

### updateEventWelcomeAction

Updates the welcome screen configuration for an event.

**Location**: `web/src/features/events/actions/events.actions.ts`

**Signature**:

```typescript
export async function updateEventWelcomeAction(
  projectId: string,
  eventId: string,
  data: UpdateEventWelcomeInput
): Promise<ActionResponse<void>>
```

**Input Schema**:

```typescript
// UpdateEventWelcomeInput
{
  title?: string | null;           // Max 100 chars
  description?: string | null;     // Max 500 chars
  mediaUrl?: string | null;        // Valid URL
  mediaType?: "image" | "video" | null;
  layout?: "list" | "grid";
}
```

**Response**:

```typescript
// Success
{
  success: true;
  data: void;
}

// Error
{
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

**Error Codes**:

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User not authenticated or lacks permission |
| `NOT_FOUND` | Event or project not found |
| `VALIDATION_ERROR` | Input failed schema validation |
| `INTERNAL_ERROR` | Unexpected server error |

**Implementation Pattern**:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { updateEventWelcomeSchema } from "../schemas/events.schemas";
import { updateEventWelcome } from "../repositories/events.repository";
import { verifyAdminSecret } from "@/lib/auth/verify-admin";
import { ActionResponse } from "@/lib/types/actions";

export async function updateEventWelcomeAction(
  projectId: string,
  eventId: string,
  data: unknown
): Promise<ActionResponse<void>> {
  try {
    // 1. Verify admin authentication
    const auth = await verifyAdminSecret();
    if (!auth.success) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authorized" },
      };
    }

    // 2. Validate input
    const validated = updateEventWelcomeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validated.error.issues[0]?.message ?? "Invalid input",
        },
      };
    }

    // 3. Update via repository
    await updateEventWelcome(projectId, eventId, validated.data);

    // 4. Revalidate cache
    revalidatePath(`/admin/projects/${projectId}/events/${eventId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateEventWelcomeAction error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update welcome screen" },
    };
  }
}
```

---

## Repository Functions

### updateEventWelcome

Updates welcome fields in Firestore using dot notation.

**Location**: `web/src/features/events/repositories/events.repository.ts`

**Signature**:

```typescript
export async function updateEventWelcome(
  projectId: string,
  eventId: string,
  welcome: UpdateEventWelcomeInput
): Promise<void>
```

**Implementation Pattern**:

```typescript
import { adminDb } from "@/lib/firebase/admin";
import { UpdateEventWelcomeInput } from "../schemas/events.schemas";

export async function updateEventWelcome(
  projectId: string,
  eventId: string,
  welcome: UpdateEventWelcomeInput
): Promise<void> {
  const eventRef = adminDb
    .collection("projects")
    .doc(projectId)
    .collection("events")
    .doc(eventId);

  // Build dot-notation update object
  const updateData: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  // Only include fields that are explicitly provided
  if (welcome.title !== undefined) {
    updateData["welcome.title"] = welcome.title;
  }
  if (welcome.description !== undefined) {
    updateData["welcome.description"] = welcome.description;
  }
  if (welcome.mediaUrl !== undefined) {
    updateData["welcome.mediaUrl"] = welcome.mediaUrl;
  }
  if (welcome.mediaType !== undefined) {
    updateData["welcome.mediaType"] = welcome.mediaType;
  }
  if (welcome.layout !== undefined) {
    updateData["welcome.layout"] = welcome.layout;
  }

  await eventRef.update(updateData);
}
```

---

## Client Hooks

### useEvent (Existing)

Real-time subscription to event data including welcome field.

**Location**: `web/src/features/events/hooks/useEvent.ts`

**No changes required** — The existing hook returns the full Event document which will include the new `welcome` field.

```typescript
// Existing usage
const { event, loading, error } = useEvent(projectId, eventId);

// Access welcome data
const welcome = event?.welcome ?? DEFAULT_EVENT_WELCOME;
```

---

## Type Definitions

### ActionResponse (Existing)

Standard response type for server actions.

**Location**: `web/src/lib/types/actions.ts`

```typescript
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

### UpdateEventWelcomeInput

Input type for welcome updates.

**Location**: `web/src/features/events/schemas/events.schemas.ts`

```typescript
export const updateEventWelcomeSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  layout: z.enum(["list", "grid"]).optional(),
});

export type UpdateEventWelcomeInput = z.infer<typeof updateEventWelcomeSchema>;
```

---

## Usage Example

```typescript
// In WelcomeSection component
import { updateEventWelcomeAction } from "../actions/events.actions";
import { useTransition } from "react";
import { toast } from "sonner";

function WelcomeSection({ event, projectId }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback((welcome: UpdateEventWelcomeInput) => {
    startTransition(async () => {
      const result = await updateEventWelcomeAction(
        projectId,
        event.id,
        welcome
      );

      if (result.success) {
        toast.success("Welcome screen updated");
      } else {
        toast.error(result.error.message);
      }
    });
  }, [projectId, event.id]);

  // ... component implementation
}
```

---

## Validation Rules

### Server-Side (Required)

All input validation happens server-side via Zod schema:

```typescript
const validated = updateEventWelcomeSchema.safeParse(data);
if (!validated.success) {
  return { success: false, error: { code: "VALIDATION_ERROR", ... } };
}
```

### Client-Side (Optional UX)

Client-side validation for immediate feedback:

```typescript
// Character count enforcement
const handleTitleChange = (value: string) => {
  if (value.length <= 100) {
    dispatch({ type: "SET_TITLE", payload: value || null });
  }
};

// Show remaining characters
<span className="text-muted-foreground text-sm">
  {welcome.title?.length ?? 0}/100
</span>
```

---

## Security Considerations

1. **Authentication**: All server actions verify admin authentication via `verifyAdminSecret()`
2. **Authorization**: Actions implicitly verify user has access to the project/event through the auth context
3. **Validation**: All input is validated with Zod before Firestore writes
4. **Sanitization**: String fields are validated for max length; URLs validated for format
5. **No Client Writes**: All Firestore mutations go through Admin SDK (security rules deny client writes)
