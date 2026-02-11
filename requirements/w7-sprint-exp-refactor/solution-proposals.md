# Experience System Redesign - Solution Proposals

Companion to `brief.md`. Captures design decisions, schema proposals, and UX direction.

---

## 1. Experience Identity: Templates + Derived Output

### No User-Set "Type" — Templates at Creation, Derived Output at Runtime

Replace `profile` + `outcome.type` with two concepts:

1. **Creation templates** — Pre-built starting configurations that set up default steps + workflow preset. The template is a starting point, not a permanent classification. Users pick a template at creation ("What do you want to start with?") and then freely evolve the experience.

2. **Derived output format** — The system determines the output format from the actual workflow config. This drives aspect ratio constraints and library badges automatically. (Can be omitted for v1 simplicity — just use the template label as stored metadata.)

### Creation Templates

Templates are declarative definitions: initial steps + initial workflow preset. New templates can be added without changing business logic.

| Template | Default Steps | Default Preset | Description |
|----------|---------------|----------------|-------------|
| **Photo** | `[capture.photo]` | Photo (direct) | Capture and output a photo |
| **AI Photo** | `[capture.photo]` | AI Photo | Capture photo + AI image generation |
| **AI Image** | `[]` | AI Image | AI image from prompt only (no capture) |
| **GIF** | `[capture.gif]` | GIF (direct) | Capture frames as animated GIF |
| **Video** | `[capture.video]` | Video (direct) | Capture and output video |
| **AI Video** | `[capture.photo]` | AI Video | Photo capture + AI image + AI video gen |
| **Survey** | `[]` | None | Data collection with input steps |
| **Story** | `[]` | None | Info-only display sequence |

Users can also start blank and build from scratch.

### Step Constraints: None

Any experience can have any step types. No type-based gating.

- A survey can have capture steps (video book use case: rate event + record video feedback)
- A photo experience can have input steps (prompt personalization via @mentions)
- A story can have input steps (interactive narrative, future)

The template sets up sensible defaults. The user can add whatever they need.

### Library Display

The library badge shows the creation template label (stored as metadata). Future: derive from workflow output for accuracy, add user-defined tags for custom organization.

---

## 2. Two-Layer Model: Steps + Workflow

### Core Insight

An experience has two conceptual layers:

1. **Steps** - What the guest interacts with (info screens, input questions, camera capture). Sequential, visible, user-facing.
2. **Workflow** - What happens after the guest completes all steps (AI generation, media processing). Automated, backend, invisible to guest.

These are fundamentally different: steps are interactive UI, workflow is a processing pipeline.

### Capture Stays as a Step

Capture is a guest-facing interaction (the guest taps "Take Photo," sees camera, takes the shot). It belongs in the steps array. The workflow *references* capture steps when it needs source media.

This allows:
- Interleaving capture with input steps (e.g., info -> capture -> input -> capture)
- Multiple named captures (e.g., "Selfie" + "Full Body")
- The creator to control exactly when capture happens in the guest flow

### Workflow Presets (Not Raw Pipeline Editing)

Exposing raw pipeline node composition to non-technical users is too tedious. Instead, **presets** define pre-built pipelines that expose only the fields users need to populate.

Each preset:
- Defines a fixed pipeline structure (which nodes, how they connect)
- Exposes specific fields as a form (capture source, prompt, model, ref media, etc.)
- Populates pipeline nodes from the form values under the hood
- Can be switched at any time — common fields are preserved across switches

**The preset is the user-facing abstraction. Pipeline nodes are the internal implementation.**

### Preset Catalog

| Preset | User Fills In | Pipeline Nodes (Internal) | Output |
|--------|--------------|--------------------------|--------|
| **Photo** (direct) | Source capture step | None (direct passthrough) | Captured photo |
| **GIF** (direct) | Source capture GIF step | None (GIF composition automatic from capture.gif) | Animated GIF |
| **Video** (direct) | Source capture video step | None (direct passthrough) | Captured video |
| **AI Photo** | Source capture step (optional), prompt, model, ref media | `[ai.image]` | AI generated image |
| **AI Image** | Prompt, model, ref media | `[ai.image]` (no capture input) | AI generated image |
| **AI Video** | Source capture step, image gen config, video gen config | `[ai.image, ai.video]` | AI generated video |

