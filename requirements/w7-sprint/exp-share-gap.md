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

### Solution: Completing State in ExperienceRuntime

Show a unified completing state **inside ExperienceRuntime** when `store.isComplete` is `true`. This replaces the step content with a loading indicator + support text, covering all consumers automatically (ExperiencePage, PreviewModal, PregatePage, PresharePage) with zero changes to any of them.

#### What to render

When `store.isComplete` is `true`, instead of rendering step content, render:

- A **loading spinner** (centered, `Loader2` animated icon)
- A **support text** below the spinner: "Completing your experience..."

The completing state stays visible until the component unmounts (navigation happens) or the parent swaps it out (PreviewModal switches to job status view).

#### Why this works for all consumers

| Consumer | What happens | Completing state visible until... |
|----------|-------------|----------------------------------|
| **ExperiencePage** | `onComplete` → mark complete → startTransformPipeline → navigate | Navigation to SharePage unmounts runtime |
| **ExperiencePreviewModal** | `onComplete` → startTransformPipeline → `setShowJobStatus(true)` | Conditional render swaps runtime for JobStatusDisplay |
| **PregatePage** | `onComplete` → mark complete → navigate to main experience | Navigation unmounts runtime |
| **PresharePage** | `onComplete` → mark complete → navigate to share | Navigation unmounts runtime |

#### What we are NOT doing

- Not reusing `ShareLoadingRenderer` — that component is tailored to share-specific content (AI generation messaging, image skeleton). The completing state is a different moment: "saving your responses and wrapping up."
- Not adding per-consumer loading states — the runtime owns this UX since it knows when completion starts.
- Not changing any consumer components (ExperiencePage, PreviewModal, PregatePage, PresharePage).

---

### Scope

**In scope:**
- Completing state UI in ExperienceRuntime (spinner + support text) when `store.isComplete` is `true`

**Out of scope:**
- Changes to consumer components (ExperiencePage, PreviewModal, PregatePage, PresharePage)
- Changes to the transform pipeline or cloud function
- Changes to SharePage or ShareLoadingRenderer

---

### Acceptance Criteria

1. After completing the last step, users **never** see a blank/empty screen.
2. A loading spinner and support text ("Completing your experience...") appear immediately when the experience completes.
3. The completing state persists until the runtime unmounts (navigation) or is swapped out (PreviewModal).
4. If `startTransformPipeline` fails, the error state is shown cleanly by the consumer (existing behavior, no regression).
5. All four consumers (ExperiencePage, PreviewModal, PregatePage, PresharePage) benefit without any changes to them.
