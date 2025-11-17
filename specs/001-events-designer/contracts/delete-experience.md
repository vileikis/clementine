# Contract: Delete Experience

**Action**: `deleteExperienceAction`
**Location**: `web/src/app/actions/experiences.ts`
**Type**: Server Action (Next.js)
**Status**: Existing (documented for reference)

---

## Request

### Signature

```typescript
export async function deleteExperienceAction(
  eventId: string,
  experienceId: string
): Promise<ActionResult<void>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string | ✅ | Event ID (Firestore document ID) |
| `experienceId` | string | ✅ | Experience ID (Firestore document ID) |

### Example Request

```typescript
await deleteExperienceAction("evt_abc123", "exp_xyz789");
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
    "message": "Failed to delete experience. Please try again."
  }
}
```

---

## Implementation

```typescript
"use server";

import { doc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/admin";
import type { ActionResult } from "@/lib/types/actions";

export async function deleteExperienceAction(
  eventId: string,
  experienceId: string
): Promise<ActionResult<void>> {
  try {
    // 1. Delete experience document
    await deleteDoc(doc(db, "events", eventId, "experiences", experienceId));

    // 2. Decrement experiencesCount on parent event
    await updateDoc(doc(db, "events", eventId), {
      experiencesCount: increment(-1),
      updatedAt: Date.now(),
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting experience:", error);
    return {
      success: false,
      error: {
        message: "Failed to delete experience. Please try again.",
      },
    };
  }
}
```

---

## Side Effects

1. **Deletes Firestore document** from `/events/{eventId}/experiences/{experienceId}`
2. **Decrements counter** on parent Event document (`experiencesCount`)
3. **Updates timestamp** on parent Event document (`updatedAt`)
4. **Triggers real-time update** (sidebar subscription receives deletion)

---

## Cleanup Considerations

**Not handled automatically**:
- Associated assets in Firebase Storage (reference images, overlays, etc.)
- Session data that referenced this experience

**Recommendation**: Consider soft deletion pattern for production (add `deleted: true` flag instead of hard delete)

---

## Notes

- **Existing action**: Already implemented in codebase
- **Used by**: Experience editor delete button
- **Not modified by Events Designer**: Feature uses existing implementation
- **Navigation after delete**: Caller should redirect away from deleted experience route

---

## Related Contracts

- [create-experience.md](./create-experience.md) - Creates new experiences
- [update-experience.md](./update-experience.md) - Updates experiences
- [get-experiences.md](./get-experiences.md) - Lists experiences (receives deletions)
