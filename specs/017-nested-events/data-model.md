# Data Model: Nested Events

**Feature**: 017-nested-events
**Date**: 2025-12-03

## Overview

Events are time-bound, themed instances nested under Projects. They serve as the container for guest experiences with visual customization.

**Firestore Path**: `/projects/{projectId}/events/{eventId}`

---

## Entities

### Event

Primary entity representing a themed activation within a Project.

```typescript
interface Event {
  id: string;                        // Document ID (auto-generated)
  projectId: string;                 // Parent project ID (from path)
  companyId: string;                 // FK to companies (denormalized)
  name: string;                      // 1-200 characters

  // Optional scheduling (stored, not enforced in Phase 5)
  publishStartAt?: number | null;    // Unix timestamp ms
  publishEndAt?: number | null;      // Unix timestamp ms

  // Linked experiences (embedded array, linking UI deferred)
  experiences: EventExperienceLink[];

  // Visual customization
  theme: EventTheme;

  // Soft delete
  deletedAt?: number | null;         // Unix timestamp ms when deleted

  // Timestamps
  createdAt: number;                 // Unix timestamp ms
  updatedAt: number;                 // Unix timestamp ms
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `companyId`: Required, must match parent Project's companyId
- `experiences`: Default to empty array `[]`
- `theme`: Required, initialized with defaults on creation

---

### EventTheme

Visual customization settings (identical structure to ProjectTheme).

```typescript
interface EventTheme {
  logoUrl?: string | null;           // Full public URL
  fontFamily?: string | null;        // CSS font family string
  primaryColor: string;              // Hex color (#RRGGBB)
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}

interface EventThemeText {
  color: string;                     // Hex color (#RRGGBB)
  alignment: "left" | "center" | "right";
}

interface EventThemeButton {
  backgroundColor?: string | null;   // Hex color, inherits primaryColor if null
  textColor: string;                 // Hex color (#RRGGBB)
  radius: "none" | "sm" | "md" | "full";
}

interface EventThemeBackground {
  color: string;                     // Hex color (#RRGGBB)
  image?: string | null;             // Full public URL
  overlayOpacity: number;            // 0-1
}
```

**Validation Rules**:
- All color fields: Valid hex format `#[0-9A-Fa-f]{6}`
- `overlayOpacity`: Number between 0 and 1
- `logoUrl`, `image`: Valid URL format when provided

---

### EventExperienceLink

Embedded object linking an Event to an Experience.

```typescript
interface EventExperienceLink {
  experienceId: string;              // FK to /experiences/{experienceId}
  label?: string | null;             // Optional display name override
}
```

**Note**: This structure is defined but the linking UI is deferred. Events are initialized with `experiences: []`.

---

## Default Values

```typescript
const DEFAULT_EVENT_THEME: EventTheme = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#6366F1",           // Indigo
  text: {
    color: "#1F2937",                // Gray-800
    alignment: "center",
  },
  button: {
    backgroundColor: null,           // Inherits primaryColor
    textColor: "#FFFFFF",            // White
    radius: "md",
  },
  background: {
    color: "#FFFFFF",                // White
    image: null,
    overlayOpacity: 0.5,
  },
};
```

---

## Relationships

```
Company (1)
    └── Project (*)
            └── Event (*)    ← NEW
                    └── experiences[] → Experience (*)

Project.activeEventId → Event.id (switchboard pattern)
```

**Key Relationships**:
- Event belongs to exactly one Project (subcollection)
- Event has denormalized companyId (must match Project.companyId)
- Event links to 0-N Experiences via embedded array
- Project.activeEventId points to one Event (or null)

---

## Indexes Required

### Composite Indexes

1. **Events by project, excluding deleted, sorted by creation**
   ```
   Collection: /projects/{projectId}/events
   Fields: deletedAt ASC, createdAt DESC
   ```

### Single-Field Indexes

Firestore auto-creates single-field indexes. No additional configuration needed for:
- `companyId` (for company-scoped queries)
- `createdAt` (for sorting)
- `deletedAt` (for soft delete filtering)

---

## State Transitions

Events have no status field. Active state is determined by `Project.activeEventId`:

```
Event created → Not active (Project.activeEventId != this event)
                    ↓
Set as active → Active (Project.activeEventId = this event)
                    ↓
Another event set active → Not active
                    ↓
Soft deleted → deletedAt set, removed from UI
```

**Deletion of active event**: When deleting the active event, `Project.activeEventId` must be cleared to `null`.

---

## Migration Notes

### From Phase 4 to Phase 5

1. **No breaking changes to Project schema**
   - `theme` field remains on Project (backwards compatibility)
   - `publishStartAt`, `publishEndAt` remain on Project
   - These will be removed in a future cleanup phase

2. **activeEventId semantics change**
   - Phase 4: Points to Experience ID
   - Phase 5: Points to nested Event ID
   - Apps using Phase 4 semantics will need updates

3. **New Events subcollection**
   - No migration of existing data required
   - New collection starts empty
   - First Event created for each Project initializes the hierarchy
