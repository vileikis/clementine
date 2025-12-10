# Experience Data Model Proposal v2

**Date**: December 2024
**Status**: Draft Proposal
**Scope**: Simplified experience model with system experiences for captures

---

## Executive Summary

This proposal introduces a cleaner experience model that:

1. **Treats everything as an experience** - Uniform handling for captures, AI, surveys, wheels
2. **System experiences for simple captures** - Photo, GIF, Video exist once globally
3. **Company experiences for custom flows** - AI transformations, surveys, wheels
4. **Event-level frame overlay** - Single overlay applied to all media outputs
5. **Event-level sharing config** - Default sharing for all outputs

---

## 1. Experience Types Overview

| Type | Scope | Purpose | Produces Media |
|------|-------|---------|----------------|
| `capture` | System | Simple photo/gif/video | Yes |
| `ai_capture` | Company | AI-powered transformation | Yes |
| `survey` | Company (or System) | Data collection | No |
| `wheel` | Company | Gamification | No |

Future types: `quiz`, `ar`, `photo_collage`, etc.

---

## 2. Core Schema

### 2.1 Experience Base

```typescript
interface ExperienceBase {
  id: string;

  // Ownership
  companyId: string | null;       // null = system experience
  isSystem: boolean;              // true = system, can't edit/delete

  // Display
  name: string;                   // 1-200 chars
  description?: string | null;    // max 1000 chars

  // Library preview
  previewMediaUrl?: string | null;
  previewType?: "image" | "gif" | "video" | null;

  // Status
  status: "active" | "deleted";
  deletedAt?: number | null;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 Experience Union Type

```typescript
type Experience =
  | CaptureExperience
  | AiCaptureExperience
  | SurveyExperience
  | WheelExperience;
```

---

## 3. Experience Type Definitions

### 3.1 Capture Experience (System)

Simple photo, GIF, or video capture without AI transformation.

```typescript
interface CaptureExperience extends ExperienceBase {
  experienceType: "capture";

  // Always system-level
  isSystem: true;
  companyId: null;

  config: {
    mode: "photo" | "gif" | "video";

    // Mode-specific defaults (can be extended in future)
    gifConfig?: {
      frameCount: number;         // Default: 4
      intervalMs: number;         // Default: 500
    } | null;

    videoConfig?: {
      maxDurationSec: number;     // Default: 15
    } | null;
  };

  // Output aspect ratio for frame overlay matching
  outputAspectRatio: AspectRatio;
}
```

**System Capture Experiences (seeded in database):**

| ID | Mode | Name | Aspect Ratio |
|----|------|------|--------------|
| `system:photo` | photo | Photo | 3:4 |
| `system:gif` | gif | GIF | 3:4 |
| `system:video` | video | Video | 9:16 |

### 3.2 AI Capture Experience (Company)

Capture photo/burst, transform with AI, output image/gif/video.

```typescript
interface AiCaptureExperience extends ExperienceBase {
  experienceType: "ai_capture";

  // Always company-level
  isSystem: false;
  companyId: string;

  // What to capture as AI input
  captureConfig: {
    mode: "photo" | "burst";

    burstConfig?: {
      frameCount: number;         // 2-10
      intervalMs: number;         // 200-2000
    } | null;

    cameraFacing: "user" | "environment" | "both";
    countdown: number;            // 0-10 seconds
  };

  // AI transformation settings
  aiConfig: {
    model: string | null;
    prompt: string;               // max 2000 chars, supports {{variable}}
    negativePrompt?: string | null;
    outputType: "image" | "gif" | "video";
    outputAspectRatio: AspectRatio;
    referenceImageUrls: string[]; // max 5

    // Advanced (optional)
    seed?: number | null;
    guidanceScale?: number | null;
  };

  // Input questions for AI context (shown before capture)
  inputQuestions: Question[];

  // Processing screen config
  processingConfig: {
    messages: string[];           // 1-10 rotating messages
    estimatedDurationSec: number; // 5-300
  };

  // Optional intro screen
  intro?: IntroScreen | null;
}
```

### 3.3 Survey Experience (Company or System)

Data collection with multiple question types.

```typescript
interface SurveyExperience extends ExperienceBase {
  experienceType: "survey";

  // Can be system (generic templates) or company (custom)
  isSystem: boolean;
  companyId: string | null;

  // Questions (same type as AI input questions)
  questions: Question[];

  // Screens
  intro?: IntroScreen | null;
  thankYou: ThankYouScreen;
}
```

### 3.4 Wheel Experience (Company)

Gamified spinning wheel with prizes.

```typescript
interface WheelExperience extends ExperienceBase {
  experienceType: "wheel";

  // Always company-level (custom wheel config)
  isSystem: false;
  companyId: string;

