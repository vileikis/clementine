# Epic E2: Step System & Editor

> **Epic Series:** Experience System
> **Dependencies:** E1 (Data Layer & Library)
> **Enables:** E3 (Event Integration), E5 (Session & Runtime)

---

## 1. Goal

Enable admins to build experiences by adding, configuring, and previewing steps within a 3-column experience editor.

**This epic delivers:**

- Step registry with all MVP step types
- Step renderers (edit mode) for visual preview
- 3-column experience editor layout
- Step list with add/remove/reorder
- Step config panels for each step type
- Auto-save to draft
- Publish button (draft → published)

**This epic does NOT include:**

- Run mode renderers (E5)
- Event-experience assignment (E3)
- Session or runtime (E5)

---

## 2. Step Types

### 2.1 Step Categories

| Category    | Description        | Profiles                |
| ----------- | ------------------ | ----------------------- |
| `info`      | Display content    | freeform, survey, story |
| `input`     | Collect user input | freeform, survey        |
| `capture`   | Capture media      | freeform, survey        |
| `transform` | AI processing      | freeform only           |

### 2.2 MVP Step Types

| Type                 | Category  | Description         | Config Fields                           |
| -------------------- | --------- | ------------------- | --------------------------------------- |
| `info`               | info      | Display information | title, description, media               |
| `input.scale`        | input     | Opinion scale       | question, min, max, labels              |
| `input.yesNo`        | input     | Yes/No question     | question                                |
| `input.multiSelect`  | input     | Multiple choice     | question, options, minSelect, maxSelect |
| `input.shortText`    | input     | Short text input    | question, placeholder, maxLength        |
| `input.longText`     | input     | Long text input     | question, placeholder, maxLength        |
| `capture.photo`      | capture   | Photo capture       | instructions, countdown, overlay        |
| `transform.pipeline` | transform | AI processing       | (placeholder - "Coming soon")           |

**Note:** `transform.pipeline` shows "Coming soon" in edit mode preview and has a "Continue" button in run mode (E5). Full implementation in E9.

### 2.3 Profile-Based Filtering

| Profile    | Allowed Categories              | Allowed Step Types      |
| ---------- | ------------------------------- | ----------------------- |
| `freeform` | info, input, capture, transform | All                     |
| `survey`   | info, input, capture            | All except transform.\* |
| `story`    | info                            | info only               |

---

## 3. Step Registry

### 3.1 Registry Structure

```typescript
interface StepDefinition {
  type: string                    // e.g., 'input.scale'
  category: StepCategory          // 'info' | 'input' | 'capture' | 'transform'
  label: string                   // Display name
  icon: LucideIcon               // Icon component

  configSchema: z.ZodSchema       // Zod schema for config
  defaultConfig: () => StepConfig // Factory for default config

  EditRenderer: React.ComponentType<StepRendererProps>
  ConfigPanel: React.ComponentType<StepConfigPanelProps>
}

const stepRegistry: Record<string, StepDefinition> = {
  'info': { ... },
  'input.scale': { ... },
  'input.yesNo': { ... },
  // ...
}
```

### 3.2 Step Schema

```typescript
export const stepSchema = z.object({
  id: z.string(), // UUID
  type: z.string(), // Step type from registry
  config: z.record(z.any()), // Type-specific config
});

export type Step = z.infer<typeof stepSchema>;
```

---

