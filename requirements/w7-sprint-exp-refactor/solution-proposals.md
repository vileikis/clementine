# Experience System Redesign - Solution Proposals

Companion to `brief.md`. Captures design decisions, schema proposals, and UX direction.

---

## 1. Unified Experience Type

### Decision: Type = Final Output Format

Replace `profile` + `outcome.type` with a single `experience.type` that describes what the experience produces:

| Type | Output | Description |
|------|--------|-------------|
| **photo** | Image file | AI-transformed or captured photo |
| **gif** | Animated GIF | Composed from captured frames |
| **video** | Video file | Captured or AI-generated video |
| **survey** | Collected data | Input responses, no media output |
| **story** | None (display) | Info-only sequence |

Future candidates: `legal` (consent collection).

### Why Type = Output

Users think in terms of what they get: "I want a photo experience." The type in the library immediately communicates the result. For hybrid cases (photo capture -> AI image -> AI video), the type is **video** because that's the final output. The workflow stages describe *how* that output is produced, not *what* it is.

### Naming: "Photo" vs "Image"

"Photo" aligns with the photobooth product metaphor and is how users think about it. Even AI-generated images are colloquially "photos." Using "photo" keeps the language product-oriented rather than technical.

If this feels limiting later (e.g., pure illustration generation with no camera involved), we can reconsider. For now, "photo" works.

### Step Constraints by Type

| Type | Allowed Steps |
|------|---------------|
| **photo** | info, input.*, capture.photo |
| **gif** | info, input.*, capture.gif |
| **video** | info, input.*, capture.photo, capture.video |
| **survey** | info, input.* |
| **story** | info |

Video allows both `capture.photo` and `capture.video` because hybrid workflows (HY-1, HY-2) start with photo capture but produce video output.

### Type Mutability

**Mutable**, but with a warning. Pre-launch, we don't need strict immutability. Changing type may invalidate steps/workflow (e.g., photo -> survey drops capture steps), so the UI should warn and clean up. This avoids the dead-end problem (P9).

---

## 2. Two-Layer Model: Steps + Workflow

### Core Insight

An experience has two conceptual layers:

1. **Steps** - What the guest interacts with (info screens, input questions, camera capture). Sequential, visible, user-facing.
2. **Workflow** - What happens after the guest completes all steps (AI generation, GIF composition). Automated, backend, invisible to guest.

These are fundamentally different: steps are interactive UI, workflow is processing pipeline. Keeping them as separate concepts (but in one view) is cleaner than mixing them.

### Capture Stays as a Step

Capture is a guest-facing interaction (the guest taps "Take Photo," sees camera, takes the shot). It belongs in the steps array. The workflow *references* capture steps when it needs source media.

This allows:
- Interleaving capture with input steps (e.g., info -> capture -> input -> capture)
- Multiple named captures (e.g., "Selfie" + "Full Body")
- The creator to control exactly when capture happens in the guest flow

### Two Concepts for Stage Inputs: Media Bindings vs Text Mentions

A stage needs two kinds of input:

1. **Media inputs** (images/video fed to the AI as visual context) — **explicit bindings**, not hidden in prompt text. The creator picks which capture steps or previous stages provide images. This is structural and visible in the UI.

2. **Text context** (personalization from input steps) — **@{step:...} mentions** in the prompt. When the prompt says `@{step:Style Choice}`, the multi-select response is substituted as text. This stays as-is.

This separation means:
- A creator can bind 2 capture steps as image inputs without ever writing `@{step:Photo}` in the prompt — the prompt just says "transform the input images into cartoon style"
- @mentions are reserved for text substitution from input steps (scale values, text answers, multi-select choices)
- The binding is visible in the UI (not buried in prompt syntax) and validated structurally

### Explicit Input Routing (Not a Linear Chain)

Each workflow stage declares its **inputs**: an explicit list of sources, where each source is either a capture step or a previous stage. This is ordered — stages can only reference things defined before them — but it's not strictly linear. Two stages can independently pull from different captures, and a later stage can combine outputs from multiple earlier stages.

**Examples:**

