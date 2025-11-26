# Data Model: Journey Editor

**Feature**: Journey Editor
**Branch**: `006-journey-editor`
**Date**: 2025-11-26

## Overview

This document defines the data model for Steps within the Journey Editor. Steps are stored as a subcollection of Events in Firestore.

---

## Firestore Collections

### Collection Structure

```text
/events/{eventId}/
├── journeys/{journeyId}     # Journey documents (existing)
│   └── stepOrder: string[]  # References step IDs in order
└── steps/{stepId}           # Step documents (NEW)
    └── [step fields]        # Type-specific configuration
```

---

## Step Base Entity

All steps share these base fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore document ID |
| `eventId` | string | Yes | Parent event reference |
| `journeyId` | string | Yes | Parent journey reference |
| `type` | StepType | Yes | Discriminator for step type |
| `title` | string | No | Main heading text |
| `description` | string | No | Subtitle/helper text |
| `mediaUrl` | string | No | Hero image/video URL (full public URL) |
| `ctaLabel` | string | No | Button text override (default: "Continue") |
| `createdAt` | number | Yes | Unix timestamp (ms) |
| `updatedAt` | number | Yes | Unix timestamp (ms) |

---

## Step Types

### 1. Info Step (`type: "info"`)

Universal message/welcome screen. Uses only base fields.

```typescript
interface StepInfo extends StepBase {
  type: "info";
  // No additional config
}
```

**Default Values**:
- `title`: "Welcome"
- `ctaLabel`: "Continue"

---

### 2. Experience Picker Step (`type: "experience-picker"`)

Allows guests to choose from available AI experiences.

Display data (name, previewMediaUrl) is resolved at runtime from the `/experiences` collection.

```typescript
interface StepExperiencePicker extends StepBase {
  type: "experience-picker";
  config: {
    layout: "grid" | "list" | "carousel";
    variable: string;       // Session variable to store selection
    experienceIds: string[]; // References to /experiences/{id}
  };
}
```

**Runtime Resolution**:
- Editor and preview components fetch experiences via `useEventExperiences(eventId)`
- Display data (name, previewMediaUrl) is joined from experiences at render time
- Missing experiences are shown with a warning indicator

**Default Values**:
- `layout`: "grid"
- `variable`: "selected_experience_id"
- `experienceIds`: []

**Validation**:
- `variable`: 1-50 chars, alphanumeric + underscore
- `experienceIds`: 0-20 items

---

### 3. Capture Step (`type: "capture"`)

Camera capture that loads Experience config at runtime.

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    source: string;              // Variable name holding experience ID
    fallbackExperienceId?: string; // Default if variable not set
  };
}
```

**Default Values**:
- `source`: "selected_experience_id"
- `fallbackExperienceId`: undefined

**Validation**:
- `source`: 1-50 chars, alphanumeric + underscore
- `fallbackExperienceId`: Valid experience ID or undefined

---

### 4. Short Text Step (`type: "short_text"`)

Single-line text input.

```typescript
interface StepShortText extends StepBase {
  type: "short_text";
  config: {
    variable: string;
    placeholder?: string;
    maxLength: number;
    required: boolean;
  };
}
```

**Default Values**:
- `variable`: "user_input"
- `placeholder`: "Enter your answer..."
- `maxLength`: 500
- `required`: false

**Validation**:
- `variable`: 1-50 chars, alphanumeric + underscore
- `placeholder`: 0-200 chars
- `maxLength`: 1-1000

---

### 5. Long Text Step (`type: "long_text"`)

Multi-line textarea input.

```typescript
interface StepLongText extends StepBase {
  type: "long_text";
  config: {
    variable: string;
    placeholder?: string;
    maxLength: number;
    required: boolean;
  };
}
```

**Default Values**:
- `variable`: "user_input"
- `placeholder`: "Share your thoughts..."
- `maxLength`: 2000
- `required`: false

**Validation**:
- Same as Short Text but `maxLength`: 1-5000

---

### 6. Multiple Choice Step (`type: "multiple_choice"`)

Selection from predefined options.

```typescript
interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: MultipleChoiceOption[];
    allowMultiple: boolean;
    required: boolean;
  };
}

interface MultipleChoiceOption {
  label: string;
  value: string;
}
```

**Default Values**:
- `variable`: "user_choice"
- `options`: [{ label: "Option 1", value: "option_1" }]
- `allowMultiple`: false
- `required`: false

**Validation**:
- `options`: 2-10 items
- `label`: 1-100 chars
- `value`: 1-50 chars, alphanumeric + underscore

---

### 7. Yes/No Step (`type: "yes_no"`)

Binary choice with customizable labels.

```typescript
interface StepYesNo extends StepBase {
  type: "yes_no";
  config: {
    variable: string;
    yesLabel: string;
    noLabel: string;
    required: boolean;
  };
}
```

**Default Values**:
- `variable`: "user_answer"
- `yesLabel`: "Yes"
- `noLabel`: "No"
- `required`: false

**Validation**:
- `yesLabel`, `noLabel`: 1-50 chars

---

### 8. Opinion Scale Step (`type: "opinion_scale"`)

Numeric scale selection with labels.

```typescript
interface StepOpinionScale extends StepBase {
  type: "opinion_scale";
  config: {
    variable: string;
    scaleMin: number;
    scaleMax: number;
    minLabel?: string;
    maxLabel?: string;
    required: boolean;
  };
}
```

**Default Values**:
- `variable`: "user_rating"
- `scaleMin`: 1
- `scaleMax`: 5
- `minLabel`: "Not at all"
- `maxLabel`: "Very much"
- `required`: false

**Validation**:
- `scaleMin`: 0-10
- `scaleMax`: 2-10, must be > scaleMin
- `minLabel`, `maxLabel`: 0-50 chars

---

### 9. Email Step (`type: "email"`)

Email address collection.

```typescript
interface StepEmail extends StepBase {
  type: "email";
  config: {
    variable: string;
    placeholder?: string;
    required: boolean;
  };
}
```

**Default Values**:
- `variable`: "user_email"
- `placeholder`: "email@example.com"
- `required`: false

**Validation**:
- `placeholder`: 0-100 chars

---

### 10. Processing Step (`type: "processing"`)

Loading/generation screen with rotating messages.

```typescript
interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    messages: string[];
    estimatedDuration: number; // seconds
  };
}
```

**Default Values**:
- `messages`: ["Creating your image...", "Almost there...", "Finishing touches..."]
- `estimatedDuration`: 30

**Validation**:
- `messages`: 1-10 items, each 1-200 chars
- `estimatedDuration`: 5-300 seconds

---

### 11. Reward Step (`type: "reward"`)

Final result display with sharing options.

```typescript
interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[];
  };
}

