# Data Model: Experience System Structural Foundations

**Feature**: 019-exp-system-foundations
**Date**: 2026-01-08
**Phase**: 1 - Design

## Overview

This document defines the data models for the Experience System foundations. Phase 0 establishes type definitions and schemas without implementation. These models will be used by future phases to build the complete Experience System.

---

## Entities

### 1. Experience

An experience is a step-based interactive flow scoped to an Event.

**Location**: `domains/experience/shared/schemas/experience.schema.ts`

```typescript
// Zod Schema
export const experienceSchema = z.looseObject({
  // Identity
  id: z.string(),
  name: z.string().min(1).max(100),

  // Metadata
  status: z.enum(['active', 'deleted']).default('active'),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // Configuration (draft vs published)
  draftConfig: experienceConfigSchema.nullable().default(null),
  publishedConfig: experienceConfigSchema.nullable().default(null),

  // Version tracking
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),
})

export type Experience = z.infer<typeof experienceSchema>
```

**Experience Config Schema**:
```typescript
export const experienceConfigSchema = z.looseObject({
  schemaVersion: z.number().default(1),
  profile: experienceProfileSchema.default('free'),
  steps: z.array(stepConfigSchema).default([]),
})

export type ExperienceConfig = z.infer<typeof experienceConfigSchema>
```

**Firestore Path**: `/projects/{projectId}/events/{eventId}/experiences/{experienceId}`

---

### 2. Step

A step is an individual unit within an experience. Steps are categorized and have type-specific configurations.

**Location**: `domains/experience/shared/types/step.types.ts`

```typescript
// Step categories
export type StepCategory = 'info' | 'input' | 'capture' | 'transform' | 'share'

// Base step interface
export interface BaseStep {
  id: string
  category: StepCategory
  type: string
  label: string  // Admin-facing label
}

// Step with category-specific config (discriminated union)
export type Step =
  | InfoStep
  | InputStep
  | CaptureStep
  | TransformStep
  | ShareStep

// Category-specific step interfaces (skeleton for Phase 0)
export interface InfoStep extends BaseStep {
  category: 'info'
  type: 'info'
  config: InfoStepConfig
}

export interface InputStep extends BaseStep {
  category: 'input'
  type: 'yesNo' | 'scale' | 'shortText' | 'longText' | 'multiSelect'
  config: InputStepConfig
}

export interface CaptureStep extends BaseStep {
  category: 'capture'
  type: 'photo' | 'video' | 'gif'
  config: CaptureStepConfig
}

export interface TransformStep extends BaseStep {
  category: 'transform'
  type: 'pipeline'
  config: TransformStepConfig
}

export interface ShareStep extends BaseStep {
  category: 'share'
  type: 'share'
  config: ShareStepConfig
}
```

**Step Config Schemas** (empty placeholders for Phase 0):
```typescript
// domains/experience/shared/schemas/step-registry.schema.ts

export const infoStepConfigSchema = z.looseObject({})
export const inputStepConfigSchema = z.looseObject({})
export const captureStepConfigSchema = z.looseObject({})
export const transformStepConfigSchema = z.looseObject({})
export const shareStepConfigSchema = z.looseObject({})

export type InfoStepConfig = z.infer<typeof infoStepConfigSchema>
export type InputStepConfig = z.infer<typeof inputStepConfigSchema>
export type CaptureStepConfig = z.infer<typeof captureStepConfigSchema>
export type TransformStepConfig = z.infer<typeof transformStepConfigSchema>
export type ShareStepConfig = z.infer<typeof shareStepConfigSchema>
```

---

### 3. Session

A session tracks guest or admin preview progress through an experience.

**Location**: `domains/session/shared/schemas/session.schema.ts`

```typescript
export const sessionModeSchema = z.enum(['preview', 'guest'])
export const configSourceSchema = z.enum(['draft', 'published'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'abandoned', 'error'])

export const sessionSchema = z.looseObject({
  // Identity
  id: z.string(),

  // Context
  projectId: z.string(),
  eventId: z.string(),
  experienceId: z.string(),

  // Mode
  mode: sessionModeSchema,
  configSource: configSourceSchema,

  // State
  status: sessionStatusSchema.default('active'),
  currentStepIndex: z.number().default(0),

  // Accumulated data
  answers: z.record(z.string(), z.unknown()).default({}),
  outputs: z.record(z.string(), mediaReferenceSchema).default({}),

  // Transform job tracking (for async processing)
  activeJobId: z.string().nullable().default(null),
  resultAssetId: z.string().nullable().default(null),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().nullable().default(null),
})

export type Session = z.infer<typeof sessionSchema>
export type SessionMode = z.infer<typeof sessionModeSchema>
export type ConfigSource = z.infer<typeof configSourceSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>
```

**Media Reference Schema** (for outputs):
```typescript
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>
```

**Firestore Path**: `/projects/{projectId}/sessions/{sessionId}`

---

### 4. ExperienceProfile

An enum defining valid experience patterns for validation.

**Location**: `domains/experience/shared/types/profile.types.ts`

