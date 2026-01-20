# Quickstart: Transform Pipeline Foundation & Schema

**Feature**: 036-transform-foundation
**Date**: 2026-01-20

## Overview

This quickstart guide covers the shared kernel consolidation and schema changes for the transform pipeline foundation. The feature establishes a single source of truth for all pipeline-relevant schemas in `packages/shared/`.

---

## Phase 1: Create Shared Kernel Structure

### 1.1 Create Directory Structure

```bash
# Create schema directories in shared package
mkdir -p packages/shared/src/schemas/{session,job,experience,event,project,workspace}
```

### 1.2 Create Barrel Exports

**File**: `packages/shared/src/schemas/index.ts`
```typescript
export * from './session'
export * from './job'
export * from './experience'
export * from './event'
export * from './project'
export * from './workspace'
```

**File**: `packages/shared/src/index.ts`
```typescript
export * from './schemas'
```

---

## Phase 2: Move and Create Schemas

### 2.1 Session Schema (CONSOLIDATE)

**File**: `packages/shared/src/schemas/session/session.schema.ts`

Take the latest from `apps/clementine-app/src/domains/session/shared/schemas/session.schema.ts` and add `jobStatus`:

```typescript
import { z } from 'zod'

export const sessionModeSchema = z.enum(['preview', 'guest'])
export const configSourceSchema = z.enum(['draft', 'published'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'abandoned', 'error'])

// NEW: Job status for transform job tracking
export const jobStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  answeredAt: z.number(),
})

export const capturedMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})

export const sessionResultMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})

export const sessionSchema = z.looseObject({
  id: z.string(),
  projectId: z.string(),
  workspaceId: z.string(),
  eventId: z.string().nullable(),
  experienceId: z.string(),
  mode: sessionModeSchema,
  configSource: configSourceSchema,
  status: sessionStatusSchema.default('active'),
  answers: z.array(answerSchema).default([]),
  capturedMedia: z.array(capturedMediaSchema).default([]),
  resultMedia: sessionResultMediaSchema.nullable().default(null),
  jobId: z.string().nullable().default(null),
  jobStatus: jobStatusSchema.nullable().default(null),  // NEW
  createdBy: z.string().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().nullable().default(null),
})

// Type exports
export type Session = z.infer<typeof sessionSchema>
export type SessionMode = z.infer<typeof sessionModeSchema>
export type ConfigSource = z.infer<typeof configSourceSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type JobStatus = z.infer<typeof jobStatusSchema>
export type Answer = z.infer<typeof answerSchema>
export type CapturedMedia = z.infer<typeof capturedMediaSchema>
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>
```

**File**: `packages/shared/src/schemas/session/index.ts`
```typescript
export * from './session.schema'
```

### 2.2 Base Step Schema (NEW)

**File**: `packages/shared/src/schemas/experience/step.schema.ts`

```typescript
import { z } from 'zod'

/**
 * Base step schema for Firestore documents.
 * Step-specific configs (discriminated union) stay in app domain.
 */
export const stepSchema = z.looseObject({
  id: z.string(),
  type: z.string(),
  name: z.string().min(1).max(50),  // NEW: Human-readable name
  config: z.record(z.string(), z.unknown()).default({}),
})

export type Step = z.infer<typeof stepSchema>
```

### 2.3 Transform Schema (NEW)

**File**: `packages/shared/src/schemas/experience/transform.schema.ts`

```typescript
import { z } from 'zod'

export const transformNodeSchema = z.looseObject({
  id: z.string(),
  type: z.string(),
  config: z.record(z.string(), z.unknown()).default({}),
})

export const variableMappingSchema = z.looseObject({
  source: z.string(),
  target: z.string(),
  mappingType: z.enum(['direct', 'template', 'computed']).default('direct'),
})

export const outputFormatSchema = z.looseObject({
  type: z.enum(['image', 'gif', 'video']),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  quality: z.number().min(0).max(100).optional(),
})

export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  variableMappings: z.array(variableMappingSchema).default([]),
  outputFormat: outputFormatSchema.nullable().default(null),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
export type VariableMapping = z.infer<typeof variableMappingSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
```

### 2.4 Experience Schema (MOVE + MODIFY)

**File**: `packages/shared/src/schemas/experience/experience.schema.ts`

Move from app and add `transform` field to ExperienceConfig:

