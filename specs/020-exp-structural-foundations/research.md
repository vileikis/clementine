# Research: Experience System Structural Foundations

**Feature Branch**: `020-exp-structural-foundations`
**Date**: 2026-01-10

## Research Questions

1. How to reconcile existing ExperienceProfile values with spec requirements?
2. How to define ExperienceSlot type and slot-profile compatibility?
3. What is the correct domain boundary for import restrictions?

---

## Question 1: ExperienceProfile Type Alignment

### Current State

The existing `experience.schema.ts` defines:

```typescript
export const experienceProfileSchema = z.enum([
  'freeform',
  'main_default',
  'pregate_default',
  'preshare_default',
])
```

### Spec Requirement

From `epic-experience-system-prd.md` and `arch-experiences-system.md`:

```typescript
type ExperienceProfile = 'freeform' | 'survey' | 'informational'
```

With step category restrictions:
- `freeform`: info, input, capture, transform, share (all steps)
- `survey`: info, input, capture, share (no transform)
- `informational`: info only

### Analysis

The existing profiles (`main_default`, `pregate_default`, `preshare_default`) conflate two concepts:
1. **Profile** - Determines allowed step types
2. **Slot** - Determines where experience can be assigned

The PRD clearly separates these:
- **Profile** defines **what steps** are allowed
- **Slot** defines **where** the experience can be used

### Decision

**Update ExperienceProfile to match PRD specification:**

```typescript
export const experienceProfileSchema = z.enum([
  'freeform',
  'survey',
  'informational',
])
```

### Rationale

1. The PRD explicitly defines these three profiles with clear step constraints
2. The architecture doc confirms this as a frozen decision
3. Slot compatibility is a separate concern handled by `ExperienceSlot`

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Keep existing profiles | Conflates profile and slot concepts, doesn't match PRD |
| Add new profiles alongside existing | Creates confusion, PRD is authoritative |

---

## Question 2: ExperienceSlot Type and Compatibility

### Spec Requirement

From `epic-experience-system-prd.md`:

| Slot | Allowed Profiles | Cardinality |
|------|-----------------|-------------|
| `main` | freeform, survey | Array (multiple) |
| `pregate` | informational, survey | Single (optional) |
| `preshare` | informational, survey | Single (optional) |

### Decision

**Create new ExperienceSlot type:**

```typescript
export const experienceSlotSchema = z.enum(['main', 'pregate', 'preshare'])
export type ExperienceSlot = z.infer<typeof experienceSlotSchema>
```

**Create slot-profile compatibility map (placeholder):**

```typescript
export const SLOT_ALLOWED_PROFILES: Record<ExperienceSlot, ExperienceProfile[]> = {
  main: ['freeform', 'survey'],
  pregate: ['informational', 'survey'],
  preshare: ['informational', 'survey'],
}

export function isProfileAllowedInSlot(
  profile: ExperienceProfile,
  slot: ExperienceSlot
): boolean {
  return SLOT_ALLOWED_PROFILES[slot].includes(profile)
}
```

### Rationale

1. Matches PRD slot definitions exactly
2. Enables validation of experience assignment at compile time
3. Placeholder function allows future expansion of validation logic

---

## Question 3: Import Boundary Rules

### Spec Requirement (FR-012)

From architecture doc:
- `domains/experience` must NOT import from `domains/event` or `domains/guest`
- `domains/session` must NOT import UI from `domains/event` or `domains/guest`

### Decision

**Document import rules in domain index files:**

```typescript
// domains/experience/index.ts
/**
 * Experience Domain
 *
 * IMPORT BOUNDARY: This domain is a core capability.
 * - MAY import from: @/shared, @/integrations, @/ui-kit
 * - MUST NOT import from: @/domains/event, @/domains/guest
 */
```

### Verification Strategy

1. TypeScript compilation will fail on circular imports
2. ESLint rules can be added later if needed
3. Code review checklist includes import boundary verification

---

## Summary of Decisions

| Topic | Decision | Source |
|-------|----------|--------|
| ExperienceProfile values | `'freeform' \| 'survey' \| 'informational'` | PRD Section 3 |
| ExperienceSlot values | `'main' \| 'pregate' \| 'preshare'` | PRD Section 3 |
| Slot-profile compatibility | Map with validation function | PRD Section 3 |
| Import boundaries | Document in domain index files | Architecture doc Section 4 |
| activeEventId | Already exists in project schema | packages/shared (verified) |

---

## Impact on Implementation

### Files to Update

1. `experience.schema.ts` - Update ExperienceProfile enum values
2. `profile.types.ts` - Update profile validators to match new profiles
3. New: `validation/index.ts` - Add slot-profile compatibility

### Files Already Correct

1. `project.schema.ts` - activeEventId already exists
2. `session-api.types.ts` - API shapes already defined

### Files to Create

1. `steps/index.ts` - Placeholder barrel export
2. `validation/index.ts` - Slot compatibility placeholder
3. `runtime/index.ts` - Placeholder barrel export
4. `editor/index.ts` - Placeholder barrel export

### Breaking Changes

None expected. The existing ExperienceProfile values are only used in placeholder code with empty validators. Updating the enum values is a non-breaking change since no runtime code depends on the specific values yet.
