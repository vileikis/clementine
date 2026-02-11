# Experience System Redesign Brief

## Context

Clementine is a digital AI photobooth platform where Experience Creators set up AI-powered photo/video experiences, and Guests visit a shareable link to receive AI-transformed media. The **experience** is the core entity that defines what a guest goes through.

---

## 1. Current Architecture Summary

### Experience Document Structure

An experience document (`/workspaces/{workspaceId}/experiences/{experienceId}`) currently has two orthogonal configuration axes:

1. **Profile** (`experience.profile`) - Set at creation, immutable. One of:
   - `freeform` - All step types + transform capabilities
   - `survey` - Info + input + capture steps
   - `story` - Info steps only

2. **Outcome** (`experience.draft.outcome`) - Configured post-creation in the "Create" tab:
   - `type`: `'image' | 'gif' | 'video' | null`
   - `aiEnabled`: boolean toggle (AI generation vs passthrough)
   - `captureStepId`: links to a capture step for source media
   - `imageGeneration`: prompt, model, reference media, aspect ratio
   - `aspectRatio`: top-level aspect ratio (canonical for all downstream systems)
   - `options`: type-specific settings (GIF fps/duration, video prompt/duration)

### Two-Tab Editor

The experience editor splits configuration into two tabs:

- **Collect tab** (Designer) - Step list management: add/reorder/delete/configure steps. Available step types gated by profile.
- **Create tab** - Outcome configuration: select outcome type, configure AI generation, set aspect ratio, upload reference media.

### Step System

Steps are stored in `experience.draft.steps[]` as a discriminated union by `type`:
- `info` - Display text/images
- `input.scale`, `input.yesNo`, `input.multiSelect`, `input.shortText`, `input.longText` - Data collection
- `capture.photo` - Camera photo capture

Step categories defined: `info`, `input`, `capture`, `transform` (transform has no step implementation yet).

### Transform Pipeline (Backend)

When a guest completes an experience, the backend:
1. Reads `outcome` config from the job snapshot
2. Resolves aspect ratio: `outcome.aspectRatio ?? outcome.imageGeneration.aspectRatio ?? '1:1'`
3. Resolves overlay by aspect ratio from project config
4. If `aiEnabled`: resolves prompt mentions (`@{step:name}`, `@{ref:name}`), calls Gemini API
5. If `!aiEnabled`: passes through captured photo
6. Applies overlay, uploads result

Only `outcome.type === 'image'` is implemented. GIF and Video throw "not implemented".

---

## 2. Problem Statements

### P1: Two-Layer Abstraction Creates Cognitive Overhead

Users must understand two separate concepts to know what an experience does:

- **Profile** determines which steps are available (set at creation, immutable)
- **Outcome type** determines what output is produced (configured later, mutable)

A "freeform" profile tells the user nothing about what the experience produces. To understand that, they must open the experience and check the Create tab. This means:

- The experience library shows profile badges (`Freeform`, `Survey`, `Story`) but these don't communicate the actual purpose (photo AI, video, survey, etc.)
- Users cannot tell from the list what kind of output an experience produces
- The relationship between profile and outcome is implicit and undocumented in the UI

### P2: Profile Categories Don't Map to User Mental Models

Users think in terms of **what they want to create**: "I want an AI photo experience" or "I want a survey." They don't think in terms of abstract capability sets like "freeform."

- `freeform` is meaningless to users - it's a technical capability label, not a product concept
- A photo AI experience and a video experience both use `freeform`, but they are fundamentally different products
- There's no way to distinguish an AI photo experience from a plain photo capture experience in the library

### P3: Outcome Configuration is Disconnected from Experience Identity

Outcome is configured in a separate tab after creation, creating a fragmented setup flow:

- Step 1: Create experience (pick name + profile)
- Step 2: Go to Collect tab, add steps
- Step 3: Go to Create tab, pick outcome type, configure AI settings
- Step 4: Realize steps and outcome need to be coordinated (e.g., capture step needed for source image)

This separation means:
- Users can create experiences with no outcome configured (`outcome: null`)
- The connection between capture steps and AI generation is manual (`captureStepId` links to a step by ID)
- There's no guided workflow that ensures coherent configuration