```typescript
import { z } from 'zod'
import { stepSchema } from './step.schema'
import { transformConfigSchema } from './transform.schema'

export const experienceStatusSchema = z.enum(['active', 'deleted'])
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'story'])

export const experienceMediaSchema = z
  .object({
    mediaAssetId: z.string().min(1),
    url: z.string().url(),
  })
  .nullable()

export const experienceConfigSchema = z.looseObject({
  steps: z.array(stepSchema).default([]),
  transform: transformConfigSchema.nullable().default(null),  // NEW
})

export const experienceSchema = z.looseObject({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: experienceStatusSchema.default('active'),
  profile: experienceProfileSchema,
  media: experienceMediaSchema.default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
})

export type Experience = z.infer<typeof experienceSchema>
export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
export type ExperienceMedia = z.infer<typeof experienceMediaSchema>
```

**File**: `packages/shared/src/schemas/experience/index.ts`
```typescript
export * from './experience.schema'
export * from './step.schema'
export * from './transform.schema'
```

### 2.5 Job Schema (NEW)

**File**: `packages/shared/src/schemas/job/job.schema.ts`

See `data-model.md` for complete schema definition.

**File**: `packages/shared/src/schemas/job/index.ts`
```typescript
export * from './job.schema'
```

### 2.6 Event Schemas (MOVE)

Move from `apps/clementine-app/src/domains/event/shared/schemas/`:

```bash
cp apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts \
   packages/shared/src/schemas/event/project-event.schema.ts

cp apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts \
   packages/shared/src/schemas/event/project-event-config.schema.ts
```

Update internal imports and create barrel:

**File**: `packages/shared/src/schemas/event/index.ts`
```typescript
export * from './project-event.schema'
export * from './project-event-config.schema'
```

### 2.7 Project Schema (MOVE)

```bash
mv packages/shared/src/entities/project/project.schema.ts \
   packages/shared/src/schemas/project/project.schema.ts
```

**File**: `packages/shared/src/schemas/project/index.ts`
```typescript
export * from './project.schema'
```

### 2.8 Workspace Schema (MOVE)

```bash
mv packages/shared/src/entities/workspace/workspace.schema.ts \
   packages/shared/src/schemas/workspace/workspace.schema.ts
```

**File**: `packages/shared/src/schemas/workspace/index.ts`
```typescript
export * from './workspace.schema'
```

---

## Phase 3: Update App Imports

### 3.1 Re-export from Domain Schemas

Create re-export files in app domains that point to shared:

**File**: `apps/clementine-app/src/domains/session/shared/schemas/index.ts`
```typescript
// Re-export from shared kernel
export {
  sessionSchema,
  sessionModeSchema,
  configSourceSchema,
  sessionStatusSchema,
  jobStatusSchema,
  answerSchema,
  capturedMediaSchema,
  sessionResultMediaSchema,
  type Session,
  type SessionMode,
  type ConfigSource,
  type SessionStatus,
  type JobStatus,
  type Answer,
  type CapturedMedia,
  type SessionResultMedia,
} from '@clementine/shared'
```

**File**: `apps/clementine-app/src/domains/experience/shared/schemas/index.ts`
```typescript
// Re-export from shared kernel
export {
  experienceSchema,
  experienceConfigSchema,
  experienceStatusSchema,
  experienceProfileSchema,
  experienceMediaSchema,
  stepSchema,
  transformConfigSchema,
  type Experience,
  type ExperienceConfig,
  type ExperienceStatus,
  type ExperienceProfile,
  type ExperienceMedia,
  type Step,
  type TransformConfig,
} from '@clementine/shared'
```

### 3.2 Update Step Discriminated Union

The detailed step schemas stay in app but need to import base step from shared:

**File**: `apps/clementine-app/src/domains/experience/steps/schemas/step.schema.ts`

```typescript
import { z } from 'zod'
// Import base step type from shared
import { type Step as BaseStep } from '@clementine/shared'
// ... import step config schemas ...

// The discriminated union stays here for detailed validation
export const stepSchema = z.discriminatedUnion('type', [
  infoStepSchema,
  inputScaleStepSchema,
  // ... etc
])

// Re-export base step type for convenience
export type { BaseStep }
export type Step = z.infer<typeof stepSchema>
```

---

## Phase 4: Cleanup

### 4.1 Remove Old Files

