# Experience Data Model Proposal (v6)

**Date**: December 2024
**Status**: Draft Proposal
**Authors**: [Your Team]
**Scope**: Address gaps in current Experience model to support all documented use cases

---

## Executive Summary

This proposal introduces a **v6 data model** for Experiences that addresses critical gaps identified in the [Architecture Gap Analysis](./architecture-gap-analysis.md) while supporting all [Experience Use Cases](./experience-use-cases.md).

### Key Changes

1. **Experience Type Declaration** - Experiences declare their type (photo, gif, video, ai_photo, etc.)
2. **Unified Capture Step** - Single capture step supporting photo, burst, and video modes
3. **Frame Overlay System** - Native support for branded output overlays
4. **Variables UI Architecture** - First-class support for AI context inputs
5. **Step Validation Graph** - Dependency validation between steps
6. **Experience Templates** - Pre-built templates for common use cases

---

## 1. Problem Statement

### Current Gaps (P0 Critical)

| Gap | Impact | Current State |
|-----|--------|---------------|
| No experience type | Can't validate required steps, no wizard UX | Generic container |
| Variables UI missing | AI Context Inputs unusable | Schema exists, no UI |
| No frame overlay | Can't brand outputs | Missing entirely |
| Single photo capture only | Can't do GIF/video | `capture` step limited |

### Use Cases Not Supported

- GIF Experience (burst capture)
- Video Experience (video recording)
- AI GIF Experience (burst + per-frame AI)
- AI Video Experience (photo → AI video)
- Wheel of Fortune (gamification)

---

## 2. Proposed Schema Changes

### 2.1 Experience Schema (Updated)

**Collection**: `/experiences/{experienceId}`

```typescript
interface Experience {
  // Identity (unchanged)
  id: string;
  companyId: string;

  // Content (unchanged)
  name: string;                         // 1-200 chars
  description?: string | null;          // max 1000 chars

  // NEW: Experience Type Declaration
  experienceType: ExperienceType;

  // NEW: Output Configuration
  outputConfig: OutputConfig;

  // Step management (unchanged)
  stepsOrder: string[];

  // Status (unchanged)
  status: "active" | "deleted";
  deletedAt: number | null;

  // Preview (unchanged)
  previewMediaUrl?: string | null;
  previewType?: "image" | "gif" | "video" | null;

  // Timestamps (unchanged)
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 Experience Type Enum

```typescript
type ExperienceType =
  // Non-AI Types
  | "photo"           // Single photo capture
  | "gif"             // Burst capture → GIF
  | "video"           // Video recording

  // AI-Enhanced Types
  | "ai_photo"        // Photo → AI transformation
  | "ai_gif"          // Burst → AI transform each → GIF
  | "ai_video"        // Photo → AI video generation

  // Special Types
  | "survey"          // Input collection only
  | "wheel"           // Wheel of Fortune
  | "custom";         // Escape hatch for advanced flows
```

### 2.3 Output Configuration

```typescript
interface OutputConfig {
  // Frame Overlay
  frameOverlay?: FrameOverlayConfig | null;

  // Watermark (simpler than frame)
  watermark?: WatermarkConfig | null;
}

interface FrameOverlayConfig {
  frameUrl: string;                     // Firebase Storage URL
  position: "overlay" | "border";       // Overlay = on top, Border = adds padding
  opacity: number;                      // 0-1, for overlay mode
}

interface WatermarkConfig {
  imageUrl: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  size: "small" | "medium" | "large";   // Relative to output
  opacity: number;                      // 0-1
}
```

---

## 3. Step Schema Updates

### 3.1 Unified Capture Step

Replace the deprecated `capture` step with a unified version supporting all capture modes.

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    // Core config
    variable: string;                   // Session variable for captured media

    // Capture Mode
    captureMode: "photo" | "burst" | "video";

    // Photo Mode Config (captureMode: "photo")
    // No additional config needed

    // Burst Mode Config (captureMode: "burst")
    burstConfig?: {
      frameCount: number;               // 2-10 frames
      intervalMs: number;               // 200-2000ms between frames
      outputFormat: "gif" | "frames";   // Compile to GIF or keep separate
    } | null;

    // Video Mode Config (captureMode: "video")
    videoConfig?: {
      maxDurationSec: number;           // 3-60 seconds
      minDurationSec?: number;          // Optional minimum
    } | null;

    // Camera Settings (all modes)
    cameraFacing: "front" | "back" | "user-choice";
    countdown: number;                  // 0 = no countdown, 1-10 seconds

    // Preview/Guide Overlay (all modes)
    guideOverlayUrl?: string | null;    // Shows during capture, removed from output
  };
}
```

