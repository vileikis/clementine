# Firestore Data Model: Events, Experiences & Steps

This document describes the current Firestore data model for the Events, Experiences, and Steps collections based on the Zod schemas and TypeScript types in `web/src/features/`.

## Overview

```
Company
  └── Projects
        └── Events (subcollection)      ← /projects/{projectId}/events/{eventId}
              └── experiences[]         ← Embedded EventExperienceLink array
              └── extras                ← Embedded slot-based flows

Experiences (root collection)           ← /experiences/{experienceId}
  └── Steps (subcollection)             ← /experiences/{experienceId}/steps/{stepId}
```

---

## 1. Events Collection

**Firestore Path:** `/projects/{projectId}/events/{eventId}`

Events are time-bound, themed instances nested under Projects. They link to reusable Experiences and define visual customization for the guest-facing flow.

### Schema

```typescript
interface Event {
  // Identity
  id: string;                           // Document ID (auto-generated)
  projectId: string;                    // Parent project ID (from path)
  companyId: string;                    // FK to companies (denormalized for query efficiency)
  name: string;                         // 1-200 characters

  // Scheduling (optional, stored but not enforced)
  publishStartAt?: number | null;       // Unix timestamp ms
  publishEndAt?: number | null;         // Unix timestamp ms

  // Linked experiences (embedded array)
  experiences: EventExperienceLink[];

  // Slot-based extra flows
  extras: EventExtras;

  // Visual customization
  theme: EventTheme;

  // Soft delete
  deletedAt?: number | null;            // Unix timestamp ms when deleted

  // Timestamps
  createdAt: number;                    // Unix timestamp ms
  updatedAt: number;                    // Unix timestamp ms
}
```

### EventExperienceLink (Embedded)

Links an Event to an Experience. Used in both `experiences[]` array and `extras` slots.

```typescript
interface EventExperienceLink {
  experienceId: string;                 // FK to /experiences/{experienceId}
  label?: string | null;                // Optional display name override (max 200 chars)
  enabled: boolean;                     // Toggle to enable/disable without removing
  frequency?: ExtraSlotFrequency | null; // Only for extras: "always" | "once_per_session"
}
```

### EventExtras (Embedded)

Slot-based extra flows that run at specific points in the guest journey.

```typescript
interface EventExtras {
  preEntryGate?: EventExperienceLink | null;  // Flow shown before guest starts any experience
  preReward?: EventExperienceLink | null;     // Flow shown after experience but before AI result
}
```

| Slot | Description | Examples |
|------|-------------|----------|
| `preEntryGate` | Flow shown once before guest starts any experience | Age verification, consent forms, house rules |
| `preReward` | Flow shown after experience but before AI result | Quick survey, feedback, additional info collection |

### EventTheme (Embedded)

Visual customization settings for the event.

```typescript
interface EventTheme {
  logoUrl?: string | null;              // Full public URL
  fontFamily?: string | null;           // CSS font family string
  primaryColor: string;                 // Hex color (#RRGGBB)
  text: EventThemeText;
  button: EventThemeButton;
  background: EventThemeBackground;
}

interface EventThemeText {
  color: string;                        // Hex color (#RRGGBB)
  alignment: "left" | "center" | "right";
}

interface EventThemeButton {
  backgroundColor?: string | null;      // Hex color, inherits primaryColor if null
  textColor: string;                    // Hex color (#RRGGBB)
  radius: "none" | "sm" | "md" | "full";
}

interface EventThemeBackground {
  color: string;                        // Hex color (#RRGGBB)
  image?: string | null;                // Full public URL
  overlayOpacity: number;               // 0-1
}
```

### Default Theme Values