**PH-3: AI from 1 capture**
```
Steps:  [capture.photo "Selfie"]
Stages: [ai.image(inputs: [step:Selfie], prompt: "cartoon style")]
```

**PH-4: AI from 2 captures**
```
Steps:  [capture.photo "Selfie", capture.photo "Full Body"]
Stages: [ai.image(inputs: [step:Selfie, step:Full Body], prompt: "merge into one scene")]
```

**2 captures -> 2 separate AI images -> 1 AI video**
```
Steps:  [capture.photo "Photo A", capture.photo "Photo B"]
Stages: [
  ai.image "Gen A" (inputs: [step:Photo A], prompt: "stylize"),
  ai.image "Gen B" (inputs: [step:Photo B], prompt: "stylize"),
  ai.video (inputs: [stage:Gen A, stage:Gen B], prompt: "animate both"),
]
```

**PH-2: AI from prompt only (no capture)**
```
Steps:  [input.shortText "Describe your scene"]
Stages: [ai.image(inputs: [], prompt: "Generate: @{step:Describe your scene}")]
```

This explicit routing solves:
- **P7 (fragile coupling)**: No more `captureStepId` — bindings are structural, validated, and visible
- **Multi-source**: A stage can take 0, 1, or N inputs from any combination of captures and previous stages
- **Fan-out**: Two AI image stages can each take a different capture, then a video stage combines both outputs
- **Transparency**: The creator sees exactly what flows where, no hidden @mention-as-image-binding

### Passthrough & Output Source

When there are **no stages** (or AI is toggled off), the experience outputs captured media directly. But with multiple captures, which one?

The workflow includes a `passthroughStepId` that explicitly designates which capture step provides the output in passthrough mode:

```
Workflow = {
  aiEnabled: false,
  stages: [...],                    // Preserved but skipped
  passthroughStepId: "capture-A"    // This capture's media is the output
}
```

When `aiEnabled: true`, the **last stage's output** is the experience output. `passthroughStepId` is ignored.

### Output Mode

The workflow has a `mode` field:
- `'direct'`: Output the capture step designated by `directOutputStepId`. Stages are preserved but skipped.
- `'stages'`: Execute stages in order (using their explicit inputs). Last stage's output is the result.

Switching between modes in the UI preserves all stage config — the creator can toggle freely without losing configured stages, prompts, and bindings.

### Default Workflows by Type

When a creator selects a type during creation, the experience gets sensible defaults:

| Type | Default Steps | Default Workflow |
|------|---------------|------------------|
| **photo** | `[capture.photo("Photo")]` | `{ mode: 'direct', directOutputStepId: <Photo>, stages: [] }` |
| **gif** | `[capture.gif("GIF Capture")]` | `{ mode: 'direct', directOutputStepId: <GIF>, stages: [] }` |
| **video** | `[capture.video("Video")]` | `{ mode: 'direct', directOutputStepId: <Video>, stages: [] }` |
| **survey** | `[]` | `null` |
| **story** | `[]` | `null` |

The creator then customizes from there: adds input steps, switches to Workflow mode, configures stages, etc.

---

## 3. Proposed Schema

### Experience Document

```
experience = {
  // Identity
  id: string
  name: string

  // THE unified type (replaces profile + outcome.type)
  type: 'photo' | 'gif' | 'video' | 'survey' | 'story'

  // Top-level aspect ratio (media types only, null for non-media)
  // Single source of truth: camera, AI gen, overlay all use this
  aspectRatio: AspectRatio | null

  // Status & timestamps (unchanged)
  status: 'active' | 'deleted'
  media: MediaReference | null
  createdAt, updatedAt, deletedAt

  // Draft / Published configs (unchanged pattern)
  draft: ExperienceConfig
  published: ExperienceConfig | null

  // Versioning (unchanged)
  draftVersion, publishedVersion
  publishedAt, publishedBy
}
```

### Experience Config

```
ExperienceConfig = {
  // Guest-facing steps (info, input, capture)
  steps: ExperienceStep[]

  // Processing workflow (null for survey/story)
  workflow: Workflow | null
}
```

