# Research: Guest Experience Runtime Engine

**Feature**: 011-guest-runtime
**Date**: 2025-11-27
**Status**: Complete

## Research Questions

This document consolidates research findings for implementing the Guest Experience Runtime Engine, focusing on integration patterns with existing infrastructure.

---

## 1. Journey Runtime State Machine Design

**Question**: How should the journey runtime state machine extend the existing `useGuestFlow` hook?

### Decision

Create a new `useJourneyRuntime` hook that orchestrates journey-level state, while delegating step-specific interactions (camera, capture) to the existing `useGuestFlow` hook.

### Rationale

- **Separation of concerns**: Journey navigation (step progression, session persistence) vs step interaction (camera, capture, form input)
- **Reuse existing code**: `useGuestFlow` already handles camera → capture → upload → transform flow
- **Simpler testing**: Each hook can be tested independently
- **Future flexibility**: Journey runtime can support new step types without modifying camera flow

### Implementation Approach

```typescript
// useJourneyRuntime manages:
// - Journey/step loading
// - Step index navigation (next/previous)
// - Session data persistence
// - Error recovery at journey level

// useGuestFlow manages (unchanged):
// - Camera permission and streaming
// - Photo capture and upload
// - Transform trigger and real-time status

// Integration point:
// - JourneyStepRenderer calls useGuestFlow for capture steps
// - On transform complete, advances to next step via useJourneyRuntime
```

### Alternatives Considered

| Alternative | Why Rejected |
|------------|--------------|
| Extend useGuestFlow directly | Would bloat the hook with journey logic, harder to test, violates single responsibility |
| Create single unified hook | Loses existing tested camera/capture logic, more work to implement |
| Use context instead of hooks | Unnecessary complexity for this use case, hooks compose better |

---

## 2. Step Renderer Adaptation for Guest Runtime

**Question**: How should existing step renderers from preview mode be adapted for real guest interaction?

### Decision

Reuse the existing step renderers with a new `mode` prop to distinguish between preview/playback (mock) and guest (real) modes. Wire real callbacks for data persistence.

### Rationale

- **Consistency**: Same UI across editor preview and guest experience
- **Minimal changes**: Renderers already support interactive mode via playback
- **Type safety**: Existing discriminated unions and props maintained

### Implementation Approach

```typescript
// Existing step renderers already support:
// - onInputChange(stepId, value) - for form inputs
// - onCtaClick() - for advancing
// - onStepComplete(stepId) - for step completion

// Guest runtime provides real implementations:
const handleInputChange = async (stepId: string, value: StepInputValue) => {
  await saveStepDataAction(eventId, sessionId, stepId, value);
};

const handleStepComplete = async (stepId: string) => {
  await advanceStepAction(eventId, sessionId, nextIndex);
  setCurrentStepIndex(nextIndex);
};
```

### Special Cases by Step Type

| Step Type | Guest Runtime Behavior |
|-----------|----------------------|
| info | Display only, CTA advances |
| experience-picker | Save selection to session, update Experience context |
| capture | Real camera via useGuestFlow, upload photo |
| short_text, long_text | Validate input, save to session |
| multiple_choice | Save selection(s) to session |
| yes_no | Save boolean to session |
| opinion_scale | Save number to session |
| email | Validate email format, save to session |
| processing | Trigger AI transform, show real-time progress |
| reward | Display AI result, enable download/share |

---

## 3. AI Transform Integration

**Question**: How should the AI transform be triggered and monitored during the processing step?

### Decision

Wire the existing AI module (`web/src/lib/ai/`) into the session action, replacing the passthrough implementation. Use Firestore real-time subscription to monitor transform status.

### Rationale

- **AI module ready**: Google AI, n8n, and mock providers are already implemented
- **Real-time updates**: Existing pattern in useGuestFlow for session status subscription
- **Server-side execution**: Transform runs via server action with Admin SDK

### Implementation Approach

```typescript
// In sessions.actions.ts - triggerTransformAction:
export async function triggerTransformAction(eventId: string, sessionId: string) {
  // 1. Get session with input image
  const session = await getSession(eventId, sessionId);
  const inputImageUrl = await getDownloadURL(session.inputImagePath);

  // 2. Get experience config (prompt, model, references)
  const experienceId = session.data?.selected_experience_id;
  const experience = await getExperience(experienceId);

  // 3. Build transform params
  const params: TransformParams = {
    prompt: experience.aiPhotoConfig?.prompt || 'Transform this image',
    inputImageUrl,
    referenceImageUrl: experience.aiPhotoConfig?.referenceImageUrls?.[0],
    model: experience.aiPhotoConfig?.model,
  };

  // 4. Execute transform
  const aiClient = getAIClient();
  const resultBuffer = await aiClient.generateImage(params);

  // 5. Upload result to Storage
  const resultPath = `results/${eventId}/${sessionId}/result.png`;
  await uploadBytes(resultPath, resultBuffer);
  const resultUrl = await getDownloadURL(resultPath);

  // 6. Update session state
  await updateSessionState(eventId, sessionId, 'ready', { resultImagePath: resultUrl });
}
```

### Error Handling

| Error Scenario | Recovery Action |
|---------------|----------------|
| AI provider timeout (45s) | Retry once automatically |
| AI provider unavailable | Set session state to 'error', show retry button |
| Invalid input image | Show error, allow retake |
| Storage upload fails | Retry upload, then show error |

---

## 4. Session Persistence Strategy

**Question**: When and how should session data be persisted to Firestore?

### Decision

Persist incrementally on each step completion, with optimistic local state for responsiveness. Use server actions for all writes.

### Rationale

