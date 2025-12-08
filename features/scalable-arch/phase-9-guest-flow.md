# Phase 9: Guest Flow

> **Status**: Draft
> **Priority**: Critical (Required for December pilots)
> **Dependencies**: Phase 8 (Camera Module) - Complete, Phase 7 (Experience Engine) - Complete

## Overview

Implement the complete guest-facing flow that allows users to access photobooth experiences via share links, run AI transformations, and receive their results. This phase integrates the Camera Module and Experience Engine into a production-ready guest experience.

## Problem / Opportunity

- Guests currently have no working way to access the new Experience Engine-powered flows
- Share links need to resolve projects → events → experiences in the new data model
- Sessions need proper persistence under projects for analytics and auditing
- AI transformations need background processing with real-time status updates
- December pilots require a stable, tested guest flow

## Goals (In Scope)

1. **Share Link Resolution** - `/join/[projectId]` resolves to active event and experiences
2. **Session Persistence** - Sessions stored under `/projects/{projectId}/sessions/{sessionId}`
3. **Welcome Screen** - Display event branding with experience selection
4. **Experience Execution** - Run selected experience via Experience Engine
5. **Camera Integration** - Use Camera Module for capture step
6. **AI Transform Processing** - Background job with `waitUntil` and real-time status
7. **Result Display** - Show transformed image with share/download options
8. **Error Handling** - Graceful empty states for all failure scenarios

## Non-Goals (Out of Scope)

- Admin preview integration (separate phase)
- Event extras orchestration (pre-gate, pre-reward) - deferred
- Video/GIF capture or output
- Analytics dashboard
- Multi-language support
- Social media deep linking

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Share link to welcome screen | < 2 seconds |
| Experience selection to camera | < 500ms |
| Photo capture to submit | < 3 seconds |
| AI transform completion | < 60 seconds |
| Transform status latency | < 1 second |
| Error recovery rate | 100% (retry always available) |

---

## User Stories

### US1: Access Experience via Share Link (P1)

**As a** guest with a share link, **I want to** access the photobooth experience, **so that** I can participate in the event.

**Acceptance Criteria:**

1. **Given** a valid project share link (`/join/[projectId]`), **When** I navigate to it, **Then** I see the welcome screen with event branding and experience list.

2. **Given** a project that does not exist, **When** I navigate to its share link, **Then** I see a "404 Not Found" error page.

3. **Given** a project with no active event, **When** I navigate to its share link, **Then** I see "Event has not been launched yet" message.

4. **Given** an event with no enabled experiences, **When** I navigate to its share link, **Then** I see "Event is empty" message.

---

### US2: Select and Start Experience (P1)

**As a** guest on the welcome screen, **I want to** select an experience, **so that** I can start the photobooth flow.

**Acceptance Criteria:**

1. **Given** I am on the welcome screen, **When** I view the page, **Then** I see a header with event branding and a list of available experiences.

2. **Given** multiple enabled experiences, **When** I tap an experience card, **Then** a new session is created and the Experience Engine launches.

3. **Given** only one enabled experience, **When** I load the welcome screen, **Then** the single experience is displayed (no auto-start - user must tap).

4. **Given** I start an experience, **When** the URL updates, **Then** it includes `?sessionId={id}&experienceId={id}` query parameters.

---

### US3: Capture Photo (P1)

**As a** guest in the capture step, **I want to** take or upload a photo, **so that** I can proceed to AI transformation.

**Acceptance Criteria:**

1. **Given** I reach the capture step, **When** the camera loads, **Then** I see the Camera Module permission prompt.

2. **Given** I grant camera permission, **When** the viewfinder appears, **Then** I can take a photo using the capture button.

3. **Given** I capture a photo, **When** I review it, **Then** I see "Retake" and "Submit" buttons.

4. **Given** I tap "Retake", **When** the camera restarts, **Then** I can capture a new photo without re-requesting permission.

5. **Given** I tap "Submit", **When** the photo is saved, **Then** it is uploaded to session input and the flow proceeds to the next step.

---

### US4: AI Transform Processing (P1)

**As a** guest, **When** my photo reaches the AI transform step, **I want to** see progress updates, **so that** I know the transformation is working.

