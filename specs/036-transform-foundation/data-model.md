# Data Model: Transform Pipeline Foundation & Schema

**Feature**: 036-transform-foundation
**Date**: 2026-01-20
**Status**: Complete

## Overview

This document defines the data model changes required to support the transform pipeline feature. It covers:
1. **Shared kernel consolidation** - All pipeline-relevant schemas in `packages/shared/`
2. **Schema modifications** - Adding fields to existing entities
3. **New entity definitions** - Job document schema

---

## Shared Kernel Structure

All schemas consolidated in `packages/shared/src/schemas/`:

```text
packages/shared/src/schemas/
├── index.ts                          # Barrel export
├── session/
│   ├── index.ts
│   └── session.schema.ts             # Full session with jobStatus
├── job/
│   ├── index.ts
│   └── job.schema.ts                 # NEW: Transform job tracking
├── experience/
│   ├── index.ts
│   ├── experience.schema.ts          # Experience with transform field
│   ├── step.schema.ts                # Base step schema (simplified)
│   └── transform.schema.ts           # NEW: TransformConfig
├── event/
│   ├── index.ts
│   ├── project-event.schema.ts       # Full event document
│   └── project-event-config.schema.ts
├── project/
│   ├── index.ts
│   └── project.schema.ts
└── workspace/
    ├── index.ts
    └── workspace.schema.ts
```

---

## Entity Changes Summary

| Entity | Location | Change Type | Description |
|--------|----------|-------------|-------------|
| Step | `schemas/experience/step.schema.ts` | MODIFY | Add `name` field |
| ExperienceConfig | `schemas/experience/experience.schema.ts` | MODIFY | Add `transform` field |
| Session | `schemas/session/session.schema.ts` | MODIFY | Add `jobStatus` field |
| Job | `schemas/job/job.schema.ts` | NEW | Transform execution tracking |
| TransformConfig | `schemas/experience/transform.schema.ts` | NEW | Pipeline configuration |
| Project | `schemas/project/project.schema.ts` | MOVE | From entities/ |
| Workspace | `schemas/workspace/workspace.schema.ts` | MOVE | From entities/ |
| Event | `schemas/event/project-event.schema.ts` | MOVE | From app |
| EventConfig | `schemas/event/project-event-config.schema.ts` | MOVE | From app |

---

## 1. Base Step Schema

### Location
`packages/shared/src/schemas/experience/step.schema.ts`

### Schema Definition
```typescript
/**
 * Base Step Schema
 *
 * Simplified step schema for shared kernel.
 * Contains only fields needed across app and functions.
 * Step-specific configs (discriminated union) stay in app domain.
 *
 * Note: This is the Firestore document structure, not the full
 * validated step with config type checking.
 */
import { z } from 'zod'

/**
 * Base step schema for Firestore documents
 */
export const stepSchema = z.looseObject({
  /** Unique step identifier within the experience (UUID) */
  id: z.string(),
  /** Step type from registry (e.g., 'info', 'input.scale') */
  type: z.string(),
  /** Human-readable step name for identification and variable mapping */
  name: z.string().min(1).max(50),
  /** Step-specific configuration object */
  config: z.record(z.string(), z.unknown()).default({}),
})

export type Step = z.infer<typeof stepSchema>
```

### Field Details

| Field | Type | Constraints | Required | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| `id` | string | UUID format | Yes | - | Unique identifier |
| `type` | string | - | Yes | - | Step type key |
| `name` | string | min: 1, max: 50 | Yes | Auto-generated | Human-readable name |
| `config` | Record | - | No | `{}` | Step-specific config |

### Auto-Generation Logic
```typescript
// In app domain where step registry exists
function generateStepName(steps: Step[], stepType: string): string {
  const label = stepRegistry[stepType].label
  const count = steps.filter(s => s.type === stepType).length + 1
  return `${label} ${count}`
}
```

### Display Name Mapping (App-side)

| Step Type | Display Name |
|-----------|-------------|
| `info` | Information |
| `input.scale` | Opinion Scale |
| `input.yesNo` | Yes/No |
| `input.multiSelect` | Multiple Choice |
| `input.shortText` | Short Answer |
| `input.longText` | Long Answer |
| `capture.photo` | Photo Capture |
| `transform.pipeline` | AI Transform |

---

## 2. Transform Config Schema (NEW)

### Location
`packages/shared/src/schemas/experience/transform.schema.ts`

