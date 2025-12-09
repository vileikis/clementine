# Experience Architecture Gap Analysis

**Date**: December 2024
**Status**: Analysis Complete
**Scope**: Evaluation of current Experiences + Steps architecture against defined use cases

---

## Executive Summary

The current step-based architecture provides **building blocks** but lacks **domain-specific abstractions** that would make experience creation intuitive and error-proof. While technically flexible, the system requires creators to understand implementation details rather than declaring intent.

**Key Finding**: The architecture can theoretically support most use cases through step composition, but the UX burden is high and there are no guardrails preventing invalid configurations.

---

## Clarifications Applied

1. **AI Context Inputs**: The current design intends to use input steps (short_text, multiple_choice, etc.) placed *before* the ai-transform step, with variables referencing those step outputs. This is a valid approach.

2. **Frame Overlay**: Single output with frame applied (not dual outputs). This simplifies the model.

---

## Gap Analysis by Use Case

### 1. Photo Experience ✅ Mostly Supported

**Use Case**: User captures a single photo, optionally with branding frame.

**Current Support**:
- `capture` step → photo capture
- `reward` step → share/download

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| No frame overlay configuration | Medium | Cannot apply branding to output |
| No experience-level type declaration | Low | Creator must know which steps to add |

---

### 2. GIF Experience ❌ Not Supported

**Use Case**: User captures X photos (burst), compiled into animated GIF.

**Current Support**: None

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| `capture` step only supports single photo | **Critical** | Cannot capture burst images |
| No `burstCount` configuration | **Critical** | Cannot specify number of frames |
| No GIF compilation step/logic | **Critical** | Cannot assemble frames into GIF |
| No frame overlay for GIF | Medium | Cannot brand GIF output |

**Required Changes**:
```typescript
// Extend capture step config
config: {
  captureMode: 'single' | 'burst',
  burstCount?: number,  // e.g., 3-10 frames
  burstInterval?: number, // ms between captures
  outputFormat: 'photo' | 'gif',
}
```

---

### 3. Video Experience ❌ Not Supported

**Use Case**: User records a short video clip.

**Current Support**: None

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| `capture` step is photo-only | **Critical** | Cannot record video |
| No video duration limits | **Critical** | Cannot enforce clip length |
| No video processing pipeline | High | Cannot apply branding/trim |

**Required Changes**:
```typescript
// Extend capture step config
config: {
  captureMode: 'single' | 'burst' | 'video',
  maxDuration?: number,  // seconds, for video mode
  // ...
}
```

---

### 4. AI Photo Experience ⚠️ Partially Supported

**Use Case**: User provides photo → AI transforms it using prompt + dynamic context inputs.

**Current Support**:
- `capture` step → photo input
- Input steps (multiple_choice, short_text, etc.) → collect context
- `ai-transform` step → transformation with variable injection
- `processing` step → loading state
- `reward` step → result display

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| Variable wiring is manual and error-prone | High | Creators must understand technical mapping |
| No validation that referenced steps exist | High | Broken experiences possible |
| No UI guidance for context input design | Medium | Poor creator UX |
| No frame overlay on AI output | Medium | Cannot brand result |
| `variables` UI not exposed in AiTransformEditor | **Critical** | Feature exists in schema but not editable |

**Critical Finding**: The `AiTransformEditor.tsx` does not expose the `variables` configuration to the user. The schema supports it, but there's no UI to:
- Add/remove variables
- Map variables to input steps
- Preview variable interpolation in prompt

---

### 5. AI GIF Experience ❌ Not Supported

**Use Case**: Burst capture → each frame AI-transformed → compiled into GIF.

**Current Support**: None (combines gaps from GIF + AI Photo)

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| All GIF gaps (burst capture, compilation) | **Critical** | Foundation missing |
| Per-frame AI transformation logic | **Critical** | Cannot process multiple frames |
| Context inputs before burst capture | Medium | Same as AI Photo |

