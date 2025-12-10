# Data Model: Theming Module

**Feature Branch**: `023-theming-module`
**Created**: 2025-12-10

## Overview

The theming module defines TypeScript interfaces for visual styling configuration. These are **client-side types only** - no Firestore collections are created. The types are consumed by Projects and Events features which handle persistence.

## Entity Definitions

### Theme (Core Entity)

The root styling configuration used by Projects and Events.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primaryColor` | `string` | Yes | Anchor color in hex format (#RRGGBB) |
| `fontFamily` | `string \| null` | No | CSS font-family string |
| `text` | `ThemeText` | Yes | Text styling configuration |
| `button` | `ThemeButton` | Yes | Button styling configuration |
| `background` | `ThemeBackground` | Yes | Background styling configuration |

**Note**: `logoUrl` is intentionally excluded - it's an identity concern handled separately by consuming features.

### ThemeText

Text styling configuration nested within Theme.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `color` | `string` | Yes | Text color in hex format (#RRGGBB) |
| `alignment` | `"left" \| "center" \| "right"` | Yes | Text alignment |

### ThemeButton

Button styling configuration nested within Theme.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `backgroundColor` | `string \| null` | No | Button background in hex; falls back to `primaryColor` if null |
| `textColor` | `string` | Yes | Button text color in hex format |
| `radius` | `"none" \| "sm" \| "md" \| "full"` | Yes | Border radius preset |

### ThemeBackground

Background styling configuration nested within Theme.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `color` | `string` | Yes | Background color in hex format (#RRGGBB) |
| `image` | `string \| null` | No | Full public URL to background image |
| `overlayOpacity` | `number` | Yes | Overlay opacity from 0 to 1 |

### ThemeContextValue (Runtime)

Context value provided by ThemeProvider, includes computed conveniences.

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `Theme` | The raw theme object |
| `buttonBgColor` | `string` | Resolved button background (falls back to primaryColor) |
| `buttonTextColor` | `string` | Button text color from theme |
| `buttonRadius` | `string` | CSS border-radius value |

## Constants

### BUTTON_RADIUS_MAP

Maps radius preset names to CSS values.

| Preset | CSS Value |
|--------|-----------|
| `none` | `"0"` |
| `sm` | `"0.25rem"` |
| `md` | `"0.5rem"` |
| `full` | `"9999px"` |

## Entity Relationships

```
Theme
├── text: ThemeText
├── button: ThemeButton
└── background: ThemeBackground

Project (features/projects)
└── theme: Theme          ← consumes Theme type
    logoUrl: string       ← identity, not in Theme

Event (features/events)
└── theme: Theme          ← consumes Theme type
    logoUrl: string       ← identity, not in Theme
```

## Validation Rules

| Rule | Entity | Description |
|------|--------|-------------|
| Hex color format | Theme, ThemeText, ThemeButton, ThemeBackground | Colors must be valid hex (#RRGGBB) |
| Overlay range | ThemeBackground | `overlayOpacity` must be 0-1 inclusive |
| Radius enum | ThemeButton | `radius` must be one of: none, sm, md, full |
| Alignment enum | ThemeText | `alignment` must be one of: left, center, right |
| URL format | ThemeBackground | `image` if present must be valid URL |

## State Transitions

N/A - Theme entities are value objects with no state transitions. They are fully replaced on update.

## Migration Notes

### From ProjectTheme/EventTheme

The existing `ProjectTheme` and `EventTheme` types will be replaced with the unified `Theme` type:

1. `logoUrl` moves from nested theme to parent entity (`Project.logoUrl`, `Event.logoUrl`)
2. All other fields remain structurally identical
3. Type aliases can provide backward compatibility during transition

### Backward Compatibility

```typescript
// In features/projects/types/project.types.ts (temporary)
export type { Theme as ProjectTheme } from "@/features/theming";

// In features/events/types/event.types.ts (temporary)
export type { Theme as EventTheme } from "@/features/theming";
```
