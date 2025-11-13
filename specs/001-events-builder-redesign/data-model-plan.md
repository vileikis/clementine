# Data Model: Events Builder Redesign

**Date**: 2025-11-13
**Branch**: `001-events-builder-redesign`
**Source**: Derived from `/specs/003-events-builder-redesign/events-data-model.md` with builder-specific requirements

## Overview

This document defines the data model for the events builder redesign. The model extends the existing `Event` type and introduces new Firestore subcollections for experiences, survey steps, and related entities. This phase focuses on the builder UI, so only entities needed for the Content, Distribute, and Results tabs are included.

## Core Entities

### 1. Event (Extended)

**Collection**: `/events/{eventId}`

**Purpose**: Root document for an event, extended with new fields for welcome, ending, survey, and experience management.

**TypeScript Interface**:
```typescript
type EventStatus = "draft" | "live" | "archived";

interface Event {
  // Existing fields (unchanged)
  id: string;
  title: string;
  brandColor: string;
  status: EventStatus;
  companyId: string | null;
  joinPath: string;
  qrPngPath: string;
  createdAt: number;
  updatedAt: number;

  // NEW: Welcome screen config
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeCtaLabel?: string;
  welcomeBackgroundImagePath?: string;
  welcomeBackgroundColorHex?: string;

  // NEW: Ending screen config
  endHeadline?: string;
  endBody?: string;
  endCtaLabel?: string;
  endCtaUrl?: string;

  // NEW: Share config (displayed on ending screen)
  shareAllowDownload: boolean;
  shareAllowSystemShare: boolean;
  shareAllowEmail: boolean;
  shareSocials: Array<"instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom">;

  // NEW: Survey config
  surveyEnabled: boolean;
  surveyRequired: boolean;
  surveyStepsCount: number;
  surveyStepsOrder: string[];
  surveyVersion: number;

  // NEW: Denormalized counters (no logic in this phase)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number;
  sharesCount: number;

  // DEPRECATED (to be removed in future phase)
  showTitleOverlay: boolean;
  currentSceneId: string;
}
```

**Validation Rules**:
- `title`: Required, 1-100 characters
- `brandColor`: Required, must match `/^#[0-9A-F]{6}$/i`
- `welcomeTitle`, `welcomeDescription`, `endHeadline`, `endBody`: Optional, max 500 characters each
- `welcomeCtaLabel`, `endCtaLabel`: Optional, max 50 characters each
- `endCtaUrl`: Optional, must be valid URL
- `surveyStepsOrder`: Must contain unique stepIds, match `surveyStepsCount`
- `shareSocials`: Array of valid social platform identifiers

**Relationships**:
- **Has many** experiences (`/events/{eventId}/experiences`)
- **Has many** survey steps (`/events/{eventId}/surveySteps`)
- **Belongs to** company (optional, via `companyId`)

**State Transitions**:
- `draft` → `live`: Event becomes accessible to guests
- `live` → `archived`: Event is no longer accessible
- `archived` → `live`: Event can be reactivated

### 2. Experience

**Collection**: `/events/{eventId}/experiences/{experienceId}`

**Purpose**: Represents a single interactive experience within an event (e.g., photo booth, video recording, spin-the-wheel).

**TypeScript Interface**:
```typescript
type ExperienceType = "photo" | "video" | "gif" | "wheel";

interface Experience {
  id: string;
  eventId: string;

  label: string;
  type: ExperienceType;
  enabled: boolean;

  // Preview for welcome picker (if multiple experiences exist)
  previewPath?: string;
  previewType?: "image" | "gif" | "video";

  // Capture options
  allowCamera?: boolean;
  allowLibrary?: boolean;

  // Video-specific
  maxDurationMs?: number;

  // GIF-specific
  frameCount?: number;
  captureIntervalMs?: number;

  // Overlays
  overlayFramePath?: string;
  overlayLogoPath?: string;

  // AI config
  aiEnabled: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiReferenceImagePaths?: string[];

  createdAt: number;
  updatedAt: number;
}
```

