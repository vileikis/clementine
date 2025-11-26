# Data Model: Delete Event (Soft Delete)

**Feature**: 007-event-delete
**Date**: 2025-11-26

## Entity Changes

### Event Entity

**Collection**: `/events/{eventId}`

#### Schema Updates

**Before** (current):
```typescript
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: eventStatusSchema,
  ownerId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),
  activeJourneyId: z.string().nullable().optional().default(null),
  theme: eventThemeSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

**After** (updated):
```typescript
export const eventStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);

export const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: eventStatusSchema,
  ownerId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),
  activeJourneyId: z.string().nullable().optional().default(null),
  theme: eventThemeSchema,

  // NEW: Soft delete timestamp
  deletedAt: z.number().nullable().optional().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
});
```

#### Field Details

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | enum | Yes | "draft" | Extended to include "deleted" |
| `deletedAt` | number \| null | No | null | Unix timestamp (ms) when soft deleted |

#### State Transitions

```
┌─────────┐     ┌──────┐     ┌──────────┐
│  draft  │ ──► │ live │ ──► │ archived │
└─────────┘     └──────┘     └──────────┘
     │              │              │
     │              │              │
     ▼              ▼              ▼
┌─────────────────────────────────────────┐
│              deleted                     │
│  (terminal state - no transitions out)   │
└─────────────────────────────────────────┘
```

**Transition Rules**:
- Any status can transition to "deleted"
- "deleted" is a terminal state (no way back in current scope)
- Restore functionality is out of scope

#### Validation Rules

1. **deletedAt must be set when status is "deleted"**:
   - When `status === "deleted"`, `deletedAt` must be a valid Unix timestamp
   - When `status !== "deleted"`, `deletedAt` should be `null`

2. **Event ID validation for delete operation**:
   - Must be non-empty string
   - Must reference existing event document

#### Query Implications

**listEvents Query Change**:
```typescript
// Must filter out deleted events
// Use "in" clause instead of "!=" for Firestore compatibility
query = query.where("status", "in", ["draft", "live", "archived"]);
```

**getEvent Query**:
- No change needed (can still fetch deleted events by ID)
- Useful for potential future restore functionality

## TypeScript Type Updates

### Event Type

**File**: `web/src/features/events/types/event.types.ts`

```typescript
export type EventStatus = "draft" | "live" | "archived" | "deleted";

export interface Event {
  id: string;
  name: string;
  status: EventStatus;
  ownerId: string | null;
  joinPath: string;
  qrPngPath: string;
  publishStartAt?: number | null;
  publishEndAt?: number | null;
  activeJourneyId?: string | null;
  theme: EventTheme;
  deletedAt?: number | null;  // NEW
  createdAt: number;
  updatedAt: number;
}
```

## Migration Notes

### Existing Data

- Existing events have no `deletedAt` field
- Zod schema with `.optional().default(null)` handles missing field gracefully
- No data migration required

### Index Requirements

- No new Firestore indexes required
- Existing `status` field queries will work with new enum value
- The `where("status", "in", [...])` query uses existing index