This replaces the current `{ steps, outcome }` structure. `outcome` becomes `workflow`.

### Workflow

```
Workflow = {
  // Output mode: 'direct' = output a capture step directly, 'stages' = execute pipeline
  mode: 'direct' | 'stages'

  // Which capture step provides output in direct mode
  // Null when mode='stages' or when no capture steps exist (PH-2 text-to-image)
  directOutputStepId: string | null

  // Processing stages with explicit input routing
  // Always preserved regardless of mode (switching to 'direct' doesn't delete stages)
  stages: WorkflowStage[]
}
```

### Workflow Stages

Every stage has an `id`, a `type`, and an `inputs` array declaring where it gets its media from. The `inputs` list is explicit — no implicit "previous stage" assumption.

```
WorkflowStage (common fields) = {
  id: string                    // UUID, for referencing by later stages
  type: string                  // Discriminator
  inputs: StageInput[]          // Explicit media sources (captures or earlier stages)
}

StageInput = {
  sourceType: 'step' | 'stage'
  sourceId: string              // UUID of a capture step or an earlier stage
}
```

**Stage types (discriminated union, extensible):**

```
AIImageStage = {
  ...common
  type: 'ai.image'
  prompt: string                // @{step:...} for TEXT substitution from input steps
                                // @{ref:...} for reference media mentions
                                // Image inputs come from `inputs`, NOT from prompt mentions
  model: AIImageModel
  refMedia: MediaReference[]    // Uploaded reference images for style guidance (max 5)
}

AIVideoStage = {
  ...common
  type: 'ai.video'
  prompt: string
  model: AIVideoModel           // Future: model selection
}

GIFComposeStage = {
  ...common
  type: 'gif.compose'
  fps: number                   // 1-60
  duration: number              // Output duration in seconds
}
```

New stage types can be added to the union as capabilities expand (e.g., `style.transfer`, `background.remove`, `image.upscale`). The `inputs` + `type` + config pattern stays the same.

### New Capture Step Types

```
// Existing
capture.photo config = {
  // aspectRatio REMOVED - uses experience.aspectRatio
}

// New
capture.gif config = {
  frameCount: number            // How many frames to capture (e.g., 4-8)
  interval: number              // Seconds between frames
  // aspectRatio from experience.aspectRatio
}

capture.video config = {
  maxDuration: number           // Max recording seconds
  // aspectRatio from experience.aspectRatio
}
```

### Aspect Ratio: Single Source of Truth

`experience.aspectRatio` is the ONE place aspect ratio lives:
- **Camera**: Capture steps read `experience.aspectRatio` for viewfinder constraints
- **AI generation**: Workflow stages use `experience.aspectRatio` for output dimensions
- **Overlay**: Backend resolves overlay by `experience.aspectRatio`
- **Non-media types**: `null` (irrelevant)

No more:
- ~~`outcome.aspectRatio`~~
- ~~`outcome.imageGeneration.aspectRatio`~~
- ~~`capture.photo.config.aspectRatio`~~
- ~~fallback chains~~

### What's Removed

| Current Field | Status | Replacement |
|---------------|--------|-------------|
| `experience.profile` | **Removed** | `experience.type` |
| `outcome` | **Removed** | `workflow` |
| `outcome.type` | **Removed** | `experience.type` |
| `outcome.captureStepId` | **Removed** | `stage.inputs[]` explicit bindings + `workflow.directOutputStepId` |
| `outcome.aiEnabled` | **Removed** | `workflow.mode` (`'direct'` / `'stages'`) |
| `outcome.imageGeneration` | **Replaced** | `AIImageStage` in `workflow.stages` |
| `outcome.aspectRatio` | **Moved up** | `experience.aspectRatio` |
| `outcome.options` | **Replaced** | Stage-specific config (GIF fps/duration, etc.) |
| `capture.photo.config.aspectRatio` | **Removed** | `experience.aspectRatio` |

---

## 4. Editor UX: Left Nav with Three Sections

### Navigation Model

The current two-tab split (Collect / Create) is replaced by a left-panel navigation with three sections. Steps are always visible under Collect.