Each preset with AI stages also has an **"Enhance prompt with AI" toggle** that, when enabled, adds an `ai.text` node before the first AI media node. This exposes an additional prompt-builder field. The toggle keeps AI text generation as an opt-in enhancement rather than a separate preset.

### Switching Presets

When switching from one preset to another:
- Common fields are preserved (e.g., prompt text, model selection, capture step binding carry over between AI Photo and AI Video)
- Preset-specific fields are added/removed as needed
- The pipeline nodes are regenerated from the new preset + preserved field values

This enables the iterative building flow:
1. Start with "Photo" preset → test direct capture
2. Switch to "AI Photo" → fill in prompt, test AI generation
3. Switch to "AI Video" → image gen fields carry over, add video gen config, test

No type switching. No validation blocking experimentation.

### Media Bindings vs Text Mentions

Pipeline nodes need two kinds of input:

1. **Media inputs** (images/video fed to AI as visual context) — **explicit bindings** configured in the preset form. The creator picks which capture steps provide images. This is structural and visible in the UI.

2. **Text context** (personalization from input steps) — **@{step:...} mentions** in the prompt text. `@{step:Style Choice}` substitutes the multi-select response as text.

3. **AI-generated text** (from ai.text nodes) — **@{stage:...} mentions** in downstream prompts. When "Enhance prompt" is enabled, the generated text is referenced via `@{stage:Prompt Builder}`.

This separation means:
- Capture step images are never @mentioned in prompts — they flow through explicit bindings
- @mentions are reserved for text substitution from input steps and text stages
- Bindings are visible in the UI and validated structurally

### Aspect Ratio

`experience.aspectRatio` is the single source of truth:
- Camera viewfinder, AI generation, and overlay all use this value
- Available options constrained by the active preset's output format (image: 1:1, 3:2, 2:3, 9:16 / video: 1:1, 9:16)
- Switching presets may narrow the available options — if current ratio becomes invalid, prompt the user to choose a compatible one

---

## 3. Proposed Schema

### Experience Document

```
experience = {
  // Identity
  id: string
  name: string

  // Template label (set at creation, user-changeable)
  // Used for library badge and filtering
  template: string   // e.g., 'photo', 'ai-photo', 'survey', 'ai-video', etc.

  // Top-level aspect ratio (null for experiences without media output)
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

  // Processing workflow (null when no media processing needed)
  workflow: Workflow | null
}
```

### Workflow

```
Workflow = {
  // Active preset identifier
  preset: string                // e.g., 'photo', 'ai-photo', 'ai-video', 'gif', etc.

  // Direct output: which capture step provides output in direct presets
  // Null for non-direct presets (pipeline produces the output)
  directOutputStepId: string | null

  // Pipeline nodes (internal, populated by preset from form values)
  // Always preserved when switching presets (common fields carry over)
  nodes: PipelineNode[]
}
```

### Pipeline Nodes

Every node has an `id`, a `type`, and an `inputs` array. Nodes are ordered — each can only reference captures or earlier nodes.

```
PipelineNode (common fields) = {
  id: string                    // UUID, for referencing by later nodes
  type: string                  // Discriminator
  inputs: NodeInput[]           // Explicit media sources (captures or earlier nodes)
}

NodeInput = {
  sourceType: 'step' | 'node'
  sourceId: string              // UUID of a capture step or an earlier node
}
```

**Node types (discriminated union, extensible):**

```
AITextNode = {
  ...common
  type: 'ai.text'
  prompt: string                // @{step:...} for input step text, @{stage:...} for prior text nodes
  model: AITextModel
}
  Output: text (NOT media)
  Referenced by: @{stage:NodeName} in downstream node prompts

AIImageNode = {
  ...common
  type: 'ai.image'
  prompt: string                // @{step:...} for input step text, @{stage:...} for text node output
                                // @{ref:...} for reference media mentions
                                // Image inputs come from `inputs`, NOT from prompt mentions
  model: AIImageModel
  refMedia: MediaReference[]    // Uploaded reference images for style guidance (max 5)
}
  Output: image (media)
  Referenced by: inputs[] in downstream nodes

AIVideoNode = {
  ...common
  type: 'ai.video'
  prompt: string                // @{step:...}, @{stage:...} for text
  model: AIVideoModel
}
  Output: video (media)
  Referenced by: inputs[] in downstream nodes
```

New node types can be added as capabilities expand (e.g., `style.transfer`, `background.remove`, `image.upscale`). No `GIFComposeNode` — GIF composition is automatic from `capture.gif`.

