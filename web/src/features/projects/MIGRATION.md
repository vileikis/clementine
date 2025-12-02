# Events Feature - V4 Schema Migration Guide

This document describes breaking changes in the Events feature module when migrating from V3 to V4 schema.

**Migration Date**: November 2024
**Breaking**: YES - No backward compatibility

---

## Overview

The V4 schema implements a normalized Firestore architecture with:
- Flat root collections (no nested subcollections)
- New theme structure with nested configuration objects
- Switchboard pattern for journey control
- Removed deprecated content fields

---

## Schema Changes

### Renamed Fields

| V3 Field | V4 Field | Notes |
|----------|----------|-------|
| `title` | `name` | Event display name |
| `companyId` | `ownerId` | FK to companies collection |

### Status Enum Change

| V3 Value | V4 Value |
|----------|----------|
| `"live"` | `"published"` |

**Note**: `"draft"` and `"archived"` remain unchanged.

### Removed Fields

The following fields have been **completely removed** and are no longer supported:

| Field | Reason |
|-------|--------|
| `welcome` | Moved to Steps module |
| `ending` | Moved to Steps module |
| `share` | Moved to Steps module |
| `experiencesCount` | Denormalized counters removed |
| `sessionsCount` | Denormalized counters removed |
| `readyCount` | Denormalized counters removed |
| `sharesCount` | Denormalized counters removed |

### New Fields

| Field | Type | Description |
|-------|------|-------------|
| `activeJourneyId` | `string \| null` | Switchboard pattern - controls which journey is live |

---

## Theme Structure Changes

### V3 Theme (Flat)

```typescript
theme?: {
  buttonColor?: string;
  buttonTextColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
}
```

### V4 Theme (Nested)

```typescript
theme: {
  logoUrl: string | null;
  fontFamily: string | null;
  primaryColor: string;           // Anchor color for the event
  text: {
    color: string;                // Hex color
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor: string | null;  // Inherits primaryColor if null
    textColor: string;
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string;
    image: string | null;
    overlayOpacity: number;       // 0-1
  };
}
```

---

## API Changes

### Renamed Actions

| V3 Action | V4 Action |
|-----------|-----------|
| `updateEventTitleAction` | `updateEventNameAction` |

### Removed Actions

The following actions have been **removed**:

- `updateEventWelcome()` - Content moved to Steps module
- `updateEventEnding()` - Content moved to Steps module
- `updateEventShare()` - Share config moved to Steps module

### New Actions

| Action | Description |
|--------|-------------|
| `updateEventSwitchboardAction(eventId, activeJourneyId)` | Set/clear active journey |

### Updated Actions

#### `createEventAction`

**V3 Parameters:**
```typescript
{ title: string, companyId: string, buttonColor: string }
```

**V4 Parameters:**
```typescript
{ name: string, ownerId: string, primaryColor: string }
```

#### `listEventsAction`

**V3 Filter:**
```typescript
{ companyId?: string | null }
```

**V4 Filter:**
```typescript
{ ownerId?: string | null }
```

#### `updateEventTheme`

Now supports the full nested theme structure with dot-notation updates:

```typescript
await updateEventTheme(eventId, {
  primaryColor: "#FF5733",
  text: { color: "#000000", alignment: "left" },
  button: { radius: "full" },
  background: { overlayOpacity: 0.8 },
});
```

---

## Component Changes

### Removed Components

- `WelcomeEditor` - Content editing moved to Steps module
- `EndingEditor` - Content editing moved to Steps module

### Updated Components

#### `ThemeEditor`

Completely refactored with:
- `useReducer` for state management
- 7 configuration sections (Identity, Primary Color, Text, Button, Background, Logo, Font)
- Live preview with all theme settings
- Keyboard shortcuts (Cmd+S / Ctrl+S)

#### `EventForm`

Updated field names:
- `title` → `name`
- `companyId` → `ownerId`
- `buttonColor` → `primaryColor`

---

## Type Changes

### Removed Types

- `EventWelcome`
- `EventEnding`
- `EventShareConfig`
- `ShareSocial`

### New Types

```typescript
export interface EventThemeText {
  color: string;
  alignment: "left" | "center" | "right";
}

export interface EventThemeButton {
  backgroundColor?: string | null;
  textColor: string;
  radius: "none" | "sm" | "md" | "full";
}

export interface EventThemeBackground {
  color: string;
  image?: string | null;
  overlayOpacity: number;
}
```

---

## Constants

### Renamed

| V3 | V4 |
|----|-----|
| `TITLE_LENGTH` | `NAME_LENGTH` |

### New

```typescript
export const THEME_DEFAULTS = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#3B82F6",
  text: { color: "#000000", alignment: "center" },
  button: { backgroundColor: null, textColor: "#FFFFFF", radius: "md" },
  background: { color: "#F9FAFB", image: null, overlayOpacity: 0.5 },
};
```

---

## Data Migration

### Firestore Documents

Existing event documents need manual migration:

1. Rename `title` → `name`
2. Rename `companyId` → `ownerId`
3. Change `status: "live"` → `status: "published"`
4. Transform flat `theme` to nested structure
5. Add `activeJourneyId: null`
6. Remove: `welcome`, `ending`, `share`, all counter fields

### No Automatic Migration

This is a **clean break** migration. No backward compatibility layer is provided. All existing data must be manually migrated or recreated.

---

## Import Changes

### Before (V3)

```typescript
import {
  updateEventTitleAction,
  updateEventWelcome,
  updateEventEnding,
} from "@/features/events";
```

### After (V4)

```typescript
import {
  updateEventNameAction,
  updateEventSwitchboardAction,
  updateEventTheme,
  THEME_DEFAULTS,
  type EventThemeText,
  type EventThemeButton,
  type EventThemeBackground,
} from "@/features/events";
```

---

## Standards Compliance

V4 implementation follows all project standards:

- **Zod v4**: Uses `z.url()` not `z.string().url()`
- **Firestore-safe**: All optional fields use `.nullable().optional().default(null)`
- **Dynamic field mapping**: Uses `Object.entries()` for theme updates
- **Dot notation**: Nested Firestore updates use `"theme.text.color"` format
- **Structured errors**: `{ code, message, issues? }` format
- **useReducer**: Complex component state management
