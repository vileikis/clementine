# Data Model: Event Experiences & Extras

**Feature Branch**: `019-event-experiences`
**Date**: 2024-12-04
**Status**: Complete

## Overview

This document defines the data model changes for the Event Experiences & Extras feature. It extends the existing Event entity with enhanced experience linking and introduces a new extras container.

---

## Entity Definitions

### EventExperienceLink (Updated)

Links an Experience to an Event with configuration options. Used for both guest-selectable experiences and extra slots.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `experienceId` | `string` | Yes | - | Foreign key to `/experiences/{experienceId}` |
| `label` | `string \| null` | No | `null` | Optional display name override for this event |
| `enabled` | `boolean` | Yes | `true` | Toggle to enable/disable without removing |
| `frequency` | `ExtraSlotFrequency \| null` | No | `null` | Only used for extras: "always" or "once_per_session" |

**TypeScript Interface**:
```typescript
export type ExtraSlotFrequency = "always" | "once_per_session";

export interface EventExperienceLink {
  experienceId: string;
  label?: string | null;
  enabled: boolean;
  frequency?: ExtraSlotFrequency | null;
}
```

**Usage**:
- **Regular experiences**: `frequency` is `null` or omitted
- **Extras**: `frequency` is required and set to `"always"` or `"once_per_session"`

**Validation Rules**:
- `experienceId` must be a non-empty string
- `label` if provided, should be reasonably short (max 200 chars)
- `enabled` must be a boolean
- `frequency` must be one of the enum values or null

---

### EventExtras (New)

Container for slot-based extra flows that run at specific points in the guest journey.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `preEntryGate` | `EventExperienceLink \| null` | No | `null` | Flow shown before guest starts any experience |
| `preReward` | `EventExperienceLink \| null` | No | `null` | Flow shown after experience but before AI result |

**TypeScript Interface**:
```typescript
export interface EventExtras {
  preEntryGate?: EventExperienceLink | null;
  preReward?: EventExperienceLink | null;
}
```

**Slot Definitions**:

| Slot Key | Display Name | Purpose | Example Use Cases |
|----------|--------------|---------|-------------------|
| `preEntryGate` | Pre-Entry Gate | Runs once before any experience | Age verification, consent forms, house rules |
| `preReward` | Pre-Reward | Runs after experience, before result | Quick survey, feedback, additional info |

---

### Event (Updated)

The main Event entity, updated to include the new `extras` field.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` | Yes | Auto-generated | Firestore document ID |
| `projectId` | `string` | Yes | - | Parent project reference |
| `companyId` | `string` | Yes | - | Company scope |
| `name` | `string` | Yes | - | Event display name |
| `publishStartAt` | `number \| null` | No | `null` | Scheduled start timestamp |
| `publishEndAt` | `number \| null` | No | `null` | Scheduled end timestamp |
| `experiences` | `EventExperienceLink[]` | Yes | `[]` | Guest-selectable experiences (enhanced) |
| `extras` | `EventExtras` | Yes | `{ preEntryGate: null, preReward: null }` | Slot-based extra flows (new) |
| `theme` | `EventTheme` | Yes | Default theme | Visual customization |
| `deletedAt` | `number \| null` | No | `null` | Soft delete timestamp |
| `createdAt` | `number` | Yes | Current timestamp | Creation timestamp |
| `updatedAt` | `number` | Yes | Current timestamp | Last update timestamp |

**TypeScript Interface** (updated fields only):
```typescript
export interface Event {
  // ... existing fields ...
  experiences: EventExperienceLink[];  // Enhanced with enabled field
  extras: EventExtras;                 // NEW field
  // ... existing fields ...
}
```

---

## Firestore Document Structure

**Collection Path**: `/projects/{projectId}/events/{eventId}`

**Example Document**:
```json
{
  "id": "event_abc123",
  "projectId": "proj_xyz789",
  "companyId": "comp_456",
  "name": "Summer Festival 2024",
  "publishStartAt": 1720000000000,
  "publishEndAt": 1720172800000,
  "experiences": [
    {
      "experienceId": "exp_photo_booth",
      "label": "Magic Photo Booth",
      "enabled": true,
      "frequency": null
    },
    {
      "experienceId": "exp_video_message",
      "label": null,
      "enabled": false,
      "frequency": null
    }
  ],
  "extras": {
    "preEntryGate": {
      "experienceId": "exp_age_verify",
      "label": "Age Check",
      "enabled": true,
      "frequency": "always"
    },
    "preReward": {
      "experienceId": "exp_quick_survey",
      "label": null,
      "enabled": true,
      "frequency": "once_per_session"
    }
  },
  "theme": {
    "logoUrl": "https://storage.googleapis.com/...",
    "fontFamily": "Inter",
    "primaryColor": "#FF5733",
    "text": { "color": "#FFFFFF" },
    "button": { "color": "#FFFFFF", "background": "#FF5733" },
    "background": { "type": "solid", "color": "#1A1A1A" }
  },
  "deletedAt": null,
  "createdAt": 1719900000000,
  "updatedAt": 1720050000000
}
```

---

## State Transitions

### Experience Lifecycle in Event

```
Not Attached → Added (enabled: true)
                  ↓
              Disabled (enabled: false) ↔ Enabled (enabled: true)
                  ↓
              Removed (from array)
