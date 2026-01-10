# Quickstart: Experience System Structural Foundations

**Feature Branch**: `020-exp-structural-foundations`
**Date**: 2026-01-10

## Overview

This guide provides step-by-step instructions for implementing Phase 0 of the Experience System structural foundations.

---

## Prerequisites

- Git checkout of `020-exp-structural-foundations` branch
- Node.js 18+ and pnpm 10.18.1
- VSCode or similar TypeScript-aware editor

---

## Implementation Steps

### Step 1: Update ExperienceProfile Schema

**File**: `apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts`

1. Update the `experienceProfileSchema` enum:

```typescript
// BEFORE
export const experienceProfileSchema = z.enum([
  'freeform',
  'main_default',
  'pregate_default',
  'preshare_default',
])

// AFTER
export const experienceProfileSchema = z.enum([
  'freeform',
  'survey',
  'informational',
])
```

2. Add the `ExperienceSlot` schema below `experienceProfileSchema`:

```typescript
/**
 * Experience Slot enum schema
 *
 * Defines where an experience can be assigned in an event.
 * - main: Primary experiences shown after welcome (array)
 * - pregate: Optional experience before welcome (single)
 * - preshare: Optional experience after main, before share (single)
 */
export const experienceSlotSchema = z.enum([
  'main',
  'pregate',
  'preshare',
])

export type ExperienceSlot = z.infer<typeof experienceSlotSchema>
```

3. Add export to the schemas barrel file.

---

### Step 2: Update Profile Validators

**File**: `apps/clementine-app/src/domains/experience/shared/types/profile.types.ts`

Update the `profileValidators` record to use new profile values:

```typescript
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: createEmptyValidator(),
  survey: createEmptyValidator(),
  informational: createEmptyValidator(),
}
```

---

### Step 3: Create Experience Subdirectories

Create placeholder subdirectories with barrel exports:

#### 3a. Steps Domain

**Create**: `apps/clementine-app/src/domains/experience/steps/index.ts`

```typescript
/**
 * Experience Steps Domain
 *
 * Step registry and step type definitions.
 * Placeholder for Phase 0 - implementation in Phase 8.
 *
 * IMPORT BOUNDARY: This subdomain is internal to experience domain.
 */

// Placeholder exports - will be populated in Phase 8
export {}
```

#### 3b. Validation Domain

**Create**: `apps/clementine-app/src/domains/experience/validation/index.ts`

```typescript
/**
 * Experience Validation Domain
 *
 * Profile validation rules and slot compatibility.
 *
 * IMPORT BOUNDARY: This subdomain is internal to experience domain.
 */

import type { ExperienceProfile, ExperienceSlot } from '../shared/schemas'

/**
 * Slot-to-profile compatibility mapping
 *
 * Defines which profiles are allowed in each slot:
 * - main: freeform, survey (not informational)
 * - pregate: informational, survey (not freeform)
 * - preshare: informational, survey (not freeform)
 */
export const SLOT_ALLOWED_PROFILES: Record<ExperienceSlot, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['informational', 'survey'],
  preshare: ['informational', 'survey'],
}

/**
 * Check if a profile is allowed in a specific slot
 *
 * @param profile - The experience profile to check
 * @param slot - The slot to check against
 * @returns true if the profile is allowed in the slot
 */
export function isProfileAllowedInSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}

// Re-export profile types from shared
export {
  validateExperienceProfile,
  profileValidators,
  type ProfileValidator,
  type ProfileValidationResult,
} from '../shared/types/profile.types'
```

#### 3c. Runtime Domain

**Create**: `apps/clementine-app/src/domains/experience/runtime/index.ts`

```typescript
/**
 * Experience Runtime Domain
 *
 * Runtime engine for executing experience flows.
 * Placeholder for Phase 0 - implementation in Phase 12.
 *
 * IMPORT BOUNDARY: This subdomain is internal to experience domain.
 */

// Placeholder exports - will be populated in Phase 12
export {}
```

#### 3d. Editor Domain

**Create**: `apps/clementine-app/src/domains/experience/editor/index.ts`