---

### 6. AI Video Experience ❌ Not Supported

**Use Case**: Single photo → AI generates synthetic video from it.

**Current Support**: Partial

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| `ai-transform` supports `outputType: 'video'` | ✅ | Schema ready |
| No video-capable AI model integration | High | Backend not implemented |
| Context inputs supported via input steps | ✅ | Works same as AI Photo |
| No frame overlay on video | Medium | Cannot brand result |

**Note**: This is closer to supported than AI GIF because it's photo→video (single input), not burst→video.

---

### 7. Survey Experience ❌ Not Supported

**Use Case**: Interactive questionnaire with MCQ, text, sliders, conditional branching.

**Current Support**: Partial

**Available Steps**:
- `short_text` ✅
- `long_text` ✅
- `multiple_choice` ✅
- `yes_no` ✅
- `opinion_scale` ✅ (slider-like)
- `email` ✅

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| No conditional branching logic | **Critical** | Cannot skip/show steps based on answers |
| No "survey" experience type abstraction | Medium | Must manually sequence input steps |
| No aggregated survey response output | High | Results stored per-step, not unified |

**Required Changes**:
- Add conditional logic to steps: `showIf: { stepId, operator, value }`
- Add survey-specific output aggregation in session data

---

### 8. Wheel of Fortune Experience ❌ Not Supported

**Use Case**: Gamified spinning wheel with configurable sectors and probabilities.

**Current Support**: None

**Gaps**:
| Gap | Severity | Impact |
|-----|----------|--------|
| No `wheel` step type | **Critical** | Cannot render wheel UI |
| No sector configuration schema | **Critical** | Cannot define prizes/outcomes |
| No probability weighting | High | Cannot control odds |
| No outcome-based branching | High | Cannot route to different rewards |

**Required Changes**:
```typescript
// New step type
export const wheelStepSchema = stepBaseSchema.extend({
  type: z.literal("wheel"),
  config: z.object({
    variable: variableNameSchema,  // stores result
    sectors: z.array(z.object({
      label: z.string(),
      value: z.string(),
      weight: z.number().positive(),
      color: z.string().optional(),
      icon: z.string().optional(),
    })).min(2).max(12),
  }),
});
```

---

## Cross-Cutting Concerns

### A. No Experience Type Declaration

**Problem**: Experiences are just containers for steps with no declared purpose.

**Impact**:
- Cannot show "Create Photo Experience" vs "Create AI GIF Experience" wizard
- Cannot validate that an experience has required steps for its type
- Cannot provide type-specific defaults or templates
- Analytics cannot segment by experience type

**Recommendation**: Add `experienceType` field:
```typescript
experienceType: z.enum([
  'photo',
  'gif',
  'video',
  'ai_photo',
  'ai_gif',
  'ai_video',
  'survey',
  'wheel',
  'custom',  // escape hatch for advanced users
])
```

---

### B. No Step Validation / Dependency Graph

**Problem**: Nothing prevents invalid step configurations:
- AI transform referencing non-existent step
- Reward step before capture step
- Missing required steps for experience type

**Impact**: Broken experiences that fail at runtime, poor creator confidence.

**Recommendation**: Add validation layer that runs on save:
```typescript
function validateExperience(experience, steps): ValidationResult {
  // Check required steps exist for experienceType
  // Check step order is valid
  // Check all variable references resolve
  // Check capture mode matches output expectations
}
```

---

### C. No Templates / Quick Start

**Problem**: Every experience starts empty. Creator must:
1. Create experience
2. Add step
3. Configure step
4. Repeat for each step
5. Wire up variables manually

**Impact**: High friction, especially for simple use cases like "basic photo booth".

**Recommendation**: Experience templates:
```typescript
const PHOTO_TEMPLATE = {
  experienceType: 'photo',
  steps: [
    { type: 'info', title: 'Welcome!' },
    { type: 'capture', config: { captureMode: 'single' } },
    { type: 'reward', config: { allowDownload: true } },
  ]
};
```

