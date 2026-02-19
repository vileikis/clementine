# Contract: Outcome Schema (Zod)

**Package**: `@clementine/shared`
**File**: `packages/shared/src/schemas/experience/outcome.schema.ts`

## OutcomeType

```typescript
const outcomeTypeSchema = z.enum(['photo', 'gif', 'video', 'ai.image', 'ai.video'])
```

## Generation Config Schemas (shared)

### ImageGenerationConfig

Shared by `ai.image` and `ai.video` outcomes. Contains the parameters passed to `aiGenerateImage()`.

```typescript
const imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  refMedia: z.array(mediaReferenceSchema).default([]),
  aspectRatio: imageAspectRatioSchema.nullable().default(null), // null = inherit from parent
})
```

### VideoGenerationConfig

Used by `ai.video` outcome. Contains the parameters passed to the video generation service.

```typescript
const videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: z.string().default(''),
  duration: z.number().min(1).max(60).default(5),
  aspectRatio: videoAspectRatioSchema.nullable().default(null), // null = inherit from parent
})
```

## PhotoOutcomeConfig

```typescript
const photoOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})
```

## AIImageOutcomeConfig

```typescript
const aiImageTaskSchema = z.enum(['text-to-image', 'image-to-image'])

const aiImageOutcomeConfigSchema = z.object({
  task: aiImageTaskSchema.default('text-to-image'),
  captureStepId: z.string().nullable().default(null),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
  imageGeneration: imageGenerationConfigSchema.default({
    prompt: '',
    model: 'gemini-2.5-flash-image',
    refMedia: [],
    aspectRatio: null,
  }),
})
```

## GifOutcomeConfig (placeholder)

```typescript
const gifOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})
```

## VideoOutcomeConfig (placeholder)

```typescript
const videoOutcomeConfigSchema = z.object({
  captureStepId: z.string(),
  aspectRatio: imageAspectRatioSchema.default('1:1'),
})
```

## AIVideoOutcomeConfig (placeholder)

```typescript
const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])

const aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('animate'),
  captureStepId: z.string(),
  aspectRatio: videoAspectRatioSchema.default('9:16'),
  startFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  endFrameImageGen: imageGenerationConfigSchema.nullable().default(null),
  videoGeneration: videoGenerationConfigSchema,
})
```

## Outcome (top-level)

```typescript
const outcomeSchema = z.looseObject({
  type: outcomeTypeSchema.nullable().default(null),
  photo: photoOutcomeConfigSchema.nullable().default(null),
  gif: gifOutcomeConfigSchema.nullable().default(null),
  video: videoOutcomeConfigSchema.nullable().default(null),
  aiImage: aiImageOutcomeConfigSchema.nullable().default(null),
  aiVideo: aiVideoOutcomeConfigSchema.nullable().default(null),
})
```

**Note**: `z.looseObject()` used for backward compatibility — old fields (`aiEnabled`, `imageGeneration`, etc.) are silently ignored during parsing.

## Exported Types

```typescript
type OutcomeType = z.infer<typeof outcomeTypeSchema>
type ImageGenerationConfig = z.infer<typeof imageGenerationConfigSchema>
type VideoGenerationConfig = z.infer<typeof videoGenerationConfigSchema>
type PhotoOutcomeConfig = z.infer<typeof photoOutcomeConfigSchema>
type AIImageOutcomeConfig = z.infer<typeof aiImageOutcomeConfigSchema>
type GifOutcomeConfig = z.infer<typeof gifOutcomeConfigSchema>
type VideoOutcomeConfig = z.infer<typeof videoOutcomeConfigSchema>
type AIVideoOutcomeConfig = z.infer<typeof aiVideoOutcomeConfigSchema>
type Outcome = z.infer<typeof outcomeSchema>
```

## Removed Exports

The following schemas and types are removed:

- `outcomeOptionsSchema` / `OutcomeOptions` (replaced by per-type configs)
- `imageOptionsSchema` / `ImageOptions`
- `gifOptionsSchema` / `GifOptions`
- `videoOptionsSchema` / `VideoOptions`

## aspectRatio Cascade Pattern

Generation configs (`imageGenerationConfigSchema`, `videoGenerationConfigSchema`) have `aspectRatio` as **nullable with null default**. The executor resolves AR as:

```typescript
const aspectRatio = genConfig.aspectRatio ?? parentConfig.aspectRatio
```

- **Outcome context**: `aspectRatio` is `null` → inherits from parent outcome config.
- **Standalone context**: can be set explicitly for self-contained generation requests.