**Validation Rules**:
- `label`: Required, 1-50 characters
- `type`: Required, must be one of "photo" | "video" | "gif" | "wheel"
- `enabled`: Required, boolean
- `previewPath`: Optional, valid Storage path
- `maxDurationMs`: Optional, integer > 0, max 60000 (60 seconds)
- `frameCount`: Optional, integer between 2-20
- `captureIntervalMs`: Optional, integer > 0
- `aiPrompt`: Optional, max 600 characters
- `aiModel`: Optional, must be valid model identifier (e.g., "nanobanana", "sdxl")

**Relationships**:
- **Belongs to** event (via `eventId`)
- **Has many** experience items (`/events/{eventId}/experienceItems` where `experienceId` matches) - only for `type === "wheel"`

**State Transitions**:
- `enabled: false` → `enabled: true`: Experience becomes visible to guests
- `enabled: true` → `enabled: false`: Experience hidden but not deleted

### 3. ExperienceItem (Out of Scope for This Phase)

**Collection**: `/events/{eventId}/experienceItems/{itemId}`

**Purpose**: Represents individual items within an experience (e.g., wheel sectors, choices, rewards). Only used for `type === "wheel"` experiences.

**Note**: ExperienceItem is out of scope for this phase. Only photo experiences are being implemented; wheel experiences (which use ExperienceItems) are marked as "coming soon" in the builder UI. This collection will be implemented in a future phase when wheel experiences are added.

### 4. SurveyStep

**Collection**: `/events/{eventId}/surveySteps/{stepId}`

**Purpose**: Represents a single question or statement in an event survey.

**TypeScript Interface**:
```typescript
type SurveyStepType = "short_text" | "long_text" | "multiple_choice" | "opinion_scale" | "email" | "statement";

interface SurveyStep {
  id: string;
  eventId: string;

  type: SurveyStepType;
  title?: string;
  description?: string;
  placeholder?: string;

  // Multiple choice config
  options?: string[];
  allowMultiple?: boolean;

  // Opinion scale config
  scaleMin?: number;
  scaleMax?: number;

  // Validation
  required?: boolean;

  createdAt: number;
  updatedAt: number;
}
```

**Validation Rules**:
- `type`: Required, must be one of the defined SurveyStepType values
- `title`: Optional, max 200 characters
- `description`: Optional, max 500 characters
- `placeholder`: Optional, max 100 characters
- `options`: Required if `type === "multiple_choice"`, array with at least 1 item, each item max 100 characters
- `scaleMin`, `scaleMax`: Required if `type === "opinion_scale"`, integers where `scaleMin < scaleMax`
- `required`: Optional, boolean, default false

**Relationships**:
- **Belongs to** event (via `eventId`)
- **Order determined by** `event.surveyStepsOrder` array

**State Transitions**:
- No state transitions (static configuration)
- Order changes via updating `event.surveyStepsOrder`

### 5. Session (Extended, Out of Scope for This Phase)

**Collection**: `/events/{eventId}/sessions/{sessionId}`

**Purpose**: Represents a guest interaction with an event. Extended in the data model but not modified in this phase.

**TypeScript Interface** (for reference only):
```typescript
type SessionState = "created" | "processing" | "ready" | "error";
type InputType = "photo" | "video" | "gif";
type OutputMediaType = "image" | "video" | "gif";

interface Session {
  id: string;
  eventId: string;
  experienceId: string;
  userId?: string | null;

  state: SessionState;
  errorCode?: string;

  inputType: InputType;
  inputImagePaths?: string[];
  inputVideoPath?: string;

  outputMediaType?: OutputMediaType;
  outputMediaPath?: string;
  outputThumbnailPath?: string;

  experienceItemId?: string | null;
  experienceItemLabel?: string | null;

  surveyCompleted: boolean;
  surveySkipped: boolean;

  shareDownloadCount: number;
  shareEmailCount: number;
  shareSocialCount: number;
  shareSystemCount: number;
  lastSharedAt?: number;

  createdAt: number;
  updatedAt: number;
}
```

