# Server Actions Contracts: Event Collection Update

**Feature**: 001-event-collection-update
**Date**: 2025-11-19
**Location**: `web/src/features/events/actions/events.ts`

## Overview

This document defines the Server Action contracts for updating Event configuration using the new nested object schema. All Server Actions use Next.js 16 Server Actions pattern with Firebase Admin SDK for writes.

---

## updateEventWelcome

Update welcome screen configuration for an event.

### Signature

```typescript
async function updateEventWelcome(
  eventId: string,
  data: UpdateEventWelcomeInput
): Promise<ActionResult<Event>>
```

### Input Schema

```typescript
const updateEventWelcomeSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  backgroundImage: z.string().url().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

type UpdateEventWelcomeInput = z.infer<typeof updateEventWelcomeSchema>;
```

### Behavior

1. Validate input against `updateEventWelcomeSchema`
2. Verify event exists in Firestore
3. Update `event.welcome` object using Admin SDK
4. Update `event.updatedAt` timestamp
5. Return success result with updated Event or error result

### Response

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

**Success Response**:
```typescript
{
  success: true,
  data: Event // Full updated event document
}
```

**Error Responses**:
| Code | Message | Condition |
|------|---------|-----------|
| `validation_error` | "Invalid input: {details}" | Input fails Zod validation |
| `not_found` | "Event not found" | Event ID doesn't exist |
| `firestore_error` | "Failed to update event" | Firestore write fails |

### Example Usage

```typescript
const result = await updateEventWelcome("event123", {
  title: "Welcome to TechCon 2025!",
  body: "Take a photo and share it with your friends!",
  ctaLabel: "Get Started",
  backgroundColor: "#FFFFFF",
});

if (result.success) {
  console.log("Welcome screen updated:", result.data.welcome);
} else {
  console.error("Update failed:", result.error.message);
}
```

---

## updateEventEnding

Update ending screen configuration for an event.

### Signature

```typescript
async function updateEventEnding(
  eventId: string,
  data: UpdateEventEndingInput
): Promise<ActionResult<Event>>
```

### Input Schema

```typescript
const updateEventEndingSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(500).optional(),
  ctaLabel: z.string().max(50).optional(),
  ctaUrl: z.string().url().optional(),
});

type UpdateEventEndingInput = z.infer<typeof updateEventEndingSchema>;
```

### Behavior

1. Validate input against `updateEventEndingSchema`
2. Verify event exists in Firestore
3. Update `event.ending` object using Admin SDK
4. Update `event.updatedAt` timestamp
5. Return success result with updated Event or error result

### Response

Same structure as `updateEventWelcome`.

### Example Usage

```typescript
const result = await updateEventEnding("event123", {
  title: "Thanks for joining us!",
  body: "Visit our website to learn more.",
  ctaLabel: "Visit Website",
  ctaUrl: "https://example.com",
});
```

---

## updateEventShare

Update share configuration for an event.

### Signature

```typescript
async function updateEventShare(
  eventId: string,
  data: UpdateEventShareInput
): Promise<ActionResult<Event>>
```

### Input Schema

```typescript
const shareSocialSchema = z.enum([
  "instagram", "tiktok", "facebook", "x", "snapchat", "whatsapp", "custom"
]);

const updateEventShareSchema = z.object({
  allowDownload: z.boolean().optional(),
  allowSystemShare: z.boolean().optional(),
  allowEmail: z.boolean().optional(),
  socials: z.array(shareSocialSchema).optional(),
});

type UpdateEventShareInput = z.infer<typeof updateEventShareSchema>;
```

### Behavior

1. Validate input against `updateEventShareSchema`
2. Verify event exists in Firestore
3. Update `event.share` object using Admin SDK
4. Update `event.updatedAt` timestamp
5. Return success result with updated Event or error result

### Response

Same structure as `updateEventWelcome`.

### Example Usage

```typescript
const result = await updateEventShare("event123", {
  allowDownload: true,
  allowSystemShare: true,
  allowEmail: false,
  socials: ["instagram", "tiktok", "facebook"],
});
```

---

## updateEventTheme

Update theme configuration for an event.

### Signature

```typescript
async function updateEventTheme(
  eventId: string,
  data: UpdateEventThemeInput
): Promise<ActionResult<Event>>
```

### Input Schema

```typescript
const updateEventThemeSchema = z.object({
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonTextColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundImage: z.string().url().optional(),
});

type UpdateEventThemeInput = z.infer<typeof updateEventThemeSchema>;
```

### Behavior

1. Validate input against `updateEventThemeSchema`
2. Verify event exists in Firestore
3. Update `event.theme` object using Admin SDK
4. Update `event.updatedAt` timestamp
5. Return success result with updated Event or error result

### Response

Same structure as `updateEventWelcome`.

### Example Usage

```typescript
const result = await updateEventTheme("event123", {
  buttonColor: "#3B82F6",
  buttonTextColor: "#FFFFFF",
  backgroundColor: "#F9FAFB",
  backgroundImage: "https://storage.googleapis.com/...",
});
```

---

## Implementation Requirements

### Server Action Best Practices

