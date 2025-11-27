# **📄 PRD #3 — Guest Experience Runtime Engine**

_(Live Step-by-Step Runtime for Guests)_

### **Product Area**

Guest Experience → `/guest` feature module → Journey Runtime Engine

### **Status**

Draft v2

---

# **1. Purpose**

This PRD defines the **live runtime engine** used by guests when they open a Clementine experience via join link or embed.

It builds on:

- **Unified step renderer** (PRD #1) — implemented in `web/src/features/steps/components/preview/`
- **Playback engine architecture** (PRD #2) — `PreviewRuntime` with "playback" mode
- **Existing `/guest` feature module** — `web/src/features/guest/` with `useGuestFlow` hook
- **Join endpoint** — `web/src/app/(public)/join/[eventId]/`

The Guest Runtime Engine must execute the **real guest flow**, including:

1. Real-time user input
2. Real media capture
3. Real AI processing via `web/src/lib/ai/` (provider-agnostic: Google AI, n8n, mock)
4. Persisted session state (extending existing `sessions` feature)
5. Theme application
6. (Optional) analytics tracking
7. Error handling, retries, and safe fallback UI

This is the **production runtime** of Clementine.

---

# **2. Summary of Change**

We introduce a complete **Guest Runtime Engine** that:

### ✔ Renders the guest journey step-by-step

Using the same step renderers as the preview engine.

### ✔ Handles real synchronous + asynchronous actions

- Camera → real image/video capture (leveraging existing `useCamera` hook and `CameraView` component)
- Processing → real AI pipeline via `web/src/lib/ai/` (supports Google AI, n8n webhook, mock)
- Skip or fail gracefully

### ✔ Persists guest session data

In Firebase / Firestore / temporary store.

### ✔ (Optional) Analytics tracking

Only if the event has analytics enabled:

- Step started
- Step completed
- Capture count
- Share/download events

### ✔ Uses the existing `/guest` module as the foundation

New runtime functionality extends what’s already there.

---

# **3. Goals**

### **Functional**

- Load a journey from join link
- Render steps in correct order
- Capture real input (photo, video, text, email)
- Trigger real AI workflow
- Provide reliable error handling and fallback UI
- Allow guests to complete journey end-to-end
- Save results (if configured)

### **Technical**

- Reuse preview renderer and shared components
- Implement a **live runtime controller**
- Store session state reliably
- Use the same responsive layout: mobile-first, desktop optional
- Omit analytics entirely if disabled

---

# **4. Scope**

### **In Scope**

- Guest journey runtime controller
- Rendering all step types:

  - Info
  - Experience Picker
  - Capture (real)
  - Short Text
  - Long Text
  - Multiple Choice
  - Yes/No
  - Opinion Scale
  - Email (with validation)
  - Processing (real AI calls)
  - Reward (real result)

- Session state management (extending `web/src/features/sessions/`)
- Theme rendering (via `EventThemeProvider`)
- AI workflow integration via `web/src/lib/ai/` (configurable provider)
- Error handling (soft + hard failures)
- Optional analytics with configurable toggles

### **Out of Scope**

- Editor
- Preview mode
- Playback mode
- Email delivery infrastructure
- Gallery backend (handled separately)
- Admin view of results

---

# **5. Detailed Requirements**

---

## **5.1 Guest Journey Initialization**

### When guest opens join link or embed:

1. Load event
2. Load journey definition
3. Load theme
4. Create **guest session ID**
5. Initialize runtime controller
6. Render the **first step**

If anything fails → show “experience unavailable” fallback.

---

## **5.2 Guest Runtime Controller**

Extends the existing `useGuestFlow` hook in `web/src/features/guest/hooks/useGuestFlow.ts`.

### Current State Machine (to be extended):

```
greeting → camera_permission_error
         → ready_to_capture → countdown → captured → uploading → transforming → review_ready → share
                                                                              → error
```

### New Responsibilities:

- Track `currentStepIndex` (extend existing state)
- Transition to next/previous steps (integrate with Journey's `stepOrder`)
- Persist session data (via extended session schema)
- Execute step-specific logic:

  - Capture: use existing `useCamera` hook + `CameraView` component
  - Processing: call AI via `web/src/lib/ai/client.ts` (provider-agnostic)
  - Reward: save generated result

- Handle errors & timeouts
- Optionally send analytics events

### Required functions:

```
start()
next()
previous()
retry()
abort()
saveSession()
flushAnalytics()   // only if enabled
```

---

## **5.3 Step-by-Step Behavior**

### **Info Step**

- Static UI
- Continue on CTA click

### **Experience Picker**

- Save selected experience (if multiple)
- Continue

### **Capture Step**

- **Real camera** (photo or video)
- GIF mode: rapid multi-capture
- Constraints from experience config (min/max duration, count)
- "Retake" button if allowed

### **Short / Long Text**

- Store text input
- Validate length, required state

### **Multiple Choice**

- Save selected option

### **Yes/No**

- Save boolean

### **Opinion Scale**

- Save number

### **Email Step**

- Save email
- Validate format
- Optional "Send me results by email"

### **Processing Step**

- Show processing screen with rotating messages
- Execute real AI workflow via `web/src/lib/ai/` (configurable provider)
- Handle AI errors:

  - Retry automatically (configurable)
  - Show fallback UI if failed

### **Reward Step**

- Show AI-generated media
- Download button
- Share button
- Save result for analytics (optional)

---

## **5.4 Session State Requirements**

**Already implemented in `web/src/features/sessions/`**

### Session Schema (`types/sessions.types.ts`):

```typescript
type SessionState = "created" | "captured" | "transforming" | "ready" | "error";

interface SessionData {
  selected_experience_id?: string;
  [key: string]: unknown;
}

interface Session {
  id: string;
  eventId: string;
  state: SessionState;

  // Capture/transform fields
  inputImagePath?: string;
  resultImagePath?: string;
  error?: string;

  // Journey support (already added)
  journeyId?: string;
  currentStepIndex?: number;
  data?: SessionData;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

### Repository Functions (`repositories/sessions.repository.ts`):

**Existing (preserved):**
- `startSession(eventId)` — Create basic session
- `saveCapture(eventId, sessionId, inputImagePath)` — Save captured image
- `updateSessionState(eventId, sessionId, state, additionalData?)` — Update state
- `getSession(eventId, sessionId)` — Fetch session

**New (already implemented):**
- `startJourneySession(eventId, journeyId)` — Create session with journey context
- `updateStepIndex(eventId, sessionId, stepIndex)` — Track step progress
- `saveStepData(eventId, sessionId, key, value)` — Save individual step input

### Data Storage Examples:

```typescript
data: {
  selected_experience_id: "exp_123", // from experience-picker step
  guest_name: "Alex",                // from short_text step
  guest_email: "alex@test.com",      // from email step
  selected_option: "option_1",       // from multiple_choice step
  rating: 8,                         // from opinion_scale step
  consent: true,                     // from yes_no step
}
```

### Persistence Strategy:

- **Firestore writes** via repository functions:
  - `startJourneySession()` on journey start
  - `saveStepData()` on each step completion
  - `updateStepIndex()` on step navigation
  - `saveCapture()` after capture step
  - `updateSessionState()` after processing complete
- If analytics off → don't store behavioral logs

---

## **5.5 AI Workflow Execution**

**Powered by `web/src/lib/ai/` module (provider-agnostic)**

### Available Providers (via `AI_PROVIDER` env):

- `google-ai` — Google Gemini image generation (default for production)
- `n8n` — N8n webhook pipeline (for complex workflows)
- `mock` — Returns placeholder images (for development/testing)

### Interface (`TransformParams`):

```typescript
{
  prompt: string;           // AI generation prompt (from Experience.aiPhotoConfig.prompt)
  inputImageUrl: string;    // User's captured photo
  referenceImageUrl?: string; // Style reference (from Experience)
  brandColor?: string;      // Event theme color
  model?: string;           // e.g., 'gemini-2.5-flash-image'
}
```

### Integration with Experiences:

The AI config comes from the selected Experience (`web/src/features/experiences/`):

```typescript
// Experience.aiPhotoConfig
{
  enabled: boolean;
  model?: string;
  prompt?: string;
  referenceImageUrls?: string[];
  aspectRatio?: "9:16" | "1:1" | "4:3";
}
```

### Failure Handling:

- Timeout (30–45 seconds)
- Retry (1–2 attempts)
- Friendly fallback if AI unavailable
- Session state set to "error" with message

---

## **5.6 Error States & Recovery**

Must show friendly UI for:

- Camera permission denied
- AI generation error (any provider)
- Network failure
- Step component rendering failure
- Missing theme or missing step

Recovery options:

- Retry
- Return to previous step
- Restart journey
- Safe-exit

---

## **5.7 Analytics (Optional)**

Controlled by event-level or organization-level toggle.

If enabled, track:

- Journey started
- Step viewed
- Step completed
- Capture success
- AI processing time
- Reward viewed
- Download clicked
- Share clicked

If disabled:

- No analytics collection
- No errors logged except fatal failures

---

# **6. Technical Architecture**

---

## **6.1 Existing Codebase to Leverage**

### Step Renderers (`web/src/features/steps/components/preview/`):

All 11 step type renderers are already implemented:

```
steps/
  InfoStep.tsx
  ShortTextStep.tsx
  LongTextStep.tsx
  MultipleChoiceStep.tsx
  YesNoStep.tsx
  OpinionScaleStep.tsx
  EmailStep.tsx
  ExperiencePickerStep.tsx
  CaptureStep.tsx
  ProcessingStep.tsx
  RewardStep.tsx
```

### Runtime Components (`web/src/features/steps/components/preview/`):

- `PreviewRuntime.tsx` — Wraps steps with theme and mock session (supports "playback" mode)
- `DeviceFrame.tsx` — Responsive viewport container
- `ViewportModeContext.tsx` — Mobile/desktop viewport switching
- `PlaybackMode.tsx` — Journey playback controller

### Guest Module (`web/src/features/guest/`):

- `hooks/useGuestFlow.ts` — State machine for guest flow
- `hooks/useCamera.ts` — Camera access and capture
- `components/CameraView.tsx` — Camera preview UI
- `components/GuestFlowContainer.tsx` — Main guest container
- `components/BrandThemeProvider.tsx` — Brand color theming
- `components/ResultViewer.tsx` — AI result display
- `lib/capture.ts` — Photo capture utilities

### AI Module (`web/src/lib/ai/`):

- `client.ts` — Provider-agnostic AI client factory
- `types.ts` — TransformParams interface
- `providers/google-ai.ts` — Google Gemini provider
- `providers/n8n-webhook.ts` — N8n webhook provider
- `providers/mock.ts` — Mock provider for development

---

## **6.2 New/Extended Files**

Minimal new code needed — sessions module already complete:

```
# Sessions module (ALREADY COMPLETE)
sessions/
  types/sessions.types.ts      # ✅ Session, SessionState, SessionData
  schemas/sessions.schemas.ts  # ✅ Zod validation with journey fields
  repositories/sessions.repository.ts  # ✅ CRUD + journey functions
  actions/sessions.actions.ts  # ✅ Server actions

# Extend guest flow hook
guest/
  hooks/useGuestFlow.ts      # Add: step navigation, session data persistence

# New: Journey-aware guest container
guest/
  components/JourneyGuestContainer.tsx   # Loads journey, renders steps
  hooks/useJourneyRuntime.ts             # Journey step progression

# Extend join page
app/(public)/join/[eventId]/
  page.tsx                   # Route to JourneyGuestContainer if activeJourneyId
```

---

# **7. Acceptance Criteria**

### **AC1. Guest can complete full journey end-to-end**

Using real camera + AI processing.

### **AC2. Guest runtime loads journey and theme correctly**

### **AC3. All 11 step types render interactively**

### **AC4. AI workflow is executed and results shown**

### **AC5. Error handling works for:**

- camera denied
- workflow timeout
- network issues
- missing step data

### **AC6. Session state is persisted**

According to the defined storage strategy.

### **AC7. Analytics only recorded if enabled**

### **AC8. No dependence on editor or preview mode**

---

# **8. Risks & Mitigations**

| Risk                                           | Mitigation                                                 |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Camera can fail or be blocked on some devices  | Use fallback "upload photo" option                         |
| AI provider may be slow or unreachable         | Implement timeout + retries + provider fallback            |
| Step complexity grows as new types added       | Keep renderer architecture modular (already in place)      |
| Analytics might introduce performance overhead | Make analytics fully optional + background fire-and-forget |
| Theme issues across devices                    | Use tested mobile-first responsive layout                  |
