# Future Patterns: Linear Chain Generation

**Status**: Future Work (Not in MVP scope)
**Related**: [Epic](./epic.md)

---

## Overview

This document captures patterns and solutions discussed for future AI generation capabilities beyond the MVP image generation.

---

## AI Generation Types

| Type | Models | Input | Output |
|------|--------|-------|--------|
| Text Generation | Gemini 2.5, ChatGPT-5, Grok | Text prompt + context | Text |
| Image Generation | Gemini 2.5 Flash Image, etc. | Text prompt + optional source image | Image |
| Video Generation | Kling AI, etc. | Text prompt + source image | Video |

---

## Use Cases

### MVP (Implemented)

| # | Use Case | Text Gen | Image Gen | Video Gen |
|---|----------|----------|-----------|-----------|
| 1 | Passthrough (overlay only) | - | - | - |
| 2 | Prompt → Image | - | ✓ | - |
| 3 | Source image → AI Image | - | ✓ | - |

### Future Use Cases

| # | Use Case | Text Gen | Image Gen | Video Gen |
|---|----------|----------|-----------|-----------|
| 4 | Same as 1-3 for GIF | - | ✓ | - |
| 5 | Video passthrough | - | - | - |
| 6 | AI Image → AI Video | - | ✓ | ✓ |
| 7 | Prompt → Video (direct) | - | - | ✓ |
| 8 | Text AI → Image AI | ✓ | ✓ | - |
| 9 | Text AI → Image AI → Video AI | ✓ | ✓ | ✓ |

---

## Linear Pipeline Pattern

All use cases follow a **fixed-order linear pipeline** (not arbitrary node graphs):

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │ →  │    Text     │ →  │    Image    │ →  │    Video    │ →  Output
│   Input     │    │ Generation  │    │ Generation  │    │ Generation  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         ↓                  ↓                  ↓
                     optional           optional           optional
```

### Key Properties

1. **Fixed order** - stages always execute in the same sequence
2. **Each stage optional** - can be enabled/disabled independently
3. **Chaining via mentions** - stages can reference previous stage output
4. **Admin controls prompts** - no auto-generated prompts without visibility
5. **Not node graphs** - simpler mental model, predictable execution

---

## Proposed Schema Evolution

### Current MVP Schema

```ts
create: {
  type: 'image' | 'gif' | 'video' | null,
  captureStepId: string | null,
  aiEnabled: boolean,

  imageGeneration: {
    prompt: string,
    refMedia: MediaReference[],
    model: AIImageModel,
    aspectRatio: AIImageAspectRatio,
  },

  options: ImageOptions | GifOptions | VideoOptions | null,
}
```

### Future Schema with All Stages

```ts
create: {
  type: 'image' | 'gif' | 'video' | null,
  captureStepId: string | null,
  aiEnabled: boolean,  // Global kill switch for all AI

  // Stage 1: Text Generation (optional)
  textGeneration: {
    enabled: boolean,
    prompt: string,           // Uses @{step:...} mentions
    model: TextModel,         // 'gemini-2.5', 'chatgpt-5', etc.
  } | null,

  // Stage 2: Image Generation (optional, current imageGeneration)
  imageGeneration: {
    enabled: boolean,
    prompt: string,           // Uses @{step:...} OR @{textGeneration}
    refMedia: MediaReference[],
    model: AIImageModel,
    aspectRatio: AIImageAspectRatio,
  } | null,

  // Stage 3: Video Generation (optional)
  videoGeneration: {
    enabled: boolean,
    prompt: string,           // Uses @{step:...} or references image
    model: VideoModel,        // 'kling-ai', etc.
    duration: number,         // seconds
  } | null,

  // Output format options
  options: ImageOptions | GifOptions | VideoOptions | null,
}
```

---

## Chaining Syntax

Extend the existing mention syntax to support stage references:

| Mention | Resolves To | Example |
|---------|-------------|---------|
| `@{step:stepName}` | Session response value/media | `@{step:Pet Choice}` → "cat" |
| `@{ref:displayName}` | Reference media | `@{ref:style.jpg}` → media |
| `@{textGeneration}` | Text stage output | Generated description |
| `@{imageGeneration}` | Image stage output | Generated image |

### Example: Text → Image Chain

```ts
textGeneration: {
  enabled: true,
  prompt: "Write a creative, detailed description of a @{step:Pet Choice} in a @{step:Setting}",
  model: 'gemini-2.5',
}

imageGeneration: {
  enabled: true,
  prompt: "@{textGeneration}",  // Uses text stage output as prompt
  refMedia: [...],
  model: 'gemini-2.5-flash-image',
  aspectRatio: '1:1',
}
```

**Execution:**
1. Text Gen: "Write a creative description of a cat in a garden" → "A fluffy orange tabby cat lounging among blooming roses..."
2. Image Gen: Uses "A fluffy orange tabby cat lounging among blooming roses..." as prompt

### Example: Image → Video Chain

```ts
imageGeneration: {
  enabled: true,
  prompt: "A @{step:Pet Choice} looking at the camera",
  model: 'gemini-2.5-flash-image',
  aspectRatio: '9:16',
}