```typescript
export enum ExperienceProfile {
  Free = 'free',           // Any valid step sequence
  Photobooth = 'photobooth', // Requires capture → transform → share
  Survey = 'survey',       // Input steps only, no media
  Gallery = 'gallery',     // View-only, no capture
}

export const experienceProfileSchema = z.nativeEnum(ExperienceProfile)

// Validation result interface
export interface ProfileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Validator function type
export type ProfileValidator = (config: ExperienceConfig) => ProfileValidationResult

// Empty validators for Phase 0 (always pass)
export const profileValidators: Record<ExperienceProfile, ProfileValidator> = {
  [ExperienceProfile.Free]: () => ({ valid: true, errors: [], warnings: [] }),
  [ExperienceProfile.Photobooth]: () => ({ valid: true, errors: [], warnings: [] }),
  [ExperienceProfile.Survey]: () => ({ valid: true, errors: [], warnings: [] }),
  [ExperienceProfile.Gallery]: () => ({ valid: true, errors: [], warnings: [] }),
}

// Convenience function
export function validateExperienceProfile(
  profile: ExperienceProfile,
  config: ExperienceConfig
): ProfileValidationResult {
  return profileValidators[profile](config)
}
```

---

### 5. RuntimeEngine (Interface Only)

The runtime engine interface for executing experiences.

**Location**: `domains/experience/shared/types/runtime.types.ts`

```typescript
export interface RuntimeState {
  currentStepIndex: number
  answers: Record<string, unknown>
  outputs: Record<string, MediaReference>
}

export interface RuntimeEngine {
  // Configuration
  readonly experienceId: string
  readonly sessionId: string
  readonly mode: SessionMode

  // State accessors
  readonly currentStep: Step | null
  readonly currentStepIndex: number
  readonly totalSteps: number
  readonly canProceed: boolean
  readonly canGoBack: boolean
  readonly isComplete: boolean

  // Navigation
  next(): Promise<void>
  back(): void
  goToStep(index: number): void

  // Data mutation
  setAnswer(stepId: string, answer: unknown): void
  setMedia(stepId: string, mediaRef: MediaReference): void

  // State access
  getAnswer(stepId: string): unknown | undefined
  getOutput(stepId: string): MediaReference | undefined
  getState(): RuntimeState
}
```

---

### 6. Session API (Type Shapes Only)

**Location**: `domains/session/shared/types/session-api.types.ts`

```typescript
// Input types
export interface CreateSessionInput {
  projectId: string
  eventId: string
  experienceId: string
  mode: SessionMode
  configSource: ConfigSource
}

export interface UpdateSessionProgressInput {
  sessionId: string
  currentStepIndex: number
  answers?: Record<string, unknown>
  outputs?: Record<string, MediaReference>
}

// API function types (shapes only, no implementation)
export type CreateSessionFn = (input: CreateSessionInput) => Promise<Session>

export type SubscribeSessionFn = (
  sessionId: string,
  callback: (session: Session) => void
) => () => void // Returns unsubscribe function

export type UpdateSessionProgressFn = (input: UpdateSessionProgressInput) => Promise<void>

export type CloseSessionFn = (sessionId: string) => Promise<void>
```

---

### 7. Project (Existing - activeEventId already present)

**Location**: `domains/project/shared/schemas/project.schema.ts` (already exists)

The `activeEventId` field already exists in the project schema. No modifications needed for Phase 0.

```typescript
// Existing field in project schema - no changes required
activeEventId: z.string().nullable().default(null),
```

**Note**: This field is already implemented and used. No action required for this phase.

---

## Entity Relationships

```
Project (1) ────────────────┐
    │                       │
    │ activeEventId         │ projectId
    ▼                       │
Event (N)                   │
    │                       │
    │ eventId               │
    ▼                       ▼
Experience (N) ◄──────── Session (N)
    │                       │
    │ experienceId          │
    └───────────────────────┘
```

**Relationships**:
- Project → Event: One project has many events, one active at a time (`activeEventId`)
- Event → Experience: One event has many experiences (subcollection)
- Session → Experience: Each session references one experience
- Session → Project: Sessions are stored under project (for access control)

---

## State Transitions

### Experience Status
```
active ──[soft delete]──► deleted
```

### Session Status
```
active ──[complete all steps]──► completed
   │
   ├──[timeout/abandon]──► abandoned
   │
   └──[error during processing]──► error
```

---

## Validation Rules

### Experience
- `name`: Required, 1-100 characters
- `status`: Must be 'active' or 'deleted'
- `draftConfig`: Nullable, validated on save
- `publishedConfig`: Nullable, set during event publish

### Session
- `mode`: Must be 'preview' or 'guest'
- `configSource`: Must be 'draft' or 'published'
- `currentStepIndex`: Non-negative integer
- Guest sessions MUST use `configSource: 'published'`
- Preview sessions MAY use either config source

### Step Registry
- Each step must have unique `id` within experience
- Step `type` must match a registered step type
- Step `category` must be valid enum value

---

## Index Requirements

### Firestore Indexes (for future phases)

```
// Sessions by project and status
Collection: projects/{projectId}/sessions
Fields: status (ASC), createdAt (DESC)

// Experiences by event and status
Collection: projects/{projectId}/events/{eventId}/experiences
Fields: status (ASC), createdAt (DESC)
```

---

## Migration Notes

- **No migration required**: All new collections/fields
- **Backwards compatibility**: `activeEventId` already exists in Project type
- **Firestore subcollections**: Created on first write, no setup needed
