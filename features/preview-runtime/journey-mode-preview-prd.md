# **📄 PRD #2 — Full Journey Preview Mode (Step-by-Step Playback)**

_(for Clementine Journey Editor)_

### **Product Area**

Event Designer → Journey Steps Preview → **Full Playback Mode**

### **Status**

Draft v1

---

# **1. Purpose**

Currently, the preview in the Journey Editor renders **only a single step** at a time.
This PRD introduces a **step-by-step playback mode** that simulates how a guest experiences the entire journey flow.

This mode:

1. Uses the same **Preview Runtime** defined in PRD #1 (mock session, theme injection).
2. Simulates the **real navigation** between steps.
3. Helps creators understand the full user flow and verify transitions, theming, and step ordering.
4. Acts as the **core development foundation** for the Guest Runtime (PRD #3).

This PRD covers ONLY **Full Journey Playback Mode** — not the editor and not the final guest runtime.

---

# **2. Summary of Change**

We introduce:

### **✔ A “Play Journey” preview mode**

Accessible via a **Play** button in the editor.

### **✔ A Journey Playback Engine**

- Reads the step list from the journey
- Moves step-by-step using real step renderers
- Uses mock data for inputs

### **✔ A Preview Navigation Bar**

For creators only:

- Back
- Next
- Restart
- “Exit Playback” (returns to editor)

### **✔ Shared state across steps**

e.g.

- Text inputs stored in mock session
- Selected choices remembered
- Mock captured media reused in later steps
- Mock AI output fed into Reward step

Essentially: a fake guest session.

---

# **3. Goals**

### **Functional**

- Simulate the full experience exactly how guests will see it.
- Navigate through all steps with correct transitions.
- Render steps using the unified render engine from PRD #1.
- Persist mock session state across steps.
- Allow easy exit back to editor.

### **Technical**

- Reuse PreviewRuntime
- Introduce a **JourneyPlaybackController**
- Use a lightweight mock session store
- Make transitions deterministic and skip asynchronous actions

---

# **4. Scope**

### **In Scope**

- “Play Journey” entry point in editor
- Full-screen playback mode
- Step-to-step navigation:

  - Auto-advance (when configured)
  - Manual next/back using preview nav

- Session state:

  - Mock camera captures
  - Mock text input
  - Mock selections
  - Mock AI results

- Support all step types from PRD #1:

  - Info
  - Experience Picker
  - Capture
  - Short Text
  - Long Text
  - Multiple Choice
  - Yes/No
  - Opinion Scale
  - Email
  - Processing
  - Reward

### **Out of Scope**

- Real camera
- Real AI calls
- Analytics events
- Branching logic (future release)
- Multi-journey flows (future)

---

# **5. Detailed Requirements**

---

## **5.1 Playback Mode UX**

### **Entry Point**

A new button in the editor:

```
[ ▶  Play Journey ]
```

Clicking it:

- Opens a modal or new panel (decide based on UI)
- Activates the full playback mode

### **Layout**

- Uses the same **mobile/desktop toggle** from PRD #1
- Adds a bottom “Preview Navigation Bar”

### **Preview Navigation Bar**

Visible only in preview mode, not in guest mode.

Contains:

- **← Back**
- **→ Next**
- **⟲ Restart**
- **✕ Exit** (return to step editor)

If a step auto-advances (e.g. after “Processing”), the engine should trigger it but also allow manual controlling with the bar.

---

## **5.2 Journey Playback Engine**

A controller that manages:

### **Step Indexing**

- Keeps track of `currentIndex`
- Moves forward/backward based on user actions

### **Session State**

Mocked session state persists across steps:

| Step Type         | Stored Mock Data           |
| ----------------- | -------------------------- |
| Capture           | `mockImageUrl`             |
| Short Text        | `mockString`               |
| Long Text         | `mockText`                 |
| Email             | `mockEmail`                |
| Multiple Choice   | `mockSelectedOption`       |
| Yes/No            | `mockBoolean`              |
| Opinion Scale     | `mockNumber`               |
| Experience Picker | `mockExperienceId`         |
| Processing        | `mockTransformationResult` |
| Reward            | uses previous step result  |

### **Automatic Transitions**

Some steps auto-advance:

- Capture (after mock capture)
- Processing (after mock delay)
- Reward (does NOT auto-advance)

### **Error Handling**

- Step render failures show fallback UI
- Playback continues where possible

---

## **5.3 Step Rendering Behavior in Playback Mode**

Same components as PRD #1, but:

- Inputs are interactive
- Mock values flow into next steps
- Countdown animations simulate real behavior
- Video/GIF logic mocked deterministically
- Processing shows rotating messages for 1–2 seconds, then continues automatically

**Important:**
Preview should simulate _guest-like behavior_ but still finish quickly.

---

## **5.4 Data Flow**

```
Editor → [Play Journey] → Playback Engine → PreviewRuntime → Step Renderer → Mock Session State → Next Step
```

- No real backend connections
- No writes to Firestore
- All state ephemeral

---

# **6. Technical Requirements**

### **6.1 New Folder Structure**

```
runtime/
  engine/
    playback/
      JourneyPlaybackController.ts
      mockSession.ts
  preview/
    PlaybackMode.tsx
    PreviewNavigationBar.tsx
```

### **6.2 JourneyPlaybackController**

Functions:

- `start()`
- `reset()`
- `next()`
- `previous()`
- `getCurrentStep()`
- `applyStepResult(mockData)`
- `detectAutoAdvance()`

### **6.3 Integration with PreviewRuntime**

PreviewRuntime must accept:

- `mode: "single-step" | "playback"`
- `playbackController`
- `mockSession`
- `onCompleteStep`

---

# **7. Acceptance Criteria**

### **AC1. Play Journey button exists in the editor**

Opens the full playback mode.

### **AC2. Creator can navigate through the entire journey**

Using next/back and auto-advance.

### **AC3. All 11 step types behave interactively**

Inputs update mock session state.

### **AC4. Preview uses the same layout as PRD #1**

Mobile/desktop toggle works.

### **AC5. Mock session persists properly between steps**

e.g., captured image → reward step.

### **AC6. Exit returns safely to step editor**

---

# **8. Risks & Mitigations**

| Risk                                                              | Mitigation                                       |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| Auto-advance logic becomes inaccurate compared to real guest flow | Keep auto-advance deterministic & simple         |
| Complex steps (Processing, Capture) behave differently in runtime | Use consistent delays + static mocks             |
| Mock session becomes too complex                                  | Keep minimal data model; reset on restart        |
| Step renderers diverge over time                                  | Continue enforcing unified renderer architecture |
