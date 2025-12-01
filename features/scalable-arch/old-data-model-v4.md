# Firestore Data Model

This document describes the Firestore collections and their schemas for the Clementine platform.

## Overview

The application uses a **normalized Firestore architecture** with flat root collections and minimal nesting:

| Collection | Path | Description |
|-----------|------|-------------|
| **Companies** | `/companies/{companyId}` | Brand/organization management |
| **Events** | `/events/{eventId}` | Event configuration and switchboard |
| **Experiences** | `/experiences/{experienceId}` | AI experience library |
| **Journeys** | `/events/{eventId}/journeys/{journeyId}` | Step sequence playlists (subcollection) |
| **Steps** | `/events/{eventId}/steps/{stepId}` | Individual screen configs (subcollection) |

---

## Companies

**Collection**: `/companies/{companyId}`

Companies represent brands or organizations that own events.

### Schema

```typescript
interface Company {
  id: string;
  name: string;                    // 1-100 characters
  status: "active" | "deleted";
  deletedAt: number | null;        // Unix timestamp ms (soft delete)
  contactEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  createdAt: number;               // Unix timestamp ms
  updatedAt: number;
}
```

### Constraints

- `name`: min 1, max 100 characters
- Soft deletion via `status: "deleted"` and `deletedAt` timestamp

---

## Events

**Collection**: `/events/{eventId}`

Events are the root container for guest experiences. They control theming and use the **Switchboard pattern** via `activeJourneyId` to control which journey is live.

### Schema

```typescript
interface Event {
  id: string;
  name: string;                      // 1-200 characters
  status: "draft" | "live" | "archived" | "deleted";
  ownerId: string | null;            // FK to companies collection
  joinPath: string;                  // e.g., "/join/abc123"
  qrPngPath: string;                 // Firebase Storage path
  publishStartAt?: number | null;    // Unix timestamp ms
  publishEndAt?: number | null;      // Unix timestamp ms
  activeJourneyId?: string | null;   // Switchboard: controls active journey
  theme: EventTheme;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Theme Schema

```typescript
interface EventTheme {
  logoUrl?: string | null;
  fontFamily?: string | null;
  primaryColor: string;              // Hex color (e.g., "#6366F1")
  text: {
    color: string;                   // Hex color
    alignment: "left" | "center" | "right";
  };
  button: {
    backgroundColor?: string | null; // Inherits primaryColor if null
    textColor: string;               // Hex color
    radius: "none" | "sm" | "md" | "full";
  };
  background: {
    color: string;                   // Hex color
    image?: string | null;           // Full public URL
    overlayOpacity: number;          // 0-1
  };
}
```

### Constraints

- `name`: min 1, max 200 characters
- Colors must match regex: `/^#[0-9A-F]{6}$/i`

---

## Experiences

**Collection**: `/experiences/{experienceId}`

Experiences are reusable AI transformation configurations. They use a **discriminated union** by `type` field.

### Base Schema (shared fields)

```typescript
interface BaseExperience {
  id: string;
  companyId: string;                 // FK to companies collection
  eventIds: string[];                // Many-to-many with events
  name: string;                      // 1-50 characters
  type: "photo" | "video" | "gif";
  enabled: boolean;
  previewMediaUrl?: string | null;
  previewType?: "image" | "gif" | "video" | null;
  inputFields?: unknown[] | null;    // Reserved for future use
  createdAt: number;
  updatedAt: number;
}
```

### Photo Experience

```typescript
interface PhotoExperience extends BaseExperience {
  type: "photo";
  captureConfig: {
    countdown: number;               // 0 = disabled, 1-10 = seconds
    cameraFacing: "front" | "back" | "both";
    overlayUrl: string | null;
  };
  aiPhotoConfig: {
    enabled: boolean;
    model?: string | null;           // e.g., "gemini-2.5-flash-image"
    prompt?: string | null;          // max 1000 chars
    referenceImageUrls?: (string | null)[]; // max 5
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  };
}
```

### Video Experience

```typescript
interface VideoExperience extends BaseExperience {
  type: "video";
  captureConfig: {
    countdown: number;
    cameraFacing: "front" | "back" | "both";
    minDuration?: number;
    maxDuration: number;
  };
  aiVideoConfig: {
    enabled: boolean;
    model?: string | null;
    prompt?: string | null;
    referenceImageUrls?: (string | null)[];
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
    duration?: number | null;        // Output duration 1-60 seconds
    fps?: number | null;             // 12-60 fps
  };
}
```

### GIF Experience

```typescript
interface GifExperience extends BaseExperience {
  type: "gif";
  captureConfig: {
    countdown: number;
    cameraFacing: "front" | "back" | "both";
    frameCount: number;              // 3-10 frames
  };
  aiPhotoConfig: AiPhotoConfig;      // Same as photo
}
```

### Available AI Models

- `gemini-2.5-flash-image` (default)
- `gemini-3-pro-preview`

---

## Journeys

**Collection**: `/events/{eventId}/journeys/{journeyId}` (subcollection of Event)

Journeys define the linear sequence of steps (playlist) that guests follow.

### Schema