**Note**: Session entity is extended in the data model but NOT modified in this phase. Guest experience (session creation, capture, transformation) is out of scope.

### 6. Share (Out of Scope for This Phase)

**Collection**: `/events/{eventId}/shares/{shareId}`

**Purpose**: Represents a guest sharing action. Not used in builder UI.

**Note**: Defined in data model but not used in this phase. Results tab shows placeholder data only.

### 7. SurveyResponse (Out of Scope for This Phase)

**Collection**: `/events/{eventId}/surveyResponses/{responseId}`

**Purpose**: Represents a guest's answer to a survey step. Not used in builder UI.

**Note**: Defined in data model but not used in this phase. Results tab shows placeholder data only.

### 8. Participant (Out of Scope for This Phase)

**Collection**: `/events/{eventId}/participants/{participantId}`

**Purpose**: Tracks authenticated users' interactions with an event. Not used in builder UI.

**Note**: Defined in data model but not used in this phase.

## Firestore Security Rules (Scope: Builder Read Access)

This phase requires read access to events and subcollections for the builder UI. Write operations use Server Actions (Firebase Admin SDK).

```javascript
// Rules for /events/{eventId}
match /events/{eventId} {
  allow read: if request.auth != null;
  allow write: if false; // All writes via Server Actions

  // Subcollections: experiences
  match /experiences/{experienceId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  // Subcollections: experienceItems
  match /experienceItems/{itemId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  // Subcollections: surveySteps
  match /surveySteps/{stepId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  // Other subcollections (sessions, shares, surveyResponses, participants)
  // Not accessed by builder UI, but include for completeness
  match /sessions/{sessionId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  match /shares/{shareId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  match /surveyResponses/{responseId} {
    allow read: if request.auth != null;
    allow write: if false;
  }

  match /participants/{participantId} {
    allow read: if request.auth != null;
    allow write: if false;
  }
}
```

## Data Migration & Backward Compatibility

**No migration required**. The redesigned builder reads from new subcollections (experiences, surveySteps) and new Event fields. Existing events with scenes (`currentSceneId`, `showTitleOverlay`) continue to work with the old builder until manually migrated or deprecated.

**Deprecation path**:
1. Deploy new builder with new data model
2. Allow creators to experiment with new builder on new events
3. Provide manual migration tool (future phase) to convert scenes to experiences
4. Deprecate old builder pages (`/events/{id}/branding`, `/events/{id}/scene`)
5. Remove deprecated fields (`currentSceneId`, `showTitleOverlay`) in future schema version

## Summary of Changes to Existing Types

### Event Type Extensions

**Added fields**:
- `welcomeTitle`, `welcomeDescription`, `welcomeCtaLabel`, `welcomeBackgroundImagePath`, `welcomeBackgroundColorHex`
- `endHeadline`, `endBody`, `endCtaLabel`, `endCtaUrl`
- `shareAllowDownload`, `shareAllowSystemShare`, `shareAllowEmail`, `shareSocials`
- `surveyEnabled`, `surveyRequired`, `surveyStepsCount`, `surveyStepsOrder`, `surveyVersion`
- `experiencesCount`, `sessionsCount`, `readyCount`, `sharesCount`

**Deprecated fields** (to be removed in future phase):
- `showTitleOverlay`
- `currentSceneId`

### Scene Type (Unchanged, Coexists with Experience)

The existing `Scene` type remains unchanged. Scenes are a legacy concept that coexist with Experiences during the transition period.

## Next Steps

1. Implement TypeScript interfaces in `web/src/lib/types/firestore.ts`
2. Implement Zod schemas in `web/src/lib/schemas/firestore.ts`
3. Update Firestore security rules (if not already permissive for authenticated users)
4. Proceed to contracts generation (Server Actions signatures)