All Server Actions MUST follow these requirements:

1. **"use server" directive**: All Server Actions must have `"use server"` at the top of the file
2. **Admin SDK only**: Use Firebase Admin SDK (`web/src/lib/firebase/admin.ts`) for all writes
3. **Zod validation**: Validate all inputs with Zod schemas before processing
4. **Type safety**: Use `ActionResult<T>` return type for consistent error handling
5. **Error handling**: Catch and transform errors into user-friendly messages
6. **Timestamps**: Always update `updatedAt` timestamp on writes
7. **Revalidation**: Call `revalidatePath()` after successful updates to refresh client cache

### Admin SDK Usage

```typescript
import { adminDb } from "@/lib/firebase/admin";

async function updateEventWelcome(
  eventId: string,
  data: UpdateEventWelcomeInput
): Promise<ActionResult<Event>> {
  "use server";

  try {
    // 1. Validate input
    const validated = updateEventWelcomeSchema.parse(data);

    // 2. Get event reference
    const eventRef = adminDb.collection("events").doc(eventId);

    // 3. Update nested object using dot notation
    await eventRef.update({
      "welcome.title": validated.title,
      "welcome.body": validated.body,
      "welcome.ctaLabel": validated.ctaLabel,
      "welcome.backgroundImage": validated.backgroundImage,
      "welcome.backgroundColor": validated.backgroundColor,
      updatedAt: Date.now(),
    });

    // 4. Fetch updated document
    const updatedDoc = await eventRef.get();
    const event = { id: updatedDoc.id, ...updatedDoc.data() } as Event;

    // 5. Revalidate cache
    revalidatePath(`/events/${eventId}`);

    return { success: true, data: event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: { code: "validation_error", message: error.message },
      };
    }
    return {
      success: false,
      error: { code: "firestore_error", message: "Failed to update event" },
    };
  }
}
```

### Partial Updates

All Server Actions support partial updates. Only fields provided in the input will be updated. Omitted fields remain unchanged in Firestore.

**Example**:
```typescript
// Update only title, leave other welcome fields unchanged
await updateEventWelcome("event123", {
  title: "New Welcome Title",
  // body, ctaLabel, etc. remain unchanged
});
```

### Firestore Dot Notation

Use dot notation to update nested object fields individually:

```typescript
// ✅ CORRECT: Update individual nested fields
await eventRef.update({
  "welcome.title": "New Title",
  "welcome.body": "New Body",
  updatedAt: Date.now(),
});

// ❌ WRONG: Replacing entire object deletes omitted fields
await eventRef.update({
  welcome: { title: "New Title" }, // This deletes body, ctaLabel, etc.
  updatedAt: Date.now(),
});
```

---

## Testing Requirements

### Unit Tests

All Server Actions MUST have unit tests covering:

1. **Happy path**: Valid input returns success result
2. **Validation errors**: Invalid input returns validation error
3. **Not found**: Non-existent event ID returns not_found error
4. **Partial updates**: Only provided fields are updated
5. **Timestamp updates**: `updatedAt` is updated on every write

### Test Location

Tests MUST be co-located: `web/src/features/events/actions/events.test.ts`

### Mocking Firebase Admin SDK

```typescript
import { adminDb } from "@/lib/firebase/admin";

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

describe("updateEventWelcome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates welcome screen successfully", async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    const mockGet = jest.fn().mockResolvedValue({
      id: "event123",
      data: () => ({
        title: "TechCon 2025",
        welcome: { title: "New Title" },
      }),
    });

    (adminDb.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: mockUpdate,
        get: mockGet,
      }),
    });

    const result = await updateEventWelcome("event123", {
      title: "New Title",
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      "welcome.title": "New Title",
      updatedAt: expect.any(Number),
    });
  });
});
```

---

## Migration Notes

### Replacing Old Server Actions

The following existing Server Actions will be **REPLACED**:

| Old Action | New Action | Change |
|------------|------------|--------|
| `updateEventWelcome` | `updateEventWelcome` | Update to use `event.welcome.*` instead of flat `welcome*` fields |
| `updateEventEnding` | `updateEventEnding` + `updateEventShare` | Split into two actions: ending and share |
| N/A | `updateEventTheme` | New action for theme configuration |

### Firestore Write Pattern Change

**Old Pattern (flat fields)**:
```typescript
await eventRef.update({
  welcomeTitle: "New Title",
  welcomeDescription: "New Body",
  updatedAt: Date.now(),
});
```

**New Pattern (nested objects with dot notation)**:
```typescript
await eventRef.update({
  "welcome.title": "New Title",
  "welcome.body": "New Body",
  updatedAt: Date.now(),
});
```

---

## Summary

This contract defines 4 Server Actions for updating Event nested objects:

1. ✅ `updateEventWelcome` - Welcome screen configuration
2. ✅ `updateEventEnding` - Ending screen configuration
3. ✅ `updateEventShare` - Share settings
4. ✅ `updateEventTheme` - Theme customization

All actions follow Next.js Server Actions pattern, use Firebase Admin SDK, validate with Zod, and return consistent `ActionResult<T>` responses.
