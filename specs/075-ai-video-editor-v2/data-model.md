# Data Model: AI Video Editor v2

**Branch**: `075-ai-video-editor-v2` | **Date**: 2026-02-22

## Schema Changes

### 1. AI Video Task Enum

**File**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Before**:
```typescript
export const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])
```

**After**:
```typescript
// Raw schema accepts legacy 'animate' value for backward compatibility
const rawAiVideoTaskSchema = z.enum([
  'animate',           // Legacy — transformed to 'image-to-video'
  'image-to-video',
  'ref-images-to-video',
  'transform',
  'reimagine',
])

// Public schema with lazy migration transform
export const aiVideoTaskSchema = rawAiVideoTaskSchema.transform((v) =>
  v === 'animate' ? 'image-to-video' as const : v,
)
```

**Inferred type**: `'image-to-video' | 'ref-images-to-video' | 'transform' | 'reimagine'`

**Migration**: Legacy `'animate'` values are transparently mapped to `'image-to-video'` at parse time.

---

### 2. Video Duration Schema (new)

**File**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Before**: Inline `z.number().min(4).max(8).default(5)`

**After**:
```typescript
const VALID_DURATIONS = [4, 6, 8] as const
type VideoDuration = (typeof VALID_DURATIONS)[number]

export const videoDurationSchema = z
  .number()
  .transform((n): VideoDuration => {
    const clamped = Math.max(4, Math.min(8, n))
    return VALID_DURATIONS.reduce((prev, curr) =>
      Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev,
    ) as VideoDuration
  })
  .pipe(z.literal(4).or(z.literal(6)).or(z.literal(8)))
```

**Inferred type**: `4 | 6 | 8`

**Migration**: Legacy `duration: 5` → coerced to `6` (nearest valid value).

---

### 3. Video Generation Config

**File**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Before**:
```typescript
export const videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: z.number().min(4).max(8).default(5),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
})
```

**After**:
```typescript
export const videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: videoDurationSchema.default(6),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
  refMedia: z.array(mediaReferenceSchema).default([]),
})
```

**Changes**:
- `duration`: `z.number().min(4).max(8).default(5)` → `videoDurationSchema.default(6)`
- `refMedia`: New field, `MediaReference[]`, defaults to `[]`

---

### 4. AI Video Outcome Config

**File**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Before**:
```typescript
export const aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('animate'),
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
  startFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  endFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  videoGeneration: videoGenerationConfigSchema,
})
```

**After**:
```typescript
export const aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('image-to-video'),
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
  startFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  endFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  videoGeneration: videoGenerationConfigSchema,
})
```

**Change**: Default task `'animate'` → `'image-to-video'`

---

## Entity Relationship

```
AIVideoOutcomeConfig
├── task: AIVideoTask (image-to-video | ref-images-to-video | transform | reimagine)
├── captureStepId: string (→ references ExperienceStep)
├── aspectRatio: VideoAspectRatio (9:16 | 16:9)
├── startFrameImageGen: ImageGenerationConfig | null
├── endFrameImageGen: ImageGenerationConfig | null
└── videoGeneration: VideoGenerationConfig
    ├── prompt: string (supports @mentions)
    ├── model: AIVideoModel
    ├── duration: VideoDuration (4 | 6 | 8)
    ├── aspectRatio: VideoAspectRatio | null (inherits from parent)
    └── refMedia: MediaReference[] (max 2 for ref-images-to-video, ignored for others)
        ├── mediaAssetId: string
        ├── url: string (public URL)
        ├── filePath: string | null (storage path)
        └── displayName: string
```

## Task-to-API Mapping

| Task | API Pattern | `params.image` | `config.referenceImages` | `config.lastFrame` |
|------|------------|----------------|--------------------------|-------------------|
| `image-to-video` | Animate | User photo (first frame) | Not set | Not set |
| `ref-images-to-video` | Reference | Not set | User photo + refMedia (ASSET type) | Not set |
| `transform` (future) | Transform | User photo | Not set | End frame image |
| `reimagine` (future) | Transform | Start frame image | Not set | End frame image |

## Validation Rules by Task

| Field | `image-to-video` | `ref-images-to-video` | `transform` | `reimagine` |
|-------|------------------|-----------------------|-------------|-------------|
| `videoGeneration.prompt` | Required | Required | Required | Required |
| `videoGeneration.refMedia` | Ignored | Max 2 items | Ignored | Ignored |
| `captureStepId` | Required | Required | Required | Required |
| `startFrameImageGen` | Ignored | Ignored | Ignored | Validated |
| `endFrameImageGen` | Ignored | Ignored | Validated | Validated |

## Type Exports

New/changed type exports from `@clementine/shared`:

```typescript
export type AIVideoTask = 'image-to-video' | 'ref-images-to-video' | 'transform' | 'reimagine'
export type VideoDuration = 4 | 6 | 8
export type VideoGenerationConfig = {
  prompt: string
  model: AIVideoModel
  duration: VideoDuration
  aspectRatio: VideoAspectRatio | null
  refMedia: MediaReference[]
}
```