### P4: Current Schema Cannot Express Multi-Stage Media Workflows

The outcome schema assumes a single-stage pipeline: one optional capture input, one generation step, one output. Real workflows require multiple stages:

| Scenario | Required Pipeline |
|----------|------------------|
| **AI image from 2+ photos** | Multiple capture steps -> AI generation -> output |
| **AI video from photo** | Capture photo -> AI image generation -> AI video generation -> output |
| **AI video from photo (direct)** | Capture photo -> AI video generation -> output |
| **GIF from captures** | Multiple captures -> GIF composition -> output |

Current limitations:
- `captureStepId` is a single string - cannot reference multiple capture steps
- No concept of chained generation stages (image -> video)
- `outcome.type` is the final output type but doesn't describe intermediate steps
- No way to express "generate an AI image, then animate it into a video"

### P5: Aspect Ratio Management is Fragmented

Aspect ratio currently lives in multiple places with a priority chain:

1. `outcome.aspectRatio` (top-level, canonical since Feature 065)
2. `outcome.imageGeneration.aspectRatio` (duplicate, never cleaned up)
3. `capture.photo` step config has its own `aspectRatio` field
4. Backend resolves: `outcome.aspectRatio ?? outcome.imageGeneration.aspectRatio ?? '1:1'`
5. Overlay resolution uses the resolved aspect ratio

Problems:
- Three places store aspect ratio, with a fallback chain
- Capture step aspect ratio and outcome aspect ratio can desync
- The designer passes `outcomeAspectRatio` down to capture config panels, but this is a prop-drilling workaround rather than a structural solution
- Different output types support different aspect ratios (image: 4 options, video: 2 options) but this constraint isn't enforced at the schema level
- Pre-launch: we can eliminate all duplication rather than maintain fallback chains

### P6: Non-Media Experience Types Have No Natural Home

`survey`, `story`, and potential future types like `legal` have no media output workflow, yet they share the same document structure with media experiences:

- They have an `outcome` field that's always `null`
- The Create tab is irrelevant for them (or confusing)
- The two-tab split (Collect/Create) doesn't make sense for survey-type experiences
- Future needs are unknown - a survey might eventually want an AI-generated summary, a story might want a shareable card

### P7: Step-Outcome Coupling is Implicit and Fragile

The relationship between steps and outcomes is maintained by loose references:

- `outcome.captureStepId` references a step by ID - if the step is deleted, the reference becomes stale
- Prompt mentions (`@{step:name}`) reference steps by name - if renamed, mentions break (handled by validation plugin, but still fragile)
- There's no structural guarantee that an AI image experience has a capture step
- Validation only runs at publish time, not during configuration

### P8: Backend Only Supports Image Outcome

The transform pipeline has a hard gate:
```typescript
if (outcome.type !== 'image') {
  throw new HttpsError('invalid-argument',
    `outcome type '${outcome.type}' is not implemented`)
}
```

GIF and Video are defined in the schema but have no execution path. The current `imageOutcome` executor handles both AI generation and passthrough for images, but there's no `gifOutcome` or `videoOutcome` executor, and no pipeline concept for multi-stage generation.

### P9: Profile Immutability Creates Dead Ends

Profile is immutable after creation. If a user creates a `freeform` experience and later wants it to be `survey`-only (or vice versa), they must create a new experience and re-do all configuration. This is especially problematic because:

- The profile choice happens at creation before the user fully understands what they're building
- Profile names don't clearly communicate consequences
- There's no migration path between profiles

---

## 3. Desired Outcomes

### G1: Single, Meaningful Experience Type

Replace the profile + outcome type dual-axis with a single **experience type** that immediately communicates what the experience produces:

- Users should understand what an experience does from a single label
- The library should clearly display experience types with distinct visual treatment
- The type should be selected upfront during creation

Candidate types (to be refined during design):
- **Photo** / **Image** - AI-transformed or captured photo output
- **GIF** - Animated output from captured frames
- **Video** - Video capture or AI-generated video output
- **Survey** - Data collection (input steps, no media output)
- **Story** - Information display (info steps only)
- **Legal** - Terms/consent collection (future)

