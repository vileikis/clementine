# Data Model: Job + Cloud Functions

**Branch**: `062-job-cloud-functions` | **Date**: 2026-02-05

## Entity Overview

This feature modifies the `JobSnapshot` entity and introduces internal execution interfaces.

---

## 1. JobSnapshot (Modified)

**Location**: `packages/shared/src/schemas/job/job.schema.ts`
**Purpose**: Immutable point-in-time capture of job execution context

### Schema Changes

```typescript
// BEFORE (current)
export const jobSnapshotSchema = z.looseObject({
  sessionInputs: sessionInputsSnapshotSchema,  // { answers, capturedMedia }
  transformNodes: transformNodesSnapshotSchema,
  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),
})

// AFTER (new)
export const jobSnapshotSchema = z.looseObject({
  /** Session responses at job creation (unified from all steps) */
  sessionResponses: z.array(sessionResponseSchema),

  /** @deprecated Always []. Kept for schema compatibility */
  transformNodes: z.array(transformNodeSchema).default([]),

  /** Project context (overlay, etc.) */
  projectContext: projectContextSnapshotSchema,

  /** Experience version at job creation */
  experienceVersion: z.number().int().positive(),

  /** Outcome configuration (reuses experience outcome schema) */
  outcome: outcomeSchema,
})
```

### Field Mapping

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `sessionInputs.answers` | `sessionResponses` (where stepType starts with `input.`) | Unified format |
| `sessionInputs.capturedMedia` | `sessionResponses` (where stepType starts with `capture.`) | Unified format |
| `transformNodes` | `transformNodes` | Deprecated, always `[]` |
| `projectContext` | `projectContext` | Unchanged |
| `experienceVersion` | `experienceVersion` | Unchanged |
| N/A | `outcome` | New field from experience |

### Backward Compatibility

- `z.looseObject()` allows old jobs (with `sessionInputs`) to parse without error
- New code only reads new fields
- Old jobs will fail outcome-based processing (expected - they use old pipeline)

---

## 2. SessionResponse (Existing)

**Location**: `packages/shared/src/schemas/session/session-response.schema.ts`
**Purpose**: Unified response format for all step types

### Schema (Unchanged)

```typescript
export const sessionResponseSchema = z.object({
  stepId: z.string(),      // Links to step definition
  stepName: z.string(),    // For @{step:...} prompt resolution
  stepType: z.string(),    // e.g., 'input.scale', 'capture.photo'
  data: sessionResponseDataSchema.nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
})

// Data union
export const sessionResponseDataSchema = z.union([
  z.string(),                      // input steps
  z.array(multiSelectOptionSchema), // multi-select
  z.array(mediaReferenceSchema),   // capture steps
])
```

---

## 3. Outcome (Existing)

**Location**: `packages/shared/src/schemas/experience/outcome.schema.ts`
**Purpose**: Configuration for job output generation

### Schema (Unchanged, snapshotted into job)

```typescript
export const outcomeSchema = z.object({
  type: outcomeTypeSchema.nullable().default(null),    // 'image' | 'gif' | 'video' | null
  captureStepId: z.string().nullable().default(null),  // Source for image-to-image
  aiEnabled: z.boolean().default(true),                 // false = passthrough mode
  imageGeneration: imageGenerationConfigSchema.default({...}),
  options: outcomeOptionsSchema.nullable().default(null),
})
```

---

## 4. ProjectContextSnapshot (Modified)

**Location**: `packages/shared/src/schemas/job/job.schema.ts`
**Purpose**: Project-level context for job execution

### Schema Changes

```typescript
// BEFORE
export const projectContextSnapshotSchema = z.looseObject({
  overlay: overlayReferenceSchema,
  applyOverlay: z.boolean(),
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
})

// AFTER - Add overlays map for aspect ratio lookup
export const projectContextSnapshotSchema = z.looseObject({
  /** @deprecated Use overlays map instead */
  overlay: overlayReferenceSchema.nullable().default(null),
  /** @deprecated Use overlays map instead */
  applyOverlay: z.boolean().default(false),
  /** Overlays by aspect ratio (from project config) */
  overlays: overlaysConfigSchema.nullable().default(null),
  /** Experience reference snapshot */
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
})
```

---

## 5. OutcomeContext (New - Internal)

**Location**: `functions/src/services/transform/types.ts`
**Purpose**: Execution context passed to outcome executors

### Schema

```typescript
export interface OutcomeContext {
  /** Job document (full, for ID and metadata) */
  job: Job
  /** Job snapshot (for execution data) */
  snapshot: JobSnapshot
  /** Processing start time (for timing metrics) */
  startTime: number
  /** Temporary directory for intermediate files */
  tmpDir: string
}
```

---

## 6. ResolvedPrompt (New - Internal)

**Location**: `functions/src/services/transform/bindings/resolvePromptMentions.ts`
**Purpose**: Result of prompt mention resolution

### Schema

```typescript
export interface ResolvedPrompt {
  /** Resolved prompt text with placeholders replaced */
  text: string
  /** Media references to include in generation request */
  mediaRefs: MediaReference[]
}
```

---

## 7. OutcomeExecutor (New - Internal)

**Location**: `functions/src/services/transform/engine/runOutcome.ts`
**Purpose**: Type signature for outcome executor functions

### Schema

```typescript
export type OutcomeExecutor = (ctx: OutcomeContext) => Promise<JobOutput>
```

---

## Entity Relationships

```
Job (document)
├── snapshot: JobSnapshot
│   ├── sessionResponses: SessionResponse[]
│   │   └── data: string | MultiSelectOption[] | MediaReference[]
│   ├── outcome: Outcome
│   │   └── imageGeneration: ImageGenerationConfig
│   │       └── refMedia: MediaReference[]
│   └── projectContext: ProjectContextSnapshot
│       └── overlays: { '1:1': MediaReference, '9:16': MediaReference }
└── output: JobOutput (after completion)
```

---

## Validation Rules

### Job Creation

| Rule | Validation |
|------|------------|
| Outcome type required | `outcome.type !== null` |
| Passthrough needs source | `!outcome.aiEnabled` implies `outcome.captureStepId !== null` |
| Capture step has media | Response with matching stepId has non-empty `data` array |

### Prompt Resolution

| Rule | Validation |
|------|------------|
| Step exists | `responses.find(r => r.stepName === stepName)` |
| Ref media exists | `refMedia.find(m => m.displayName === displayName)` |
| Graceful fallback | Unresolved mentions preserved with warning |

---

## State Transitions

### Job Status

```
pending → running → completed
                 → failed
```

### Session Job Status

```
null → pending (job created)
     → running (job started)
     → completed (job succeeded)
     → failed (job failed)
```