### 3.2 AI Transform Step (Enhanced)

Update to support burst input and add variables UI architecture.

```typescript
interface StepAiTransform extends StepBase {
  type: "ai-transform";
  config: {
    // Model Configuration
    model: string | null;
    prompt: string | null;              // max 1000 chars, supports {{variable}} syntax
    negativePrompt?: string | null;     // max 500 chars

    // Input Configuration
    inputType: "single" | "burst";      // Single image or burst frames
    inputStepId: string;                // Reference to capture step

    // Output Configuration
    outputType: "image" | "video" | "gif";
    aspectRatio: AspectRatio;

    // Reference Images
    referenceImageUrls: string[];       // max 5 URLs

    // Variables (AI Context Inputs)
    variables: AiTransformVariable[];

    // Advanced (optional)
    seed?: number | null;               // For reproducibility
    guidanceScale?: number | null;      // Model-specific
  };
}

type AspectRatio = "1:1" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9";

interface AiTransformVariable {
  key: string;                          // 1-50 chars, identifier format [a-z_][a-z0-9_]*
  displayName?: string | null;          // Human-readable name for UI
  sourceType: "capture" | "input" | "static" | "event";

  // Source Step Reference (for capture/input)
  sourceStepId?: string | null;

  // Static Value (for static)
  staticValue?: string | null;

  // Event Field (for event - pulls from Event document)
  eventField?: "name" | "companyName" | "projectName" | null;

  // Prompt Integration
  promptPlaceholder: string;            // The {{placeholder}} in the prompt
  required: boolean;                    // Fails generation if missing
}
```

### 3.3 New: Wheel Step

```typescript
interface StepWheel extends StepBase {
  type: "wheel";
  config: {
    variable: string;                   // Stores selected sector result

    // Wheel Configuration
    sectors: WheelSector[];             // 2-12 sectors
    spinDurationMs: number;             // 2000-8000ms

    // Visual Customization
    pointerPosition: "top" | "right";
    showConfetti: boolean;
  };
}

interface WheelSector {
  id: string;                           // Unique within wheel
  label: string;                        // 1-50 chars, displayed on wheel
  value: string;                        // 1-100 chars, stored in variable
  weight: number;                       // Probability weight (1-100)

  // Visual
  backgroundColor?: string | null;      // Hex color, auto-assigned if null
  textColor?: string | null;            // Hex color, auto-contrast if null
  icon?: string | null;                 // Lucide icon name or emoji

  // Optional Prize Configuration
  prize?: {
    type: "coupon" | "discount" | "freebie" | "points" | "none";
    code?: string | null;               // Coupon/discount code
    description?: string | null;
  } | null;
}
```

### 3.4 Step Type Constants (Updated)

```typescript
const STEP_TYPES = {
  // Navigation
  info: { category: "navigation", deprecated: false },
  "experience-picker": { category: "navigation", deprecated: true },  // REMOVED

  // Capture
  capture: { category: "capture", deprecated: false },                 // UNIFIED
  "ai-transform": { category: "capture", deprecated: false },

  // Input
  short_text: { category: "input", deprecated: false },
  long_text: { category: "input", deprecated: false },
  multiple_choice: { category: "input", deprecated: false },
  yes_no: { category: "input", deprecated: false },
  opinion_scale: { category: "input", deprecated: false },
  email: { category: "input", deprecated: false },

  // Gamification (NEW)
  wheel: { category: "gamification", deprecated: false },

  // Completion
  processing: { category: "completion", deprecated: false },
  reward: { category: "completion", deprecated: false },
} as const;
```

