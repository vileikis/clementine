# Data Model: Event-Experience Integration

**Feature**: 025-event-exp-integration
**Date**: 2026-01-14

## Overview

This document defines the data structures for connecting experiences to events. The model extends the existing `ProjectEventConfig` schema stored in Firestore.

---

## Entities

### 1. ExperienceReference

A pointer to a workspace experience assigned to an event slot.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `experienceId` | string | Yes | - | Reference to experience document ID |
| `enabled` | boolean | No | `true` | Whether experience is active for guests |

**Validation Rules**:
- `experienceId` must be non-empty string
- References `workspaces/{workspaceId}/experiences/{experienceId}`

---

### 2. MainExperienceReference

Extended reference for main slot experiences with overlay control.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `experienceId` | string | Yes | - | Reference to experience document ID |
| `enabled` | boolean | No | `true` | Whether experience is active for guests |
| `applyOverlay` | boolean | No | `true` | Whether event overlay is applied to results |

**Validation Rules**:
- Inherits all ExperienceReference rules
- `applyOverlay` controls whether `overlays` config is applied to guest media

---

### 3. ExperiencesConfig

Container for all experience slot assignments.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `main` | MainExperienceReference[] | No | `[]` | Array of main experiences (0-n) |
| `pregate` | ExperienceReference \| null | No | `null` | Single pregate experience (0-1) |
| `preshare` | ExperienceReference \| null | No | `null` | Single preshare experience (0-1) |

**Validation Rules**:
- `main` can contain 0 or more items (array)
- `pregate` and `preshare` are single-item slots (null or one item)
- Array order in `main` determines display order on welcome screen

---

## Slot Definitions

### Slot Types

| Slot | Cardinality | Allowed Profiles | UI Location | Purpose |
|------|-------------|------------------|-------------|---------|
| `main` | Array (0-n) | freeform, survey | Welcome tab | Primary guest experiences |
| `pregate` | Single (0-1) | survey, story | Settings tab | Pre-welcome flow (data collection, disclaimers) |
| `preshare` | Single (0-1) | survey, story | Settings tab | Post-experience flow (feedback, upsells) |

### Profile Compatibility Matrix

| Profile | main | pregate | preshare |
|---------|------|---------|----------|
| freeform | Yes | No | No |
| survey | Yes | Yes | Yes |
| story | No | Yes | Yes |

---

## Zod Schema Definitions

```typescript
import { z } from 'zod'

/**
 * Base experience reference - used for pregate/preshare slots
 */
export const experienceReferenceSchema = z.object({
  /** Experience document ID */
  experienceId: z.string().min(1),
  /** Whether experience is enabled for guests */
  enabled: z.boolean().default(true),
})

/**
 * Main experience reference - includes overlay control
 */
export const mainExperienceReferenceSchema = experienceReferenceSchema.extend({
  /** Whether to apply event overlay on result media */
  applyOverlay: z.boolean().default(true),
})

/**
 * Complete experiences configuration for an event
 */
export const experiencesConfigSchema = z.object({
  /** Main experiences array (shown on welcome screen) */
  main: z.array(mainExperienceReferenceSchema).default([]),
  /** Pregate experience (runs before welcome) */
  pregate: experienceReferenceSchema.nullable().default(null),
  /** Preshare experience (runs after main, before share) */
  preshare: experienceReferenceSchema.nullable().default(null),
})

/**
 * TypeScript types
 */
export type ExperienceReference = z.infer<typeof experienceReferenceSchema>
export type MainExperienceReference = z.infer<typeof mainExperienceReferenceSchema>
export type ExperiencesConfig = z.infer<typeof experiencesConfigSchema>
```

---

## Firestore Schema Update

The `experiences` field is added to `ProjectEventConfig`:

### Path
```
projects/{projectId}/events/{eventId}
  └── draftConfig.experiences
  └── publishedConfig.experiences (after publish)
```

### Schema Addition
```typescript
// In project-event-config.schema.ts
export const projectEventConfigSchema = z.looseObject({
  // ... existing fields ...

  /**
   * Experience slot assignments
   * Defines which experiences are connected to this event
   */
  experiences: experiencesConfigSchema.nullable().default(null),
})
```

---

## State Transitions

### Experience Reference States

```
[Not Connected] → [Connected + Enabled] → [Connected + Disabled] → [Removed]
        ↓                    ↓                      ↓
   (Add from drawer)   (Toggle enabled)      (Toggle enabled)
                             ↓                      ↓
                       (Remove action)       (Remove action)
                             ↓                      ↓
                       [Not Connected]       [Not Connected]
```

### Main Experience Reordering

```
[Position N] ←→ [Position M] (via drag-and-drop)
```

---

## Relationships

```
ProjectEvent
    │
    └── draftConfig: ProjectEventConfig
            │
            └── experiences: ExperiencesConfig
                    │
                    ├── main[]: MainExperienceReference[] ──→ Experience (via experienceId)
                    │
                    ├── pregate: ExperienceReference ──→ Experience (via experienceId)
                    │
                    └── preshare: ExperienceReference ──→ Experience (via experienceId)

Workspace
    │
    └── experiences/: Experience[] (source documents)
            │
            ├── id
            ├── name
            ├── profile: 'freeform' | 'survey' | 'story'
            ├── media: { url }
            └── ...
```

---

## Migration Strategy

### Existing Events (No experiences field)

- Schema uses `z.looseObject()` for forward compatibility
- Default value is `null` (no experiences configured)
- No data migration required - field is optional

### Default Values on First Access

```typescript
const experiences = draftConfig.experiences ?? {
  main: [],
  pregate: null,
  preshare: null,
}
```

---

## Query Patterns

### Fetching Available Experiences for Slot

```typescript
// Get experiences filtered by profile compatibility
const allowedProfiles = SLOT_PROFILES[slot] // ['freeform', 'survey'] or ['survey', 'story']

const availableExperiences = workspaceExperiences.filter(
  exp => allowedProfiles.includes(exp.profile)
)

// Mark already-assigned experiences
const assignedIds = new Set([
  ...experiences.main.map(e => e.experienceId),
  experiences.pregate?.experienceId,
  experiences.preshare?.experienceId,
].filter(Boolean))

const experienceList = availableExperiences.map(exp => ({
  ...exp,
  isAssigned: assignedIds.has(exp.id),
}))
```

### Fetching Experience Details for Display

```typescript
// Batch fetch experience documents for connected references
const experienceIds = experiences.main.map(ref => ref.experienceId)
const experienceDetails = await Promise.all(
  experienceIds.map(id => getExperience(workspaceId, id))
)
```

---

## Edge Cases

### Missing Experience (Deleted from Workspace)

When an experience is deleted but still referenced:
- Show "Missing Experience" placeholder in UI
- Allow removal from event
- Prevent selection of deleted experiences

### Duplicate Experience IDs

- Prevented at write time by filtering already-assigned experiences
- UI disables selection of experiences already in any slot

### Empty State

- `main: []` - Show "Add your first experience" empty state
- `pregate: null` - Show "Add" button only
- `preshare: null` - Show "Add" button only