```typescript
/**
 * Experience Editor Domain
 *
 * UI components for editing experiences.
 * Placeholder for Phase 0 - implementation in Phase 7.
 *
 * IMPORT BOUNDARY: This subdomain is internal to experience domain.
 */

// Placeholder exports - will be populated in Phase 7
export {}
```

---

### Step 4: Update Experience Domain Barrel Export

**File**: `apps/clementine-app/src/domains/experience/index.ts`

```typescript
/**
 * Experience Domain - Main Barrel Export
 *
 * Entry point for importing from @/domains/experience
 *
 * IMPORT BOUNDARY: This domain is a core capability.
 * - MAY import from: @/shared, @/integrations, @/ui-kit
 * - MUST NOT import from: @/domains/event, @/domains/guest
 *
 * Usage:
 * ```typescript
 * import { Experience, experienceSchema, ExperienceSlot } from '@/domains/experience'
 * ```
 */

export * from './shared'
export * from './steps'
export * from './validation'
export * from './runtime'
export * from './editor'
```

---

### Step 5: Rename WelcomeControls to WelcomeConfigPanel

#### 5a. Rename the file

```bash
cd apps/clementine-app/src/domains/event/welcome/components
mv WelcomeControls.tsx WelcomeConfigPanel.tsx
```

#### 5b. Update the component name in the file

**File**: `WelcomeConfigPanel.tsx`

```typescript
// Update export name
export function WelcomeConfigPanel({ ... }) {
  // ... component body unchanged
}

// Update interface name
export interface WelcomeConfigPanelProps {
  // ... same props
}
```

#### 5c. Update barrel export

**File**: `apps/clementine-app/src/domains/event/welcome/components/index.ts`

```typescript
export { WelcomeConfigPanel } from './WelcomeConfigPanel'
export type { WelcomeConfigPanelProps } from './WelcomeConfigPanel'
// Remove old: export { WelcomeControls } from './WelcomeControls'
```

#### 5d. Update all imports

Find and replace in the codebase:
- `WelcomeControls` → `WelcomeConfigPanel`
- `WelcomeControlsProps` → `WelcomeConfigPanelProps`

Key files to update:
- `WelcomeEditorPage.tsx` (container)
- Any tests referencing the component

---

### Step 6: Rename ThemeControls to ThemeConfigPanel

Same process as Step 5:

#### 6a. Rename the file

```bash
cd apps/clementine-app/src/domains/event/theme/components
mv ThemeControls.tsx ThemeConfigPanel.tsx
```

#### 6b. Update the component and interface names

#### 6c. Update barrel export

#### 6d. Update all imports

Find and replace:
- `ThemeControls` → `ThemeConfigPanel`
- `ThemeControlsProps` → `ThemeConfigPanelProps`

Key files to update:
- `ThemeEditorPage.tsx` (container)

---

### Step 7: Verify Build

Run validation checks:

```bash
cd apps/clementine-app

# Type check
pnpm type-check

# Lint and format
pnpm check

# Start dev server to verify boot
pnpm dev
```

**Success Criteria:**
- TypeScript compilation: zero errors
- ESLint: zero errors
- Application boots without errors
- No circular dependency warnings

---

## Verification Checklist

- [X] ExperienceProfile enum updated to `freeform | survey | informational`
- [X] ExperienceSlot type added
- [X] Profile validators updated for new profiles
- [X] `steps/` subdirectory created with placeholder
- [X] `validation/` subdirectory created with slot compatibility
- [X] `runtime/` subdirectory created with placeholder
- [X] `editor/` subdirectory created with placeholder
- [X] Experience domain barrel export updated
- [X] WelcomeControls → WelcomeConfigPanel (file, component, imports)
- [X] ThemeControls → ThemeConfigPanel (file, component, imports)
- [X] `pnpm type-check` passes
- [X] `pnpm check` passes
- [X] `pnpm dev` boots successfully

---

## Next Steps

After Phase 0 completion:
- Run `/speckit.tasks` to generate implementation tasks
- Phase 1: Experience Data Layer (CRUD operations)
- Phase 2: Event Config Experiences Schema
