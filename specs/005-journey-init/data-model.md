# Data Model: Journey Init

**Feature**: 005-journey-init
**Date**: 2024-11-25

## Entities

### Journey

**Collection Path**: `/journeys/{journeyId}`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | Auto-generated | Firestore document ID |
| `eventId` | string | Yes | - | FK to events collection |
| `name` | string | Yes | - | Display name (1-200 chars) |
| `stepOrder` | string[] | Yes | `[]` | Ordered array of step IDs |
| `tags` | string[] | No | `[]` | Metadata tags (future use) |
| `status` | enum | Yes | `"active"` | `"active"` \| `"deleted"` |
| `deletedAt` | number \| null | Yes | `null` | Unix timestamp ms when deleted |
| `createdAt` | number | Yes | - | Unix timestamp ms |
| `updatedAt` | number | Yes | - | Unix timestamp ms |

**Indexes Required**:
- Composite: `eventId` + `status` + `createdAt` (for filtered list queries)

### Event (Existing - Relevant Fields)

**Collection Path**: `/events/{eventId}`

| Field | Type | Description |
|-------|------|-------------|
| `activeJourneyId` | string \| null | FK to journeys collection (switchboard) |
| `status` | enum | `"draft"` \| `"live"` \| `"archived"` |

## TypeScript Interfaces

### Journey Type

```typescript
// web/src/features/journeys/types/journeys.types.ts

export type JourneyStatus = "active" | "deleted";

export interface Journey {
  id: string;
  eventId: string;
  name: string;
  stepOrder: string[];
  tags: string[];
  status: JourneyStatus;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

## Zod Schemas

### Document Schema (Firestore)

```typescript
// web/src/features/journeys/schemas/journeys.schemas.ts

import { z } from "zod";
import { JOURNEY_CONSTRAINTS } from "../constants";

export const journeyStatusSchema = z.enum(["active", "deleted"]);

export const journeySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string()
    .min(JOURNEY_CONSTRAINTS.NAME_LENGTH.min)
    .max(JOURNEY_CONSTRAINTS.NAME_LENGTH.max),
  stepOrder: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: journeyStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type JourneySchema = z.infer<typeof journeySchema>;
```

### Input Validation Schemas

```typescript
// Create journey input
export const createJourneyInput = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z.string()
    .min(JOURNEY_CONSTRAINTS.NAME_LENGTH.min, "Journey name is required")
    .max(JOURNEY_CONSTRAINTS.NAME_LENGTH.max, "Journey name too long")
    .transform((val) => val.trim()),
});

export type CreateJourneyInput = z.infer<typeof createJourneyInput>;
```

## Constants

```typescript
// web/src/features/journeys/constants.ts

export const JOURNEY_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 200 },
} as const;
```

## Relationships

```
┌─────────────┐         ┌─────────────┐
│   Event     │         │   Journey   │
├─────────────┤         ├─────────────┤
│ id          │◄───────┐│ id          │
│ activeJourneyId ──────┤│ eventId ────┼──► Event.id
│ status      │         ││ name        │
│ ...         │         ││ stepOrder   │
└─────────────┘         ││ status      │
                        │└─────────────┘
                        │
                        │  (1:many)
                        │  One Event has many Journeys
                        │
                        │  (1:0..1)
                        │  One Event has zero or one active Journey
```

## State Transitions

### Journey Status

```
                 ┌─────────┐
     create() ──►│  active │
                 └────┬────┘
                      │
                delete()
                      │
                      ▼
                 ┌─────────┐
                 │ deleted │
                 └─────────┘
```

**Note**: No transition from `deleted` back to `active` in this phase (undelete is out of scope).

### Event.activeJourneyId

```
                    ┌──────┐
     initial ──────►│ null │
                    └──┬───┘
                       │
        activateJourney(journeyId)
                       │
                       ▼
                ┌────────────┐
                │ journeyId  │◄─── deactivateJourney()
                └────────────┘     (sets to null)
                       │
                       │
        activateJourney(otherJourneyId)
                       │
                       ▼
                ┌────────────────┐
                │ otherJourneyId │
                └────────────────┘
```

## Validation Rules

### Journey Creation

| Rule | Validation | Error |
|------|------------|-------|
| Name required | `name.length >= 1` | "Journey name is required" |
| Name max length | `name.length <= 200` | "Journey name too long" |
| Event exists | Firestore query | "Event not found" |
| Event not archived | `event.status !== "archived"` | "Cannot create journey for archived event" |

### Journey Deletion

| Rule | Validation | Error |
|------|------------|-------|
| Journey exists | Firestore query | "Journey not found" |
| Not already deleted | `journey.status !== "deleted"` | "Journey not found" |

### Set Active Journey

| Rule | Validation | Error |
|------|------------|-------|
| Event exists | Firestore query | "Event not found" |
| Journey exists (if not null) | Firestore query | "Journey not found" |
| Journey belongs to event | `journey.eventId === eventId` | "Journey not found" |

## Query Patterns

### List Journeys for Event

```typescript
db.collection("journeys")
  .where("eventId", "==", eventId)
  .where("status", "==", "active")
  .orderBy("createdAt", "desc")
  .get()
```

### Get Single Journey

```typescript
const doc = await db.collection("journeys").doc(journeyId).get();
if (!doc.exists || doc.data()?.status === "deleted") {
  return null;
}
```