**Acceptance Criteria:**

1. **Given** I reach the AI transform step, **When** the step loads, **Then** a background job is triggered via `waitUntil`.

2. **Given** the transform is processing, **When** I view the screen, **Then** I see a loading skeleton and rotating status messages.

3. **Given** the transform completes, **When** the result URL is saved to session, **Then** the `transformStatus` updates to "complete".

4. **Given** the transform fails, **When** the error is recorded, **Then** I see an error message with a "Retry" button.

5. **Given** the transform succeeds, **When** the output URL is available, **Then** the flow auto-advances to the reward step.

---

### US5: View Result and Share (P1)

**As a** guest who completed the AI transformation, **I want to** view and share my result, **so that** I can save and distribute my transformed photo.

**Acceptance Criteria:**

1. **Given** the transform is not yet complete, **When** I view the reward step, **Then** I see a loading skeleton (no share buttons).

2. **Given** the transform is complete, **When** I view the reward step, **Then** I see my transformed image.

3. **Given** I see my result, **When** I look for share options, **Then** I see "Copy Link", "Download", and "Share" buttons.

4. **Given** I tap "Download", **When** the action completes, **Then** the image is downloaded to my device.

5. **Given** I tap "Copy Link", **When** the action completes, **Then** the result URL is copied to clipboard with a success toast.

6. **Given** I tap "Share", **When** the device supports Web Share API, **Then** the native share sheet opens with the image.

---

### US6: Exit Experience (P2)

**As a** guest in the middle of an experience, **I want to** exit and return to the welcome screen, **so that** I can start over or choose a different experience.

**Acceptance Criteria:**

1. **Given** I am in the Experience Engine, **When** I look at the UI, **Then** I see an "X" close button in the top-left corner.

2. **Given** I tap the close button, **When** the confirmation dialog appears, **Then** I see "Exit experience?" with Cancel and Exit options.

3. **Given** I confirm exit, **When** the dialog closes, **Then** I return to the welcome screen (URL query params removed).

4. **Given** I cancel exit, **When** the dialog closes, **Then** I remain in the current step of the experience.

---

## Data Model

### Session Storage Path

Sessions are stored as a subcollection under projects:

```
/projects/{projectId}/sessions/{sessionId}
```

### GuestSession Schema

Extended from `EngineSession` with guest-specific fields:

```ts
interface GuestSession {
  // Base fields from EngineSession
  id: string;
  experienceId: string;
  currentStepIndex: number;
  data: SessionData;
  transformStatus: TransformationStatus;
  createdAt: number;
  updatedAt: number;

  // Guest-specific context
  projectId: string;
  eventId: string;
  companyId: string;

  // Input/Output URLs
  inputUrl?: string;      // Captured photo URL (Firebase Storage)
  outputUrl?: string;     // Transformed result URL (Firebase Storage)
}
```

### TransformationStatus (from sessions module)

```ts
interface TransformationStatus {
  status: "idle" | "pending" | "processing" | "complete" | "error";
  resultUrl?: string;
  errorMessage?: string;
  jobId?: string;
  updatedAt?: number;
}
```

---

## Technical Architecture

### Route Structure

```
web/src/app/(guest)/join/
├── [projectId]/
│   ├── page.tsx              # Welcome screen (RSC)
│   └── loading.tsx           # Loading skeleton
└── layout.tsx                # Guest layout (minimal chrome)
```

### Module Structure

```
web/src/features/guest/
├── index.ts                  # Public exports
├── types/
│   └── guest.types.ts        # GuestSession, GuestFlowState
├── components/
│   ├── WelcomeScreen.tsx     # Event header + experience list
│   ├── ExperienceCard.tsx    # Selectable experience card
│   ├── ExperienceRunner.tsx  # Mounts ExperienceEngine
│   ├── ExitConfirmDialog.tsx # Exit confirmation modal
│   ├── EmptyStates/
│   │   ├── ProjectNotFound.tsx
│   │   ├── EventNotLaunched.tsx
│   │   └── EventEmpty.tsx
│   └── steps/                # Guest-specific step wrappers
│       ├── GuestCaptureStep.tsx   # Wraps CameraCapture
│       ├── GuestAiTransformStep.tsx
│       └── GuestRewardStep.tsx
├── hooks/
│   ├── useGuestFlow.ts       # Main flow orchestrator
│   ├── useSessionSync.ts     # Firestore real-time sync
│   └── useTransformJob.ts    # Background job + polling
├── actions/
│   ├── resolve-project.ts    # Server action: project → event → experiences
│   ├── create-session.ts     # Server action: create session doc
│   ├── update-session.ts     # Server action: update session data
│   └── trigger-transform.ts  # Server action: start AI job with waitUntil
└── lib/
    └── session-storage.ts    # Firestore session CRUD
```

