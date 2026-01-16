# Data Model: Themed Experience Cards

**Feature**: 027-themed-exp-cards
**Date**: 2026-01-15

## Overview

This feature does not introduce new data models or modify existing schemas. It refactors the presentation layer only.

## Existing Entities Used

### Experience (unchanged)

**Location**: `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`

Relevant fields for ExperienceCard:
```typescript
{
  id: string,              // Unique identifier
  name: string,            // Display name (1-100 chars)
  media: {                 // Optional thumbnail
    mediaAssetId: string,
    url: string            // Full public URL
  } | null
}
```

### Theme (unchanged)

**Location**: `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`

Relevant fields for ExperienceCard styling:
```typescript
{
  fontFamily: string | null,
  primaryColor: string,       // Hex color for primary accents
  text: {
    color: string,            // Hex color for text
    alignment: 'left' | 'center' | 'right'
  },
  button: {
    textColor: string         // Used for contrast text on primary backgrounds
  }
}
```

## No Schema Changes Required

- ✅ Experience schema provides all needed data (id, name, media)
- ✅ Theme schema provides all needed styling tokens
- ✅ No new fields or entities needed
- ✅ No migrations required
