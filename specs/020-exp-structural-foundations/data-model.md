# Data Model: Experience System Structural Foundations

**Feature Branch**: `020-exp-structural-foundations`
**Date**: 2026-01-10

## Overview

This document defines the type definitions and schemas for Phase 0 of the Experience System. These are foundational types that will be used throughout subsequent phases.

---

## Core Types

### ExperienceProfile

Categorizes experiences by their allowed step types.

```typescript
// Schema (Zod)
export const experienceProfileSchema = z.enum([
  'freeform',
  'survey',
  'informational',
])

// Type
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
// = 'freeform' | 'survey' | 'informational'
```

**Profile Step Constraints:**

| Profile | Allowed Step Categories |
|---------|------------------------|
| `freeform` | info, input, capture, transform, share |
| `survey` | info, input, capture, share |
| `informational` | info |

---

### ExperienceSlot

Determines where an experience can be assigned in an event.

```typescript
// Schema (Zod)
export const experienceSlotSchema = z.enum([
  'main',
  'pregate',
  'preshare',
])

// Type
export type ExperienceSlot = z.infer<typeof experienceSlotSchema>
// = 'main' | 'pregate' | 'preshare'
```

**Slot Characteristics:**

| Slot | Cardinality | When Executed |
|------|-------------|---------------|
| `main` | Array (multiple) | After welcome screen |
| `pregate` | Single (optional) | Before welcome screen |
| `preshare` | Single (optional) | After main, before share |

---

### Slot-Profile Compatibility

Mapping of which profiles are allowed in which slots.

```typescript
// Constant
export const SLOT_ALLOWED_PROFILES: Record<ExperienceSlot, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['informational', 'survey'],
  preshare: ['informational', 'survey'],
}

// Validation function
export function isProfileAllowedInSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}
```

---

## Existing Types (Reference)

These types already exist and require no changes.

### Project (from packages/shared)

```typescript
export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  workspaceId: z.string().min(1),
  status: projectStatusSchema,
  activeEventId: z.string().nullable(),  // Already exists
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type Project = z.infer<typeof projectSchema>
```

### Session API Types (from domains/session)

```typescript
export type CreateSessionFn = (input: CreateSessionInput) => Promise<Session>
export type SubscribeSessionFn = (
  sessionId: string,
  callback: (session: Session) => void,
) => () => void
export type UpdateSessionProgressFn = (
  input: UpdateSessionProgressInput,
) => Promise<void>
export type CloseSessionFn = (sessionId: string) => Promise<void>
```

---

## Type Location Map

| Type | File Location | Action |
|------|---------------|--------|
| `ExperienceProfile` | `domains/experience/shared/schemas/experience.schema.ts` | UPDATE |
| `ExperienceSlot` | `domains/experience/shared/schemas/experience.schema.ts` | ADD |
| `SLOT_ALLOWED_PROFILES` | `domains/experience/validation/index.ts` | ADD |
| `isProfileAllowedInSlot` | `domains/experience/validation/index.ts` | ADD |
| `ProfileValidator` | `domains/experience/shared/types/profile.types.ts` | UPDATE |
| `Project` | `packages/shared/src/entities/project/project.schema.ts` | NO CHANGE |
| Session API types | `domains/session/shared/types/session-api.types.ts` | NO CHANGE |

---

## Barrel Export Structure

### domains/experience/index.ts

```typescript
// Re-export everything from shared
export * from './shared'

// Re-export subdomain placeholders
export * from './steps'
export * from './validation'
export * from './runtime'
export * from './editor'
```

### domains/experience/shared/schemas/index.ts

```typescript
export {
  experienceSchema,
  experienceConfigSchema,
  experienceStatusSchema,
  experienceProfileSchema,
  experienceSlotSchema,  // NEW
  type Experience,
  type ExperienceConfig,
  type ExperienceStatus,
  type ExperienceProfile,
  type ExperienceSlot,   // NEW
} from './experience.schema'

export {
  stepConfigSchema,
  // ... other step exports
} from './step-registry.schema'
```

### domains/experience/validation/index.ts (NEW)

```typescript
/**
 * Experience Validation Domain
 *
 * Placeholder for profile validation and slot compatibility.
 * Full implementation in Phase 1 (Data Layer).
 */

export {
  SLOT_ALLOWED_PROFILES,
  isProfileAllowedInSlot,
} from './slot-compatibility'

export {
  validateExperienceProfile,
  profileValidators,
  type ProfileValidator,
  type ProfileValidationResult,
} from '../shared/types/profile.types'
```

---

## Validation Rules

### Profile Validation (Placeholder)

```typescript
export interface ProfileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type ProfileValidator = (
  config: ExperienceConfig,
) => ProfileValidationResult

// Phase 0: All validators pass
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  freeform: () => ({ valid: true, errors: [], warnings: [] }),
  survey: () => ({ valid: true, errors: [], warnings: [] }),
  informational: () => ({ valid: true, errors: [], warnings: [] }),
}
```

---

## Migration Notes

### ExperienceProfile Enum Change

**Before:**
```typescript
z.enum(['freeform', 'main_default', 'pregate_default', 'preshare_default'])
```

**After:**
```typescript
z.enum(['freeform', 'survey', 'informational'])
```

**Impact:**
- No runtime code depends on specific profile values yet
- Profile validators use empty implementations (always pass)
- No Firestore data migration needed (no documents with old values)