  // Wheel configuration
  wheelConfig: {
    sectors: WheelSector[];       // 2-12 sectors
    spinDurationMs: number;       // 2000-8000
    pointerPosition: "top" | "right";
    showConfetti: boolean;
  };

  // Screens
  intro?: IntroScreen | null;
  resultScreen: {
    titleTemplate: string;        // "You won {{prize}}!"
    descriptionTemplate?: string;
    showPrizeCode: boolean;
  };
}

interface WheelSector {
  id: string;
  label: string;                  // 1-50 chars, shown on wheel
  value: string;                  // 1-100 chars, stored result
  weight: number;                 // 1-100, probability weight

  // Visual
  backgroundColor?: string | null;
  textColor?: string | null;
  icon?: string | null;           // Emoji or icon name

  // Prize (optional)
  prize?: {
    type: "coupon" | "discount" | "freebie" | "points" | "none";
    code?: string | null;
    description?: string | null;
  } | null;
}
```

---

## 4. Shared Types

### 4.1 Question Type (Shared by AI inputs & Surveys)

```typescript
type Question =
  | ShortTextQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | YesNoQuestion
  | OpinionScaleQuestion
  | EmailQuestion;

interface QuestionBase {
  id: string;
  variableKey: string;            // Used in prompts as {{variableKey}}
  title: string;                  // max 200 chars
  description?: string | null;    // max 1000 chars
  required: boolean;
}

interface ShortTextQuestion extends QuestionBase {
  type: "short_text";
  placeholder?: string | null;
  maxLength: number;              // 1-500
}

interface LongTextQuestion extends QuestionBase {
  type: "long_text";
  placeholder?: string | null;
  maxLength: number;              // 1-2000
}

interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: { label: string; value: string }[];  // 2-10 options
  allowMultiple: boolean;
}

interface YesNoQuestion extends QuestionBase {
  type: "yes_no";
  yesLabel: string;               // default: "Yes"
  noLabel: string;                // default: "No"
}

interface OpinionScaleQuestion extends QuestionBase {
  type: "opinion_scale";
  scaleMin: number;               // 0-10
  scaleMax: number;               // 2-10
  minLabel?: string | null;
  maxLabel?: string | null;
}

interface EmailQuestion extends QuestionBase {
  type: "email";
  placeholder?: string | null;
}
```

### 4.2 Screen Types

```typescript
interface IntroScreen {
  title: string;                  // max 200 chars
  description?: string | null;    // max 1000 chars
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
  ctaLabel?: string | null;       // default: "Get Started"
}

interface ThankYouScreen {
  title: string;                  // max 200 chars
  description?: string | null;    // max 1000 chars
  mediaUrl?: string | null;
  mediaType?: "image" | "gif" | "video" | "lottie" | null;
}
```

### 4.3 Aspect Ratio

```typescript
type AspectRatio = "1:1" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9";
```

---

## 5. Event Schema

### 5.1 Event Document

```typescript
interface Event {
  id: string;
  projectId: string;
  companyId: string;
  name: string;                   // 1-200 chars

  // Scheduling
  publishStartAt?: number | null;
  publishEndAt?: number | null;

  // Visual theme (existing)
  theme: EventTheme;

  // ----- Experiences -----
  // See Section 6 for two approaches

  // ----- Frame Overlay (applied to ALL media outputs) -----
  frameOverlay?: FrameOverlay | null;

  // Future: frameOverlays by aspect ratio
  // frameOverlays?: Record<AspectRatio, FrameOverlay> | null;

  // ----- Default Sharing Config -----
  sharingConfig: SharingConfig;

  // ----- Extras -----
  extras: EventExtras;

  // Status
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

interface FrameOverlay {
  url: string;                    // Firebase Storage URL
  type: "image" | "gif" | "video";
}

interface SharingConfig {
  allowDownload: boolean;
  allowEmail: boolean;
  socials: ShareSocial[];
}

type ShareSocial = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "whatsapp";

interface EventExtras {
  preEntryGate?: EventExperienceLink | null;
  preReward?: EventExperienceLink | null;
}
```

---

## 6. System Experiences: Two Approaches

### Approach A: Unified `experiences[]` Array

System and company experiences in one array.

```typescript
interface Event {
  // ...

  // All experiences in one array
  experiences: EventExperienceLink[];
}

interface EventExperienceLink {
  experienceId: string;           // "system:photo" or company experience ID
  label?: string | null;          // Override display name
  enabled: boolean;