```

### Extra Slot Lifecycle

```
Empty (null) → Configured (EventExperienceLink)
                    ↓
              Disabled ↔ Enabled (via enabled toggle)
                    ↓
              Cleared (back to null)
```

---

## Relationships

```
Company (1) ──────────────────────────────────────────┐
    │                                                  │
    │ owns                                            │
    ↓                                                  │
Experience (N) ←───────── references ────────┐        │
    │                                         │        │
    └─────────────────────────────────────────┼────────┘
                                              │
Project (1)                                   │
    │                                         │
    │ contains                               │
    ↓                                         │
Event (N)                                     │
    │                                         │
    ├── experiences[] ───────────────────────┘
    │       └── EventExperienceLink
    │               └── experienceId (FK)
    │
    └── extras
            ├── preEntryGate ─────────────────┘
            │       └── EventExperienceLink
            │               └── experienceId (FK)
            └── preReward ────────────────────┘
                    └── EventExperienceLink
                            └── experienceId (FK)
```

---

## Zod Schemas

### Core Schemas

```typescript
/**
 * Frequency options for extra slots
 */
export const extraSlotFrequencySchema = z.enum(["always", "once_per_session"]);

/**
 * Unified Event-Experience link schema
 */
export const eventExperienceLinkSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
  label: z.string().max(200).nullable().optional().default(null),
  enabled: z.boolean().default(true),
  frequency: extraSlotFrequencySchema.nullable().optional().default(null),
});

/**
 * Event Extras schema (slot-based flows)
 */
export const eventExtrasSchema = z.object({
  preEntryGate: eventExperienceLinkSchema.nullable().optional().default(null),
  preReward: eventExperienceLinkSchema.nullable().optional().default(null),
});
```

### Input Schemas (Server Actions)

```typescript
/**
 * Add experience to event input
 */
export const addEventExperienceInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  experienceId: z.string().min(1),
  label: z.string().max(200).nullable().optional(),
});

/**
 * Update event experience input
 */
export const updateEventExperienceInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  experienceId: z.string().min(1),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Remove event experience input
 */
export const removeEventExperienceInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  experienceId: z.string().min(1),
});

/**
 * Set extra slot input
 */
export const setEventExtraInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  slot: z.enum(["preEntryGate", "preReward"]),
  experienceId: z.string().min(1),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional().default(true),
  frequency: extraSlotFrequencySchema,
});

/**
 * Update extra slot input
 */
export const updateEventExtraInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  slot: z.enum(["preEntryGate", "preReward"]),
  label: z.string().max(200).nullable().optional(),
  enabled: z.boolean().optional(),
  frequency: extraSlotFrequencySchema.optional(),
});

/**
 * Remove extra slot input
 */
export const removeEventExtraInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1),
  slot: z.enum(["preEntryGate", "preReward"]),
});
```

---

## Migration Notes

### Backward Compatibility

The existing `experiences` array structure is being enhanced, not replaced:
- **Before**: `{ experienceId: string; label?: string | null }`
- **After**: `{ experienceId: string; label?: string | null; enabled: boolean; frequency?: ExtraSlotFrequency | null }`

**Migration Strategy**:
1. Existing events with `experiences` array will work - Zod schema provides defaults:
   - `enabled` defaults to `true`
   - `frequency` defaults to `null`
2. New `extras` field defaults to `{ preEntryGate: null, preReward: null }`
3. No data migration script needed - Zod handles missing fields at read time

### Event Creation Update

Update `createEvent` in repository to include default extras:
```typescript
const event: Event = {
  // ... existing fields ...
  experiences: [],
  extras: { preEntryGate: null, preReward: null }, // Add this line
  theme: DEFAULT_EVENT_THEME,
  // ... existing fields ...
};
```

---

## Indexes

No additional Firestore indexes required for this feature:
- Events are queried by `projectId` (existing index)
- Experiences are queried by `companyId` and `status` (existing index)
- No queries on `experiences[]` or `extras` fields directly

---

## Security Considerations

1. **Experience Reference Integrity**: When an experience is deleted from the company library, its reference may still exist in event configurations. UI handles this gracefully by showing "Experience not found" with option to remove.

2. **Cross-Company Access**: Server actions validate that the event's `companyId` matches the user's company context, preventing cross-company experience linking.

3. **Admin SDK Only**: All write operations go through server actions using Admin SDK, ensuring security rules are bypassed safely with server-side validation.
