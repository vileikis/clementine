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

Show a unified completing state **inside ExperienceRuntime** when `store.isComplete` is `true`. The content area (children + navigation) is replaced with a loading indicator + support text. The RuntimeTopBar stays visible as a safety valve.

#### Layout during completing state

```
┌─────────────────────────┐
│ RuntimeTopBar            │  ← stays visible, back → close (X icon)
│  [X]   Title    [Home]  │     progress bar hidden
├─────────────────────────┤
│                         │
│      🔄 spinner         │  ← replaces children + navigation
│  "Completing your       │
│   experience..."        │
│                         │
└─────────────────────────┘
```

#### ExperienceRuntime changes

When `store.isComplete` is `true`:

1. **Content area**: Replace children + RuntimeNavigation with a centered loading spinner (`Loader2` animated icon) and support text ("Completing your experience...")
2. **RuntimeTopBar**: Keep visible but pass an `isCompleting` flag:
   - Force close mode (`X` icon instead of back arrow) regardless of step index — clicking triggers home confirmation dialog, same as existing `isCloseMode` behavior via `handleGoBack`
   - Hide progress bar
3. The completing state stays visible until the component unmounts (navigation) or the parent swaps it out (PreviewModal switches to job status view)

#### RuntimeTopBar changes

Accept an `isCompleting` prop:

- When `isCompleting` is `true`: force `isCloseMode = true` (show `X` icon, `handleGoBack` triggers home confirmation)
- When `isCompleting` is `true`: hide progress bar (extend existing `totalSteps > 1` guard)

#### Content component cleanup

Remove stale `isComplete` handling from content components — ExperienceRuntime now short-circuits before children render when completing:

- **GuestRuntimeContent**: Remove `if (isComplete) return null` — this was the source of the blank screen. ExperienceRuntime handles this state now.
- **PreviewRuntimeContent**: Remove the `if (isComplete)` block that renders the static "Preview Complete!" checkmark — this is replaced by ExperienceRuntime's completing state.

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
- Not changing consumer containers (ExperiencePage, PreviewModal, PregatePage, PresharePage).

---

### Scope

**In scope:**
- Completing state UI in ExperienceRuntime (spinner + support text) when `store.isComplete` is `true`
- RuntimeTopBar: `isCompleting` prop — force close mode, hide progress bar
- GuestRuntimeContent: remove dead `isComplete` early return
- PreviewRuntimeContent: remove dead `isComplete` checkmark block

**Out of scope:**
- Changes to consumer containers (ExperiencePage, PreviewModal, PregatePage, PresharePage)
- Changes to the transform pipeline or cloud function
- Changes to SharePage or ShareLoadingRenderer

---

### Files to change

| File | Change |
|------|--------|
| `domains/experience/runtime/containers/ExperienceRuntime.tsx` | Render completing state (spinner + text) when `store.isComplete`, pass `isCompleting` to RuntimeTopBar |
| `domains/experience/runtime/components/RuntimeTopBar.tsx` | Add `isCompleting` prop: force close mode, hide progress bar |
| `domains/guest/components/GuestRuntimeContent.tsx` | Remove `if (isComplete) return null` |
| `domains/experience/preview/components/PreviewRuntimeContent.tsx` | Remove `if (isComplete)` checkmark block |

---

### Acceptance Criteria

1. After completing the last step, users **never** see a blank/empty screen.
2. A loading spinner and support text ("Completing your experience...") appear immediately when the experience completes.
3. RuntimeTopBar stays visible during completing with close button (X) and no progress bar.
4. Clicking close (X) during completing triggers home confirmation dialog (existing behavior).
5. The completing state persists until the runtime unmounts (navigation) or is swapped out (PreviewModal).
6. If `startTransformPipeline` fails, the error state is shown cleanly by the consumer (existing behavior, no regression).
7. All four consumers (ExperiencePage, PreviewModal, PregatePage, PresharePage) benefit without changes to them.