```
+--------------------+----------------------------------------------+
| LEFT NAV           |  MAIN CONTENT AREA                           |
|                    |                                              |
| Overview           |  (varies by selected section)                |
| Create             |                                              |
| Collect            |                                              |
|   1. Welcome       |                                              |
|   2. Pick Style    |                                              |
|   3. Take Photo    |                                              |
|   [+ Add Step]     |                                              |
|                    |                                              |
+--------------------+----------------------------------------------+
```

### Section: Overview

**Left nav**: "Overview" nav item (selected state).

**Main content**: Simple form with experience-level settings.

```
Overview
┌──────────────────────────────────────┐
│ Name:        [My Photo Experience  ] │
│ Type:        Photo (read-only)       │
│ Description: [Optional description ] │
│ Cover Image: [Upload / preview]      │
│ Aspect Ratio: [1:1 ▾]               │
└──────────────────────────────────────┘
```

Fields:
- **Name**: Editable, same validation as current
- **Type**: Read-only badge (set at creation). Future: changeable with warning.
- **Description**: Optional text (future: used on landing/details page)
- **Cover Image**: Experience thumbnail/media
- **Aspect Ratio**: Selector (media types only, hidden for survey/story). Single source of truth for camera, AI gen, overlay.

This is the first screen users see — the "control space" for experience identity and global settings.

### Section: Create (media types only)

**Left nav**: "Create" nav item. Hidden entirely for survey/story types.

**Main content**: Inline scrollable form (same pattern as current `ExperienceCreatePage`). All stage config is rendered inline — no right config panel.

```
Create
┌──────────────────────────────────────────┐
│ Output Mode                              │
│ [Direct ○] [Workflow ●]                 │
│                                          │
│ ┌── Stage 1: AI Image Gen ─────────────┐│
│ │                                       ││
│ │ Inputs                                ││
│ │ ┌─────────────────────────────────┐   ││
│ │ │ [Photo A (capture)] [x]        │   ││
│ │ │ [+ Add input]                   │   ││
│ │ └─────────────────────────────────┘   ││
│ │                                       ││
│ │ Prompt                                ││
│ │ ┌─────────────────────────────────┐   ││
│ │ │ Transform into cartoon style    │   ││
│ │ │ using @{step:Style Choice} ...  │   ││
│ │ └─────────────────────────────────┘   ││
│ │                                       ││
│ │ Model: [Gemini 3 Pro ▾]              ││
│ │ Ref Media: [img1] [img2] [+]         ││
│ └───────────────────────────────────────┘│
│                                          │
│ [+ Add Stage]                            │
└──────────────────────────────────────────┘
```

**Direct mode** (when selected):
```
│ Output Mode                              │
│ [Direct ●] [Workflow ○]                 │
│                                          │
│ Output Source                            │
│ [Photo (capture step) ▾]                │
│                                          │
│ (Stages hidden but preserved)            │
```

Key behaviors:
- **Mode toggle**: Switching between Direct and Workflow preserves all stage config
- **Direct mode**: Shows a dropdown of available capture steps to pick the output source
- **Workflow mode**: Shows all stages inline, each with its own inputs picker, prompt composer, model selector, and reference media
- **Multiple stages**: Each stage is an expandable card/section. Add Stage button at the bottom for multi-stage pipelines.
- **Stage inputs**: Each stage has an explicit Inputs section where the creator picks which capture steps and/or previous stages provide media. Dropdown/checklist of available sources.
- **Prompt @mentions**: Only for TEXT substitution from input steps. Capture step images come from the explicit Inputs binding, not from @mentions in the prompt.

### Section: Collect

**Left nav**: "Collect" nav item, with steps listed directly below it. Steps are always visible in the left nav regardless of which section is active.

**Main content**: Same 3-column layout as current designer:

```
+--------------------+------------------+------------------+
| LEFT NAV           |    PREVIEW       |  CONFIG PANEL    |
|                    |                  |                  |
| Overview           | +------------+  | [Selected step   |
| Create             | | Live step  |  |  config panel]   |
| Collect            | | preview    |  |                  |
|   1. Welcome   [▸] | |            |  | Title: [...]     |
|   2. Style     [▸] | |            |  | Required: [x]    |
|   3. Photo     [▸] | +------------+  | Options: [...]   |
|   [+ Add Step]     |                  |                  |
+--------------------+------------------+------------------+
```

