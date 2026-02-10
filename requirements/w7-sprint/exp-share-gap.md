## Experience-to-Share Transition Gap

### Problem

After completing the last step of an experience, users see an **empty screen** while the completion flow runs in the background. This gap can last several seconds (Firestore sync + `completeSession` + `startTransformPipeline` cloud function call) with zero visual feedback. Users don't know if the app is working, frozen, or broken.

---

### Where It Happens

There are **three contexts** where `ExperienceRuntime` is used, each with a different completion flow:

| Context | Completion Flow | Cloud Function? | Gap Problem? |
|---------|----------------|-----------------|--------------|
| **ExperiencePage** (guest) | sync → completeSession → startTransformPipeline → navigate to share | Yes | **Yes** — worst case, multi-second blank screen |
| **ExperiencePreviewModal** | sync → completeSession → startTransformPipeline → show JobStatusDisplay in-place | Yes | **Yes** — blank screen until `setShowJobStatus(true)` runs |
| **PregatePage** (guest) | sync → completeSession → markComplete → navigate to main experience | No | **Mild** — brief blank flash during navigation |
| **PresharePage** (guest) | sync → completeSession → markComplete → navigate to share | No | **Mild** — brief blank flash during navigation |

The core issue is in `ExperienceRuntime`: once `store.isComplete` becomes `true`, the runtime renders the last step's content but there's no indication that completion is in progress. The `onComplete` callback is async and can take seconds, during which the UI is static/blank.

---

### Root Cause Analysis

1. **ExperienceRuntime** fires `onComplete()` from a `useEffect` and does not expose any "completing" state to the UI.
2. **ExperiencePage.handleExperienceComplete** is an `async` function that sequentially:
   - Marks experience complete (network call)
   - Calls `startTransformPipeline` (cloud function — slowest part)
   - Navigates to share page
3. **ExperiencePreviewModal.handleComplete** similarly awaits `startTransformPipeline` before calling `setShowJobStatus(true)`.
4. During all of this, the user sees the last step content or nothing — no loading spinner, no progress indicator, no transition animation.

---

### Goal

Make the experience-to-share transition feel **seamless and intentional**. Users should always see clear visual feedback that their submission is being processed, from the moment they complete the last step until they land on the share/results screen.

---

### Proposed Approach

#### 1. Surface a "completing" state from ExperienceRuntime

When `store.isComplete` becomes `true` and the completion effect fires, the runtime should visually communicate that completion is in progress. Options:

- **Option A**: ExperienceRuntime renders a built-in loading/transition overlay when `isComplete && !hasCalledOnComplete` (or while the `onComplete` promise is pending).
- **Option B**: Expose an `isCompleting` state via the store so consumers (ExperiencePage, PreviewModal) can render their own transition UI.

#### 2. ExperiencePage — show loading state during async completion

While `handleExperienceComplete` is running (marking complete, triggering transform, waiting for response), show a loading/transition screen instead of the runtime content. This could be:

- The share loading screen (`ShareLoadingRenderer`) shown early
- A simple themed spinner with "Processing your photo..." messaging

#### 3. ExperiencePreviewModal — show transition during completion

Same principle: show a loading state between the runtime finishing and `showJobStatus` becoming `true`.

---

### Scope

**In scope:**
- Visual feedback during the completion flow in ExperiencePage (guest)
- Visual feedback during the completion flow in ExperiencePreviewModal
- Graceful handling of slow `startTransformPipeline` responses

**Out of scope:**
- PregatePage / PresharePage (no cloud functions, navigation is fast enough)
- Changes to the transform pipeline itself
- Changes to SharePage or ShareLoadingRenderer behavior

---

### Acceptance Criteria

1. After completing the last step, users **never** see a blank/empty screen.
2. A loading/transition indicator appears immediately when the experience completes.
3. The loading state persists until navigation to share (ExperiencePage) or job status display (PreviewModal).
4. If `startTransformPipeline` fails, the error state is shown cleanly (existing behavior, just no blank gap before it).
5. PregatePage and PresharePage continue to work as-is (no regression).