  // Future: per-experience overrides
  // sharingOverride?: Partial<SharingConfig> | null;
}
```

**Example:**
```typescript
const event = {
  experiences: [
    { experienceId: "system:photo", label: "Take a Photo", enabled: true },
    { experienceId: "system:gif", label: "Make a GIF", enabled: false },
    { experienceId: "abc123", label: "Hobbitify Me", enabled: true },
  ],
};
```

**Pros:**
- Uniform handling in UI and guest flow
- Single list to manage
- Easy to reorder all experiences together

**Cons:**
- Need to filter/validate system experiences (only one per mode)
- Slightly more complex queries

**Constraints:**
- Only one of each system capture type (photo, gif, video) allowed per event
- Validated at application level

---

### Approach B: Separate `systemCaptures` Map

System captures in dedicated map, company experiences in array.

```typescript
interface Event {
  // ...

  // System captures (max one per mode)
  systemCaptures: {
    photo?: SystemCaptureConfig | null;
    gif?: SystemCaptureConfig | null;
    video?: SystemCaptureConfig | null;
  };

  // Company experiences only
  experiences: EventExperienceLink[];
}

interface SystemCaptureConfig {
  enabled: boolean;
  label?: string | null;          // Override display name

  // Future: mode-specific overrides
  // photoConfig?: { ... };
  // gifConfig?: { frameCount: number; ... };
  // videoConfig?: { maxDuration: number; ... };
}
```

**Example:**
```typescript
const event = {
  systemCaptures: {
    photo: { enabled: true, label: "Take a Photo" },
    gif: { enabled: false, label: "Make a GIF" },
    video: null,
  },
  experiences: [
    { experienceId: "abc123", label: "Hobbitify Me", enabled: true },
  ],
};
```

**Pros:**
- Clear separation of system vs company
- Type-safe: impossible to add duplicate system captures
- No need to seed system experiences in database
- Easier to add mode-specific config in future

**Cons:**
- Two places to manage experiences
- Guest flow needs to merge both sources
- UI needs to handle two sections

---

### Recommendation

**Start with Approach B** for MVP:
- Simpler validation (no duplicate system captures possible)
- No database seeding required
- Clear type-safe structure
- Can migrate to Approach A later if needed

**Approach A** makes sense when:
- You want uniform drag-drop reordering of all experiences
- System experiences need the same features as company experiences
- You plan to have many system experience variants

---

## 7. Guest Flow Logic

### 7.1 Experience Resolution

```typescript
function getAvailableExperiences(event: Event): ExperienceOption[] {
  const options: ExperienceOption[] = [];

  // Add enabled system captures (Approach B)
  if (event.systemCaptures.photo?.enabled) {
    options.push({
      type: "system",
      mode: "photo",
      label: event.systemCaptures.photo.label ?? "Photo",
    });
  }
  if (event.systemCaptures.gif?.enabled) {
    options.push({
      type: "system",
      mode: "gif",
      label: event.systemCaptures.gif.label ?? "GIF",
    });
  }
  if (event.systemCaptures.video?.enabled) {
    options.push({
      type: "system",
      mode: "video",
      label: event.systemCaptures.video.label ?? "Video",
    });
  }

  // Add enabled company experiences
  for (const link of event.experiences) {
    if (link.enabled) {
      options.push({
        type: "company",
        experienceId: link.experienceId,
        label: link.label,  // Resolved from experience if null
      });
    }
  }

  return options;
}
```

### 7.2 Flow Execution

```
Guest arrives at event
    │
    ├── preEntryGate extra? → Run gate experience
    │
    ▼
How many experiences available?
    │
    ├── 0 → Show "No experiences" error
    ├── 1 → Go directly to that experience
    └── 2+ → Show experience picker

    ▼
Run selected experience
    │
    ├── System capture → Camera → Output
    ├── AI capture → Inputs? → Camera → Processing* → Output
    ├── Survey → Questions → Thank you
    └── Wheel → Spin → Result

    * During AI processing, if preReward extra exists, run it