### Node Output Types & Reference System

Nodes produce either **text** or **media**. The output type determines how downstream nodes consume it:

| Node Output | How to Reference | Used For |
|-------------|-----------------|----------|
| **Text** (`ai.text`) | `@{stage:NodeName}` in prompt | AI-generated prompts, descriptions, instructions |
| **Media** (`ai.image`, `ai.video`) | `inputs[]` binding | Source images/video for generation |

The @mention system resolves three source types:
- `@{step:StepName}` — text from input steps (scale values, text answers, multi-select choices)
- `@{stage:NodeName}` — text from `ai.text` nodes
- `@{ref:DisplayName}` — reference media display names (existing)

Capture step images and media node outputs are **never** @mentioned — they flow through explicit `inputs[]` bindings.

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

### What's Removed

| Current Field | Status | Replacement |
|---------------|--------|-------------|
| `experience.profile` | **Removed** | `experience.template` (label) + no constraints |
| `outcome` | **Removed** | `workflow` with preset + nodes |
| `outcome.type` | **Removed** | Derived from active preset / last node output |
| `outcome.captureStepId` | **Removed** | `node.inputs[]` explicit bindings + `workflow.directOutputStepId` |
| `outcome.aiEnabled` | **Removed** | `workflow.preset` (direct presets vs AI presets) |
| `outcome.imageGeneration` | **Replaced** | `AIImageNode` in `workflow.nodes` |
| `outcome.aspectRatio` | **Moved up** | `experience.aspectRatio` |
| `outcome.options` | **Removed** | Capture step config handles GIF/video specifics |
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
+--------------------------------------+
| Name:        [My Photo Experience  ] |
| Template:    AI Photo (changeable)   |
| Description: [Optional description ] |
| Cover Image: [Upload / preview]      |
| Aspect Ratio: [1:1 v]               |
+--------------------------------------+
```

Fields:
- **Name**: Editable, same validation as current
- **Template**: Shows current template label. Changeable (updates library badge). Future: auto-derived from workflow.
- **Description**: Optional text (future: used on landing/details page)
- **Cover Image**: Experience thumbnail/media
- **Aspect Ratio**: Selector. Options constrained by active preset output format. Single source of truth for camera, AI gen, overlay. Hidden when no workflow and no capture steps.

This is the first screen users see — the "control space" for experience identity and global settings.

### Section: Create

**Left nav**: "Create" nav item. Visible when workflow exists (media experiences). Hidden when `workflow === null` (pure survey/story). If a user adds capture steps to a survey and wants processing, they can activate a workflow from here.

**Main content**: Inline scrollable form (same pattern as current `ExperienceCreatePage`). The preset determines the form layout — no raw node editing.

**Example: AI Photo preset**
```
Create
+------------------------------------------+
| Preset: [AI Photo v]                     |
|                                          |
| Source Image                             |
| [Photo (capture step) v]                |
|                                          |
| [] Enhance prompt with AI               |
|                                          |
| Prompt                                   |
| +--------------------------------------+ |
| | Transform into cartoon style         | |
| | using @{step:Style Choice} ...       | |
| +--------------------------------------+ |
|                                          |
| Model: [Gemini 3 Pro v]                 |
| Ref Media: [img1] [img2] [+]            |
+------------------------------------------+
```

**Example: AI Video preset**
```
Create
+------------------------------------------+
| Preset: [AI Video v]                     |
|                                          |
| Source Image                             |
| [Photo (capture step) v]                |
|                                          |
| -- Image Generation --                   |
| Prompt: [Transform into cartoon...]      |
| Model: [Gemini 3 Pro v]                 |
| Ref Media: [img1] [+]                   |
|                                          |
| -- Video Generation --                   |
| Prompt: [Animate with gentle motion]     |
| Model: [Video Model v]                  |
+------------------------------------------+
```

**Example: Photo preset (direct)**
```
Create
+------------------------------------------+
| Preset: [Photo v]                        |
|                                          |
| Output Source                            |
| [Photo (capture step) v]                |
+------------------------------------------+
```

**Example: "Enhance prompt with AI" toggle enabled**
```
| [x] Enhance prompt with AI              |
|                                          |
| Prompt Builder                           |
| +--------------------------------------+ |
| | Create a detailed prompt from:       | |
| | Mood: @{step:Mood}                   | |
| | Scene: @{step:Scene Description}     | |
| +--------------------------------------+ |
|                                          |
| Image Generation Prompt                  |
| +--------------------------------------+ |
| | @{stage:Prompt Builder}              | |
| +--------------------------------------+ |
```

Key behaviors:
- **Preset selector**: Dropdown at top. Switching preserves common fields.
- **Direct presets** (Photo, GIF, Video): Show only a capture step dropdown.
- **AI presets** (AI Photo, AI Image, AI Video): Show prompt, model, ref media, capture source per their structure.
- **Enhance prompt toggle**: Available on AI presets. Adds an ai.text node to the pipeline. Exposes the prompt-builder form section.
- **Prompt @mentions**: Only for TEXT substitution from input steps and ai.text nodes. Capture step images come from the explicit source binding.

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
|   1. Welcome   [>] | |            |  | Title: [...]     |
|   2. Style     [>] | |            |  | Required: [x]    |
|   3. Photo     [>] | +------------+  | Options: [...]   |
|   [+ Add Step]     |                  |                  |
+--------------------+------------------+------------------+
```