```typescript
const DEFAULT_EVENT_THEME = {
  logoUrl: null,
  fontFamily: null,
  primaryColor: "#6366F1",              // Indigo
  text: {
    color: "#1F2937",                   // Gray-800
    alignment: "center",
  },
  button: {
    backgroundColor: null,              // Inherits primaryColor
    textColor: "#FFFFFF",               // White
    radius: "md",
  },
  background: {
    color: "#FFFFFF",                   // White
    image: null,
    overlayOpacity: 0.5,
  },
};
```

---

## 2. Experiences Collection

**Firestore Path:** `/experiences/{experienceId}`

Experiences are company-scoped reusable flow templates. They define the sequence of steps a guest goes through.

### Schema

```typescript
interface Experience {
  // Identity
  id: string;                           // Document ID (auto-generated)
  companyId: string;                    // FK to companies

  // Content
  name: string;                         // 1-200 characters
  description?: string | null;          // Max 1000 characters

  // Step ordering
  stepsOrder: string[];                 // Ordered array of step IDs

  // Status
  status: "active" | "deleted";
  deletedAt: number | null;             // Unix timestamp ms when deleted

  // Preview media (optional)
  previewMediaUrl?: string | null;      // Max 2048 chars
  previewType?: "image" | "gif" | null;

  // Timestamps
  createdAt: number;                    // Unix timestamp ms
  updatedAt: number;                    // Unix timestamp ms
}
```

### Constraints

| Field | Constraint |
|-------|------------|
| `name` | 1-200 characters |
| `description` | Max 1000 characters |
| `previewMediaUrl` | Max 2048 characters |
| Max steps | 50 per experience |

---

## 3. Steps Collection

**Firestore Path:** `/experiences/{experienceId}/steps/{stepId}`

Steps are individual UI screen configurations within Experiences. They use a discriminated union pattern based on the `type` field.

### Base Schema (All Steps)

```typescript
interface StepBase {
  id: string;                           // Document ID
  experienceId: string;                 // Parent experience ID
  type: StepType;                       // Discriminator
  title?: string | null;                // Max 200 chars
  description?: string | null;          // Max 1000 chars
  mediaUrl?: string | null;             // URL for media
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null;             // Max 50 chars
  createdAt: number;                    // Unix timestamp ms
  updatedAt: number;                    // Unix timestamp ms
}
```

### Step Types

| Type | Category | Description | Has Config |
|------|----------|-------------|------------|
| `info` | Navigation | Welcome or message screen | No |
| `experience-picker` | Navigation | Choose an AI experience (deprecated) | Yes |
| `capture` | Capture | Take a photo or video (deprecated) | Yes |
| `ai-transform` | Capture | Transform photos with AI models | Yes |
| `short_text` | Input | Single line text input | Yes |
| `long_text` | Input | Multi-line text input | Yes |
| `multiple_choice` | Input | Select from options | Yes |
| `yes_no` | Input | Binary choice | Yes |
| `opinion_scale` | Input | Numeric rating scale | Yes |
| `email` | Input | Collect email address | Yes |
| `processing` | Completion | Loading/generation screen | Yes |
| `reward` | Completion | Final result with sharing | Yes |

### Step Type Configurations

#### Info Step
No additional config required.

```typescript
interface StepInfo extends StepBase {
  type: "info";
}
```

#### Capture Step (Deprecated)

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    source: string;                     // Variable name for session storage
    fallbackExperienceId?: string | null;
  };
}
```

#### AI Transform Step

```typescript
interface StepAiTransform extends StepBase {
  type: "ai-transform";
  config: {
    model: string | null;               // e.g., "gemini-2.5-flash-image", "flux"
    prompt: string | null;              // Max 1000 chars, supports {{variable}} syntax
    variables: AiTransformVariable[];   // How prompt variables are populated
    outputType: "image" | "video" | "gif";
    aspectRatio: string;                // e.g., "1:1", "3:4", "9:16"
    referenceImageUrls: string[];       // Max 5 URLs
  };
}