    ▼
For media outputs:
    │
    ├── Apply frame overlay (if configured)
    ├── Show sharing options (from event.sharingConfig)
    └── Option to start over
```

---

## 8. Database Structure

### 8.1 Collections

```
/experiences/{experienceId}
├── Company AI experiences (experienceType: "ai_capture")
├── Company surveys (experienceType: "survey")
├── Company wheels (experienceType: "wheel")
└── Optional: System survey templates (isSystem: true)

/projects/{projectId}/events/{eventId}
├── Event config
├── systemCaptures: { photo, gif, video }
├── experiences: EventExperienceLink[]
├── frameOverlay
├── sharingConfig
└── extras
```

### 8.2 Example Documents

**AI Capture Experience:**
```json
{
  "id": "exp_abc123",
  "companyId": "comp_xyz",
  "isSystem": false,
  "experienceType": "ai_capture",
  "name": "Hobbitify Me",
  "description": "Transform into a hobbit character",
  "status": "active",

  "captureConfig": {
    "mode": "photo",
    "cameraFacing": "user",
    "countdown": 3
  },

  "aiConfig": {
    "model": "flux-schnell",
    "prompt": "Transform this person into a hobbit from Lord of the Rings. They are holding a {{pet}}. Background: {{background}}. Style: cinematic, detailed.",
    "outputType": "image",
    "outputAspectRatio": "3:4",
    "referenceImageUrls": []
  },

  "inputQuestions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "variableKey": "pet",
      "title": "What pet should you hold?",
      "options": [
        { "label": "Cat", "value": "a fluffy cat" },
        { "label": "Dog", "value": "a loyal dog" },
        { "label": "Chicken", "value": "a brown chicken" }
      ],
      "allowMultiple": false,
      "required": true
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "variableKey": "background",
      "title": "Choose your background",
      "options": [
        { "label": "Hobbit Hole", "value": "cozy hobbit hole interior" },
        { "label": "The Shire", "value": "rolling green hills of the Shire" },
        { "label": "Rivendell", "value": "elven architecture of Rivendell" }
      ],
      "allowMultiple": false,
      "required": true
    }
  ],

  "processingConfig": {
    "messages": [
      "Entering Middle-earth...",
      "Finding your hobbit self...",
      "Adding the finishing touches..."
    ],
    "estimatedDurationSec": 30
  },

  "intro": {
    "title": "Become a Hobbit!",
    "description": "We'll transform your photo into a character from the Shire",
    "ctaLabel": "Let's Go!"
  },

  "createdAt": 1702000000000,
  "updatedAt": 1702000000000
}
```

**Event with Approach B:**
```json
{
  "id": "evt_123",
  "projectId": "proj_456",
  "companyId": "comp_xyz",
  "name": "Holiday Party 2024",

  "systemCaptures": {
    "photo": { "enabled": true, "label": "Quick Photo" },
    "gif": { "enabled": true, "label": "Fun GIF" },
    "video": null
  },

  "experiences": [
    { "experienceId": "exp_abc123", "label": "Hobbitify Me", "enabled": true },
    { "experienceId": "exp_def456", "label": "Winter Wonderland", "enabled": true }
  ],

  "frameOverlay": {
    "url": "https://storage.../frames/holiday-2024.png",
    "type": "image"
  },

  "sharingConfig": {
    "allowDownload": true,
    "allowEmail": true,
    "socials": ["instagram", "facebook", "twitter"]
  },

  "extras": {
    "preEntryGate": null,
    "preReward": { "experienceId": "exp_survey_feedback", "enabled": true }
  },

  "theme": { /* ... */ },
  "createdAt": 1702000000000,
  "updatedAt": 1702000000000
}
```

---

## 9. Migration from Current Model

### 9.1 Schema Changes

| Current | New |
|---------|-----|
| `Experience.stepsOrder[]` | Removed - flow determined by `experienceType` |
| `Steps` subcollection | Removed - config embedded in experience |
| `Experience.status` | Unchanged |
| `Event.experiences[]` | Split into `systemCaptures` + `experiences[]` |

### 9.2 Migration Steps

1. **Add new fields** to Event schema (`systemCaptures`, `frameOverlay`, `sharingConfig`)
2. **Create new experience types** (`ai_capture`, `survey`, `wheel`)
3. **Migrate existing experiences** - Convert step-based to typed experiences
4. **Deprecate steps** - Keep for backwards compat, stop creating new
5. **Update Experience Engine** - Execute by type, not by steps

### 9.3 Backwards Compatibility

- Existing step-based experiences work as `experienceType: "legacy"`
- Legacy experiences use old step-by-step execution
- New experiences use type-based execution
- Gradual migration path

---

## 10. Open Questions

1. **System capture config expansion** - When to add settings like countdown, camera facing to system captures?

2. **Frame overlay aspect ratio matching** - How to handle mismatched aspect ratios between capture and overlay?

3. **Sharing config per experience** - Is event-level default sufficient, or need per-experience override?

4. **Survey as preReward** - Should preReward be limited to survey type, or allow any experience?

5. **Experience ordering** - In Approach B, how to order system captures relative to company experiences in picker?

---

## 11. Summary

### Key Decisions

| Decision | Choice |
|----------|--------|
| Simple captures | System-level, not per-company |
| Experience structure | Discriminated union by `experienceType` |
| Steps | Removed - config embedded in experience type |
| Frame overlay | Event-level, single overlay (future: by aspect ratio) |
| Sharing config | Event-level default |
| System experience storage | Approach B: separate `systemCaptures` map |

### Experience Types

| Type | Scope | Media Output | Reusable |
|------|-------|--------------|----------|
| `capture` | System | Yes | N/A (built-in) |
| `ai_capture` | Company | Yes | Yes |
| `survey` | Company | No | Yes |
| `wheel` | Company | No | Yes |

### Next Steps

1. Finalize choice between Approach A vs B
2. Define Zod schemas for all types
3. Plan migration from step-based model
4. Design Experience Engine execution by type
5. Build UI for new experience creation flow