- **Data safety**: Guests don't lose progress on refresh/disconnect
- **Resume capability**: Guests can resume from last completed step
- **Performance**: Incremental writes vs batch at end
- **Consistency**: Server actions ensure validation and admin SDK usage

### Implementation Approach

```typescript
// Persistence points:
// 1. Journey start → startJourneySessionAction (creates session)
// 2. Step input → saveStepDataAction (saves form data)
// 3. Step complete → advanceStepAction (updates currentStepIndex)
// 4. Capture complete → saveCaptureAction (saves inputImagePath)
// 5. Transform complete → updateSessionState via real-time subscription

// Local state for responsiveness:
const [localInputs, setLocalInputs] = useState<Record<string, StepInputValue>>({});

// Persist on blur/submit:
const handleInputBlur = async (stepId: string, value: StepInputValue) => {
  setLocalInputs(prev => ({ ...prev, [stepId]: value }));
  await saveStepDataAction(eventId, sessionId, stepId, value);
};
```

### Session Data Structure

```typescript
interface SessionData {
  // Experience selection
  selected_experience_id?: string;

  // Form inputs (keyed by stepId)
  [stepId: string]: StepInputValue;
}

// Example populated session:
{
  selected_experience_id: 'exp_abc123',
  'step_name': { type: 'text', value: 'Jane Doe' },
  'step_email': { type: 'text', value: 'jane@example.com' },
  'step_rating': { type: 'number', value: 8 },
  'step_consent': { type: 'boolean', value: true },
}
```

---

## 5. Error Handling & Recovery

**Question**: What error states should be handled and how should recovery work?

### Decision

Implement three tiers of error handling: step-level (retry input), journey-level (retry step), and fatal (restart or exit).

### Rationale

- **User experience**: Most errors are recoverable, don't force restart
- **Data preservation**: Session persisted on each step, recovery doesn't lose data
- **Graceful degradation**: Even fatal errors show friendly message

### Error Hierarchy

| Tier | Examples | Recovery Options |
|------|----------|------------------|
| **Step-level** | Validation error, input format error | Show inline error, allow correction |
| **Journey-level** | Camera permission denied, network timeout | Show modal, retry or skip (if optional) |
| **Fatal** | Event unavailable, session corrupted, auth error | Show friendly message, contact support |

### Implementation Approach

```typescript
// Step-level: Handled by individual step components
// Already exists in form validation (email format, required fields)

// Journey-level: ErrorBoundary + recovery UI
<JourneyErrorBoundary onRetry={handleRetry} onRestart={handleRestart}>
  <JourneyStepRenderer step={currentStep} ... />
</JourneyErrorBoundary>

// Fatal: Caught at JourneyGuestContainer level
if (!event || !journey) {
  return <EventUnavailableScreen />;
}
```

---

## 6. Camera Permission & Fallback

**Question**: How should camera permission denial be handled?

### Decision

Show friendly permission prompt with instructions. Offer file upload as fallback when camera unavailable.

### Rationale

- **Accessibility**: Not all devices have working cameras
- **Privacy**: Some users prefer not to grant camera access
- **Completion rate**: Fallback ensures users can still complete journey

### Implementation Approach

```typescript
// In CaptureStep guest mode:
const { status, stream, requestPermission } = useCamera();

if (status === 'denied') {
  return (
    <CameraPermissionDenied
      onRequestAgain={requestPermission}
      onUploadFallback={() => setShowUploader(true)}
    />
  );
}

// File upload fallback uses standard <input type="file" accept="image/*" capture>
// Mobile browsers show camera option even without getUserMedia
```

---

## 7. Join Page Routing Logic

**Question**: How should the join page determine whether to show legacy flow or journey flow?

### Decision

Check `event.activeJourneyId` - if present and valid, render `JourneyGuestContainer`. Otherwise, fall back to existing `GuestFlowContainer`.

### Rationale

- **Backward compatibility**: Events without journeys continue working
- **Smooth migration**: No breaking changes to existing events
- **Clear logic**: Single source of truth (activeJourneyId)

### Implementation Approach

```typescript
// In join/[eventId]/page.tsx:
export default async function JoinPage({ params }) {
  const { eventId } = await params;
  const event = await getEventAction(eventId);

  // Check company status (existing)
  if (event.ownerId) {
    const companyStatus = await getCompanyStatus(event.ownerId);
    if (companyStatus === 'deleted') return <EventUnavailableScreen />;
  }

  // Route based on activeJourneyId
  if (event.activeJourneyId) {
    // Load journey and steps
    const journey = await getJourneyAction(eventId, event.activeJourneyId);
    const steps = await getStepsAction(eventId, event.activeJourneyId);

    if (journey && steps.length > 0) {
      return (
        <JourneyGuestContainer
          event={event}
          journey={journey}
          steps={steps}
        />
      );
    }
  }

  // Fallback to legacy flow
  return (
    <BrandThemeProvider brandColor={event.theme.primaryColor}>
      <GuestFlowContainer eventId={event.id} eventTitle={event.name} />
    </BrandThemeProvider>
  );
}
```

---

## Summary of Decisions

| Area | Decision |
|------|----------|
| State management | New `useJourneyRuntime` hook + existing `useGuestFlow` |
| Step rendering | Reuse existing renderers with real callbacks |
| AI integration | Wire existing AI module into session action |
| Data persistence | Incremental per-step via server actions |
| Error handling | Three-tier (step, journey, fatal) with recovery |
| Camera fallback | File upload alternative when camera denied |
| Routing | Route by `activeJourneyId` presence |

All decisions extend existing patterns without introducing new architectural complexity.