### Schema Definition
```typescript
/**
 * Transform Configuration Schema
 *
 * Configuration for the transform pipeline.
 * Embedded within ExperienceConfig.
 */
import { z } from 'zod'

/**
 * Transform node definition
 * Represents a single node in the pipeline graph
 */
export const transformNodeSchema = z.looseObject({
  /** Unique node identifier */
  id: z.string(),
  /** Node type (e.g., 'ai.imageGeneration', 'filter.resize') */
  type: z.string(),
  /** Node-specific configuration */
  config: z.record(z.string(), z.unknown()).default({}),
})

/**
 * Variable mapping from session data to transform inputs
 */
export const variableMappingSchema = z.looseObject({
  /** Source identifier (step name or special identifier) */
  source: z.string(),
  /** Target node input parameter */
  target: z.string(),
  /** Mapping type for data transformation */
  mappingType: z.enum(['direct', 'template', 'computed']).default('direct'),
})

/**
 * Output format configuration
 */
export const outputFormatSchema = z.looseObject({
  /** Output type */
  type: z.enum(['image', 'gif', 'video']),
  /** Output width in pixels */
  width: z.number().int().positive().optional(),
  /** Output height in pixels */
  height: z.number().int().positive().optional(),
  /** Quality (0-100) */
  quality: z.number().min(0).max(100).optional(),
})

/**
 * Transform pipeline configuration
 * Embedded within ExperienceConfig
 */
export const transformConfigSchema = z.looseObject({
  /** Pipeline node definitions */
  nodes: z.array(transformNodeSchema).default([]),
  /** Variable bindings from session data to node inputs */
  variableMappings: z.array(variableMappingSchema).default([]),
  /** Output format specification */
  outputFormat: outputFormatSchema.nullable().default(null),
})

export type TransformConfig = z.infer<typeof transformConfigSchema>
export type TransformNode = z.infer<typeof transformNodeSchema>
export type VariableMapping = z.infer<typeof variableMappingSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
```

---

## 3. Experience Schema

### Location
`packages/shared/src/schemas/experience/experience.schema.ts`

### Schema Definition
```typescript
/**
 * Experience Schema
 *
 * Defines the structure for Experience documents stored in Firestore.
 * Firestore Path: /workspaces/{workspaceId}/experiences/{experienceId}
 */
import { z } from 'zod'
import { stepSchema } from './step.schema'
import { transformConfigSchema } from './transform.schema'

/**
 * Experience status enum
 */
export const experienceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Experience profile enum
 */
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'story'])

/**
 * Experience media schema
 */
export const experienceMediaSchema = z
  .object({
    mediaAssetId: z.string().min(1),
    url: z.string().url(),
  })
  .nullable()

/**
 * Experience Config Schema
 * Contains step definitions and optional transform configuration
 */
export const experienceConfigSchema = z.looseObject({
  /** Array of steps in the experience */
  steps: z.array(stepSchema).default([]),
  /** Optional transform pipeline configuration */
  transform: transformConfigSchema.nullable().default(null),
})

/**
 * Experience Schema
 * Complete experience document
 */
export const experienceSchema = z.looseObject({
  // IDENTITY
  id: z.string(),
  name: z.string().min(1).max(100),

  // METADATA
  status: experienceStatusSchema.default('active'),
  profile: experienceProfileSchema,
  media: experienceMediaSchema.default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // CONFIGURATION (draft vs published)
  draft: experienceConfigSchema,
  published: experienceConfigSchema.nullable().default(null),

  // VERSIONING
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),

  // PUBLISH TRACKING
  publishedAt: z.number().nullable().default(null),
  publishedBy: z.string().nullable().default(null),
})

export type Experience = z.infer<typeof experienceSchema>
export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type ExperienceProfile = z.infer<typeof experienceProfileSchema>
export type ExperienceMedia = z.infer<typeof experienceMediaSchema>
```

---

## 4. Session Schema

### Location
`packages/shared/src/schemas/session/session.schema.ts`

### Schema Definition
```typescript
/**
 * Session Schema
 *
 * Defines the structure for Session documents stored in Firestore.
 * Firestore Path: /projects/{projectId}/sessions/{sessionId}
 */
import { z } from 'zod'

/**
 * Session mode schema
 */
export const sessionModeSchema = z.enum(['preview', 'guest'])

/**
 * Config source schema
 */
export const configSourceSchema = z.enum(['draft', 'published'])

/**
 * Session status schema
 */
export const sessionStatusSchema = z.enum([
  'active',
  'completed',
  'abandoned',
  'error',
])

/**
 * Job status schema (for transform job tracking)
 */
export const jobStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

/**
 * Answer schema
 */
export const answerSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  answeredAt: z.number(),
})

/**
 * CapturedMedia schema
 */
export const capturedMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})

/**
 * SessionResultMedia schema
 */
export const sessionResultMediaSchema = z.object({
  stepId: z.string(),
  assetId: z.string(),
  url: z.string(),
  createdAt: z.number(),
})

/**
 * Session Schema
 */
export const sessionSchema = z.looseObject({
  // IDENTITY
  id: z.string(),

  // CONTEXT
  projectId: z.string(),
  workspaceId: z.string(),
  eventId: z.string().nullable(),
  experienceId: z.string(),

  // MODE
  mode: sessionModeSchema,
  configSource: configSourceSchema,

  // STATE
  status: sessionStatusSchema.default('active'),

  // ACCUMULATED DATA
  answers: z.array(answerSchema).default([]),
  capturedMedia: z.array(capturedMediaSchema).default([]),
  resultMedia: sessionResultMediaSchema.nullable().default(null),

  // TRANSFORM JOB TRACKING
  jobId: z.string().nullable().default(null),
  jobStatus: jobStatusSchema.nullable().default(null),

  // OWNERSHIP
  createdBy: z.string().nullable().default(null),

  // TIMESTAMPS
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().nullable().default(null),
})

export type Session = z.infer<typeof sessionSchema>
export type SessionMode = z.infer<typeof sessionModeSchema>
export type ConfigSource = z.infer<typeof configSourceSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type JobStatus = z.infer<typeof jobStatusSchema>
export type Answer = z.infer<typeof answerSchema>
export type CapturedMedia = z.infer<typeof capturedMediaSchema>
export type SessionResultMedia = z.infer<typeof sessionResultMediaSchema>
```