interface AiTransformVariable {
  key: string;                          // Variable name (1-50 chars, identifier format)
  sourceType: "capture" | "input" | "static";
  sourceStepId?: string;                // Required if sourceType is "capture" or "input"
  staticValue?: string;                 // Required if sourceType is "static"
}
```

#### Short Text Step

```typescript
interface StepShortText extends StepBase {
  type: "short_text";
  config: {
    variable: string;                   // Variable name for session storage
    placeholder?: string | null;        // Max 200 chars
    maxLength: number;                  // 1-1000
    required: boolean;
  };
}
```

#### Long Text Step

```typescript
interface StepLongText extends StepBase {
  type: "long_text";
  config: {
    variable: string;
    placeholder?: string | null;        // Max 200 chars
    maxLength: number;                  // 1-5000
    required: boolean;
  };
}
```

#### Multiple Choice Step

```typescript
interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: MultipleChoiceOption[];    // 2-10 options
    allowMultiple: boolean;
    required: boolean;
  };
}

interface MultipleChoiceOption {
  label: string;                        // 1-100 chars
  value: string;                        // 1-50 chars, alphanumeric with underscores
}
```

#### Yes/No Step

```typescript
interface StepYesNo extends StepBase {
  type: "yes_no";
  config: {
    variable: string;
    yesLabel: string;                   // 1-50 chars
    noLabel: string;                    // 1-50 chars
    required: boolean;
  };
}
```

#### Opinion Scale Step

```typescript
interface StepOpinionScale extends StepBase {
  type: "opinion_scale";
  config: {
    variable: string;
    scaleMin: number;                   // 0-10
    scaleMax: number;                   // 2-10, must be > scaleMin
    minLabel?: string | null;           // Max 50 chars
    maxLabel?: string | null;           // Max 50 chars
    required: boolean;
  };
}
```

#### Email Step

```typescript
interface StepEmail extends StepBase {
  type: "email";
  config: {
    variable: string;
    placeholder?: string | null;        // Max 100 chars
    required: boolean;
  };
}
```

#### Processing Step

```typescript
interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    messages: string[];                 // 1-10 messages, each max 200 chars
    estimatedDuration: number;          // 5-300 seconds
  };
}
```

#### Reward Step

```typescript
interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[];             // Max 6
  };
}

type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";
```

### Step Constants Summary

| Constant | Value |
|----------|-------|
| Max steps per experience | 50 |
| Max title length | 200 |
| Max description length | 1000 |
| Max CTA label length | 50 |
| Max variable name length | 50 |
| Max short text input | 1000 |
| Max long text input | 5000 |
| Multiple choice options | 2-10 |
| Opinion scale range | 0-10 |
| Processing messages | 1-10 |
| Estimated duration | 5-300 seconds |

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Company                                   │
│                     /companies/{id}                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│       Projects        │       │     Experiences       │
│    /projects/{id}     │       │   /experiences/{id}   │
│                       │       │                       │
│ • companyId (FK)      │       │ • companyId (FK)      │
│ • activeEventId       │       │ • stepsOrder[]        │
└───────────┬───────────┘       └───────────┬───────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│        Events         │       │        Steps          │
│ /projects/{}/events/{}│       │ /experiences/{}/steps/│
│                       │       │                       │
│ • projectId           │       │ • experienceId        │
│ • companyId (FK)      │       │ • type (discriminator)│
│ • experiences[] ──────┼───────│ • config              │
│ • extras              │       │                       │
│ • theme               │       │                       │
└───────────────────────┘       └───────────────────────┘
```

---

## Source Files

- **Events:** `web/src/features/events/schemas/events.schemas.ts`
- **Events Types:** `web/src/features/events/types/event.types.ts`
- **Experiences:** `web/src/features/experiences/schemas/experiences.schemas.ts`
- **Experiences Types:** `web/src/features/experiences/types/experiences.types.ts`
- **Steps:** `web/src/features/steps/schemas/step.schemas.ts`
- **Steps Types:** `web/src/features/steps/types/step.types.ts`