---

## 4. Experience Type Validation

### 4.1 Required Steps by Type

Each experience type has required and optional step patterns:

```typescript
interface ExperienceTypeDefinition {
  type: ExperienceType;
  displayName: string;
  description: string;
  requiredSteps: StepRequirement[];
  recommendedSteps: StepRequirement[];
  allowedSteps: StepType[];             // If empty, all non-deprecated steps allowed
  outputType: "image" | "gif" | "video" | "data" | "none";
}

interface StepRequirement {
  stepType: StepType;
  position?: "first" | "last" | "before-reward" | "any";
  config?: Partial<StepConfig>;         // Required config values
}

const EXPERIENCE_TYPE_DEFINITIONS: ExperienceTypeDefinition[] = [
  {
    type: "photo",
    displayName: "Photo Booth",
    description: "Capture a single photo with optional branding",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "photo" } },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],                   // All non-deprecated allowed
    outputType: "image",
  },

  {
    type: "gif",
    displayName: "GIF Booth",
    description: "Capture burst photos compiled into animated GIF",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "burst", burstConfig: { outputFormat: "gif" } } },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],
    outputType: "gif",
  },

  {
    type: "video",
    displayName: "Video Booth",
    description: "Record a short video clip",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "video" } },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],
    outputType: "video",
  },

  {
    type: "ai_photo",
    displayName: "AI Photo",
    description: "Transform photos with AI using prompts and context inputs",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "photo" } },
      { stepType: "ai-transform", config: { inputType: "single", outputType: "image" } },
      { stepType: "processing", position: "before-reward" },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],                   // Input steps allowed for AI context
    outputType: "image",
  },

  {
    type: "ai_gif",
    displayName: "AI GIF",
    description: "Transform burst photos with AI, compiled into animated GIF",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "burst", burstConfig: { outputFormat: "frames" } } },
      { stepType: "ai-transform", config: { inputType: "burst", outputType: "gif" } },
      { stepType: "processing", position: "before-reward" },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],
    outputType: "gif",
  },

  {
    type: "ai_video",
    displayName: "AI Video",
    description: "Generate AI video from a single photo",
    requiredSteps: [
      { stepType: "capture", config: { captureMode: "photo" } },
      { stepType: "ai-transform", config: { inputType: "single", outputType: "video" } },
      { stepType: "processing", position: "before-reward" },
      { stepType: "reward", position: "last" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: [],
    outputType: "video",
  },

  {
    type: "survey",
    displayName: "Survey",
    description: "Collect user responses without media capture",
    requiredSteps: [],                  // At least one input step recommended
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: ["info", "short_text", "long_text", "multiple_choice", "yes_no", "opinion_scale", "email"],
    outputType: "data",
  },

  {
    type: "wheel",
    displayName: "Wheel of Fortune",
    description: "Gamified spinning wheel with prizes",
    requiredSteps: [
      { stepType: "wheel" },
    ],
    recommendedSteps: [
      { stepType: "info", position: "first" },
    ],
    allowedSteps: ["info", "wheel", "short_text", "email"],  // Limited steps
    outputType: "none",
  },

  {
    type: "custom",
    displayName: "Custom Flow",
    description: "Advanced: build your own step sequence",
    requiredSteps: [],
    recommendedSteps: [],
    allowedSteps: [],                   // All non-deprecated allowed
    outputType: "none",                 // Determined by steps
  },
];
```

### 4.2 Validation Function

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  stepId?: string;
  field?: string;
}

interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