### Data Flow

```
1. Guest navigates to /join/{projectId}
   │
   ├─ Server Component: resolveProject(projectId)
   │  ├─ Load Project document
   │  ├─ Check activeEventId exists
   │  ├─ Load Event document
   │  ├─ Filter enabled experiences
   │  └─ Return: { project, event, experiences } or error state
   │
2. Welcome Screen renders
   │
   ├─ Display event.theme branding (logo, colors)
   ├─ List experiences[] as cards
   │
3. Guest taps experience card
   │
   ├─ createSession(projectId, eventId, experienceId)
   │  └─ Creates /projects/{projectId}/sessions/{sessionId}
   │
   ├─ Update URL with ?sessionId={id}&experienceId={id}
   │
   ├─ Mount ExperienceRunner
   │  ├─ Load experience steps
   │  └─ Initialize ExperienceEngine with:
   │     - name: "guest-flow"
   │     - persistSession: true
   │     - allowSkip: false
   │     - allowBack: false
   │
4. CaptureStep reached
   │
   ├─ Render CameraCapture from Camera Module
   ├─ On submit: Upload photo to Firebase Storage
   ├─ Save URL to session.inputUrl and session.data.{stepId}
   │
5. AiTransformStep reached
   │
   ├─ triggerTransform(sessionId, experienceId, stepConfig, inputUrl)
   │  ├─ Update session.transformStatus = "pending"
   │  ├─ Call AI service via waitUntil (background)
   │  └─ On complete: Update session.transformStatus, outputUrl
   │
   ├─ Subscribe to session.transformStatus via Firestore
   │  └─ On "complete": Auto-advance to next step
   │
6. RewardStep reached
   │
   ├─ If transformStatus !== "complete": Show skeleton
   ├─ If transformStatus === "complete": Show image + share buttons
   │
7. Guest exits or completes
   │
   └─ Session preserved for analytics
```

---

## Component Specifications

### WelcomeScreen

**Purpose:** Display event branding and experience selection

**Props:**
```ts
interface WelcomeScreenProps {
  event: Event;
  experiences: Experience[];
  onSelectExperience: (experienceId: string) => void;
}
```

