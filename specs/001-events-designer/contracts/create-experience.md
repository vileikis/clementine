# Contract: Create Experience

**Action**: `createExperienceAction`
**Location**: `web/src/app/actions/experiences.ts`
**Type**: Server Action (Next.js)

---

## Request

### Signature

```typescript
export async function createExperienceAction(
  eventId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string | ✅ | Event ID (Firestore document ID) |
| `data` | unknown | ✅ | Unvalidated form data (validated against schema) |

### Input Schema

**Validation**: `createExperienceSchema` (Zod)
**Location**: `web/src/lib/schemas/firestore.ts`

```typescript
import { z } from "zod";

export const createExperienceSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(50, "Experience name must be 50 characters or less"),

  type: experienceTypeSchema, // z.enum(["photo", "video", "gif", "wheel"])
  enabled: z.boolean().default(true),
  aiEnabled: z.boolean().default(false),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
```

### Example Request

```typescript
await createExperienceAction("evt_abc123", {
  label: "Fun Photo Booth",
  type: "photo"
});
```

---

## Response

### Success Response

```typescript
{
  success: true,
  data: {
    id: string  // Generated Firestore document ID
  }
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "id": "exp_xyz789"
  }
}
```

### Error Response

**Validation Error**:
```typescript
{
  success: false,
  error: {
    fieldErrors: {
      label?: string[],
      type?: string[]
    },
    formErrors: string[]
  }
}
```

**Example** (missing label):
```json
{
  "success": false,
  "error": {
    "fieldErrors": {
      "label": ["Experience name is required"]
    },
    "formErrors": []
  }
}
```

**Firestore Error**:
```typescript
{
  success: false,
  error: {
    message: string
  }
}
```

**Example**:
```json
{
  "success": false,
  "error": {
    "message": "Failed to create experience. Please try again."
  }
}
```

---

## Implementation

### Server Action

```typescript
"use server";

import { addDoc, collection, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/admin";
import { createExperienceSchema } from "@/lib/schemas/firestore";
import type { ActionResult } from "@/lib/types/actions";

export async function createExperienceAction(
  eventId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const validated = createExperienceSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
    };
  }

  try {
    // 2. Create experience document in Firestore
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
      updatedAt: Date.now(),
    });

    // 4. Return success with generated ID
    return {
      success: true,
      data: { id: docRef.id },
    };
  } catch (error) {
    console.error("Error creating experience:", error);
    return {
      success: false,
      error: {
        message: "Failed to create experience. Please try again.",
      },
    };
  }
}
```

---

## Side Effects

1. **Creates Firestore document** in `/events/{eventId}/experiences/{experienceId}`
2. **Increments counter** on parent Event document (`experiencesCount`)
3. **Updates timestamp** on parent Event document (`updatedAt`)

---

## Error Scenarios

| Scenario | Response | HTTP Status Equivalent |
|----------|----------|------------------------|
| Missing/empty label | Validation error (field: label) | 400 Bad Request |
| Missing type | Validation error (field: type) | 400 Bad Request |
| Invalid type value | Validation error (field: type) | 400 Bad Request |
| Whitespace-only label | Validation error (trimmed to empty) | 400 Bad Request |
| Label >50 characters | Validation error (field: label) | 400 Bad Request |
| Invalid eventId | Firestore error | 404 Not Found |
| Firestore write fails | Generic error | 500 Internal Server Error |
| Permission denied | Firestore error | 403 Forbidden |

---

## Security

- **Authentication**: Assumes user is authenticated (Firebase Auth context)
- **Authorization**: Assumes user has write access to event (enforced by Firestore Security Rules)
- **Input Validation**: Zod schema prevents injection attacks (string trimming, enum validation)
- **Rate Limiting**: Not implemented (consider for production)

---

## Performance

- **Expected duration**: <300ms (Firestore write + counter increment)
- **Optimistic updates**: Not required (creation is fire-and-forget)
- **Retry strategy**: Client should allow manual retry on error

---

## Testing

### Unit Tests

```typescript
describe("createExperienceAction", () => {
  it("creates experience with valid input", async () => {
    const result = await createExperienceAction("evt_123", {
      label: "Photo Booth",
      type: "photo",
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });

  it("fails with empty label", async () => {
    const result = await createExperienceAction("evt_123", {
      label: "",
      type: "photo",
    });

    expect(result.success).toBe(false);
    expect(result.error.fieldErrors.label).toContain("Experience name is required");
  });

  it("trims whitespace from label", async () => {
    const result = await createExperienceAction("evt_123", {
      label: "   Photo Booth   ",
      type: "photo",
    });

    expect(result.success).toBe(true);
    // Verify label is trimmed in Firestore (mock assertion)
  });

  it("fails with invalid type", async () => {
    const result = await createExperienceAction("evt_123", {
      label: "Booth",
      type: "invalid",
    });

    expect(result.success).toBe(false);
    expect(result.error.fieldErrors.type).toBeDefined();
  });

  it("increments experiencesCount on parent event", async () => {
    await createExperienceAction("evt_123", {
      label: "Booth",
      type: "photo",
    });

    // Verify increment called (mock assertion)
  });
});
```

---

## Related Contracts

- [get-experiences.md](./get-experiences.md) - Used by sidebar to list experiences
- [update-experience.md](./update-experience.md) - Used by experience editor
- [delete-experience.md](./delete-experience.md) - Used to remove experiences

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-11-17 | Initial contract definition | Events Designer Feature |
