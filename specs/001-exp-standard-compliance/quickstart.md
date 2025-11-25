# Quickstart: Experiences Feature Migration Guide

**Feature**: 001-exp-standard-compliance
**Date**: 2025-11-25
**Purpose**: Guide developers through the experiences feature refactoring

## Overview

This guide documents the folder structure changes for the experiences feature module. The refactoring improves code organization without changing runtime behavior.

## What Changed

### Before vs After Structure

```
BEFORE                              AFTER
───────────────────────────────────────────────────────────────
features/experiences/               features/experiences/
├── actions/                        ├── actions/
│   ├── legacy.ts        ❌ DELETED │   ├── gif-create.ts
│   └── ...                         │   └── ...
├── components/                     ├── components/
│   ├── photo/                      │   ├── photo/
│   │   ├── AITransform  ❌ DELETED │   │   ├── CountdownSettings.tsx
│   │   └── ...                     │   │   ├── index.ts      ✨ NEW
│   ├── gif/                        │   ├── gif/
│   │   └── ...                     │   │   ├── ...
│   │                               │   │   └── index.ts      ✨ NEW
│   └── shared/                     │   └── shared/
│       ├── AITransform  ✓ KEPT    │       ├── AITransformSettings.tsx
│       └── ...                     │       └── index.ts      ✨ NEW
├── hooks/               ❌ DELETED │
├── lib/                 ❌ DELETED ├── repositories/         ✨ NEW
│   ├── constants.ts                │   ├── experiences.repository.ts
│   ├── repository.ts               │   └── index.ts
│   ├── schemas.ts                  ├── schemas/              ✨ NEW
│   └── schemas.test.ts             │   ├── experiences.schemas.ts
│                                   │   ├── experiences.schemas.test.ts
│                                   │   └── index.ts
│                                   ├── types/                ✨ NEW
│                                   │   ├── experiences.types.ts
│                                   │   └── index.ts
│                                   ├── constants.ts          ✨ MOVED
└── index.ts                        └── index.ts
```

## Import Path Changes

### Public API (No Changes)

Continue using the feature's public API for components and types:

```typescript
// ✅ Still works - no changes needed
import { ExperienceEditor, type Experience } from '@/features/experiences';
```

### Repository Access (Path Changed)

```typescript
// ❌ OLD - no longer works
import { getExperience } from '@/features/experiences/lib/repository';

// ✅ NEW - use this instead
import { getExperience } from '@/features/experiences/repositories';
```

### Schema Access (Path Changed)

```typescript
// ❌ OLD - no longer works
import { photoExperienceSchema } from '@/features/experiences/lib/schemas';

// ✅ NEW - use this instead
import { photoExperienceSchema } from '@/features/experiences/schemas';
```

### Internal Feature Imports

If you're working inside the experiences feature:

```typescript
// ❌ OLD - no longer works
import { photoExperienceSchema } from '../lib/schemas';

// ✅ NEW - use this instead
import { photoExperienceSchema } from '../schemas';
```

## Deleted Files

The following files were removed:

| File | Reason |
|------|--------|
| `actions/legacy.ts` | Deprecated code, no longer referenced |
| `components/photo/AITransformSettings.tsx` | Duplicate of shared version |
| `components/photo/AITransformSettings.test.tsx` | Test for deleted component |
| `hooks/` folder | Empty folder with no hooks |
| `lib/` folder | Migrated to dedicated folders |

## New Barrel Exports

Every folder now has an `index.ts` barrel export:

```typescript
// Import from folder, not file
import { PhotoExperienceEditor } from '@/features/experiences/components/photo';
import { GifExperienceEditor } from '@/features/experiences/components/gif';
import { getExperience } from '@/features/experiences/repositories';
import { experienceSchema } from '@/features/experiences/schemas';
import type { Experience } from '@/features/experiences/types';
```

## File Naming Convention

All files now follow `[domain].[purpose].ts` pattern:

| Old Name | New Name |
|----------|----------|
| `repository.ts` | `experiences.repository.ts` |
| `schemas.ts` | `experiences.schemas.ts` |
| `schemas.test.ts` | `experiences.schemas.test.ts` |

## Testing After Migration

Run the validation loop to ensure everything works:

```bash
# From repository root
pnpm type-check    # TypeScript validation
pnpm lint          # ESLint validation
pnpm test          # Jest test suite
```

## Common Issues

### "Cannot find module" Error

If you see this error after the migration:

1. Check if you're using an old import path (see Import Path Changes above)
2. Ensure you're importing from the barrel (`index.ts`) not the file directly
3. Run `pnpm type-check` to identify all broken imports

### Component Not Found

If `AITransformSettings` is not found in `components/photo/`:

```typescript
// ❌ OLD - component was deleted
import { AITransformSettings } from '@/features/experiences/components/photo';

// ✅ NEW - use shared version
import { AITransformSettings } from '@/features/experiences/components/shared';
// or from public API
import { AITransformSettings } from '@/features/experiences';
```

## Questions?

Refer to the standards documentation:
- `standards/global/feature-modules.md` - Feature module structure
- `standards/global/validation.md` - Validation patterns
