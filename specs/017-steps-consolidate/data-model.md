# Data Model: Steps Consolidation (Experience-Scoped Steps)

**Feature**: `017-steps-consolidate`
**Date**: 2025-12-03

## Overview

This document defines the data model changes for the Steps Consolidation feature. It covers entity schemas, validation rules, relationships, and state transitions.

---

## Entity: Step (Updated)

### Firestore Collection Path
```
/experiences/{experienceId}/steps/{stepId}
```

### Schema Definition

```typescript
interface Step {
  // Identity
  id: string;                    // Auto-generated Firestore document ID
  experienceId: string;          // Required: Parent experience reference

  // Configuration
  type: StepType;                // Required: Step type discriminator
  title: string | null;          // Optional: Display title (max 200 chars)
  description: string | null;    // Optional: Display description (max 1000 chars)
  mediaUrl: string | null;       // Optional: Public URL to media asset
  mediaType: MediaType | null;   // Optional: "image" | "gif" | "video" | "lottie"
  ctaLabel: string | null;       // Optional: CTA button text (max 50 chars)
  config: StepConfig;            // Required: Type-specific configuration

  // Timestamps
  createdAt: number;             // Epoch milliseconds
  updatedAt: number;             // Epoch milliseconds
}
```

### Step Types

```typescript
type StepType =
  | "info"                // Information display step
  | "experience-picker"   // DEPRECATED: Will be removed, do not use
  | "capture"             // DEPRECATED: Use ai-transform instead
  | "ai-transform"        // NEW: AI-powered photo transformation
  | "short_text"          // Single-line text input
  | "long_text"           // Multi-line text input
  | "multiple_choice"     // Selection from options
  | "yes_no"              // Binary choice
  | "opinion_scale"       // Numeric scale rating
  | "email"               // Email address input
  | "processing"          // Loading/processing display
  | "reward"              // Result download/share step
```

### Media Types

```typescript
type MediaType = "image" | "gif" | "video" | "lottie";
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `id` | Non-empty string | "Step ID is required" |
| `experienceId` | Non-empty string | "Experience ID is required" |
| `type` | Valid StepType enum | "Invalid step type" |
| `title` | Max 200 characters | "Title must be 200 characters or less" |
| `description` | Max 1000 characters | "Description must be 1000 characters or less" |
| `mediaUrl` | Valid URL or null | "Media URL must be a valid URL" |
| `ctaLabel` | Max 50 characters | "CTA label must be 50 characters or less" |
| `createdAt` | Positive number | "Created timestamp is required" |
| `updatedAt` | Positive number | "Updated timestamp is required" |

---

## Entity: AiTransformConfig (New)

### Schema Definition

```typescript
interface AiTransformConfig {
  // AI Model Configuration
  model: string | null;                    // AI model identifier (e.g., "gemini-2.5-flash-image")
  prompt: string | null;                   // Prompt template with {{variable}} placeholders

  // Variable Mappings
  variables: AiTransformVariable[];        // How prompt variables are populated

  // Output Configuration
  outputType: "image" | "video" | "gif";   // Result format
  aspectRatio: string;                     // "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | etc.

  // Reference Materials
  referenceImageUrls: string[];            // Up to 5 reference image URLs
}
```

### AiTransformVariable Schema

```typescript
interface AiTransformVariable {
  key: string;                             // Variable name (e.g., "style", "theme")
  sourceType: "capture" | "input" | "static"; // Where the value comes from
  sourceStepId?: string;                   // Step ID if capture or input type
  staticValue?: string;                    // Value if static type
}
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `model` | Non-empty string or null | N/A (optional) |
| `prompt` | Max 1000 characters or null | "Prompt must be 1000 characters or less" |
| `variables` | Array of valid AiTransformVariable | "Invalid variable configuration" |
| `variables[].key` | Max 50 chars, alphanumeric + underscore | "Variable key must be alphanumeric" |
| `variables[].sourceType` | "capture" \| "input" \| "static" | "Invalid source type" |
| `variables[].sourceStepId` | Required if sourceType is "capture" or "input" | "Source step ID required" |
| `variables[].staticValue` | Required if sourceType is "static" | "Static value required" |
| `outputType` | "image" \| "video" \| "gif" | "Invalid output type" |
| `aspectRatio` | Valid aspect ratio string | "Invalid aspect ratio" |
| `referenceImageUrls` | Max 5 items, each valid URL | "Maximum 5 reference images allowed" |