### G2: Type-Driven Experience Structure

Each experience type should come with a natural, guided structure:

- Media types (photo, gif, video) need a **workflow** concept that defines the pipeline stages
- Non-media types (survey, story) need step-focused configuration without media pipeline concerns
- The editor UI should adapt based on type - showing relevant configuration and hiding irrelevant options

### G3: Scalable Media Workflow Model

For media-type experiences, support multi-stage pipelines that can express:

- Single capture -> output (simple photo/video)
- No capture -> AI generation -> output (text-to-image)
- Single capture -> AI generation -> output (image-to-image)
- Multiple captures -> AI generation -> output (multi-source)
- Capture -> AI image -> AI video -> output (chained generation)
- Multiple captures -> composition -> output (GIF from frames)
- Input steps -> AI text generation -> AI image generation -> output (AI-enhanced prompting)

### G4: Unified Aspect Ratio Model

A single aspect ratio setting per experience that propagates to all relevant components:
- Camera/capture constraints
- AI generation dimensions
- Overlay resolution
- Output dimensions

No fallback chains, no legacy fields, no desync between steps and outcome.

### G5: Clean Separation of Media vs Non-Media Types

Non-media experience types should not carry unused media configuration:
- No outcome/pipeline fields for surveys or stories
- Editor UI shows only relevant configuration
- Schema reflects actual structure needed per type

### G6: Clean Break (Pre-Launch)

We are pre-launch. There is no production data to preserve:
- No backward compatibility layer needed
- Existing test/dev experiences can be wiped and recreated
- Schemas, documents, and backend can be redesigned from scratch
- No migration scripts required - this is a greenfield redesign within the existing codebase

---

## 4. Scenarios to Support

These are the concrete media workflows the redesigned system must handle. Non-media types (survey, story, legal) require step management only, no media pipeline.

### Photo / Image Scenarios

| # | Scenario | Capture | AI Stage | Output |
|---|----------|---------|----------|--------|
| PH-1 | Simple photo | 1x capture.photo | None | Original photo |
| PH-2 | AI from prompt only | None | Image gen (text prompt) | AI generated image |
| PH-3 | AI from source photo | 1x capture.photo | Image gen (prompt + source) | AI generated image |
| PH-4 | AI from multiple photos | 2+ capture.photo | Image gen (prompt + sources) | AI generated image |

### GIF Scenarios

| # | Scenario | Capture | Processing | Output |
|---|----------|---------|------------|--------|
| GF-1 | Composed GIF | 1x capture.gif (produces N frames) | Frame composition | Animated GIF |

### Video Scenarios

| # | Scenario | Capture | Processing | Output |
|---|----------|---------|------------|--------|
| VD-1 | Simple video | 1x capture.video | None | Original video |

### Hybrid / Multi-Stage Scenarios

| # | Scenario | Capture | Stage 1 | Stage 2 | Output |
|---|----------|---------|---------|---------|--------|
| HY-1 | Photo -> AI image -> AI video | 1x capture.photo | AI image gen (prompt + source) | AI video gen (prompt + image) | AI generated video |
| HY-2 | Photo(s) -> AI video | 1+ capture.photo | AI video gen (prompt + photos) | - | AI generated video |

### AI Text (Prompt Enhancement) Scenarios

| # | Scenario | Input Steps | Stage 1 | Stage 2 | Output |
|---|----------|-------------|---------|---------|--------|
| TX-1 | AI-enhanced prompt -> image | Input steps (mood, scene, etc.) | AI text gen (builds rich prompt from inputs) | AI image gen (uses generated prompt + optional capture) | AI generated image |
| TX-2 | Photo description -> reimagine | 1x capture.photo | AI text gen (describes photo) | AI image gen (uses description as prompt, no source image) | AI generated image |
| TX-3 | AI-enhanced prompt -> video | Input steps | AI text gen (builds prompt) | AI video gen (uses generated prompt + capture) | AI generated video |