**Layout:**
```
┌────────────────────────────────────────┐
│              [Event Logo]              │
│                                        │
│          Welcome to {Event}            │
│                                        │
│   ┌────────────────────────────────┐   │
│   │     Experience 1               │   │
│   │     Description...             │   │
│   └────────────────────────────────┘   │
│                                        │
│   ┌────────────────────────────────┐   │
│   │     Experience 2               │   │
│   │     Description...             │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

### ExperienceRunner

**Purpose:** Wrapper that mounts ExperienceEngine with guest configuration

**Props:**
```ts
interface ExperienceRunnerProps {
  sessionId: string;
  experienceId: string;
  projectId: string;
  eventId: string;
  experience: Experience;
  steps: Step[];
  theme: EventTheme;
  onExit: () => void;
  onComplete: () => void;
}
```

**Engine Configuration:**
```ts
{
  name: "guest-flow",
  experienceId: experienceId,
  steps: steps,
  stepOrder: experience.stepOrder,
  persistSession: true,
  allowSkip: false,
  allowBack: false,
  debugMode: false,
  theme: theme,
  projectId: projectId,
  eventId: eventId,
  existingSessionId: sessionId,
}
```

### GuestCaptureStep

**Purpose:** Thin wrapper connecting Camera Module to Experience Engine

**Implementation:**
```tsx
function GuestCaptureStep({ step, onStepComplete, sessionId }) {
  const handleSubmit = async (photo: CapturedPhoto) => {
    // 1. Upload to Firebase Storage
    const url = await uploadPhoto(photo.file, sessionId);

    // 2. Save to session data
    await updateSessionInput(sessionId, step.id, { type: "photo", url });

    // 3. Advance to next step
    onStepComplete();
  };

  return (
    <CameraCapture
      enableCamera={step.config.enableCamera ?? true}
      enableLibrary={step.config.enableLibrary ?? true}
      cameraFacing={step.config.cameraFacing ?? "user"}
      onSubmit={handleSubmit}
    />
  );
}
```

### GuestAiTransformStep

**Purpose:** Trigger and monitor AI transformation

**States:**
- `pending` - Show "Starting transformation..." with spinner
- `processing` - Show skeleton + rotating messages
- `complete` - Auto-advance (handled by engine)
- `error` - Show error message + "Retry" button

### GuestRewardStep

**Purpose:** Display result with share options

**Layout:**
```
┌────────────────────────────────────────┐
│  [X]                                   │
│                                        │
│         ┌──────────────────┐           │
│         │                  │           │
│         │   [Result Image] │           │
│         │                  │           │
│         └──────────────────┘           │
│                                        │
│   [Copy Link]  [Download]  [Share]     │
│                                        │
└────────────────────────────────────────┘
```

**Loading State:**
```
┌────────────────────────────────────────┐
│  [X]                                   │
│                                        │
│         ┌──────────────────┐           │
│         │ ░░░░░░░░░░░░░░░░ │           │
│         │ ░░░ Loading... ░░│           │
│         │ ░░░░░░░░░░░░░░░░ │           │
│         └──────────────────┘           │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

---

## Server Actions

### resolveProject

```ts
"use server";

interface ResolveProjectResult {
  status: "success" | "not_found" | "no_event" | "no_experiences";
  project?: Project;
  event?: Event;
  experiences?: Experience[];
}

async function resolveProject(projectId: string): Promise<ResolveProjectResult> {
  // 1. Load project
  const project = await getProject(projectId);
  if (!project || project.status === "deleted") {
    return { status: "not_found" };
  }

  // 2. Check active event
  if (!project.activeEventId) {
    return { status: "no_event", project };
  }

  // 3. Load event
  const event = await getEvent(projectId, project.activeEventId);
  if (!event) {
    return { status: "no_event", project };
  }

  // 4. Filter enabled experiences
  const enabledLinks = event.experiences.filter(e => e.enabled);
  if (enabledLinks.length === 0) {
    return { status: "no_experiences", project, event };
  }

  // 5. Load experience documents
  const experiences = await Promise.all(
    enabledLinks.map(link => getExperience(link.experienceId))
  );

  return {
    status: "success",
    project,
    event,
    experiences: experiences.filter(Boolean),
  };
}
```

### createSession

```ts
"use server";

async function createSession(
  projectId: string,
  eventId: string,
  experienceId: string,
  companyId: string
): Promise<{ sessionId: string }> {
  const sessionId = generateId();
  const now = Date.now();

  const session: GuestSession = {
    id: sessionId,
    projectId,
    eventId,
    experienceId,
    companyId,
    currentStepIndex: 0,
    data: {},
    transformStatus: { status: "idle", updatedAt: now },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(
    doc(db, "projects", projectId, "sessions", sessionId),
    session
  );

  return { sessionId };
}
```

### triggerTransform