function validateExperience(
  experience: Experience,
  steps: Step[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const definition = EXPERIENCE_TYPE_DEFINITIONS.find(d => d.type === experience.experienceType);

  if (!definition) {
    errors.push({ code: "INVALID_TYPE", message: "Unknown experience type" });
    return { valid: false, errors, warnings };
  }

  // Check required steps exist
  for (const req of definition.requiredSteps) {
    const matchingStep = steps.find(s =>
      s.type === req.stepType &&
      (!req.config || matchesConfig(s.config, req.config))
    );

    if (!matchingStep) {
      errors.push({
        code: "MISSING_REQUIRED_STEP",
        message: `Experience type "${definition.displayName}" requires a ${req.stepType} step`,
      });
    }
  }

  // Check step positions
  // ... position validation logic

  // Check variable references resolve
  const aiTransformSteps = steps.filter(s => s.type === "ai-transform");
  for (const step of aiTransformSteps) {
    for (const variable of step.config.variables) {
      if (variable.sourceType === "capture" || variable.sourceType === "input") {
        const sourceStep = steps.find(s => s.id === variable.sourceStepId);
        if (!sourceStep) {
          errors.push({
            code: "INVALID_VARIABLE_REF",
            message: `Variable "${variable.key}" references non-existent step`,
            stepId: step.id,
            field: `variables.${variable.key}`,
          });
        }
      }
    }
  }

  // Check allowed steps for restricted types
  if (definition.allowedSteps.length > 0) {
    for (const step of steps) {
      if (!definition.allowedSteps.includes(step.type)) {
        errors.push({
          code: "DISALLOWED_STEP_TYPE",
          message: `Step type "${step.type}" not allowed in ${definition.displayName} experiences`,
          stepId: step.id,
        });
      }
    }
  }

  // Warnings for recommended steps
  for (const rec of definition.recommendedSteps) {
    const matchingStep = steps.find(s => s.type === rec.stepType);
    if (!matchingStep) {
      warnings.push({
        code: "MISSING_RECOMMENDED_STEP",
        message: `Consider adding a ${rec.stepType} step`,
        suggestion: `${definition.displayName} experiences typically include a ${rec.stepType} step`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## 5. Experience Templates

### 5.1 Template Schema

```typescript
interface ExperienceTemplate {
  id: string;
  experienceType: ExperienceType;
  name: string;
  description: string;
  previewImageUrl: string;

  // Template Content
  defaultSteps: TemplateStep[];
  defaultOutputConfig: OutputConfig;

  // Metadata
  category: "starter" | "branded" | "interactive" | "gamification";
  tags: string[];
  isOfficial: boolean;                  // Clementine-provided vs community
}

interface TemplateStep {
  type: StepType;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultConfig: StepConfig;
}
```

### 5.2 Built-in Templates

```typescript
const BUILT_IN_TEMPLATES: ExperienceTemplate[] = [
  {
    id: "simple-photo-booth",
    experienceType: "photo",
    name: "Simple Photo Booth",
    description: "Quick photo capture with branded frame",
    previewImageUrl: "/templates/simple-photo.png",
    category: "starter",
    tags: ["simple", "quick", "branded"],
    isOfficial: true,
    defaultSteps: [
      {
        type: "info",
        defaultTitle: "Welcome!",
        defaultDescription: "Tap below to take your photo",
        defaultConfig: {},
      },
      {
        type: "capture",
        defaultTitle: "Strike a Pose",
        defaultConfig: {
          captureMode: "photo",
          cameraFacing: "front",
          countdown: 3,
        },
      },
      {
        type: "reward",
        defaultTitle: "Your Photo",
        defaultConfig: {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: false,
          socials: ["instagram", "facebook"],
        },
      },
    ],
    defaultOutputConfig: {
      frameOverlay: null,
      watermark: null,
    },
  },

  {
    id: "ai-photo-hobbit",
    experienceType: "ai_photo",
    name: "AI Photo Transformation",
    description: "Transform guests into custom characters with AI",
    previewImageUrl: "/templates/ai-photo.png",
    category: "interactive",
    tags: ["ai", "transformation", "interactive"],
    isOfficial: true,
    defaultSteps: [
      {
        type: "info",
        defaultTitle: "Welcome to the Magic!",
        defaultDescription: "We'll transform your photo with AI",
        defaultConfig: {},
      },
      {
        type: "multiple_choice",
        defaultTitle: "Choose Your Style",
        defaultConfig: {
          variable: "style_choice",
          options: [
            { label: "Fantasy", value: "fantasy" },
            { label: "Sci-Fi", value: "scifi" },
            { label: "Vintage", value: "vintage" },
          ],
          allowMultiple: false,
          required: true,
        },
      },
      {
        type: "capture",
        defaultTitle: "Take Your Photo",
        defaultConfig: {
          variable: "user_photo",
          captureMode: "photo",
          cameraFacing: "front",
          countdown: 3,
        },
      },
      {
        type: "ai-transform",
        defaultTitle: "Creating Your Transformation",
        defaultConfig: {
          model: null,  // Selected by creator
          prompt: "Transform this person into a {{style_choice}} character. Maintain their likeness.",
          inputType: "single",
          inputStepId: null,  // Linked on creation
          outputType: "image",
          aspectRatio: "1:1",
          variables: [
            {
              key: "style_choice",
              sourceType: "input",
              sourceStepId: null,  // Linked on creation
              promptPlaceholder: "{{style_choice}}",
              required: true,
            },
          ],
          referenceImageUrls: [],
        },
      },
      {
        type: "processing",
        defaultConfig: {
          messages: [
            "Working some magic...",
            "Applying your style...",
            "Almost there...",
          ],
          estimatedDuration: 30,
        },
      },
      {
        type: "reward",
        defaultTitle: "Your Transformation",
        defaultConfig: {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: true,
          socials: ["instagram", "facebook", "twitter"],
        },
      },
    ],
    defaultOutputConfig: {
      frameOverlay: null,
      watermark: null,
    },
  },

  {
    id: "gif-booth",
    experienceType: "gif",
    name: "GIF Booth",
    description: "Capture 4-frame animated GIF",
    previewImageUrl: "/templates/gif-booth.png",
    category: "starter",
    tags: ["gif", "animated", "fun"],
    isOfficial: true,
    defaultSteps: [
      {
        type: "info",
        defaultTitle: "Get Ready for GIF!",
        defaultDescription: "We'll take 4 photos to create your animated GIF",
        defaultConfig: {},
      },
      {
        type: "capture",
        defaultTitle: "Strike 4 Poses!",
        defaultConfig: {
          variable: "gif_capture",
          captureMode: "burst",
          burstConfig: {
            frameCount: 4,
            intervalMs: 500,
            outputFormat: "gif",
          },
          cameraFacing: "front",
          countdown: 3,
        },
      },
      {
        type: "reward",
        defaultTitle: "Your GIF",
        defaultConfig: {
          allowDownload: true,
          allowSystemShare: true,
          allowEmail: false,
          socials: ["instagram", "twitter"],
        },
      },
    ],
    defaultOutputConfig: {
      frameOverlay: null,
      watermark: null,
    },
  },

  {
    id: "wheel-of-fortune",
    experienceType: "wheel",
    name: "Spin to Win",
    description: "Gamified prize wheel experience",
    previewImageUrl: "/templates/wheel.png",
    category: "gamification",
    tags: ["game", "prizes", "engagement"],
    isOfficial: true,
    defaultSteps: [
      {
        type: "info",
        defaultTitle: "Spin to Win!",
        defaultDescription: "Spin the wheel for a chance to win prizes",
        defaultConfig: {},
      },
      {
        type: "email",
        defaultTitle: "Enter to Spin",
        defaultConfig: {
          variable: "user_email",
          placeholder: "your@email.com",
          required: true,
        },
      },
      {
        type: "wheel",
        defaultTitle: "Spin the Wheel!",
        defaultConfig: {
          variable: "prize_result",
          sectors: [
            { id: "1", label: "10% Off", value: "discount_10", weight: 30 },
            { id: "2", label: "20% Off", value: "discount_20", weight: 20 },
            { id: "3", label: "Free Item", value: "freebie", weight: 5 },
            { id: "4", label: "Try Again", value: "none", weight: 45 },
          ],
          spinDurationMs: 4000,
          pointerPosition: "top",
          showConfetti: true,
        },
      },
    ],
    defaultOutputConfig: {
      frameOverlay: null,
      watermark: null,
    },
  },
];
```

---

## 6. Variables UI Architecture

### 6.1 AI Transform Editor Enhancement

The current `AiTransformEditor.tsx` needs a new `VariablesEditor` component:

```typescript
interface VariablesEditorProps {
  variables: AiTransformVariable[];
  onChange: (variables: AiTransformVariable[]) => void;
  availableSteps: Step[];               // Steps that can be referenced
  prompt: string;                       // For placeholder detection
}

// Component Features:
// 1. List existing variables with source mapping
// 2. Add variable button with wizard
// 3. Auto-detect {{placeholders}} from prompt
// 4. Validate references exist
// 5. Preview variable values in prompt
```

### 6.2 Variable Source Types

| Source Type | Description | UI Component |
|-------------|-------------|--------------|
| `capture` | References a capture step's output | Step dropdown (capture steps only) |
| `input` | References an input step's value | Step dropdown (input steps only) |
| `static` | Hardcoded value | Text input |
| `event` | Pull from Event document | Field dropdown (name, companyName, etc.) |

### 6.3 Prompt Preview Component

```typescript
interface PromptPreviewProps {
  prompt: string;
  variables: AiTransformVariable[];
  sessionData?: Record<string, unknown>;  // For preview values
}

// Features:
// 1. Highlight {{placeholders}} in prompt
// 2. Show resolved values from session data
// 3. Warn on unbound placeholders
// 4. Warn on unused variables
```

---

## 7. Migration Strategy

### 7.1 Schema Migration Steps

1. **Add optional `experienceType` field** - Default to `"custom"` for existing experiences
2. **Add optional `outputConfig` field** - Default to null
3. **Update capture step schema** - Add new fields as optional, infer from existing config
4. **Migrate existing capture steps** - Set `captureMode: "photo"` for all existing
5. **Add wheel step schema** - New step type, no migration needed
6. **Add experience templates** - Configuration only, no data migration

### 7.2 Backwards Compatibility

- All new fields optional with sensible defaults
- Existing experiences continue working as `type: "custom"`
- Validation warnings (not errors) for legacy experiences
- Templates for new experiences encourage proper typing

### 7.3 UI Migration Path

1. **Phase A**: Add `experienceType` selector to Experience creation
2. **Phase B**: Add `OutputConfig` editor (frame overlay, watermark)
3. **Phase C**: Build `VariablesEditor` for AI Transform step
4. **Phase D**: Update `CaptureStepEditor` for burst/video modes
5. **Phase E**: Build `WheelStepEditor` and renderer
6. **Phase F**: Add experience templates library

---

## 8. Open Questions

### To Discuss

1. **Frame overlay rendering** - Client-side compositing or server-side processing?
2. **GIF compilation** - Client-side (ffmpeg.wasm) or Cloud Function?
3. **Video recording limits** - What's the max duration we can support?
4. **Wheel prizes** - Do we need prize redemption tracking?
5. **Template marketplace** - Allow companies to share templates?

### Deferred to Future

1. **Conditional branching** - Steps that route based on input values
2. **A/B testing** - Multiple paths with traffic splitting
3. **Analytics hooks** - Step-level event tracking
4. **Multi-language** - Localized step content

---

## 9. Summary

### Changes Summary

| Component | Current State | Proposed State |
|-----------|--------------|----------------|
| Experience type | Generic container | Typed with validation |
| Capture step | Photo only | Photo, burst, video |
| AI Transform variables | Schema exists, no UI | Full editor UI |
| Frame overlay | Not supported | Native config |
| Wheel step | Not supported | New step type |
| Templates | None | Built-in library |
| Validation | None | Type-based rules |

### Priority Order

1. **P0**: Experience type + validation
2. **P0**: Variables UI in AI Transform editor
3. **P1**: Frame overlay configuration
4. **P1**: Unified capture step (burst mode)
5. **P2**: Wheel step type
6. **P2**: Experience templates
7. **P3**: Video capture mode

---

## Appendix A: Complete Type Definitions

See separate file: `types/experience-v6.types.ts` (to be created)

## Appendix B: Zod Schema Updates

See separate file: `schemas/experience-v6.schemas.ts` (to be created)

## Appendix C: Database Migration Script

See separate file: `migrations/v5-to-v6.ts` (to be created)