- Selecting a step in the left nav shows its preview (center) and config (right)
- Steps support drag-to-reorder, add, rename, delete (same as current)
- No step type restrictions — any step type available for any experience
- Capture step config is simplified: no aspect ratio field (uses experience-level setting from Overview)

### Publish & Top Nav

Publish action stays in the top navigation bar (same as current `ExperienceDesignerLayout`). The top nav shows:
- Breadcrumbs (Experiences > Experience Name)
- Save status indicator
- Changes badge (unpublished changes)
- Publish button

### Responsive / Mobile

- Mobile: Single column, left nav becomes a top bar or hamburger menu
- Steps accessible via bottom sheet or collapsed nav
- Create section scrolls naturally (already inline form)
- Collect falls back to current mobile pattern (bottom sheets for step list + config)

---

## 5. Backend Pipeline Changes

### Outcome Dispatcher -> Node Executor

The current `runOutcome()` dispatcher becomes a **node runner** that executes pipeline nodes in sequence with explicit input resolution:

```
function runWorkflow(workflow, sessionResponses, context):
  if workflow.preset is a direct preset:
    return getStepMedia(sessionResponses, workflow.directOutputStepId)

  mediaRegistry = {}   // nodeId -> output media (for ai.image, ai.video)
  textRegistry = {}    // nodeId -> output text (for ai.text)

  for each node in workflow.nodes:
    // Resolve media inputs from explicit bindings
    mediaInputs = node.inputs.map(input =>
      input.sourceType === 'step'
        ? getStepMedia(sessionResponses, input.sourceId)
        : mediaRegistry[input.sourceId]
    )

    // Resolve text mentions in prompt: @{step:...} and @{stage:...}
    resolvedPrompt = resolvePrompt(node.prompt, sessionResponses, textRegistry)

    // Execute node
    output = executeNode(node, mediaInputs, resolvedPrompt, context)

    // Route output to appropriate registry
    if node.type === 'ai.text':
      textRegistry[node.id] = output    // text string
    else:
      mediaRegistry[node.id] = output   // media file

  // Return last node's output (must be media)
  return mediaRegistry[lastNode.id]
```

Each node executor:
- `ai.text`: Sends media inputs (optional, for visual context) + resolved prompt to LLM, returns **text string**
- `ai.image`: Sends media inputs as image parts + resolved prompt to Gemini, returns **generated image**
- `ai.video`: Sends media inputs + prompt to video generation API, returns **video**

Two registries keep text and media outputs separate. `@{stage:...}` resolves against the text registry; `inputs[]` resolves against the media registry.

### GIF Handling

GIF composition is NOT a pipeline node. `capture.gif` produces frames, and the backend automatically composes them into a GIF. This happens in the direct output path, not the node pipeline.

### Aspect Ratio Flow

```
experience.aspectRatio
    |
    +-> Camera viewfinder (capture steps)
    +-> AI generation (node config)
    +-> Overlay resolution (pickOverlay)
    +-> Output dimensions
```

One value flows everywhere. No resolution chain.

### Job Snapshot Changes

```
JobSnapshot = {
  sessionResponses: SessionResponse[]
  workflow: Workflow                    // Preset + nodes
  aspectRatio: AspectRatio             // From experience
  overlayChoice: MediaReference | null // Pre-resolved at job creation
  experienceVersion: number
}
```