type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";
```

**Default Values**:
- `allowDownload`: true
- `allowSystemShare`: true
- `allowEmail`: false
- `socials`: []

**Validation**:
- `socials`: 0-6 items, unique values

---

## TypeScript Types

### Discriminated Union

```typescript
export type StepType =
  | "info"
  | "experience-picker"
  | "capture"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward";

export type Step =
  | StepInfo
  | StepExperiencePicker
  | StepCapture
  | StepShortText
  | StepLongText
  | StepMultipleChoice
  | StepYesNo
  | StepOpinionScale
  | StepEmail
  | StepProcessing
  | StepReward;
```

### Helper Types

```typescript
// Extract config type for a specific step type
export type StepConfig<T extends StepType> = Extract<Step, { type: T }> extends { config: infer C } ? C : never;

// Steps that have a config property
export type StepWithConfig = Exclude<Step, StepInfo>;

// Input step types (collect user data)
export type InputStepType = "short_text" | "long_text" | "multiple_choice" | "yes_no" | "opinion_scale" | "email";

// Steps that set session variables
export type VariableStepType = InputStepType | "experience-picker" | "capture";
```

---

## Zod Schemas

### Base Schema

```typescript
const stepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  journeyId: z.string(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  mediaUrl: z.string().url().optional(),
  ctaLabel: z.string().max(50).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

### Type-Specific Schemas (Examples)

```typescript
const variableNameSchema = z.string()
  .min(1).max(50)
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be valid variable name");

const infoStepSchema = stepBaseSchema.extend({
  type: z.literal("info"),
});

const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal("multiple_choice"),
  config: z.object({
    variable: variableNameSchema,
    options: z.array(z.object({
      label: z.string().min(1).max(100),
      value: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
    })).min(2).max(10),
    allowMultiple: z.boolean(),
    required: z.boolean(),
  }),
});

// Discriminated union
const stepSchema = z.discriminatedUnion("type", [
  infoStepSchema,
  experiencePickerStepSchema,
  captureStepSchema,
  shortTextStepSchema,
  longTextStepSchema,
  multipleChoiceStepSchema,
  yesNoStepSchema,
  opinionScaleStepSchema,
  emailStepSchema,
  processingStepSchema,
  rewardStepSchema,
]);
```

---

## State Transitions

### Step Lifecycle

```
[Created] → [Active] → [Deleted]
                ↑
                └── [Updated]
```

Steps don't have explicit status - they exist in the journey's `stepOrder` array or they don't. Deletion removes from `stepOrder` and optionally soft-deletes the document.

### Journey Step Order Updates

When steps are reordered, added, or removed:

1. Update `Journey.stepOrder` array
2. Revalidate cache paths
3. Client receives real-time update via subscription

---

## Indexes

### Required Composite Indexes

```text
Collection: events/{eventId}/steps
- eventId ASC, journeyId ASC, createdAt DESC
  (for listing steps by journey)

- eventId ASC, type ASC
  (for filtering steps by type)
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId}/steps/{stepId} {
      // Allow reads (authenticated or public based on event settings)
      allow read: if true;

      // Deny all client writes - must go through Admin SDK
      allow write: if false;
    }
  }
}
```

---

## Relationships

```text
Event (1) ─────────┬───────── (N) Journey
                   │
                   └───────── (N) Step
                                  │
                                  └── references Experience (via config)

Journey.stepOrder: string[] ──────── Step.id (ordered references)
```

---

## Constants

```typescript
export const STEP_CONSTANTS = {
  // Limits
  MAX_STEPS_PER_JOURNEY: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CTA_LABEL_LENGTH: 50,
  MAX_VARIABLE_NAME_LENGTH: 50,

  // Multiple Choice
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_OPTION_LABEL_LENGTH: 100,
  MAX_OPTION_VALUE_LENGTH: 50,

  // Text Input
  DEFAULT_SHORT_TEXT_MAX_LENGTH: 500,
  DEFAULT_LONG_TEXT_MAX_LENGTH: 2000,
  MAX_SHORT_TEXT_LENGTH: 1000,
  MAX_LONG_TEXT_LENGTH: 5000,

  // Opinion Scale
  MIN_SCALE_VALUE: 0,
  MAX_SCALE_VALUE: 10,

  // Processing
  MIN_PROCESSING_MESSAGES: 1,
  MAX_PROCESSING_MESSAGES: 10,
  MIN_ESTIMATED_DURATION: 5,
  MAX_ESTIMATED_DURATION: 300,

  // Experience Picker
  MAX_EXPERIENCE_OPTIONS: 20,

  // Socials
  AVAILABLE_SOCIALS: ["instagram", "facebook", "twitter", "linkedin", "tiktok", "whatsapp"] as const,
};
```