### Default Values

```typescript
const AI_TRANSFORM_DEFAULTS: AiTransformConfig = {
  model: null,
  prompt: null,
  variables: [],
  outputType: "image",
  aspectRatio: "1:1",
  referenceImageUrls: [],
};
```

---

## Entity: StepConfig (Union Type)

The `config` field on Step is a discriminated union based on `type`:

```typescript
type StepConfig =
  | InfoConfig
  | ExperiencePickerConfig   // Deprecated
  | CaptureConfig            // Deprecated
  | AiTransformConfig        // New
  | ShortTextConfig
  | LongTextConfig
  | MultipleChoiceConfig
  | YesNoConfig
  | OpinionScaleConfig
  | EmailConfig
  | ProcessingConfig
  | RewardConfig;
```

### Existing Configs (Unchanged)

```typescript
// Info step - no config
interface InfoConfig {}

// Deprecated: Experience picker
interface ExperiencePickerConfig {
  fallbackExperienceId?: string;
}

// Deprecated: Capture
interface CaptureConfig {
  source: string;
  fallbackExperienceId?: string;
}

// Text inputs
interface ShortTextConfig {
  variable: string;
  placeholder?: string;
  maxLength: number;
  required: boolean;
}

interface LongTextConfig {
  variable: string;
  placeholder?: string;
  maxLength: number;
  required: boolean;
}

interface EmailConfig {
  variable: string;
  placeholder?: string;
  maxLength: number;
  required: boolean;
}

// Selection inputs
interface MultipleChoiceConfig {
  variable: string;
  options: { id: string; label: string }[];
  allowMultiple: boolean;
  required: boolean;
}

interface YesNoConfig {
  variable: string;
  yesLabel: string;
  noLabel: string;
  required: boolean;
}

interface OpinionScaleConfig {
  variable: string;
  scaleMin: number;
  scaleMax: number;
  minLabel?: string;
  maxLabel?: string;
  required: boolean;
}

// Completion steps
interface ProcessingConfig {
  messages: string[];
  estimatedDuration: number;
}

interface RewardConfig {
  allowDownload: boolean;
  allowSystemShare: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

type ShareSocial = {
  platform: "instagram" | "tiktok" | "twitter" | "facebook";
  enabled: boolean;
};
```

---

## Entity: Experience (Updated)

### Firestore Collection Path
```
/experiences/{experienceId}
```

### Schema Definition (Relevant Fields)

```typescript
interface Experience {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  stepsOrder: string[];              // Array of step IDs in display order
  status: "active" | "deleted";
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Relationship to Steps

- **One Experience → Many Steps**: Steps are stored in `/experiences/{experienceId}/steps/`
- **Order Management**: `stepsOrder` array on Experience document defines display order
- **Max Steps**: 50 steps per experience (EXPERIENCE_CONSTRAINTS.MAX_STEPS)

---

## Entity: Session (Updated Field)

### Schema Definition (Relevant Fields)

```typescript
interface Session {
  id: string;
  eventId: string;

  // Updated: experienceId replaces journeyId
  experienceId?: string;           // Reference to experience (FR-010)
  currentStepIndex?: number;       // Position in experience.stepsOrder

  // Other fields unchanged
  state: SessionState;
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;
  data?: SessionData;
  createdAt: number;
  updatedAt: number;
}
```

### Migration Notes

- Sessions with `journeyId` will continue to work (backward compatible)
- New sessions will use `experienceId` field
- Both fields may coexist during transition period

---

## Zod Schemas

### Location
```
web/src/features/steps/schemas/step.schemas.ts
```

### New Schemas to Add

```typescript
// AiTransformVariable schema
export const aiTransformVariableSchema = z.object({
  key: z.string()
    .min(1, "Variable key is required")
    .max(50, "Variable key must be 50 characters or less")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Variable key must be alphanumeric"),
  sourceType: z.enum(["capture", "input", "static"]),
  sourceStepId: z.string().optional(),
  staticValue: z.string().optional(),
}).refine(
  (data) => {
    if (data.sourceType === "static") {
      return data.staticValue !== undefined;
    }
    if (data.sourceType === "capture" || data.sourceType === "input") {
      return data.sourceStepId !== undefined;
    }
    return true;
  },
  { message: "Source configuration is incomplete" }
);