### Validation at Job Creation

- Published config check (unchanged)
- Workflow must have valid preset configuration
- For direct presets: `directOutputStepId` references a valid capture step with a response
- For AI presets: nodes must exist, each node type must have an implemented executor
- All `node.inputs` references resolve to valid step responses or earlier node outputs
- Last node must produce media (not text)

---

## 6. Creation Flow Changes

### New Experience Dialog

Current: Name + Profile selector (freeform/survey/story)

New: Name + Template selector with visual cards:

```
What do you want to create?

+----------+  +----------+  +----------+
|          |  |          |  |          |
|  Photo   |  | AI Photo |  | AI Image |
|          |  |          |  |          |
+----------+  +----------+  +----------+

+----------+  +----------+  +----------+
|          |  |          |  |          |
|   GIF    |  |  Video   |  | AI Video |
|          |  |          |  |          |
+----------+  +----------+  +----------+

+----------+  +----------+
|          |  |          |
|  Survey  |  |  Story   |
|          |  |          |
+----------+  +----------+
```

Each card shows: icon, template name, brief description.

On creation:
1. Experience document created with template label + defaults
2. Default steps + workflow preset applied per template
3. Redirect to editor (Overview section)

### Library Display

Experience cards show the **template** badge:
- Color-coded (photo variants: blue, gif: purple, video: red, survey: green, story: amber)
- Filter tabs for common categories
- Users can immediately see the intent of each experience

---

## 7. Remaining Design Questions

These can be resolved during implementation:

1. **capture.gif UX**: How does the multi-frame capture flow work for the guest? Countdown timer between frames? Continuous burst?

2. **AI Video generation**: Which API/model? Backend integration question, doesn't affect schema.

3. **Preset extensibility**: How are presets defined? Hardcoded in the app, or declarative config that can be extended? (Recommend: start hardcoded, extract to config when patterns stabilize.)

4. **Preset switching edge cases**: When switching from AI Video to Photo, what happens to video-specific fields? (Recommend: preserve all fields, only show relevant ones per preset. Switching back restores everything.)

5. **"Custom" preset (future)**: For power users who want arbitrary node composition. Not needed for v1. The architecture supports it — presets map to nodes, a "custom" preset just exposes the node editor directly.

6. **Derived output format**: Should we auto-derive the library badge from the actual workflow output, or keep the template label as-is? (Recommend: template label for v1, auto-derive later for accuracy.)

7. **Aspect ratio on preset switch**: When switching from AI Photo (4 ratios) to AI Video (2 ratios) and current ratio is 3:2, what happens? (Recommend: prompt user to choose a compatible ratio.)

8. **Workflow activation for non-media templates**: If a survey user adds capture steps and wants AI processing, how do they activate a workflow? (Recommend: show a "Set up processing" option in the Create section.)

9. **@mention scope**: With image inputs as explicit bindings, capture-step @mentions in prompts should be disallowed. Only input steps and ai.text nodes are @mentionable. (Clean separation: images via bindings, text via @mentions.)

---

## 8. Summary of Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Experience identity | Template at creation + derived output | Templates for starting point, no permanent type constraints |
| Step constraints | None — any step for any experience | Video book survey needs capture; photo needs input for personalization |
| Workflow abstraction | Presets (user-facing) over pipeline nodes (internal) | Non-technical users shouldn't wire nodes manually |
| Preset switching | Preserves common fields across switches | Enables iterative building without data loss |
| AI text generation | Toggle within AI presets, not a separate preset | Opt-in enhancement, not a workflow the user composes |
| Capture modeling | Stays as guest-facing step | Creators control when capture happens in the flow |
| Image input binding | Explicit bindings in preset form | Visible, structural, validated — not hidden in prompt |
| Text personalization | @{step:...} and @{stage:...} mentions in prompt | Text from input steps and ai.text nodes |
| GIF composition | Automatic from capture.gif, no pipeline node | Not a creative decision — just format conversion |
| Aspect ratio | One field on experience, constrained by preset output | Single source of truth, auto-adjusts on preset switch |
| Editor UX | Left nav: Overview / Create / Collect | Three focused sections, steps always visible |
| Backward compat | Clean break | Pre-launch, no migration needed |

---

*Ready for feedback. Once direction is agreed, we can proceed to spec and task breakdown.*