## 4. Experience Editor

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Workspace / Experiences / [Name]      [Publish] │
├──────────────┬─────────────────────────┬────────────────────┤
│              │                         │                    │
│  Step List   │    Step Preview         │   Step Config      │
│              │    (Edit Mode)          │   Panel            │
│  [+ Add]     │                         │                    │
│              │                         │                    │
│  • Step 1    │    ┌─────────────┐     │   Title: [____]    │
│  • Step 2 ←  │    │             │     │   Description:     │
│  • Step 3    │    │   Preview   │     │   [____________]   │
│              │    │             │     │                    │
│              │    └─────────────┘     │                    │
│              │                         │                    │
└──────────────┴─────────────────────────┴────────────────────┘
```

### 4.2 Components

**ExperienceEditorPage** (`domains/experience/designer/containers/`)

- Loads experience data
- Manages selected step state (URL param: `?step=stepId`)
- Orchestrates 3-column layout
- Handles auto-save and publish

**StepList** (`domains/experience/designer/components/`)

- Displays steps with icons and labels
- Selected step highlighted
- Drag-to-reorder with @dnd-kit
- "Add Step" button opens step type picker
- Context menu: Delete step

**StepPreview** (`domains/experience/designer/components/`)

- Phone frame preview shell
- Renders `StepRenderer` in edit mode
- Shows placeholder when no step selected

**StepConfigPanel** (`domains/experience/designer/components/`)

- Renders config panel from step registry
- Form fields update step config
- Changes trigger auto-save

**AddStepDialog** (`domains/experience/designer/components/`)

- Modal with step type grid
- Filtered by experience profile
- Groups by category
- Shows icon, label, description

---

## 5. Step Renderers (Edit Mode)

### 5.1 Renderer Contract

```typescript
interface StepRendererProps {
  mode: "edit" | "run";
  step: Step;
  config: StepConfig;
  // Run mode props (not used in edit)
  onNext?: () => void;
  onAnswer?: (answer: unknown) => void;
}
```

### 5.2 Edit Mode Behavior

- **Non-interactive**: No form inputs respond to clicks
- **Visual preview**: Shows how step will look to guest
- **Live updates**: Reflects config changes immediately
- **Placeholder content**: Uses config values or placeholder text

### 5.3 Renderer Examples

**InfoStepRenderer (edit mode)**

- Shows title (or "Add a title...")
- Shows description (or placeholder)
- Shows media if configured

**InputScaleRenderer (edit mode)**

- Shows question text
- Shows scale buttons (disabled)
- Shows min/max labels

**CapturePhotoRenderer (edit mode)**

- Shows camera placeholder graphic
- Shows instructions text
- Shows countdown value

**TransformPipelineRenderer (edit mode)**

- Shows "AI Processing" title
- Shows "Coming soon" badge
- Shows placeholder graphic

---

## 6. Step Config Panels

### 6.1 Panel Structure

Each step type has a dedicated config panel with appropriate form fields.

**InfoStepConfigPanel**

- Title input
- Description textarea
- Media picker (from media library)

**InputScaleConfigPanel**

- Question input
- Min value (number)
- Max value (number)
- Min label input
- Max label input

**InputYesNoConfigPanel**

- Question input

**InputMultiSelectConfigPanel**

- Question input
- Options list (add/remove/reorder)
- Min selections
- Max selections

**InputShortTextConfigPanel**

- Question input
- Placeholder input
- Max length

**InputLongTextConfigPanel**

- Question input
- Placeholder input
- Max length

**CapturePhotoConfigPanel**

- Instructions input
- Countdown toggle + value
- Overlay picker (future)

**TransformPipelineConfigPanel**

- "Coming soon" message
- No configurable options yet

---

## 7. Auto-Save & Publish

### 7.1 Auto-Save

- Debounced save (500ms after last change)
- Saves to `experience.draft.steps`
- Updates `experience.updatedAt`
- Visual indicator: "Saving..." / "Saved"

### 7.2 Publish

- "Publish" button in header
- Copies `draft` to `published`
- Sets `publishedAt` and `publishedBy`
- Visual indicator: "Publishing..." / "Published"
- Success toast notification

### 7.3 Publish Validation

Before publish, validate:

- At least one step exists
- All steps have valid config (per schema)
- Profile constraints satisfied (step types allowed)

Show validation errors if publish blocked.

---

## 8. Implementation Phases

### Phase 1: Step Registry & Schemas

Define step registry structure, schemas for all MVP step types, and profile-based filtering utility.

### Phase 2: Editor Layout

Build 3-column editor layout, step list with selection, and placeholder panels.

### Phase 3: Step Renderers (Edit Mode)

Implement edit mode renderers for all step types. Non-interactive visual previews.

### Phase 4: Step Config Panels

Build config panel components for each step type with form fields.

### Phase 5: Step Management

Add step dialog (filtered by profile), drag-to-reorder, delete step, URL-synced selection.

### Phase 6: Auto-Save & Publish

Implement debounced auto-save, publish flow with validation, visual indicators.

---

## 9. Acceptance Criteria

### Must Have

- [ ] Step registry contains all MVP step types
- [ ] Experience editor shows 3-column layout
- [ ] Admin can add steps (filtered by profile)
- [ ] Admin can reorder steps via drag-and-drop
- [ ] Admin can delete steps
- [ ] Selecting step shows preview and config panel
- [ ] Edit mode renderers display step content non-interactively
- [ ] Config panel changes update preview immediately
- [ ] Changes auto-save to draft
- [ ] Admin can publish (draft → published)
- [ ] Publish validates step config and profile constraints

### Nice to Have

- [ ] Undo/redo for step changes
- [ ] Duplicate step action
- [ ] Step templates/presets

---

## 10. Technical Notes

### Folder Structure

```
domains/experience/
├── steps/
│   ├── registry.ts              # Step registry
│   ├── schemas/                 # Step config schemas
│   │   ├── info.schema.ts
│   │   ├── input-scale.schema.ts
│   │   └── ...
│   ├── renderers/               # Step renderers
│   │   ├── InfoStepRenderer.tsx
│   │   ├── InputScaleRenderer.tsx
│   │   └── ...
│   └── config-panels/           # Config panels
│       ├── InfoStepConfigPanel.tsx
│       ├── InputScaleConfigPanel.tsx
│       └── ...
├── designer/
│   ├── containers/
│   │   └── ExperienceEditorPage.tsx
│   └── components/
│       ├── StepList.tsx
│       ├── StepPreview.tsx
│       ├── StepConfigPanel.tsx
│       └── AddStepDialog.tsx
└── shared/
    └── hooks/
        ├── useUpdateExperienceDraft.ts
        └── usePublishExperience.ts
```

---

## 11. Out of Scope

| Item                              | Epic |
| --------------------------------- | ---- |
| Run mode renderers                | E5   |
| Event-experience assignment       | E3   |
| Session creation                  | E5   |
| Runtime engine                    | E5   |
| Photo capture implementation      | E5   |
| Transform pipeline implementation | E9   |