---

## 5. Job Schema (NEW)

### Location
`packages/shared/src/schemas/job/job.schema.ts`

### Firestore Path
```
/projects/{projectId}/jobs/{jobId}
```

### Schema Definition
```typescript
/**
 * Job Schema
 *
 * Tracks execution of a transform pipeline.
 * Contains full execution context snapshot for reproducibility.
 *
 * Firestore Path: /projects/{projectId}/jobs/{jobId}
 */
import { z } from 'zod'
import { jobStatusSchema } from '../session/session.schema'

/**
 * Job progress tracking
 */
export const jobProgressSchema = z.object({
  currentStep: z.string(),
  percentage: z.number().min(0).max(100),
  message: z.string().optional(),
})

/**
 * Job error details
 */
export const jobErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  step: z.string().optional(),
  isRetryable: z.boolean(),
  timestamp: z.number().int().positive(),
})

/**
 * Job output reference
 */
export const jobOutputSchema = z.object({
  assetId: z.string(),
  url: z.string().url(),
  format: z.enum(['image', 'gif', 'video']),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sizeBytes: z.number().int().positive(),
  processingTimeMs: z.number().int().nonnegative(),
})

/**
 * Snapshot of session inputs at job creation
 */
export const sessionInputsSnapshotSchema = z.object({
  answers: z.array(z.object({
    stepId: z.string(),
    stepType: z.string(),
    stepName: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    answeredAt: z.number(),
  })),
  capturedMedia: z.array(z.object({
    stepId: z.string(),
    stepName: z.string(),
    assetId: z.string(),
    url: z.string(),
    createdAt: z.number(),
  })),
})

/**
 * Snapshot of transform configuration at job creation
 */
export const transformConfigSnapshotSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    config: z.record(z.string(), z.unknown()),
  })),
  variableMappings: z.array(z.object({
    source: z.string(),
    target: z.string(),
    mappingType: z.string(),
  })),
  outputFormat: z.object({
    type: z.enum(['image', 'gif', 'video']),
    width: z.number().optional(),
    height: z.number().optional(),
    quality: z.number().optional(),
  }).nullable(),
})

/**
 * Snapshot of event context at job creation
 */
export const eventContextSnapshotSchema = z.object({
  overlaySettings: z.object({
    enabled: z.boolean(),
    mediaAssetId: z.string().nullable(),
    position: z.string().optional(),
    opacity: z.number().optional(),
  }).nullable(),
  applyOverlay: z.boolean(),
})

/**
 * Version snapshot for audit trail
 */
export const versionSnapshotSchema = z.object({
  experienceVersion: z.number().int().positive(),
  eventVersion: z.number().int().positive().nullable(),
})

/**
 * Complete job execution snapshot
 */
export const jobSnapshotSchema = z.object({
  sessionInputs: sessionInputsSnapshotSchema,
  transformConfig: transformConfigSnapshotSchema,
  eventContext: eventContextSnapshotSchema,
  versions: versionSnapshotSchema,
})

/**
 * Job Document Schema
 */
export const jobSchema = z.looseObject({
  // IDENTITY
  id: z.string(),

  // CONTEXT REFERENCES
  projectId: z.string(),
  sessionId: z.string(),
  experienceId: z.string(),
  stepId: z.string().nullable().default(null),

  // STATUS TRACKING
  status: jobStatusSchema.default('pending'),
  progress: jobProgressSchema.nullable().default(null),

  // RESULTS
  output: jobOutputSchema.nullable().default(null),
  error: jobErrorSchema.nullable().default(null),

  // EXECUTION SNAPSHOT
  snapshot: jobSnapshotSchema,

  // TIMESTAMPS
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  startedAt: z.number().int().positive().nullable().default(null),
  completedAt: z.number().int().positive().nullable().default(null),
})

export type Job = z.infer<typeof jobSchema>
export type JobProgress = z.infer<typeof jobProgressSchema>
export type JobError = z.infer<typeof jobErrorSchema>
export type JobOutput = z.infer<typeof jobOutputSchema>
export type JobSnapshot = z.infer<typeof jobSnapshotSchema>
export type SessionInputsSnapshot = z.infer<typeof sessionInputsSnapshotSchema>
export type TransformConfigSnapshot = z.infer<typeof transformConfigSnapshotSchema>
export type EventContextSnapshot = z.infer<typeof eventContextSnapshotSchema>
export type VersionSnapshot = z.infer<typeof versionSnapshotSchema>

// Re-export JobStatus from session for convenience
export { jobStatusSchema, type JobStatus } from '../session/session.schema'
```