```bash
# Remove old entities folder
rm -rf packages/shared/src/entities/

# Remove old session.schemas.ts (processing-specific, outdated)
rm packages/shared/src/schemas/session.schemas.ts

# Remove app domain schema files that are now in shared
rm apps/clementine-app/src/domains/session/shared/schemas/session.schema.ts
rm apps/clementine-app/src/domains/experience/shared/schemas/experience.schema.ts
rm apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts
rm apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts
```

### 4.2 Update Functions Imports

**File**: `functions/src/lib/schemas/media-pipeline.schema.ts`

```typescript
// Import from shared kernel
import { sessionSchema, type Session } from '@clementine/shared'
import { jobSchema, type Job } from '@clementine/shared'
```

---

## Phase 5: Security Rules and Indexes

### 5.1 Firestore Security Rules

**File**: `firebase/firestore.rules`

Add inside `match /projects/{projectId}`:

```javascript
// Jobs collection - admin read, server-only write
match /jobs/{jobId} {
  allow read: if isAdmin();
  allow create, update, delete: if false;
}
```

### 5.2 Firestore Indexes

**File**: `firebase/firestore.indexes.json`

Add to indexes array:

```json
{
  "collectionGroup": "jobs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "projectId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "jobs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "sessionId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## Step Name Auto-Generation

In app domain where step registry exists:

```typescript
import { stepRegistry } from '@/domains/experience/steps/registry/step-registry'
import type { Step } from '@clementine/shared'

function generateStepName(existingSteps: Step[], stepType: string): string {
  const label = stepRegistry[stepType].label
  const count = existingSteps.filter(s => s.type === stepType).length + 1
  return `${label} ${count}`
}
```

### Lazy Migration for Existing Steps

```typescript
function ensureStepHasName(step: Step, allSteps: Step[]): Step {
  if (step.name) return step

  const sameTypeSteps = allSteps.filter(s => s.type === step.type)
  const index = sameTypeSteps.findIndex(s => s.id === step.id) + 1
  const label = stepRegistry[step.type].label

  return { ...step, name: `${label} ${index}` }
}
```

---

## Validation Checklist

- [ ] `packages/shared` builds successfully (`pnpm --filter @clementine/shared build`)
- [ ] App builds successfully (`pnpm app:build`)
- [ ] Functions build successfully (`pnpm functions:build`)
- [ ] All imports resolve correctly
- [ ] Type checking passes (`pnpm app:type-check`)
- [ ] Existing experiences load without errors
- [ ] New steps receive auto-generated names
- [ ] Security rules deploy successfully (`pnpm fb:deploy:rules`)
- [ ] Indexes deploy successfully (`pnpm fb:deploy:indexes`)

---

## Files Summary

### New Files in Shared

| File | Description |
|------|-------------|
| `schemas/session/session.schema.ts` | Consolidated session with jobStatus |
| `schemas/session/index.ts` | Barrel export |
| `schemas/job/job.schema.ts` | New job document schema |
| `schemas/job/index.ts` | Barrel export |
| `schemas/experience/experience.schema.ts` | Experience with transform |
| `schemas/experience/step.schema.ts` | Base step with name |
| `schemas/experience/transform.schema.ts` | New transform config |
| `schemas/experience/index.ts` | Barrel export |
| `schemas/event/project-event.schema.ts` | Moved from app |
| `schemas/event/project-event-config.schema.ts` | Moved from app |
| `schemas/event/index.ts` | Barrel export |
| `schemas/project/project.schema.ts` | Moved from entities |
| `schemas/project/index.ts` | Barrel export |
| `schemas/workspace/workspace.schema.ts` | Moved from entities |
| `schemas/workspace/index.ts` | Barrel export |
| `schemas/index.ts` | Master barrel export |

### Files to Remove

| File | Reason |
|------|--------|
| `packages/shared/src/entities/` | Consolidated into schemas |
| `packages/shared/src/schemas/session.schemas.ts` | Replaced by session/ |
| App domain schema files | Use shared via re-exports |

---

## Next Steps

After implementing:
1. Run `pnpm --filter @clementine/shared build`
2. Run `pnpm app:check` to validate formatting and linting
3. Run `pnpm app:type-check` to verify TypeScript
4. Run `pnpm functions:build` to verify functions
5. Deploy security rules: `pnpm fb:deploy:rules`
6. Deploy indexes: `pnpm fb:deploy:indexes`
7. Test with existing experiences to verify backward compatibility