// AiTransformConfig schema
export const aiTransformConfigSchema = z.object({
  model: z.string().nullable(),
  prompt: z.string().max(1000, "Prompt must be 1000 characters or less").nullable(),
  variables: z.array(aiTransformVariableSchema).default([]),
  outputType: z.enum(["image", "video", "gif"]).default("image"),
  aspectRatio: z.string().default("1:1"),
  referenceImageUrls: z.array(z.string().url())
    .max(5, "Maximum 5 reference images allowed")
    .default([]),
});

// Type inference
export type AiTransformConfig = z.infer<typeof aiTransformConfigSchema>;
export type AiTransformVariable = z.infer<typeof aiTransformVariableSchema>;
```

### Updated StepType Schema

```typescript
export const stepTypeSchema = z.enum([
  "info",
  "experience-picker",  // Deprecated
  "capture",            // Deprecated
  "ai-transform",       // New
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "opinion_scale",
  "email",
  "processing",
  "reward",
]);
```

---

## State Transitions

### Step Lifecycle

```
[Created] → [Active] → [Deleted]
```

Steps don't have a status field - deletion removes the document and updates `experience.stepsOrder`.

### Experience-Step Consistency

When modifying steps, the following invariants must be maintained:

1. **Create**: Step document created → `stepsOrder` updated with new ID
2. **Delete**: Step document deleted → `stepsOrder` updated without deleted ID
3. **Reorder**: `stepsOrder` array reordered (step documents unchanged)

All operations that affect both step documents and `stepsOrder` must use Firestore batch writes for atomicity.

---

## Index Requirements

### Composite Indexes

No additional indexes required. Steps are queried by:
1. Parent subcollection path (automatic)
2. `experienceId` field within subcollection (automatic)

### Query Patterns

1. **List steps for experience**:
   ```
   /experiences/{experienceId}/steps
   ```

2. **Get single step**:
   ```
   /experiences/{experienceId}/steps/{stepId}
   ```

3. **Steps ordering**: Retrieved via `experience.stepsOrder` array, then fetched in batch

---

## Relationships Diagram

```
┌─────────────┐
│   Company   │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│  Experience │◄────────────────────────────┐
│             │                             │
│ stepsOrder[]│                             │
└──────┬──────┘                             │
       │ 1:N (subcollection)                │
       ▼                                    │
┌─────────────┐                             │
│    Step     │ experienceId ───────────────┘
│             │
│ type        │
│ config      │ (type-specific)
│ title       │
│ ctaLabel    │
│ mediaUrl    │
└─────────────┘

┌─────────────┐
│   Session   │
│             │
│ experienceId│ ─────────► Experience
│ stepIndex   │ ─────────► Position in stepsOrder
└─────────────┘
```

---

## Constants

### Location
```
web/src/features/steps/constants.ts
```

### STEP_TYPE_META Update

```typescript
export const STEP_TYPE_META: Record<StepType, StepTypeMeta> = {
  // ... existing entries ...

  "ai-transform": {
    label: "AI Transform",
    description: "Transform photos with AI models",
    icon: "wand-2",          // lucide-react icon
    category: "capture",
    deprecated: false,
  },
};
```

### STEP_DEFAULTS Update

```typescript
export const STEP_DEFAULTS: Record<StepType, StepDefaults> = {
  // ... existing entries ...

  "ai-transform": {
    title: "AI Transform",
    ctaLabel: "Generate",
    config: {
      model: null,
      prompt: null,
      variables: [],
      outputType: "image",
      aspectRatio: "1:1",
      referenceImageUrls: [],
    },
  },
};
```
