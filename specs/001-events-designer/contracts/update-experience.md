# Contract: Update Experience

**Action**: `updateExperienceAction`
**Location**: `web/src/app/actions/experiences.ts`
**Type**: Server Action (Next.js)
**Status**: Existing (documented for reference)

---

## Request

### Signature

```typescript
export async function updateExperienceAction(
  eventId: string,
  experienceId: string,
  data: Partial<Experience>
): Promise<ActionResult<void>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string | ✅ | Event ID (Firestore document ID) |
| `experienceId` | string | ✅ | Experience ID (Firestore document ID) |
| `data` | Partial<Experience> | ✅ | Fields to update (partial) |

### Example Request

```typescript
await updateExperienceAction("evt_abc123", "exp_xyz789", {
  label: "Updated Photo Booth",
  aiEnabled: true,
  aiPrompt: "Make it look like a vintage polaroid"
});
```

---

## Response

### Success Response

```typescript
{
  success: true,
  data: undefined
}
```

### Error Response

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
    "message": "Failed to update experience. Please try again."
  }
}
```

---

## Implementation

```typescript
"use server";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/admin";
import type { ActionResult } from "@/lib/types/actions";
import type { Experience } from "@/lib/types/firestore";

export async function updateExperienceAction(
  eventId: string,
  experienceId: string,
  data: Partial<Experience>
): Promise<ActionResult<void>> {
  try {
    await updateDoc(
      doc(db, "events", eventId, "experiences", experienceId),
      {
        ...data,
        updatedAt: Date.now(),
      }
    );

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error updating experience:", error);
    return {
      success: false,
      error: {
        message: "Failed to update experience. Please try again.",
      },
    };
  }
}
```

---

## Side Effects

1. **Updates Firestore document** at `/events/{eventId}/experiences/{experienceId}`
2. **Updates timestamp** on Experience document (`updatedAt`)
3. **Triggers real-time update** (sidebar subscription receives update)

---

## Notes

- **Existing action**: Already implemented in codebase
- **Used by**: Experience editor component
- **Validation**: Type-level validation only (TypeScript), no Zod schema
- **Not modified by Events Designer**: Feature uses existing implementation

---

## Related Contracts

- [create-experience.md](./create-experience.md) - Creates new experiences
- [delete-experience.md](./delete-experience.md) - Deletes experiences
- [get-experiences.md](./get-experiences.md) - Lists experiences (receives updates)