videoGeneration: {
  enabled: true,
  prompt: "The animal slowly walks towards the camera",
  model: 'kling-ai',
  duration: 5,
}
```

**Execution:**
1. Image Gen: Creates static image of cat
2. Video Gen: Animates the image based on video prompt

---

## Validation Rules

### Stage Dependencies

| Outcome Type | Required Stages | Optional Stages |
|--------------|-----------------|-----------------|
| `image` | imageGeneration (if aiEnabled) | textGeneration |
| `gif` | imageGeneration (if aiEnabled) | textGeneration |
| `video` | videoGeneration (if aiEnabled) | textGeneration, imageGeneration |

### Passthrough Validation

```ts
if (!aiEnabled) {
  // All generation stages disabled
  if (!captureStepId) {
    throw Error('Passthrough requires source image')
  }
  // Only overlay application, no AI
}
```

### Chain Validation

```ts
// If referencing @{textGeneration}, text stage must be enabled
if (imageGeneration.prompt.includes('@{textGeneration}')) {
  if (!textGeneration?.enabled) {
    throw Error('Cannot reference textGeneration when stage is disabled')
  }
}

// If referencing @{imageGeneration}, image stage must be enabled
if (videoGeneration.prompt.includes('@{imageGeneration}')) {
  if (!imageGeneration?.enabled) {
    throw Error('Cannot reference imageGeneration when stage is disabled')
  }
}
```

---

## UI Considerations

### Stage Toggle Pattern

```
┌─────────────────────────────────────────────────────┐
│ Create                                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ☑ Enable AI Generation                              │
│                                                     │
│ ┌─ Text Enhancement (Optional) ─────────────────┐   │
│ │ ☐ Enable                                      │   │
│ │                                               │   │
│ │ Prompt                                        │   │
│ │ [Write a detailed description of...]          │   │
│ │                                               │   │
│ │ Model: [Gemini 2.5 ▼]                         │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ Image Generation ────────────────────────────┐   │
│ │ ☑ Enable (required for image/gif)             │   │
│ │                                               │   │
│ │ Prompt                                        │   │
│ │ [@{textGeneration} or write your own...]      │   │
│ │                                               │   │
│ │ Model: [Gemini 2.5 Flash ▼]                   │   │
│ │ Aspect Ratio: [1:1] [3:2] [9:16]...           │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ Video Generation (for video outcome) ────────┐   │
│ │ ☑ Enable                                      │   │
│ │                                               │   │
│ │ Prompt                                        │   │
│ │ [Make it walk towards camera...]              │   │
│ │                                               │   │
│ │ Model: [Kling AI ▼]                           │   │
│ │ Duration: [5 seconds]                         │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Conditional Display

- Text Enhancement: Always available, optional
- Image Generation: Required for image/gif, optional for video (direct text-to-video)
- Video Generation: Only shown when outcome type is 'video'

---

## Migration Path

### Phase 1 (MVP - Current)
- Only `imageGeneration` block
- `aiEnabled` at top level
- `textGeneration` and `videoGeneration` not in schema

### Phase 2 (GIF/Video)
- Add `videoGeneration` block
- Add `options` for GIF (fps, duration) and Video (duration)
- `imageGeneration` becomes optional for video (direct text-to-video)

### Phase 3 (Text Enhancement)
- Add `textGeneration` block
- Add `@{textGeneration}` mention support
- UI for text stage configuration

---

## Alternative Approaches Considered

### A. Stages Array (Rejected)

```ts
stages: [
  { kind: 'text', prompt: '...', model: '...' },
  { kind: 'image', prompt: '...', model: '...' },
]
```

**Rejected because:**
- Feels like node graph (complexity we wanted to avoid)
- Harder to validate
- Less clear what's required vs optional

### B. Separate Fields Per Outcome (Rejected)

```ts
create: {
  image: { ... } | null,
  gif: { ... } | null,
  video: { ... } | null,
}
```

**Rejected because:**
- Schema grows with each outcome type
- Doesn't handle shared fields well
- Switching outcomes loses config

### C. Arbitrary Node Graph (Rejected)

Full node-based pipeline with arbitrary connections.

**Rejected because:**
- Too complex for target users
- Hard to validate
- Unpredictable execution order
- Original problem we're solving

---

## Open Questions

1. **GIF generation**: Single image → animate, or multiple frames with per-frame prompts?

2. **Video aspect ratio**: Does video generation change aspect ratio, or preserve input?

3. **Text stage output format**: Plain text, or structured (JSON) for more control?

4. **Stage output preview**: Should admin be able to preview each stage's output separately?

5. **Cost visibility**: How to show estimated AI costs for multi-stage pipelines?

---

## Related Documents

- [Epic](./epic.md) - Current implementation scope
- [PRD 3: Job + Cloud Functions](./prd-3-job-cloud-functions.md) - Execution architecture