```ts
"use server";

import { waitUntil } from "@vercel/functions";

async function triggerTransform(
  projectId: string,
  sessionId: string,
  stepConfig: AiTransformStepConfig,
  inputUrl: string
): Promise<void> {
  const sessionRef = doc(db, "projects", projectId, "sessions", sessionId);

  // 1. Update status to pending
  await updateDoc(sessionRef, {
    "transformStatus.status": "pending",
    "transformStatus.updatedAt": Date.now(),
    updatedAt: Date.now(),
  });

  // 2. Launch background job
  waitUntil(
    executeAiTransform(projectId, sessionId, stepConfig, inputUrl)
  );
}

async function executeAiTransform(
  projectId: string,
  sessionId: string,
  stepConfig: AiTransformStepConfig,
  inputUrl: string
): Promise<void> {
  const sessionRef = doc(db, "projects", projectId, "sessions", sessionId);

  try {
    // Update to processing
    await updateDoc(sessionRef, {
      "transformStatus.status": "processing",
      "transformStatus.updatedAt": Date.now(),
    });

    // Call AI service
    const result = await aiClient.transform({
      inputUrl,
      model: stepConfig.model,
      prompt: stepConfig.prompt,
      negativePrompt: stepConfig.negativePrompt,
      aspectRatio: stepConfig.aspectRatio,
    });

    // Update to complete
    await updateDoc(sessionRef, {
      "transformStatus.status": "complete",
      "transformStatus.resultUrl": result.outputUrl,
      "transformStatus.updatedAt": Date.now(),
      outputUrl: result.outputUrl,
      updatedAt: Date.now(),
    });
  } catch (error) {
    // Update to error
    await updateDoc(sessionRef, {
      "transformStatus.status": "error",
      "transformStatus.errorMessage": error.message,
      "transformStatus.updatedAt": Date.now(),
      updatedAt: Date.now(),
    });
  }
}
```

---

## Empty States

### ProjectNotFound

**Trigger:** Project document doesn't exist or status is "deleted"

**Display:**
```
┌────────────────────────────────────────┐
│                                        │
│              🔍                        │
│                                        │
│       Page Not Found                   │
│                                        │
│   The experience you're looking        │
│   for doesn't exist.                   │
│                                        │
└────────────────────────────────────────┘
```

### EventNotLaunched

**Trigger:** Project exists but `activeEventId` is null or event doesn't exist

**Display:**
```
┌────────────────────────────────────────┐
│                                        │
│              ⏳                        │
│                                        │
│   Event Has Not Been Launched Yet      │
│                                        │
│   Check back soon or contact the       │
│   event organizer for details.         │
│                                        │
└────────────────────────────────────────┘
```

### EventEmpty

**Trigger:** Event exists but has no enabled experiences

**Display:**
```
┌────────────────────────────────────────┐
│                                        │
│              📭                        │
│                                        │
│       Event Is Empty                   │
│                                        │
│   No experiences are available         │
│   at this time.                        │
│                                        │
└────────────────────────────────────────┘
```

---

## Integration Points

### Camera Module (Phase 8)

The guest flow consumes the Camera Module via:

```tsx
import { CameraCapture } from "@/features/camera";

// In GuestCaptureStep
<CameraCapture
  enableCamera={true}
  enableLibrary={true}
  cameraFacing="user"
  aspectRatio="3:4"
  onSubmit={handlePhotoSubmit}
  onError={handleCameraError}
/>
```

### Experience Engine (Phase 7)

The guest flow mounts the Experience Engine via:

```tsx
import { ExperienceEngine } from "@/features/experience-engine";

// In ExperienceRunner
<ExperienceEngine
  name="guest-flow"
  experienceId={experienceId}
  steps={steps}
  stepOrder={stepOrder}
  persistSession={true}
  allowSkip={false}
  allowBack={false}
  theme={theme}
  projectId={projectId}
  eventId={eventId}
  existingSessionId={sessionId}
  onComplete={handleComplete}
  onError={handleError}
/>
```

### Sessions Module

Uses the existing sessions module types and extends for guest-specific needs:

```ts
import type {
  EngineSession,
  TransformationStatus
} from "@/features/sessions";
```

---

## URL Structure

### Share Link
```
/join/{projectId}
```

### During Experience
```
/join/{projectId}?sessionId={sessionId}&experienceId={experienceId}
```

### Query Parameters
- `sessionId` - Active session ID (required after starting experience)
- `experienceId` - Current experience ID (required after starting experience)

---

## Migration & Cleanup

### Files to Delete (Old Guest Components)

After Phase 9 completion, remove legacy guest components:

