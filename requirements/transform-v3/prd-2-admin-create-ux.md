# PRD 2: Admin Create Tab UX

**Epic**: [Outcome-based Create](./epic.md)
**Status**: ✅ Complete
**Dependencies**: PRD 1B (Experience Outcome Config)
**Enables**: PRD 3 (Job + CF)

---

## Overview

Replace the Generate/nodes UI with a simplified Create tab where admins configure outcome parameters. Uses the Lexical prompt editor from 055-lexical-prompt-editor for prompt input with mention support.

---

## Completed Prep Work

> **Note**: The following prep work has already been completed (PR #131):
>
> - [x] Renamed `domains/experience/generate/` subdomain to `domains/experience/create/`
> - [x] Renamed route from `/experiences/$id/generate` to `/experiences/$id/create`
> - [x] Renamed `ExperienceGeneratePage` to `ExperienceCreatePage`
> - [x] Updated tab navigation to use "Create" label with `/create` path
>
> Existing components (Lexical, PromptComposer, reference media) are preserved in the `create/` subdomain and can be reused or refactored.

---

## Technical Approach

### Reuse `domains/experience/create/` Subdomain

The existing `create/` subdomain contains reusable components from the previous node-based implementation:

| Component | Reusability | Notes |
|-----------|-------------|-------|
| `lexical/*` | ✅ Fully reusable | Complete @mention system (nodes, plugins, serialization) |
| `LexicalPromptInput` | ✅ Fully reusable | Rich text editor with @mention support |
| `ReferenceMediaStrip` | ✅ Fully reusable | Thumbnail strip for uploaded media |
| `ReferenceMediaItem` | ✅ Fully reusable | Individual media thumbnail with remove |
| `AddMediaButton` | ✅ Fully reusable | File picker trigger |
| `PromptComposer` | 🔄 Refactor | Decouple from node-based data model |
| `ControlRow` | 🔄 Refactor | Extract model/aspect ratio selectors |
| `useRefMediaUpload` | 🔄 Refactor | Work with `outcome.imageGeneration.refMedia` |
| `NodeListItem/*` | ❌ Delete | Node-centric UI being removed |
| `TransformPipelineEditor` | ❌ Delete | Multi-node pipeline being replaced |
| `transform-operations.ts` | ❌ Delete | Operations on `TransformNode[]` |

### PromptComposer: Composition over Configuration

Refactor `PromptComposer` to be **generation-type agnostic** using composition over configuration. This enables reuse for future generation types (video, text) without modifying the component.

**Design Principle**: PromptComposer handles common UI; parent passes type-specific options.

```typescript
interface PromptComposerProps {
  // Core prompt (same for all generation types)
  prompt: string
  onPromptChange: (prompt: string) => void

  // Reference media (same for all types, can hide if not needed)
  refMedia: MediaReference[]
  onRefMediaAdd: (media: MediaReference) => void
  onRefMediaRemove: (mediaAssetId: string) => void

  // Model - options passed by parent (different per generation type)
  model: string
  onModelChange: (model: string) => void
  modelOptions: SelectOption[]

  // Aspect ratio - optional (not needed for text generation)
  aspectRatio?: string
  onAspectRatioChange?: (ratio: string) => void
  aspectRatioOptions?: SelectOption[]

  // Context
  steps: ExperienceStep[]
  workspaceId: string
  disabled?: boolean
}
```

**Usage by generation type**:

```tsx
// Image generation (this PRD)
<PromptComposer
  modelOptions={IMAGE_MODEL_OPTIONS}
  aspectRatioOptions={IMAGE_ASPECT_RATIO_OPTIONS}
  // ...
/>

// Future: Video generation
<PromptComposer
  modelOptions={VIDEO_MODEL_OPTIONS}
  aspectRatioOptions={VIDEO_ASPECT_RATIO_OPTIONS}
  // ...
/>

// Future: Text generation (no aspect ratio)
<PromptComposer
  modelOptions={TEXT_MODEL_OPTIONS}
  // aspectRatioOptions omitted
  // ...
/>
```

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `OutcomeTypeSelector` | Image/GIF/Video toggle (Section 2) |
| `SourceImageSelector` | Capture step dropdown (Section 3) |
| `AIGenerationToggle` | Enable/disable AI toggle (Section 4) |
| `CreateTabForm` | Container composing all fields, binds to `draft.outcome` |

---

## 1. Create Tab Structure

### Tab Navigation

~~Replace existing tab structure:~~

~~**Before**: Collect | Generate~~
~~**After**: Collect | Create~~

**Done** - Tab already renamed to "Create" (see Completed Prep Work above).

### Create Tab Layout

```
┌─────────────────────────────────────────────────────┐
│ Create                                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Outcome Type                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Image]  [GIF]  [Video]                     │   │
│  │    ✓     (soon)  (soon)                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Source Image (Optional)                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ None (prompt only)                    ▼     │   │
│  │ ─────────────────────────────────────────   │   │
│  │ Your Photo (capture.photo)                  │   │
│  └─────────────────────────────────────────────┘   │
│  Helper: "Select a capture step to use as base     │
│  image for transformation"                         │
│                                                     │
│  ☑ Enable AI Generation                            │  ← Toggle
│                                                     │
│  ┌─ Prompt Composer ──────────────────────────┐   │  ← Collapsible
│  │                                             │   │
│  │  Prompt *                                   │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ Create a @{step:Pet Choice} in the  │   │   │
│  │  │ style of @{ref:style-image.jpg}...  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  Reference Images                           │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ [+ Add]  [style-image.jpg] [x]      │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │                                             │   │
│  │  Model              Aspect Ratio            │   │
│  │  ┌───────────────┐  ┌───────────────────┐  │   │
│  │  │ Gemini 2.5  ▼ │  │ [1:1] [3:2] ...   │  │   │
│  │  └───────────────┘  └───────────────────┘  │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Acceptance Criteria

- [x] AC-1.1: Create tab visible in experience editor *(done - tab renamed)*
- [x] AC-1.2: Generate tab removed (or hidden) *(done - route renamed to /create)*
- [ ] AC-1.3: Outcome type selector shows Image enabled, GIF/Video disabled with "coming soon"

---

## 2. Outcome Type Selector

### Design

- Radio button or segmented control style
- Image: enabled, selectable
- GIF, Video: visually disabled with "coming soon" label

### Behavior

- Selecting Image shows image-specific form fields
- GIF/Video show "Coming soon" message when clicked
- `outcome.type` updates in draft on selection
- **Switching preserves** `imageGeneration` block (prompt, refMedia, model, aspectRatio)
- **Switching resets** `options` to defaults for new type

### Acceptance Criteria

- [ ] AC-2.1: Image outcome selectable
- [ ] AC-2.2: GIF/Video show "coming soon" and are not selectable
- [ ] AC-2.3: Selection persists in draft config
- [ ] AC-2.4: Switching outcomes preserves imageGeneration config

---

## 3. Source Image Selector

### Design

- Dropdown with optional selection
- First option: "None (prompt only)"
- Other options: Capture steps from Collect tab

### Behavior

- Lists only capture steps (e.g., `capture.photo`)
- Shows step name as option label
- "None" means no source image (prompt-only or invalid for passthrough)
- Saved to `outcome.captureStepId`

### Acceptance Criteria

- [ ] AC-3.1: Dropdown shows "None" + capture steps
- [ ] AC-3.2: Only capture steps listed (not input steps)
- [ ] AC-3.3: "None" sets `captureStepId: null`
- [ ] AC-3.4: Selection saved to `outcome.captureStepId`
- [ ] AC-3.5: Helper text explains optional behavior

---

## 4. AI Generation Toggle

### Design

- Checkbox or toggle switch
- Label: "Enable AI Generation"
- When off, Prompt Composer section collapses but values are preserved

### Behavior

```
☑ Enable AI Generation  →  Show Prompt Composer (prompt, refMedia, model)
☐ Enable AI Generation  →  Hide Prompt Composer (passthrough mode)
```

### Passthrough Validation

When `aiEnabled: false`:
- Must have `captureStepId` set (validation in PRD 1B)
- Result is: source image → apply overlay → output

### Acceptance Criteria

- [ ] AC-4.1: Toggle controls `outcome.aiEnabled`
- [ ] AC-4.2: Prompt Composer section shows/hides based on toggle
- [ ] AC-4.3: Prompt Composer values preserved when toggling off/on
- [ ] AC-4.4: Warning shown if passthrough without source image

---

## 5. Prompt Editor

Use the Lexical prompt editor from 055-lexical-prompt-editor.

### Mention Support

| Mention Type | Syntax | Source | Example |
|--------------|--------|--------|---------|
| Step mention | `@{step:stepName}` | Steps from Collect tab | `@{step:Favorite Color}` |
| Media mention | `@{ref:displayName}` | Reference images in form | `@{ref:style-image.jpg}` |

### Available Mentions

**Step mentions**: All steps from Collect tab (input + capture)
- Shows step name in autocomplete
- Info steps excluded (no response value)

**Reference media mentions**: Media from Reference Images field
- Shows displayName in autocomplete
- Updates when refMedia changes

### Acceptance Criteria

- [ ] AC-5.1: Prompt editor renders with Lexical
- [ ] AC-5.2: `@` triggers mention autocomplete
- [ ] AC-5.3: Step mentions show steps from Collect tab (excluding info)
- [ ] AC-5.4: Ref mentions show reference images
- [ ] AC-5.5: Prompt value saved to `outcome.imageGeneration.prompt`

---

## 6. Reference Images

### Design

- Media picker component (reuse existing)
- Shows thumbnails of selected images
- Each image shows displayName (editable)
- Remove button on each image

### Behavior

- Add image opens media picker
- Selected images saved as `MediaReference[]`
- displayName defaults to filename
- displayName must be unique within refMedia
- displayName validation (no special characters per PRD 1A)

### Acceptance Criteria

- [ ] AC-6.1: Can add 0..N reference images
- [ ] AC-6.2: Each image shows editable displayName
- [ ] AC-6.3: displayName validation (no `}`, `:`, `{` characters)
- [ ] AC-6.4: Duplicate displayName shows error
- [ ] AC-6.5: Images saved to `outcome.imageGeneration.refMedia`

---

## 7. Model Selector

### Design

- Dropdown with available models
- Shows human-readable model names

### Options (from `aiImageModelSchema`)

| Value | Display Name |
|-------|--------------|
| `gemini-2.5-flash-image` | Gemini 2.5 Flash Image |
| `gemini-3-pro-image-preview` | Gemini 3 Pro Image (Preview) |

### Acceptance Criteria

- [ ] AC-7.1: Dropdown shows all available models
- [ ] AC-7.2: Default selection: `gemini-2.5-flash-image`
- [ ] AC-7.3: Selection saved to `outcome.imageGeneration.model`

---

## 8. Aspect Ratio Selector

### Design

- Segmented control or button group
- Visual representation of each ratio

### Options (from `aiImageAspectRatioSchema`)

| Value | Display | Use Case |
|-------|---------|----------|
| `1:1` | Square | Instagram, profile |
| `3:2` | Landscape | Standard photo |
| `2:3` | Portrait | Standard portrait |
| `9:16` | Tall | Stories, TikTok |
| `16:9` | Wide | Video thumbnail |

### Acceptance Criteria

- [ ] AC-8.1: All aspect ratios shown
- [ ] AC-8.2: Default selection: `1:1`
- [ ] AC-8.3: Selection saved to `outcome.imageGeneration.aspectRatio`

---

## 9. Publish Validation UI

Show validation errors when publish fails.

### Error Display

- Inline errors next to invalid fields
- Summary error at top of form
- Prevent publish until fixed

### Error Messages

| Condition | Message |
|-----------|---------|
| No outcome type | "Select an outcome type" |
| Passthrough without source | "Passthrough mode requires a source image" |
| AI enabled, empty prompt | "Prompt is required" |
| Invalid captureStepId | "Selected source step no longer exists" |
| Duplicate displayName | "Reference images must have unique names" |
| GIF/Video selected | "GIF/Video coming soon" |

### Acceptance Criteria

- [ ] AC-9.1: Validation errors shown inline
- [ ] AC-9.2: Publish button disabled when invalid
- [ ] AC-9.3: Error messages are actionable

---

## 10. Hide Transform Nodes

Ensure no transformNodes UI is accessible.

### Changes

- ~~Remove Generate tab entirely~~ *(done - renamed to Create)*
- Remove any node editor components
- ~~Remove node-related routes~~ *(done - route is now /create)*

### Acceptance Criteria

- [ ] AC-10.1: No transformNodes UI visible anywhere
- [x] AC-10.2: Direct URL to old Generate tab redirects to Create *(done - route renamed, old URL will 404)*
- [ ] AC-10.3: No node-editing functionality accessible

---

## Files Changed

| File | Action | Status |
|------|--------|--------|
| Experience editor tab navigation | MODIFY | **Done** (PR #131) |
| `PromptComposer` | REFACTOR | Decouple from node-based model |
| `ControlRow` | REFACTOR | Accept options via props |
| `useRefMediaUpload` | REFACTOR | Work with `outcome.imageGeneration` |
| `LexicalPromptInput` | REUSE | No changes needed |
| `ReferenceMediaStrip` / `ReferenceMediaItem` | REUSE | No changes needed |
| `lexical/*` (mention system) | REUSE | No changes needed |
| `CreateTabForm` (container) | CREATE | New container for Create tab |
| `OutcomeTypeSelector` | CREATE | Image/GIF/Video selector |
| `SourceImageSelector` | CREATE | Capture step dropdown |
| `AIGenerationToggle` | CREATE | Enable/disable toggle |
| `NodeListItem/*`, `TransformPipelineEditor` | DELETE | Node-centric UI removed |
| `transform-operations.ts` | DELETE | Node operations removed |

---

## Testing

- [ ] Visual test: Create tab layout matches design
- [ ] Integration test: All form fields save to draft config
- [ ] Integration test: Prompt editor mentions work
- [ ] Integration test: AI toggle shows/hides settings
- [ ] Integration test: Switching outcomes preserves imageGeneration
- [ ] Integration test: Publish validation shows errors
- [ ] E2E test: Complete Create tab configuration and publish