```typescript
interface Journey {
  id: string;
  eventId: string;                   // Parent event ID
  name: string;                      // 1-200 characters
  stepOrder: string[];               // Ordered array of step IDs
  tags: string[];
  status: "active" | "deleted";
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

### Switchboard Pattern

The `Event.activeJourneyId` field controls which journey is currently live. Changing this field switches all connected guests to a different journey in real-time.

---

## Steps

**Collection**: `/events/{eventId}/steps/{stepId}` (subcollection of Event)

Steps are individual UI screens in a journey. They use a **discriminated union** by `type` field with 11 different step types.

### Base Schema (shared fields)

```typescript
interface StepBase {
  id: string;
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string | null;             // max 200 chars
  description?: string | null;       // max 1000 chars
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null;          // max 50 chars
  createdAt: number;
  updatedAt: number;
}
```

### Step Types

#### 1. Info Step
Simple informational screen with no user input.

```typescript
interface StepInfo extends StepBase {
  type: "info";
}
```

#### 2. Experience Picker Step
Allows guests to select from available experiences.

```typescript
interface StepExperiencePicker extends StepBase {
  type: "experience-picker";
  config: {
    layout: "grid" | "list" | "carousel";
    variable: string;                // Session variable to store selection
    experienceIds: string[];         // FK to /experiences (max 20)
  };
}
```

#### 3. Capture Step
Camera capture screen that loads experience config dynamically.

```typescript
interface StepCapture extends StepBase {
  type: "capture";
  config: {
    source: string;                  // Variable reference (e.g., "$experienceId")
    fallbackExperienceId?: string | null;
  };
}
```

#### 4. Short Text Step
Single-line text input.

```typescript
interface StepShortText extends StepBase {
  type: "short_text";
  config: {
    variable: string;
    placeholder?: string | null;
    maxLength: number;               // max 1000
    required: boolean;
  };
}
```

#### 5. Long Text Step
Multi-line text input.

```typescript
interface StepLongText extends StepBase {
  type: "long_text";
  config: {
    variable: string;
    placeholder?: string | null;
    maxLength: number;               // max 5000
    required: boolean;
  };
}
```

#### 6. Multiple Choice Step

```typescript
interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: Array<{ label: string; value: string }>; // 2-10 options
    allowMultiple: boolean;
    required: boolean;
  };
}
```

#### 7. Yes/No Step

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

#### 8. Opinion Scale Step

```typescript
interface StepOpinionScale extends StepBase {
  type: "opinion_scale";
  config: {
    variable: string;
    scaleMin: number;                // 0-10
    scaleMax: number;                // 0-10
    minLabel?: string | null;
    maxLabel?: string | null;
    required: boolean;
  };
}
```

#### 9. Email Step

```typescript
interface StepEmail extends StepBase {
  type: "email";
  config: {
    variable: string;
    placeholder?: string | null;
    required: boolean;
  };
}
```

#### 10. Processing Step
Loading/waiting screen during AI generation.

```typescript
interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    messages: string[];              // 1-10 messages, max 200 chars each
    estimatedDuration: number;       // 5-300 seconds
  };
}
```

#### 11. Reward Step
Final screen showing transformed media with sharing options.

```typescript
interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[];          // Available: instagram, facebook, twitter, linkedin, tiktok, whatsapp
  };
}
```

### Step Constraints

| Constraint | Value |
|-----------|-------|
| Max steps per journey | 50 |
| Max title length | 200 |
| Max description length | 1000 |
| Max CTA label length | 50 |
| Max variable name length | 50 |
| Options (min/max) | 2-10 |
| Short text max length | 1000 |
| Long text max length | 5000 |
| Scale range | 0-10 |
| Processing messages | 1-10 |
| Estimated duration | 5-300 seconds |

---

## Relationships

```
Companies (1) ──────┬──────── (*) Events
                    │
                    └──────── (*) Experiences
                                    │
Events (1) ─────────┬──────── (*) Journeys (subcollection)
                    │
                    └──────── (*) Steps (subcollection)
                                    │
                                    └──── references ──── Experiences
```

- **Company → Events**: One company owns many events (`Event.ownerId`)
- **Company → Experiences**: One company owns many experiences (`Experience.companyId`)
- **Event ↔ Experiences**: Many-to-many via `Experience.eventIds[]`
- **Event → Journeys**: One event contains many journeys (subcollection)
- **Event → Steps**: One event contains many steps (subcollection)
- **Journey → Steps**: Journey references steps via `stepOrder[]` array
- **Step → Experience**: Capture and picker steps reference experiences

---

## Source Files

| Feature | Types | Schemas | Constants |
|---------|-------|---------|-----------|
| Companies | `web/src/features/companies/types/companies.types.ts` | `schemas/companies.schemas.ts` | `constants.ts` |
| Events | `web/src/features/events/types/event.types.ts` | `schemas/events.schemas.ts` | `constants.ts` |
| Experiences | `web/src/features/experiences/types/experiences.types.ts` | `schemas/experiences.schemas.ts` | `constants.ts` |
| Journeys | `web/src/features/journeys/types/journeys.types.ts` | `schemas/journeys.schemas.ts` | `constants.ts` |
| Steps | `web/src/features/steps/types/step.types.ts` | `schemas/step.schemas.ts` | `constants.ts` |