---

### D. Frame Overlay Not Modeled

**Problem**: No way to configure branding frame overlay.

**Impact**: Cannot deliver branded outputs — key value proposition.

**Recommendation**: Add to experience or as processing config:
```typescript
// Option A: Experience-level
frameConfig: {
  frameUrl: z.string().url().nullable(),
  position: z.enum(['overlay', 'border']),
}

// Option B: Processing step config
config: {
  applyFrame: z.boolean(),
  frameUrl: z.string().url().nullable(),
}
```

---

### E. Variables UI Missing in AI Transform Editor

**Problem**: `AiTransformEditor.tsx` preserves `variables` in form state but provides **no UI to edit them**.

**Code Evidence** (AiTransformEditor.tsx:125-126):
```typescript
variables: config.variables ?? [],
// ... but no FormField for variables anywhere in the JSX
```

**Impact**: The AI Context Inputs feature is architecturally supported but **not usable** without code changes.

**Recommendation**: Add variables editor UI:
- List existing variables with source mapping
- Add variable button
- For each variable: key input, source type dropdown, source step selector
- Preview of prompt with variables highlighted

---

## Summary Matrix

| Use Case | Schema Support | UI Support | Runtime Support | Overall |
|----------|---------------|------------|-----------------|---------|
| Photo | ✅ | ✅ | ⚠️ No frame | ⚠️ Partial |
| GIF | ❌ | ❌ | ❌ | ❌ None |
| Video | ❌ | ❌ | ❌ | ❌ None |
| AI Photo | ⚠️ Variables exist | ❌ No variables UI | ⚠️ No frame | ⚠️ Partial |
| AI GIF | ❌ | ❌ | ❌ | ❌ None |
| AI Video | ⚠️ Schema ready | ❌ No variables UI | ❌ No backend | ❌ None |
| Survey | ⚠️ Input steps exist | ✅ | ❌ No branching | ⚠️ Partial |
| Wheel | ❌ | ❌ | ❌ | ❌ None |

---

## Priority Recommendations

### P0 - Critical (Blocks Core Value)

1. **Expose Variables UI in AiTransformEditor** — The feature exists but is invisible
2. **Add `experienceType` field** — Foundation for validation and templates
3. **Add frame overlay configuration** — Core branding feature

### P1 - High (Enables Key Use Cases)

4. **Extend capture step for burst mode** — Enables GIF experiences
5. **Extend capture step for video mode** — Enables Video experiences
6. **Add experience templates** — Reduces creator friction

### P2 - Medium (Expands Platform)

7. **Add conditional branching** — Enables Survey experiences
8. **Add wheel step type** — Enables gamification
9. **Add step validation layer** — Prevents broken experiences

### P3 - Low (Polish)

10. **Add experience type wizard** — Guided creation flow
11. **Add variable preview in prompt** — Better AI config UX

---

## Appendix: Current Schema Reference

### Experience Schema (experiences.schemas.ts)
```typescript
{
  id, companyId, name, description,
  stepsOrder: string[],
  status, deletedAt, createdAt, updatedAt,
  previewMediaUrl, previewType
}
```

### Step Types (step.schemas.ts)
- `info` - Display content
- `capture` - Photo capture (single only)
- `ai-transform` - AI transformation with variables
- `short_text`, `long_text` - Text input
- `multiple_choice` - MCQ
- `yes_no` - Boolean
- `opinion_scale` - Slider/scale
- `email` - Email input
- `processing` - Loading state
- `reward` - Share/download

### AI Transform Config
```typescript
{
  model: string,
  prompt: string,
  variables: Array<{
    key: string,
    sourceType: 'capture' | 'input' | 'static',
    sourceStepId?: string,
    staticValue?: string,
  }>,
  outputType: 'image' | 'video' | 'gif',
  aspectRatio: string,
  referenceImageUrls: string[],
}
```
