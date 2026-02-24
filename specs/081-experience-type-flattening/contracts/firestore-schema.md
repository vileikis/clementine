# Firestore Schema Contracts: Experience Type Flattening

**Feature Branch**: `081-experience-type-flattening`
**Date**: 2026-02-24

This feature does not introduce new API endpoints. All mutations use Firebase client SDK (Firestore writes) and Cloud Functions. This document defines the Firestore document schema contracts.

## Experience Document Contract

**Collection**: `/workspaces/{workspaceId}/experiences/{experienceId}`

### Write Contract: Create Experience

**Trigger**: Creator submits "Create Experience" form
**Writer**: Client SDK (Firestore)

```typescript
// Fields set at creation
{
  id: string,                    // Generated document ID
  name: string,                  // User-provided name (1-100 chars)
  type: ExperienceType,          // Selected type (REQUIRED — replaces 'profile')
  status: 'active',
  media: null,
  draft: {
    steps: [],
    photo: null,
    gif: null,
    video: null,
    aiImage: null,               // Populated with defaults if type = 'ai.image'
    aiVideo: null,               // Populated with defaults if type = 'ai.video'
  },
  published: null,
  draftVersion: 1,
  publishedVersion: null,
  publishedAt: null,
  publishedBy: null,
  createdAt: serverTimestamp,
  updatedAt: serverTimestamp,
  deletedAt: null,
}
```

### Write Contract: Update Experience Type

**Trigger**: Creator switches type via config header selector
**Writer**: Client SDK (Firestore)

```typescript
// Fields updated on type switch
{
  type: ExperienceType,          // New type value
  draft: {
    // Previous type's config → null
    // New type's config → default values
    [previousType]: null,
    [newType]: defaultConfigForType,
  },
  updatedAt: serverTimestamp,
}
```

### Write Contract: Update Type-Specific Config

**Trigger**: Creator edits outcome configuration (auto-save)
**Writer**: Client SDK (Firestore)

```typescript
// Fields updated on config change (example: AI Image)
{
  draft: {
    aiImage: {
      task: AIImageTask,
      captureStepId: string | null,
      aspectRatio: ImageAspectRatio,
      imageGeneration: ImageGenerationConfig,
    },
  },
  updatedAt: serverTimestamp,
}
```

---

## Job Snapshot Contract

**Collection**: `/projects/{projectId}/sessions/{sessionId}/jobs/{jobId}`

### Write Contract: Build Job Snapshot

**Trigger**: `startTransformPipeline` Cloud Function
**Writer**: Admin SDK (Cloud Functions)

```typescript
// Snapshot construction from experience
{
  snapshot: {
    sessionResponses: SessionResponse[],
    experienceVersion: number,
    type: ExperienceType,            // From experience.type
    photo: PhotoOutcomeConfig | null,  // From experience.[configSource].photo
    gif: GifOutcomeConfig | null,
    video: VideoOutcomeConfig | null,
    aiImage: AIImageOutcomeConfig | null,
    aiVideo: AIVideoOutcomeConfig | null,
    overlayChoice: OverlayReference | null,
  }
}
```

### Read Contract: Outcome Executor

**Trigger**: `transformPipelineTask` Cloud Task
**Reader**: Admin SDK (Cloud Functions)

```typescript
// Executor reads from snapshot
const { type } = snapshot                    // Determines executor
const typeConfig = snapshot[type]             // Type-specific config (e.g., snapshot.aiImage)
```

---

## Migration Contract

**Script**: `functions/scripts/migrations/081-experience-type-flattening.ts`
**Target**: All documents in `/workspaces/{workspaceId}/experiences/`

### Transformation Rules

```typescript
// Input: Old experience document
{
  profile: ExperienceProfile,
  draft: {
    outcome: {
      type: OutcomeType | null,
      photo: PhotoConfig | null,
      aiImage: AIImageConfig | null,
      aiVideo: AIVideoConfig | null,
      gif: GifConfig | null,
      video: VideoConfig | null,
    } | null,
    steps: Step[],
  },
  published: { /* same structure */ } | null,
}

// Output: New experience document
{
  type: ExperienceType,              // Derived from profile + outcome.type
  // profile: DELETED
  draft: {
    // outcome: DELETED (wrapper)
    steps: Step[],                   // Unchanged
    photo: PhotoConfig | null,       // Moved from outcome.photo
    aiImage: AIImageConfig | null,   // Moved from outcome.aiImage
    aiVideo: AIVideoConfig | null,   // Moved from outcome.aiVideo
    gif: GifConfig | null,           // Moved from outcome.gif
    video: VideoConfig | null,       // Moved from outcome.video
  },
  published: { /* same flattening */ } | null,
}
```

### Type Derivation Rules

| profile | outcome.type | → experience.type |
|---------|-------------|-------------------|
| `'freeform'` | `'photo'` | `'photo'` |
| `'freeform'` | `'ai.image'` | `'ai.image'` |
| `'freeform'` | `'ai.video'` | `'ai.video'` |
| `'freeform'` | `'gif'` | `'gif'` |
| `'freeform'` | `'video'` | `'video'` |
| `'freeform'` | `null` | `'ai.image'` (safe default) |
| `'survey'` | any | `'survey'` |
| `'story'` | any | `'survey'` |
