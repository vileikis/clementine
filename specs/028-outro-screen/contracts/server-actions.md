# Server Actions Contract: Event Outro & Share Configuration

**Feature**: 028-outro-screen
**Date**: 2025-12-15

## Overview

Server Actions for updating Event outro and share configuration. All actions use the Admin SDK for write operations (Constitution Principle VI).

---

## updateEventOutroAction

Updates the outro configuration for an event.

### Signature

```typescript
async function updateEventOutroAction(
  eventId: string,
  projectId: string,
  outro: Partial<EventOutro>
): Promise<ActionResult<void>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | `string` | Yes | The event document ID |
| `projectId` | `string` | Yes | The parent project ID (for collection path) |
| `outro` | `Partial<EventOutro>` | Yes | Partial outro fields to update |

### Request Validation (Zod)

```typescript
const partialEventOutroSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  ctaLabel: z.string().max(50).nullable().optional(),
  ctaUrl: z.string().url().nullable().optional(),
}).partial();
```

### Response

```typescript
// Success
{ success: true, data: undefined }

// Failure
{ success: false, error: string }
```

### Error Cases

| Error | Condition |
|-------|-----------|
| `"Invalid outro data"` | Validation failed (title too long, invalid URL, etc.) |
| `"Event not found"` | Event document doesn't exist |
| `"Unauthorized"` | User doesn't have access to project/event |

### Implementation Notes

- Uses dot-notation updates (`outro.title`, `outro.description`, etc.)
- Updates `updatedAt` timestamp on every save
- Only updates provided fields (partial update)
- Null values clear the field

### Example Usage

```typescript
// In React component
const handleSave = async (updates: Partial<EventOutro>) => {
  const result = await updateEventOutroAction(event.id, event.projectId, updates);
  if (!result.success) {
    toast.error(result.error);
  }
};
```

---

## updateEventShareOptionsAction

Updates the share options configuration for an event.

### Signature

```typescript
async function updateEventShareOptionsAction(
  eventId: string,
  projectId: string,
  shareOptions: Partial<EventShareOptions>
): Promise<ActionResult<void>>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | `string` | Yes | The event document ID |
| `projectId` | `string` | Yes | The parent project ID (for collection path) |
| `shareOptions` | `Partial<EventShareOptions>` | Yes | Partial share options to update |

### Request Validation (Zod)

```typescript
const partialEventShareOptionsSchema = z.object({
  allowDownload: z.boolean().optional(),
  allowSystemShare: z.boolean().optional(),
  allowEmail: z.boolean().optional(),
  socials: z.array(shareSocialSchema).optional(),
}).partial();
```

### Response

```typescript
// Success
{ success: true, data: undefined }

// Failure
{ success: false, error: string }
```

### Error Cases

| Error | Condition |
|-------|-----------|
| `"Invalid share options"` | Validation failed (invalid social platform, etc.) |
| `"Event not found"` | Event document doesn't exist |
| `"Unauthorized"` | User doesn't have access to project/event |

### Implementation Notes

- Uses dot-notation updates (`shareOptions.allowDownload`, etc.)
- Updates `updatedAt` timestamp on every save
- Array fields (socials) replace entire array, not merge
- Only updates provided fields (partial update)

### Example Usage

```typescript
// In React component
const handleShareOptionsChange = async (updates: Partial<EventShareOptions>) => {
  const result = await updateEventShareOptionsAction(event.id, event.projectId, updates);
  if (!result.success) {
    toast.error(result.error);
  }
};
```

---

## Combined Update Action (Alternative)

If the UI updates both outro and shareOptions in the same form, a combined action can be used.

### Signature

```typescript
async function updateEventOutroAndShareAction(
  eventId: string,
  projectId: string,
  updates: {
    outro?: Partial<EventOutro>;
    shareOptions?: Partial<EventShareOptions>;
  }
): Promise<ActionResult<void>>
```

### Implementation Notes

- Batches both updates in single Firestore write
- More efficient if both are updated together
- Individual actions preferred for autosave on separate form sections

---

## Repository Methods

### eventsRepository.updateEventOutro

```typescript
async updateEventOutro(
  eventId: string,
  projectId: string,
  outro: Partial<EventOutro>
): Promise<void> {
  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(outro)) {
    updates[`outro.${key}`] = value;
  }
  updates["updatedAt"] = Date.now();

  await this.eventsCollection(projectId).doc(eventId).update(updates);
}
```

### eventsRepository.updateEventShareOptions

```typescript
async updateEventShareOptions(
  eventId: string,
  projectId: string,
  shareOptions: Partial<EventShareOptions>
): Promise<void> {
  const updates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(shareOptions)) {
    updates[`shareOptions.${key}`] = value;
  }
  updates["updatedAt"] = Date.now();

  await this.eventsCollection(projectId).doc(eventId).update(updates);
}
```

---

## ActionResult Type (existing)

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```
