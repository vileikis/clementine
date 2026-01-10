# Quickstart: Experience Data Layer & Event Config Schema

**Date**: 2026-01-10
**Branch**: `021-exp-data-layer`

## Overview

This guide provides quick examples for using the experience data layer hooks and schemas.

---

## Prerequisites

Ensure you're in the `apps/clementine-app` directory and have dependencies installed:

```bash
cd apps/clementine-app
pnpm install
```

---

## 1. List Experiences in a Workspace

```typescript
import { useWorkspaceExperiences } from '@/domains/experience'

function ExperienceList({ workspaceId }: { workspaceId: string }) {
  const { data: experiences, isLoading, error } = useWorkspaceExperiences(workspaceId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading experiences</div>
  if (!experiences?.length) return <div>No experiences yet</div>

  return (
    <ul>
      {experiences.map((exp) => (
        <li key={exp.id}>
          {exp.name} ({exp.profile})
        </li>
      ))}
    </ul>
  )
}
```

---

## 2. Get a Single Experience

```typescript
import { useWorkspaceExperience } from '@/domains/experience'

function ExperienceDetail({
  workspaceId,
  experienceId,
}: {
  workspaceId: string
  experienceId: string
}) {
  const { data: experience, isLoading } = useWorkspaceExperience(workspaceId, experienceId)

  if (isLoading) return <div>Loading...</div>
  if (!experience) return <div>Experience not found</div>

  return (
    <div>
      <h1>{experience.name}</h1>
      <p>Profile: {experience.profile}</p>
      <p>Steps: {experience.steps.length}</p>
    </div>
  )
}
```

---

## 3. Create an Experience

```typescript
import { useCreateExperience } from '@/domains/experience'

function CreateExperienceButton({ workspaceId }: { workspaceId: string }) {
  const createExperience = useCreateExperience()

  const handleCreate = async () => {
    try {
      const result = await createExperience.mutateAsync({
        workspaceId,
        name: 'My New Survey',
        profile: 'survey',
      })
      console.log('Created experience:', result.experienceId)
    } catch (error) {
      console.error('Failed to create:', error)
    }
  }

  return (
    <button onClick={handleCreate} disabled={createExperience.isPending}>
      {createExperience.isPending ? 'Creating...' : 'Create Experience'}
    </button>
  )
}
```

---

## 4. Update an Experience

```typescript
import { useUpdateExperience } from '@/domains/experience'

function RenameExperience({
  workspaceId,
  experienceId,
}: {
  workspaceId: string
  experienceId: string
}) {
  const updateExperience = useUpdateExperience()

  const handleRename = async (newName: string) => {
    await updateExperience.mutateAsync({
      workspaceId,
      experienceId,
      updates: { name: newName },
    })
  }

  return (
    <button onClick={() => handleRename('Renamed Experience')}>
      Rename
    </button>
  )
}
```

---

## 5. Delete an Experience (Soft Delete)

```typescript
import { useDeleteExperience } from '@/domains/experience'

function DeleteExperience({
  workspaceId,
  experienceId,
}: {
  workspaceId: string
  experienceId: string
}) {
  const deleteExperience = useDeleteExperience()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this experience?')) {
      await deleteExperience.mutateAsync({ workspaceId, experienceId })
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleteExperience.isPending}>
      Delete
    </button>
  )
}
```

---

## 6. Validate Experience Profile

```typescript
import { validateExperienceProfile } from '@/domains/experience/validation'
import type { ExperienceProfile, Step } from '@/domains/experience'

function validateSteps(profile: ExperienceProfile, steps: Step[]) {
  const result = validateExperienceProfile(profile, steps)

  if (!result.valid) {
    console.error('Profile violations:', result.violations)
    // [{ stepId: '...', stepType: 'transform.pipeline', message: '...' }]
  }

  return result.valid
}
```

---

## 7. Check Slot Compatibility

```typescript
import { isProfileCompatibleWithSlot } from '@/domains/experience/validation'
import type { ExperienceProfile, ExperienceSlot } from '@/domains/experience'

// Filter experiences for a picker
function getCompatibleExperiences(
  experiences: Array<{ id: string; profile: ExperienceProfile }>,
  slot: ExperienceSlot,
) {
  return experiences.filter((exp) =>
    isProfileCompatibleWithSlot(exp.profile, slot)
  )
}

// Example usage
const mainSlotExperiences = getCompatibleExperiences(allExperiences, 'main')
// Returns only freeform and survey experiences

const pregateExperiences = getCompatibleExperiences(allExperiences, 'pregate')
// Returns only informational and survey experiences
```

---

## 8. Event Config with Experiences

```typescript
import { eventExperiencesConfigSchema } from '@/domains/event/shared/schemas'

// Parse event config with experiences
const config = eventExperiencesConfigSchema.parse({
  main: [
    { experienceId: 'exp-1', enabled: true },
    { experienceId: 'exp-2', enabled: false },
  ],
  pregate: { experienceId: 'exp-3', enabled: true },
  preshare: null,
})

// Access experiences
console.log(config.main.length) // 2
console.log(config.pregate?.experienceId) // 'exp-3'
console.log(config.preshare) // null
```

---

## Schema Imports

```typescript
// Entity schemas and types
import {
  workspaceExperienceSchema,
  type WorkspaceExperience,
  experienceReferenceSchema,
  type ExperienceReference,
} from '@/domains/experience'

// Validation utilities
import {
  validateExperienceProfile,
  isProfileCompatibleWithSlot,
  PROFILE_ALLOWED_STEP_CATEGORIES,
  SLOT_ALLOWED_PROFILES,
} from '@/domains/experience/validation'

// Event config schemas
import {
  eventExperiencesConfigSchema,
  type EventExperiencesConfig,
  experienceReleaseSchema,
  type ExperienceRelease,
} from '@/domains/event'
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run experience domain tests
pnpm test -- --filter="experience"

# Run validation tests
pnpm test -- domains/experience/validation
```

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Experience schema | `src/domains/experience/shared/schemas/workspace-experience.schema.ts` |
| CRUD hooks | `src/domains/experience/shared/hooks/` |
| Query options | `src/domains/experience/shared/queries/` |
| Profile validation | `src/domains/experience/validation/profile-rules.ts` |
| Slot compatibility | `src/domains/experience/validation/slot-compatibility.ts` |
| Event config schema | `src/domains/event/shared/schemas/event-experiences-config.schema.ts` |
| Release schema | `src/domains/event/shared/schemas/experience-release.schema.ts` |
| Security rules | `firebase/firestore.rules` |
