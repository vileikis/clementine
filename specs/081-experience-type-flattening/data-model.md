# Data Model: Experience Type Flattening

**Feature Branch**: `081-experience-type-flattening`
**Date**: 2026-02-24

## Entity Changes

### 1. Experience Document

**Firestore path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

#### Before

```
experience {
  id: string
  name: string
  status: 'active' | 'deleted'
  profile: 'freeform' | 'survey' | 'story'        ← REMOVED
  media: MediaReference | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  draft: ExperienceConfig {
    steps: ExperienceStep[]
    outcome: Outcome | null {                       ← REMOVED (wrapper)
      type: OutcomeType | null                      ← MOVED to experience.type
      photo: PhotoOutcomeConfig | null              ← MOVED up one level
      gif: GifOutcomeConfig | null                  ← MOVED up one level
      video: VideoOutcomeConfig | null              ← MOVED up one level
      aiImage: AIImageOutcomeConfig | null          ← MOVED up one level
      aiVideo: AIVideoOutcomeConfig | null          ← MOVED up one level
    }
  }
  published: ExperienceConfig | null                [same structure as draft]
  draftVersion: number
  publishedVersion: number | null
  publishedAt: number | null
  publishedBy: string | null
}
```

#### After

```
experience {
  id: string
  name: string
  status: 'active' | 'deleted'
  type: 'survey' | 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'   ← NEW (replaces profile)
  media: MediaReference | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  draft: ExperienceConfig {
    steps: ExperienceStep[]
    photo: PhotoOutcomeConfig | null                ← FLATTENED (was outcome.photo)
    gif: GifOutcomeConfig | null                    ← FLATTENED (was outcome.gif)
    video: VideoOutcomeConfig | null                ← FLATTENED (was outcome.video)
    aiImage: AIImageOutcomeConfig | null            ← FLATTENED (was outcome.aiImage)
    aiVideo: AIVideoOutcomeConfig | null            ← FLATTENED (was outcome.aiVideo)
  }
  published: ExperienceConfig | null                [same structure as draft]
  draftVersion: number
  publishedVersion: number | null
  publishedAt: number | null
  publishedBy: string | null
}
```

#### Field Changes Summary

| Change | Old Path | New Path |
|--------|----------|----------|
| Profile → Type | `experience.profile` | `experience.type` |
| Outcome type removed | `experience.draft.outcome.type` | (derived from `experience.type`) |
| Outcome wrapper removed | `experience.draft.outcome` | (fields moved up) |
| Photo config | `experience.draft.outcome.photo` | `experience.draft.photo` |
| GIF config | `experience.draft.outcome.gif` | `experience.draft.gif` |
| Video config | `experience.draft.outcome.video` | `experience.draft.video` |
| AI Image config | `experience.draft.outcome.aiImage` | `experience.draft.aiImage` |
| AI Video config | `experience.draft.outcome.aiVideo` | `experience.draft.aiVideo` |

Same changes apply to `experience.published.*`.

---

### 2. Job Snapshot

**Stored in**: Job document at `/projects/{projectId}/sessions/{sessionId}/jobs/{jobId}`

#### Before

```
job.snapshot {
  sessionResponses: SessionResponse[]
  experienceVersion: number
  outcome: Outcome | null {                         ← REMOVED (wrapper)
    type: OutcomeType | null                        ← MOVED to snapshot.type
    photo: PhotoOutcomeConfig | null                ← MOVED up one level
    gif: GifOutcomeConfig | null                    ← MOVED up one level
    video: VideoOutcomeConfig | null                ← MOVED up one level
    aiImage: AIImageOutcomeConfig | null            ← MOVED up one level
    aiVideo: AIVideoOutcomeConfig | null            ← MOVED up one level
  }
  overlayChoice: OverlayReference | null
}
```

#### After

```
job.snapshot {
  sessionResponses: SessionResponse[]
  experienceVersion: number
  type: ExperienceType                              ← NEW (from experience.type)
  photo: PhotoOutcomeConfig | null                  ← FLATTENED
  gif: GifOutcomeConfig | null                      ← FLATTENED
  video: VideoOutcomeConfig | null                  ← FLATTENED
  aiImage: AIImageOutcomeConfig | null              ← FLATTENED
  aiVideo: AIVideoOutcomeConfig | null              ← FLATTENED
  overlayChoice: OverlayReference | null
}
```

---

### 3. Experience Type Enum

#### Before (two separate enums)

```
ExperienceProfile = 'freeform' | 'survey' | 'story'
OutcomeType = 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'
```

#### After (single unified enum)

```
ExperienceType = 'survey' | 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'
```

---

### 4. Type Metadata (Frontend)

#### Before

```
profileMetadata: Record<ExperienceProfile, ProfileMetadata>
  freeform → { label, allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main] }
  survey   → { label, allowedStepCategories: [info, input, capture], slotCompatibility: [main, pregate, preshare] }
  story    → { label, allowedStepCategories: [info], slotCompatibility: [pregate, preshare] }
```

#### After

```
typeMetadata: Record<ExperienceType, TypeMetadata>
  survey   → { label: 'Survey',    allowedStepCategories: [info, input, capture],            slotCompatibility: [main, pregate, preshare] }
  photo    → { label: 'Photo',     allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main] }
  gif      → { label: 'GIF',       allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main], comingSoon: true }
  video    → { label: 'Video',     allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main], comingSoon: true }
  ai.image → { label: 'AI Image',  allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main] }
  ai.video → { label: 'AI Video',  allowedStepCategories: [info, input, capture, transform], slotCompatibility: [main] }
```

---

## Per-Type Config Schemas (Unchanged)

These schemas remain exactly the same — only their location in the parent schema changes:

| Schema | Fields |
|--------|--------|
| `photoOutcomeConfigSchema` | captureStepId, aspectRatio |
| `gifOutcomeConfigSchema` | captureStepId, aspectRatio |
| `videoOutcomeConfigSchema` | captureStepId, aspectRatio |
| `aiImageOutcomeConfigSchema` | task, captureStepId, aspectRatio, imageGeneration |
| `aiVideoOutcomeConfigSchema` | task, captureStepId, aspectRatio, startFrameImageGen, endFrameImageGen, videoGeneration |

---

## Validation Rules

| Rule | Description |
|------|-------------|
| Experience type required | `experience.type` is non-nullable, set at creation |
| Type immutability | Type can be changed via config header but not via library (same as current outcome type behavior) |
| Survey has no type configs | When `type = 'survey'`, all per-type configs MUST be null |
| Active type config required | When `type != 'survey'` and experience is published, the active type's config MUST be non-null |
| Coming soon types | `gif` and `video` types are valid in schema but not selectable in UI creation flow |

---

## State Transitions

Experience type follows these transitions:

```
Creation: → type selected (required)
Editing:  type A → type B (via type selector in config header)
          - Previous type's config set to null
          - New type's default config initialized
Publishing: type must be valid + active config must be complete
Processing: survey types cannot enter transform pipeline
```