```
web/src/features/guest/components/
├── GuestCaptureStep.tsx       # Replaced by Camera Module integration
├── GuestProcessingStep.tsx    # Replaced by GuestAiTransformStep
├── GuestRewardStep.tsx        # Replaced by new GuestRewardStep
├── JourneyStepRenderer.tsx    # Replaced by Experience Engine
├── JourneyErrorBoundary.tsx   # Replaced by new error handling
├── CameraPermissionDenied.tsx # Handled by Camera Module
├── CameraView.tsx             # Replaced by Camera Module
├── CaptureButton.tsx          # Replaced by Camera Module
├── Countdown.tsx              # Replaced by Camera Module
├── RetakeButton.tsx           # Replaced by Camera Module
```

### Files to Keep

```
web/src/features/guest/components/
├── BrandThemeProvider.tsx     # Reuse for theme application
├── EventUnavailableScreen.tsx # Adapt for empty states
├── GreetingScreen.tsx         # Adapt for WelcomeScreen
├── ResultViewer.tsx           # Adapt for GuestRewardStep
├── ErrorBanner.tsx            # Reuse for error display
```

### Hooks to Delete

```
web/src/features/guest/hooks/
├── useGuestFlow.ts            # Replaced by new implementation
├── useCamera.ts               # Replaced by Camera Module hooks
```

---

## Acceptance Criteria

### Functional

- [ ] `/join/{projectId}` resolves to welcome screen
- [ ] 404 page shown for non-existent projects
- [ ] "Event not launched" shown for projects without active event
- [ ] "Event empty" shown for events without enabled experiences
- [ ] Experience list displays correctly with event branding
- [ ] Tapping experience creates session and launches engine
- [ ] URL updates with sessionId and experienceId
- [ ] Capture step uses Camera Module
- [ ] Photo uploads to Firebase Storage
- [ ] AI transform triggers via waitUntil
- [ ] Transform status syncs in real-time
- [ ] Reward step shows skeleton while loading
- [ ] Reward step shows result when complete
- [ ] Download, Copy Link, Share buttons work
- [ ] Exit confirmation dialog works
- [ ] Exit returns to welcome screen

### Session Persistence

- [ ] Sessions created at `/projects/{projectId}/sessions/{sessionId}`
- [ ] Session data persists across step navigation
- [ ] inputUrl saved after photo capture
- [ ] transformStatus updates correctly through states
- [ ] outputUrl saved after transform completion

### Performance

- [ ] Share link to welcome: < 2 seconds
- [ ] Experience selection to camera: < 500ms
- [ ] Transform status updates: < 1 second latency
- [ ] No page reloads during experience

### Mobile

- [ ] Full-screen experience on mobile viewports
- [ ] Touch targets meet minimum size (44x44px)
- [ ] Camera viewfinder fills screen
- [ ] Share buttons accessible at bottom

---

## Future Considerations

### Event Extras (Post Phase 9)

When Event Extras are implemented, the guest flow orchestrator will:

```ts
async function runGuestFlow(event: Event, session: GuestSession) {
  // 1. Check pre-entry gate
  if (event.extras.preEntryGate?.enabled) {
    await runExperience(event.extras.preEntryGate.experienceId);
  }

  // 2. Show experience picker
  const selectedExperience = await showExperiencePicker(event.experiences);

  // 3. Run main experience
  await runExperience(selectedExperience.experienceId);

  // 4. Check pre-reward
  if (event.extras.preReward?.enabled) {
    await runExperience(event.extras.preReward.experienceId);
  }

  // 5. Show final reward
  await showReward();
}
```

### Analytics (Future Phase)

Session data enables:
- Completion rates per experience
- Drop-off points by step
- Transform success/failure rates
- Average time per step
- Device/browser distribution

### Session Resume (Future)

If a guest returns to the same link with an existing session:
- Detect existing session via localStorage or URL
- Offer to resume or start fresh
- Resume picks up at last completed step

---

## Related Documentation

- `phase-7-experience-engine.md` - Engine architecture
- `phase-8-camera-module.md` - Camera Module PRD
- `specs/022-camera-module/` - Camera Module implementation
- `phase-6-event-experiences.md` - Event extras (future integration)
- `new-data-model-v5.md` - Data model reference
- `web/src/features/sessions/` - Session types and schemas
