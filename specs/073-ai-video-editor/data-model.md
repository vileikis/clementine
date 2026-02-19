# Data Model: AI Video Editor

**Branch**: `073-ai-video-editor` | **Date**: 2026-02-19

## Existing Entities (No Changes)

### Outcome (top-level)

```typescript
{
  type: OutcomeType | null      // 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video' | null
  photo: PhotoOutcomeConfig | null
  gif: GifOutcomeConfig | null
  video: VideoOutcomeConfig | null
  aiImage: AIImageOutcomeConfig | null
  aiVideo: AIVideoOutcomeConfig | null   // ← This is the focus of Phase 2
}
```

### ImageGenerationConfig (shared, reused)

```typescript
{
  prompt: string              // Default: ''
  model: AIImageModel         // Default: 'gemini-2.5-flash-image'
  refMedia: MediaReference[]  // Default: []
  aspectRatio: ImageAspectRatio | null  // Default: null (inherit from parent)
}
```

### MediaReference (shared, reused)

```typescript
{
  mediaAssetId: string
  url: string (URL)
  filePath: string | null
  displayName: string         // 1-100 chars, no {, }, : characters
}
```

## Existing Entities (Schema Changes Required)

### AIVideoOutcomeConfig

**Current state**: Schema exists in shared package but `aiVideoTaskSchema` is not exported.

**Change required**: Export `aiVideoTaskSchema` and add `AIVideoTask` type export.

```typescript
// packages/shared/src/schemas/experience/outcome.schema.ts

// BEFORE:
const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])

// AFTER:
export const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])

// Add type export:
export type AIVideoTask = z.infer<typeof aiVideoTaskSchema>
```

**Full AIVideoOutcomeConfig shape** (already defined, no schema changes):

```typescript
{
  task: AIVideoTask              // 'animate' | 'transform' | 'reimagine', default: 'animate'
  captureStepId: string          // Required reference to capture.photo step
  aspectRatio: VideoAspectRatio  // '9:16' | '1:1', default: '9:16'
  startFrameImageGen: ImageGenerationConfig | null  // Default: null
  endFrameImageGen: ImageGenerationConfig | null    // Default: null
  videoGeneration: VideoGenerationConfig            // Required
}
```

### VideoGenerationConfig (schema change required)

**Change required**: Replace `model: z.string()` with `model: aiVideoModelSchema`.

```typescript
// BEFORE:
model: z.string().default('')

// AFTER:
model: aiVideoModelSchema.default('veo-3.1-fast-generate-001')
```

**Full shape after change**:
```typescript
{
  prompt: string                         // Default: ''
  model: AIVideoModel                    // 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001', default: 'veo-3.1-fast-generate-001'
  duration: number                       // 1-60 seconds, default: 5
  aspectRatio: VideoAspectRatio | null   // Default: null (inherit from parent)
}
```

## Entity Relationships

```
Outcome
├── type: 'ai.video'
└── aiVideo: AIVideoOutcomeConfig
    ├── task: AIVideoTask
    ├── captureStepId → ExperienceStep (capture.photo)
    ├── aspectRatio: VideoAspectRatio
    ├── startFrameImageGen: ImageGenerationConfig | null
    │   ├── prompt (with @{step:...} and @{ref:...} mentions)
    │   ├── model: AIImageModel
    │   └── refMedia: MediaReference[]
    ├── endFrameImageGen: ImageGenerationConfig | null
    │   ├── prompt (with mentions)
    │   ├── model: AIImageModel
    │   └── refMedia: MediaReference[]
    └── videoGeneration: VideoGenerationConfig
        ├── prompt
        ├── model: AIVideoModel
        └── duration: number
```

## Task → Visible Config Matrix

| Field | animate | transform | reimagine |
|-------|---------|-----------|-----------|
| captureStepId | visible | visible | visible |
| aspectRatio | visible | visible | visible |
| videoGeneration.prompt | visible | visible | visible |
| videoGeneration.model | visible | visible | visible |
| videoGeneration.duration | visible | visible | visible |
| startFrameImageGen | hidden | hidden | **visible** |
| endFrameImageGen | hidden | **visible** | **visible** |

## Smart Defaults

When AI Video is selected for the first time (`initializeOutcomeType` creates default config):

```typescript
{
  task: 'animate',
  captureStepId: autoStepId ?? '',    // Auto-select if exactly 1 capture step
  aspectRatio: '9:16',
  startFrameImageGen: null,
  endFrameImageGen: null,
  videoGeneration: {
    prompt: '',
    model: 'veo-3.1-fast-generate-001',
    duration: 5,
    aspectRatio: null,
  }
}
```

## Validation Rules

| Rule | Field | Condition |
|------|-------|-----------|
| V1 | `captureStepId` | Must be non-empty and reference existing `capture.photo` step |
| V2 | `endFrameImageGen.refMedia` | No duplicate displayNames (same as AI Image) |
| V3 | `startFrameImageGen.refMedia` | No duplicate displayNames (same as AI Image) |

Note: Prompt fields are NOT validated as required for AI Video in Phase 2 — validation is deferred to Phase 3 when the backend executor is implemented.