- Selecting a step in the left nav shows its preview (center) and config (right)
- Steps support drag-to-reorder, add, rename, delete (same as current)
- Step config panel is the same as current `StepConfigPanel`
- Capture step config is simplified: no aspect ratio field (uses experience-level setting from Overview)

### Publish & Top Nav

Publish action stays in the top navigation bar (same as current `ExperienceDesignerLayout`). The top nav shows:
- Breadcrumbs (Experiences > Experience Name)
- Save status indicator
- Changes badge (unpublished changes)
- Publish button

### Type-Adaptive Behavior

| Type | Overview | Create | Collect |
|------|----------|--------|---------|
| **photo** | name, type, desc, media, aspect ratio | Direct / Workflow (ai.image stages) | info, input, capture.photo |
| **gif** | name, type, desc, media, aspect ratio | Direct / Workflow (gif.compose stages) | info, input, capture.gif |
| **video** | name, type, desc, media, aspect ratio | Direct / Workflow (ai.video stages) | info, input, capture.photo/video |
| **survey** | name, type, desc, media | Hidden | info, input |
| **story** | name, type, desc, media | Hidden | info |

### Responsive / Mobile

- Mobile: Single column, left nav becomes a top bar or hamburger menu
- Steps accessible via bottom sheet or collapsed nav
- Create section scrolls naturally (already inline form)
- Collect falls back to current mobile pattern (bottom sheets for step list + config)

---

## 5. Backend Pipeline Changes

### Outcome Dispatcher -> Workflow Executor

The current `runOutcome()` dispatcher (routes by `outcome.type`) becomes a **stage runner** with explicit input resolution:

```
function runWorkflow(workflow, sessionResponses, context):
  outputRegistry = {}  // stageId -> output media

  for each stage in workflow.stages:
    // Resolve inputs from explicit bindings
    mediaInputs = stage.inputs.map(input =>
      input.sourceType === 'step'
        ? getStepMedia(sessionResponses, input.sourceId)
        : outputRegistry[input.sourceId]
    )

    // Resolve text mentions in prompt
    resolvedPrompt = resolveTextMentions(stage.prompt, sessionResponses)

    // Execute stage
    output = executeStage(stage, mediaInputs, resolvedPrompt, context)
    outputRegistry[stage.id] = output

  // Return last stage's output
  return outputRegistry[lastStage.id]
```

Each stage executor:
- `ai.image`: Sends media inputs as image parts + resolved prompt as text to Gemini, returns generated image
- `ai.video`: Sends media inputs + prompt to video generation API, returns video
- `gif.compose`: Takes capture frames from inputs, composites into GIF

The key difference: **input images are resolved from explicit bindings**, not extracted from prompt mentions. The prompt resolution only handles text substitution.

### Direct Mode Logic

When `workflow.mode === 'direct'`:
- Use `workflow.directOutputStepId` to find the designated capture step
- Output that capture's media directly (after overlay if applicable)
- Validation: `directOutputStepId` must reference a valid capture step with a response

### Aspect Ratio Flow (Simplified)

```
experience.aspectRatio
    |
    +-> Camera viewfinder (capture steps)
    +-> AI generation (stage config)
    +-> Overlay resolution (pickOverlay)
    +-> Output dimensions
```

One value flows everywhere. No resolution chain.

### Job Snapshot Changes

```
JobSnapshot = {
  sessionResponses: SessionResponse[]
  workflow: Workflow                    // Replaces outcome
  aspectRatio: AspectRatio             // From experience
  overlayChoice: MediaReference | null // Pre-resolved at job creation
  experienceVersion: number
}
```

### Validation at Job Creation