---

## 6. Project Schema (MOVE)

### Location
`packages/shared/src/schemas/project/project.schema.ts`

### Notes
Move from `packages/shared/src/entities/project/project.schema.ts` - no changes needed.

---

## 7. Workspace Schema (MOVE)

### Location
`packages/shared/src/schemas/workspace/workspace.schema.ts`

### Notes
Move from `packages/shared/src/entities/workspace/workspace.schema.ts` - no changes needed.

---

## 8. Event Schemas (MOVE)

### Locations
- `packages/shared/src/schemas/event/project-event.schema.ts`
- `packages/shared/src/schemas/event/project-event-config.schema.ts`

### Notes
Move from app domain - no changes needed except updating internal imports.

---

## Firestore Security Rules

### Jobs Collection Rules
```javascript
// firebase/firestore.rules
// Inside match /projects/{projectId}

match /jobs/{jobId} {
  // READ: Admins only (jobs contain execution details)
  allow read: if isAdmin();

  // WRITE: Server only via Admin SDK
  allow create, update, delete: if false;
}
```

---

## Firestore Indexes

### New Indexes Required
```json
{
  "indexes": [
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
  ]
}
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                       Workspace                              │
│                           │                                  │
│                           ▼                                  │
│                      Experience                              │
│              ┌────────────┴────────────┐                     │
│              ▼                         ▼                     │
│           draft                   published                  │
│     (ExperienceConfig)       (ExperienceConfig)              │
│              │                         │                     │
│              └──────────┬──────────────┘                     │
│                         │                                    │
│              ┌──────────┴──────────┐                         │
│              ▼                     ▼                         │
│          steps[]              transform                      │
│              │              (TransformConfig)                │
│              ▼                                               │
│          Step 1...N                                          │
│         (+ name)                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Project                               │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              ▼                         ▼                     │
│          sessions                    jobs                    │
│              │                         │                     │
│              ▼                         ▼                     │
│          Session                      Job                    │
│       ┌──────────────┐         ┌──────────────┐              │
│       │ jobId ───────┼─────────┤► id          │              │
│       │ jobStatus    │◄────────┤─ status      │              │
│       │ answers      │         │ snapshot:    │              │
│       │ capturedMedia│  ┌──────┤─ inputs      │              │
│       └──────────────┘  │      │─ config      │              │
│              ▲          │      │─ versions    │              │
│              └──────────┘      └──────────────┘              │
│      (snapshot copies session data at job creation)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Backward Compatibility

| Change | Compatibility | Migration |
|--------|--------------|-----------|
| Step.name | Backward compatible | Lazy migration |
| transform field | Backward compatible | Defaults to null |
| Session.jobStatus | Backward compatible | Defaults to null |
| Job collection | New collection | No migration |
| Schema moves | Breaking for imports | Update all imports |

All schema changes are additive. Import changes require updating all consumers but don't affect runtime behavior.

---

## Barrel Export Structure

### Root Export
```typescript
// packages/shared/src/index.ts
export * from './schemas'
```

### Schemas Export
```typescript
// packages/shared/src/schemas/index.ts
export * from './session'
export * from './job'
export * from './experience'
export * from './event'
export * from './project'
export * from './workspace'
```

### Domain Exports
```typescript
// packages/shared/src/schemas/session/index.ts
export * from './session.schema'

// packages/shared/src/schemas/job/index.ts
export * from './job.schema'

// packages/shared/src/schemas/experience/index.ts
export * from './experience.schema'
export * from './step.schema'
export * from './transform.schema'

// packages/shared/src/schemas/event/index.ts
export * from './project-event.schema'
export * from './project-event-config.schema'

// packages/shared/src/schemas/project/index.ts
export * from './project.schema'

// packages/shared/src/schemas/workspace/index.ts
export * from './workspace.schema'
```