**Why AI text generation matters**: The current @mention system substitutes raw user input into prompts (e.g., `@{step:Mood}` becomes "happy"). An AI text stage can transform simple user inputs into rich, detailed prompts — handling nuance, combination, and creative direction that template substitution cannot. This enables "dumb inputs, smart prompts" where the guest answers simple questions but the AI receives a sophisticated generation prompt.

### Non-Media Scenarios

| # | Type | Steps | Output |
|---|------|-------|--------|
| NM-1 | Survey | Info + input steps | Collected responses (+ optional AI summary, future) |
| NM-2 | Story | Info steps only | Display sequence |
| NM-3 | Legal | Consent/checkbox steps (future) | Signed consent records |

---

## 5. Open Questions for Design Phase

These questions should be resolved during the solution brainstorming:

1. **Type mutability**: Should experience type be immutable like profile is today, or should users be able to change it (with appropriate migration)?

2. **Workflow representation**: How should multi-stage pipelines be represented in the document? (Linear array of stages? DAG? Flat config with stage references?)

3. **Editor UX for workflows**: Should media workflow configuration replace the current Create tab, or should it be integrated into the step flow?

4. **Capture step modeling**: Should capture steps remain in the steps array, or should they be part of the workflow/pipeline definition?

5. **Type-specific step constraints**: How strictly should types constrain available steps? (e.g., can a Photo experience have survey-style input steps for prompt personalization?)

6. **New capture types**: GIF and Video scenarios imply new capture step types (`capture.gif`, `capture.video`). How do these relate to the existing `capture.photo`?

7. **Hybrid type classification**: Scenarios HY-1 and HY-2 produce video from photo input. Are these "Video" type experiences? A separate "Hybrid" type? Or should the type reflect the output format?

8. ~~**Migration strategy**~~: Not applicable - pre-launch, clean break.

9. **Backend pipeline architecture**: How should the transform pipeline evolve to support multi-stage execution? Sequential stage runner? Node graph?

10. **Aspect ratio per stage**: In multi-stage pipelines, can different stages have different aspect ratios? (e.g., capture at 1:1, generate video at 9:16)

---

## 6. Current Schema & Code References

| Area | Path | Notes |
|------|------|-------|
| Experience schema | `packages/shared/src/schemas/experience/experience.schema.ts` | Profile + config (draft/published) |
| Outcome schema | `packages/shared/src/schemas/experience/outcome.schema.ts` | Type + AI config + aspect ratio |
| Step schemas | `packages/shared/src/schemas/experience/step.schema.ts` | Discriminated union by type |
| Step configs | `packages/shared/src/schemas/experience/steps/*.schema.ts` | Per-type config (info, inputs, capture) |
| Aspect ratio schema | `packages/shared/src/schemas/media/aspect-ratio.schema.ts` | Shared aspect ratio definitions |
| Session schema | `packages/shared/src/schemas/session/session.schema.ts` | Response storage + job tracking |
| Job schema | `packages/shared/src/schemas/job/job.schema.ts` | Snapshot + execution state |
| Designer layout | `apps/clementine-app/src/domains/experience/designer/` | Two-tab editor (Collect/Create) |
| Create tab form | `apps/clementine-app/src/domains/experience/create/` | Outcome configuration UI |
| Step registry | `apps/clementine-app/src/domains/experience/steps/registry/` | Step types + profile filtering |
| Experience library | `apps/clementine-app/src/domains/experience/library/` | List view + creation flow |
| Runtime | `apps/clementine-app/src/domains/experience/runtime/` | Guest-facing step execution |
| Transform pipeline | `functions/src/callable/startTransformPipeline.ts` | Job creation + validation |
| Image outcome | `functions/src/services/transform/outcomes/imageOutcome.ts` | AI generation + passthrough |
| Prompt resolution | `functions/src/services/transform/bindings/resolvePromptMentions.ts` | @mention replacement |
| Overlay resolution | `functions/src/repositories/project.ts` (`pickOverlay`) | Aspect-ratio-based overlay |

---

*This brief captures the current state and problem space. Solution design will follow in a separate brainstorming phase.*