Current JC checks adapted:
- JC-001: Published config check (unchanged)
- JC-002/003: Workflow must exist for media types, stages must exist if `mode === 'stages'`
- JC-004: Session must have responses (unchanged)
- JC-005: Each stage type must have an implemented executor
- New: All `stage.inputs` references resolve to valid step responses or earlier stage outputs
- New: `directOutputStepId` references a capture step that has a response (when `mode === 'direct'`)
- New: No circular references (enforced by ordering — stages can only reference earlier items)

---

## 6. Creation Flow Changes

### New Experience Dialog

Current: Name + Profile selector (freeform/survey/story)

New: Name + Type selector with visual cards:

```
+-------+  +-------+  +-------+
| 📷    |  | 🎞️    |  | 🎬    |
| Photo |  |  GIF  |  | Video |
+-------+  +-------+  +-------+

+-------+  +-------+
| 📋    |  | 📖    |
| Survey|  | Story |
+-------+  +-------+
```

Each card shows: icon, type name, brief description of what it produces.

On creation:
1. Experience document created with selected type
2. Default steps + workflow applied (see Section 2 defaults table)
3. Redirect to unified editor

### Library Display

Experience cards show the **type** badge instead of profile badge:
- Color-coded per type (photo: blue, gif: purple, video: red, survey: green, story: amber)
- Filter tabs: `[All] [Photo] [GIF] [Video] [Survey] [Story]`
- Users can immediately see what each experience produces

---

## 7. Remaining Design Questions

These can be resolved during implementation:

1. **capture.gif UX**: How does the multi-frame capture flow work for the guest? Countdown timer between frames? Continuous burst?

2. **AI Video generation**: Which API/model? This is a backend integration question that doesn't affect the schema design.

3. **Stage preview**: What does the center panel show when a workflow stage is selected? Pipeline diagram? Last result? Placeholder?

4. **Stage validation**: Should we validate stage combinations at edit time or only at publish? (Recommend: publish-time, with warnings at edit time.)

5. **Passthrough for GIF/Video**: For GF-1 with `aiEnabled: false`, the output is the raw captured frames as a GIF. Is this useful or should GIF always go through composition?

6. **Experience type change**: When type changes, what happens to incompatible steps/workflow? (Recommend: warn and offer to clean up, but allow it.)

7. **Empty stages in Workflow mode**: If `mode: 'stages'` but `stages: []`, is that a validation error at publish? (Recommend: yes — Workflow mode with no stages is invalid.)

8. **Input validation on stages**: Should we enforce that `stage.inputs` references are valid at edit time? (Recommend: yes - if a referenced capture step is deleted, show warning on the stage and require re-binding.)

9. **Stage ordering constraints**: Can any stage type appear in any position? Or should we enforce rules like "gif.compose can't follow ai.video"? (Recommend: minimal constraints for now, validate at publish that the chain makes sense for the experience type.)

10. **@mention scope change**: With image inputs moved to explicit bindings, should @mentions of capture steps still resolve to their media, or should they be disallowed in prompts? (Recommend: disallow capture-step @mentions in prompts — images come from inputs, text comes from @mentions. Clean separation.)

---

## 8. Summary of Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Unified type | Type = final output format | Users think in outputs, not capabilities |
| Type mutability | Mutable with warnings | Avoids dead-ends (P9) |
| Capture modeling | Stays as guest-facing step | Creators control when capture happens |
| Image input binding | Explicit `stage.inputs[]` | Visible, structural, validated — not hidden in prompt text |
| Text personalization | @{step:...} mentions in prompt | Only for text substitution from input steps |
| Workflow model | Ordered stages with explicit input routing | Handles linear chains, fan-out, and multi-source merges |
| Output mode | `workflow.mode`: `'direct'` / `'stages'` | Explicit, preserves stages when switching |
| Aspect ratio | One field on experience | Single source of truth, no fallbacks |
| Editor UX | Left nav: Overview / Create / Collect | Three focused sections, steps always visible |
| Multi-capture | Both patterns (named steps + multi-shot) | Named steps for different inputs, multi-shot for same-type |
| Backward compat | Clean break | Pre-launch, no migration needed |

---

*Ready for feedback. Once direction is agreed, we can proceed to spec and task breakdown.*
