# Data Model: Welcome Screen Customization

**Feature**: 025-welcome-screen
**Date**: 2024-12-11

## Overview

This document defines the data model changes required to support welcome screen customization on events.

---

## New Types

### ExperienceLayout

Enum type defining how experiences are displayed on the welcome screen.

```typescript
/**
 * Layout options for experience cards on the welcome screen
 */
export type ExperienceLayout = "list" | "grid";
```

| Value | Description | Use Case |
|-------|-------------|----------|
| `list` | Single column, full-width cards stacked vertically | 1-3 experiences, longer names |
| `grid` | Two-column grid of cards | 4+ experiences, visual variety |

### EventWelcome

Configuration for the welcome screen content and layout.

```typescript
/**
 * Welcome screen configuration for an event
 */
export interface EventWelcome {
  /** Custom welcome title. Falls back to event.name in UI if null/empty */
  title?: string | null;

  /** Welcome description displayed below title */
  description?: string | null;

  /** Hero media URL (Firebase Storage public URL) */
  mediaUrl?: string | null;

  /** Type of hero media for proper rendering */
  mediaType?: "image" | "video" | null;

  /** Layout for experience cards */
  layout: ExperienceLayout;
}
```

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `title` | `string \| null` | No | Max 100 characters | `null` (falls back to event name) |
| `description` | `string \| null` | No | Max 500 characters | `null` |
| `mediaUrl` | `string \| null` | No | Valid URL | `null` |
| `mediaType` | `"image" \| "video" \| null` | No | Auto-detected from upload | `null` |
| `layout` | `ExperienceLayout` | Yes | `"list"` or `"grid"` | `"list"` |

---

## Updated Types

### Event (Extended)

The Event interface is extended with the `welcome` field.

```typescript
export interface Event {
  id: string;
  projectId: string;
  companyId: string;
  name: string;

  publishStartAt?: number | null;
  publishEndAt?: number | null;

  experiences: EventExperienceLink[];
  extras: EventExtras;
  theme: Theme;

  /** Welcome screen configuration */
  welcome: EventWelcome;  // NEW

  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

---

## Default Values

```typescript
/**
 * Default welcome configuration for new events
 */
export const DEFAULT_EVENT_WELCOME: EventWelcome = {
  title: null,
  description: null,
  mediaUrl: null,
  mediaType: null,
  layout: "list",
};
```

---

## Zod Schemas

### experienceLayoutSchema

```typescript
import { z } from "zod";

export const experienceLayoutSchema = z.enum(["list", "grid"]);
```

### eventWelcomeSchema

```typescript
export const eventWelcomeSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  layout: experienceLayoutSchema.default("list"),
});
```

### updateEventWelcomeSchema

For partial updates via server action.

```typescript
export const updateEventWelcomeSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaType: z.enum(["image", "video"]).nullable().optional(),
  layout: experienceLayoutSchema.optional(),
});

export type UpdateEventWelcomeInput = z.infer<typeof updateEventWelcomeSchema>;
```

---

## Firestore Schema

### Collection Path

```
/projects/{projectId}/events/{eventId}
```

### Document Structure

```typescript
{
  id: string,
  projectId: string,
  companyId: string,
  name: string,
  publishStartAt: number | null,
  publishEndAt: number | null,
  experiences: EventExperienceLink[],
  extras: {
    preEntryGate: EventExperienceLink | null,
    preReward: EventExperienceLink | null,
  },
  theme: Theme,
  welcome: {                           // NEW FIELD
    title: string | null,
    description: string | null,
    mediaUrl: string | null,
    mediaType: "image" | "video" | null,
    layout: "list" | "grid",
  },
  deletedAt: number | null,
  createdAt: number,
  updatedAt: number,
}
```

---

## Migration Strategy

### New Events

New events created after this feature ships will include the `welcome` field with `DEFAULT_EVENT_WELCOME` values.

```typescript
// In createEvent repository function
const newEvent: Event = {
  // ... existing fields
  welcome: DEFAULT_EVENT_WELCOME,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### Existing Events

Existing events will not have the `welcome` field. The UI and server code must handle missing `welcome` gracefully:

```typescript
// Runtime fallback in UI components
const welcome = event.welcome ?? DEFAULT_EVENT_WELCOME;

// In repository when reading
export function normalizeEvent(data: DocumentData): Event {
  return {
    ...data,
    welcome: data.welcome ?? DEFAULT_EVENT_WELCOME,
  } as Event;
}
```

### Backfill (Optional)

A migration script can be created to backfill existing events with default welcome values. This is optional since the UI handles missing data gracefully.

```typescript
// Optional: Backfill script for existing events
async function backfillWelcomeField() {
  const eventsWithoutWelcome = await db
    .collectionGroup("events")
    .where("welcome", "==", null)
    .get();

  const batch = db.batch();
  eventsWithoutWelcome.docs.forEach(doc => {
    batch.update(doc.ref, {
      welcome: DEFAULT_EVENT_WELCOME,
      updatedAt: Date.now(),
    });
  });

  await batch.commit();
}
```

---

## Relationships

```
Event (1) ──────────── (1) EventWelcome
  │
  └── EventExperienceLink[] ──── (n) Experience
```

- `EventWelcome` is embedded within `Event` (not a separate collection)
- `EventWelcome.layout` affects how `Event.experiences[]` are displayed
- Only enabled experiences (`EventExperienceLink.enabled === true`) are shown in welcome preview

---

## Validation Rules

### Title

- Optional (nullable)
- Maximum 100 characters
- Whitespace-only values should be treated as null

### Description

- Optional (nullable)
- Maximum 500 characters
- Whitespace-only values should be treated as null

### Media URL

- Optional (nullable)
- Must be valid URL when provided
- Should be Firebase Storage public URL format

### Media Type

- Optional (nullable)
- Auto-detected from uploaded file MIME type
- Only set when `mediaUrl` is set

### Layout

- Required
- Must be "list" or "grid"
- Defaults to "list" for new events

---

## Index Requirements

No additional Firestore indexes required. The `welcome` field is only accessed when reading the full event document.
