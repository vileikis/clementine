# Data Model: Theme Editor

**Feature**: 003-theme-editor
**Date**: 2025-11-25

## Overview

The Theme Editor manages visual configuration for events. Theme data is stored as a nested object within the Event document in Firestore.

## Entities

### EventTheme (Nested Object)

The theme configuration stored within each Event document.

**Location in Firestore**: `/events/{eventId}.theme`

```typescript
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string;
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}
```

#### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `logoUrl` | `string \| null` | No | `null` | Full public URL to logo in Firebase Storage |
| `fontFamily` | `string \| null` | No | `null` | CSS font-family value (e.g., "Roboto, sans-serif") |
| `primaryColor` | `string` | Yes | N/A | Primary brand color in hex format (#RRGGBB) |
| `text` | `EventThemeText` | Yes | N/A | Text styling configuration |
| `button` | `EventThemeButton` | Yes | N/A | Button styling configuration |
| `background` | `EventThemeBackground` | Yes | N/A | Background styling configuration |

### EventThemeText (Nested Object)

Text appearance settings.

```typescript
interface EventThemeText {
  color: string;
  alignment: "left" | "center" | "right";
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `color` | `string` | Yes | Text color in hex format (#RRGGBB) |
| `alignment` | `enum` | Yes | Text alignment: "left", "center", or "right" |

### EventThemeButton (Nested Object)

Button styling settings.

```typescript
interface EventThemeButton {
  backgroundColor?: string | null;
  textColor: string;
  radius: "none" | "sm" | "md" | "full";
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `backgroundColor` | `string \| null` | No | Inherits `primaryColor` | Button background color in hex format |
| `textColor` | `string` | Yes | N/A | Button text color in hex format |
| `radius` | `enum` | Yes | N/A | Border radius: "none" (0), "sm" (4px), "md" (8px), "full" (9999px) |

### EventThemeBackground (Nested Object)

Background styling settings.

```typescript
interface EventThemeBackground {
  color: string;
  image?: string | null;
  overlayOpacity: number;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `color` | `string` | Yes | N/A | Background color in hex format |
| `image` | `string \| null` | No | `null` | Full public URL to background image |
| `overlayOpacity` | `number` | Yes | N/A | Dark overlay opacity (0-1) for text readability |

## Validation Rules

### Color Format
All color fields must match: `/^#[0-9A-F]{6}$/i`

Examples:
- Valid: `#3B82F6`, `#ffffff`, `#000000`
- Invalid: `#fff`, `rgb(0,0,0)`, `blue`

### Image URLs
- Must be valid URLs (validated with Zod `.url()`)
- Should be full public URLs from Firebase Storage
- Pattern: `https://storage.googleapis.com/{bucket}/{path}`

### Overlay Opacity
- Must be a number between 0 and 1
- 0 = no overlay, 1 = fully opaque overlay

## Storage Locations

### Firebase Storage Buckets

| Destination | Path Pattern | Recommended Size | Max Size |
|-------------|--------------|------------------|----------|
| `logos` | `/logos/{eventId}/{timestamp}_{filename}` | 512x512px | 5MB |
| `backgrounds` | `/backgrounds/{eventId}/{timestamp}_{filename}` | 1080x1920px | 10MB |

### Firestore Update Pattern

Updates use dot notation for partial updates:

```typescript
// Example: Update only primary color
await db.collection("events").doc(eventId).update({
  "theme.primaryColor": "#3B82F6"
});

// Example: Update text settings
await db.collection("events").doc(eventId).update({
  "theme.text.color": "#000000",
  "theme.text.alignment": "center"
});
```

## Default Theme Values

When creating a new event, the following default theme should be applied:

```typescript
const defaultTheme: EventTheme = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#3B82F6", // Blue-500
  text: {
    color: "#000000",
    alignment: "center",
  },
  button: {
    backgroundColor: null, // Inherits primaryColor
    textColor: "#FFFFFF",
    radius: "md",
  },
  background: {
    color: "#F9FAFB", // Gray-50
    image: null,
    overlayOpacity: 0.3,
  },
};
```

## Type Definitions Location

- Primary types: `web/src/features/events/types/event.types.ts`
- Validation schemas: `web/src/features/events/schemas/events.schemas.ts`
