## Implementation Plan

**Part of**: [Inline Prompt Architecture (v2)](./README.md)

### Phase 1a: Schemas & Foundation (2-3 days)

**Goal**: Update schemas to support AI-aware features

**Tasks**:

- [ ] Update `experienceStepNameSchema`:
  - Make required (remove `.optional()`)
  - Add regex validation: `/^[a-zA-Z0-9 \-_]+$/` (letters, numbers, spaces, hyphens, underscores)
  - Keep max length at 50 characters
  - Update comment to reflect support for spaces in names
- [ ] Enhance `multiSelectOptionSchema`:
  - Add `promptFragment: z.string().max(500).optional()`
  - Add `promptMedia: mediaReferenceSchema.optional()`
- [ ] Create `refMediaEntrySchema`:
  - Extend `mediaReferenceSchema` with `displayName`
- [ ] Create `aiImageNodeSchema`:
  - Fields: `model`, `aspectRatio`, `prompt`, `refMedia`
- [ ] Update `transformConfigSchema`:
  - Remove `variableMappings` field (obsolete with inline architecture)
  - Remove `variableMappingSchema` export
- [ ] Update `transformNodeSchema` to support typed configs
- [ ] Write unit tests for schemas

**Files**:

- `packages/shared/src/schemas/experience/step.schema.ts`
- `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`
- `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`
- `packages/shared/src/schemas/experience/nodes/ref-media-entry.schema.ts`
- `packages/shared/src/schemas/experience/transform.schema.ts`

**Success Criteria**:

- ✅ Schemas validate correctly
- ✅ TypeScript types generated
- ✅ Unit tests pass
- ✅ Step names support spaces and are required

---

### Phase 1b: Step Editor Enhancement (3-4 days)

**Goal**: Add step name editing and AI-aware fields to step editors

**Tasks**:

- [ ] **Step name editing**
  - Add step name text input to all step editor settings panels
  - Auto-generate initial name from step type on creation (e.g., "Pet Choice", "User Photo")
  - Validate uniqueness on blur (case-sensitive)
  - Show inline error if name is duplicate or invalid
  - Debounced auto-save
  - Max 50 characters
  - Allow spaces, letters, numbers, hyphens, underscores
- [ ] **Update StepList display**
  - Show `step.name` instead of `step.config.title` in StepList
  - Add fallback to title if name is empty (backward compatibility)
  - Display step type badge/icon next to name
  - Update StepListItem component
- [ ] **Step name uniqueness validation**
  - Implement `useValidateStepName` hook
  - Check uniqueness across all steps in experience
  - Show error message if duplicate found
  - Prevent saving duplicate names
- [ ] Add promptFragment text input to option editor
  - Label: "Prompt Fragment (optional)"
  - Help text: "Text to insert when this option is selected"
  - Max 500 chars
  - Debounced auto-save
- [ ] Add promptMedia picker to option editor
  - Label: "Prompt Media (optional)"
  - Upload button or media library picker
  - Shows thumbnail when set
  - Remove button
- [ ] Visual indicator when option is AI-aware
  - Badge/icon showing "AI-enabled"
  - Visible when promptFragment or promptMedia is set
- [ ] Validation
  - promptFragment max length
  - promptMedia must be valid MediaReference
  - Step names must be unique

**Components** (new or enhanced):

- `domains/experience/designer/components/StepList.tsx`
- `domains/experience/designer/components/StepListItem.tsx`
- `domains/experience/designer/steps/components/StepNameEditor.tsx`
- `domains/experience/designer/steps/components/MultiSelectOptionEditor.tsx`
- `domains/experience/designer/steps/components/PromptFragmentInput.tsx`
- `domains/experience/designer/steps/components/PromptMediaPicker.tsx`

**Hooks** (new):

- `domains/experience/designer/hooks/useValidateStepName.ts`
- `domains/experience/designer/hooks/useUpdateStepName.ts`

**Success Criteria**:

- ✅ Can edit step names with validation
- ✅ Step names are unique and required
- ✅ StepList shows step names instead of titles
- ✅ Can add/edit promptFragment for options
- ✅ Can upload promptMedia for options
- ✅ Changes save to experience draft
- ✅ Visual feedback for AI-enabled options

---

### Phase 1b-2: Transform Pipeline Editor (2-3 days)

**Goal**: Create transform pipeline editor UI foundation

**Tasks**:

- [ ] Add Transform panel to experience designer
  - Show alongside step list (same layout area)
  - Empty state message when no nodes
  - Tab/section switcher between Steps and Transform
- [ ] Node list/canvas UI
  - Display AI Image nodes in list/canvas
  - Node card shows summary (model, aspect ratio, prompt preview)
  - Empty state with "Add Node" button
- [ ] Add AI Image node
  - "Add Node" button
  - Creates new AI Image node with defaults (model: gemini-2.5-pro, aspectRatio: 3:2)
  - Auto-generates node ID
  - Opens node editor panel
- [ ] Delete node
  - Delete button on node card (show on hover)
  - Confirmation dialog
  - Remove from transform config
- [ ] Node display card
  - Shows node type badge ("AI Image Generation")
  - Shows model name
  - Shows aspect ratio
  - Shows prompt preview (first 50 chars)
  - Click card to edit
- [ ] Save transform config
  - Auto-save to experience.draft.transform
  - Debounced updates (2000ms)
  - Save status indicator
- [ ] Node editor panel (placeholder structure)
  - Opens in sidebar when node is selected
  - Basic layout with sections for: Model Settings, Prompt, RefMedia, Test Run
  - Section placeholders only - detailed config added in Phase 1c-1e
  - Close button

**Components** (new):

- `domains/experience/designer/transform/containers/TransformPipelineEditor.tsx`
- `domains/experience/designer/transform/components/TransformPanel.tsx`
- `domains/experience/designer/transform/components/NodeList.tsx`
- `domains/experience/designer/transform/components/AIImageNodeCard.tsx`
- `domains/experience/designer/transform/components/AddNodeButton.tsx`
- `domains/experience/designer/transform/components/DeleteNodeDialog.tsx`
- `domains/experience/designer/transform/components/NodeEditorPanel.tsx`

**Hooks** (new):

- `domains/experience/designer/transform/hooks/useUpdateTransformConfig.ts`
- `domains/experience/designer/transform/hooks/useAddNode.ts`
- `domains/experience/designer/transform/hooks/useDeleteNode.ts`
- `domains/experience/designer/transform/hooks/useSelectedNode.ts`

**Success Criteria**:

- ✅ Transform panel visible in experience designer
- ✅ Can add AI Image node
- ✅ Node card displays summary (model, aspect ratio, prompt preview)
- ✅ Can delete node with confirmation
- ✅ Node editor panel opens when node selected
- ✅ Node editor panel has placeholder sections
- ✅ Transform config saves to experience draft
- ✅ Auto-save and save status work

---

### Phase 1c: RefMedia Management (2-3 days)

**Goal**: Build refMedia section in AI node editor panel (builds on Phase 1b-2)

**Tasks**:

- [ ] RefMedia section UI
  - Similar to current media registry
  - Thumbnail grid layout
  - Empty state
- [ ] Upload/add media
  - Upload button
  - File picker or drag-drop
  - Upload to Firebase Storage
  - Create RefMediaEntry
- [ ] Auto-generate displayName
  - Extract from fileName
  - Editable text input
  - Validate uniqueness
- [ ] Display media
  - Thumbnail with displayName label
  - Hover shows full fileName
- [ ] Delete media
  - Delete button on hover
  - Confirmation dialog
- [ ] Reorder media (optional)
  - Drag-drop to reorder (if needed)

**Components** (new):

- `domains/experience/designer/transform/components/RefMediaSection.tsx`
- `domains/experience/designer/transform/components/RefMediaGrid.tsx`
- `domains/experience/designer/transform/components/RefMediaItem.tsx`
- `domains/experience/designer/transform/components/AddRefMediaDialog.tsx`

**Hooks** (new):

- `domains/experience/designer/transform/hooks/useUpdateRefMedia.ts`

**Success Criteria**:

- ✅ Can upload media to refMedia
- ✅ DisplayName auto-generated and editable
- ✅ DisplayName uniqueness validated
- ✅ Can delete refMedia
- ✅ Changes save to experience draft

---

### Phase 1d: Lexical Prompt Editor (3-4 days)

**Goal**: Build Lexical prompt editor in AI node editor panel (builds on Phase 1b-2)

**Tasks**:

- [ ] Create PromptEditor component
  - Based on `domains/ai-presets/editor/components/PromptTemplateEditor.tsx`
  - Adapt for experience context
- [ ] Implement StepMentionNode
  - Blue pill display
  - Serialize: `@{step:stepName}` (step names can contain spaces, e.g., `@{step:Pet Choice}`)
  - Deserialize with step lookup
  - Parse using regex: `/@\{step:([^}]+)\}/g` to handle spaces
- [ ] Implement MediaMentionNode
  - Green pill display
  - Serialize: `@{ref:mediaAssetId}`
  - Deserialize with displayName lookup
- [ ] MentionsPlugin configuration
  - Trigger on `@` character
  - Autocomplete with steps + refMedia
  - Insert appropriate node type
- [ ] Autocomplete component
  - Show steps (with type icon)
  - Show refMedia (with thumbnail)
  - Search/filter by name
  - Keyboard navigation
- [ ] Serialization utils
  - `serializeToPlainText()`: EditorState → `@{step:name}` or `@{ref:id}` format
  - `deserializeFromPlainText()`: Plain text → EditorState
  - Support step names with spaces (e.g., `@{step:Pet Choice}`)
  - Parse using regex: `/@\{step:([^}]+)\}/g` and `/@\{ref:([^}]+)\}/g`
- [ ] Character count display
- [ ] Validation
  - Check for undefined step references
  - Check for undefined refMedia references

**Components** (new):

- `domains/experience/designer/transform/components/PromptEditor.tsx`
- `domains/experience/designer/transform/components/MentionAutocomplete.tsx`
- `domains/experience/designer/transform/components/StepMentionPill.tsx`
- `domains/experience/designer/transform/components/MediaMentionPill.tsx`

**Lexical infrastructure** (adapt from ai-presets):

- `domains/experience/designer/transform/lexical/nodes/StepMentionNode.ts`
- `domains/experience/designer/transform/lexical/nodes/MediaMentionNode.ts`
- `domains/experience/designer/transform/lexical/plugins/MentionsPlugin.tsx`
- `domains/experience/designer/transform/lexical/utils/serialization.ts`

**Success Criteria**:

- ✅ Can type `@` to trigger autocomplete
- ✅ Autocomplete shows steps and refMedia
- ✅ Can insert step mentions (blue pills)
- ✅ Can insert media mentions (green pills)
- ✅ Serializes correctly to storage format
- ✅ Deserializes correctly to display format
- ✅ Character count updates
- ✅ Validation shows undefined references

---

### Phase 1e: AI Node Settings (1-2 days)

**Goal**: Add model and aspect ratio controls to AI node editor panel (builds on Phase 1b-2)

**Tasks**:

- [ ] Model dropdown
  - Options: gemini-2.5-flash, gemini-2.5-pro, gemini-3.0
  - Default: gemini-2.5-pro
- [ ] Aspect ratio dropdown
  - Options: 1:1, 3:2, 2:3, 9:16, 16:9
  - Default: 3:2
- [ ] Auto-save integration
  - Debounce updates (2000ms)
  - Save to experience draft
- [ ] Save status indicator
  - Reuse shared editor-status module
  - Show "Saving...", "Saved", "Error"

**Components** (new):

- `domains/experience/designer/transform/components/ModelSettings.tsx`

**Hooks** (adapt):

- `domains/experience/designer/hooks/useUpdateExperienceDraft.ts`

**Success Criteria**:

- ✅ Can select model
- ✅ Can select aspect ratio
- ✅ Changes auto-save
- ✅ Save status indicator works

---

### Phase 1f: Resolution Logic (3-4 days)

**Goal**: Implement prompt resolution algorithm

**Tasks**:

- [ ] Parse mention patterns
  - `parseStepMentions()`: Extract `@{step:...}` patterns
  - `parseRefMentions()`: Extract `@{ref:...}` patterns
- [ ] Resolve step mentions
  - Capture step → `<mediaAssetId>`
  - Multiselect step → promptFragment + auto-ref
  - Text step → input value
  - Handle multi-selection (comma join)
  - Handle missing options (fallback to value)
- [ ] Resolve refMedia mentions
  - `@{ref:mediaAssetId}` → `<mediaAssetId>`
- [ ] Extract media references
  - `extractMediaIds()`: Find all `<...>` patterns
  - Deduplicate
  - Exclude `<missing>`
- [ ] Validation
  - Check for undefined step references
  - Check for undefined refMedia references
  - Check for missing required inputs
- [ ] Unit tests
  - Test all step types
  - Test multi-selection
  - Test missing references
  - Test media extraction

**Files** (new):

- `domains/experience/designer/transform/lib/prompt-resolution.ts`
- `domains/experience/designer/transform/lib/prompt-resolution.test.ts`
- `domains/experience/designer/transform/lib/validation.ts`
- `domains/experience/designer/transform/lib/validation.test.ts`

**Success Criteria**:

- ✅ Resolution algorithm works for all step types
- ✅ Multi-selection joins correctly
- ✅ Media references extracted correctly
- ✅ Validation catches errors
- ✅ Unit tests pass (100% coverage)

---

### Phase 1g: Test Run Dialog (3-4 days)

**Goal**: Build test run dialog for AI node

**Tasks**:

- [ ] Test run button in AI node editor
  - Opens dialog
  - Passes node config + experience steps
- [ ] Test input form generation
  - Parse prompt for step references
  - Generate input field per step type:
    - Capture → Image upload
    - Multiselect → Dropdown (or checkboxes if multiSelect)
    - Text → Text input
  - Pre-fill with defaults (if any)
  - Required field indicators
- [ ] Real-time resolution
  - Listen to input changes
  - Debounce resolution (300ms)
  - Update preview on change
- [ ] Resolved prompt display
  - Show resolved text
  - Character count
  - Highlight `<missing>` placeholders
- [ ] Media preview grid
  - Show all referenced media
  - Thumbnails with labels
  - "X of Y media" indicator
  - Distinguish: capture, step option, refMedia
- [ ] Validation display
  - Status indicator (valid/invalid/incomplete)
  - List errors (missing required inputs)
  - List warnings (undefined references)
  - Click error → focus input field
- [ ] Test generation button (placeholder)
  - Disabled state when invalid
  - Tooltip explaining why disabled
  - Placeholder UI (will implement in Phase 5)

**Components** (new):

- `domains/experience/designer/transform/components/TestRunDialog.tsx`
- `domains/experience/designer/transform/components/TestInputsForm.tsx`
- `domains/experience/designer/transform/components/TestInputField.tsx`
- `domains/experience/designer/transform/components/ResolvedPromptDisplay.tsx`
- `domains/experience/designer/transform/components/MediaPreviewGrid.tsx`
- `domains/experience/designer/transform/components/ValidationDisplay.tsx`
- `domains/experience/designer/transform/components/TestGenerationButton.tsx`

**Hooks** (new):

- `domains/experience/designer/transform/hooks/useTestInputs.ts` (Zustand store)
- `domains/experience/designer/transform/hooks/usePromptResolution.ts`
- `domains/experience/designer/transform/hooks/usePromptValidation.ts`
- `domains/experience/designer/transform/hooks/useMediaReferences.ts`

**Success Criteria**:

- ✅ Test run dialog opens
- ✅ Input form generated from prompt
- ✅ Can enter test values
- ✅ Resolved prompt updates in real-time
- ✅ Media preview shows correct images
- ✅ Validation shows errors/warnings
- ✅ Test generation button disabled when invalid

---

### Phase 1h: Testing & Documentation (2 days)

**Goal**: Ensure quality and document the system

**Tasks**:

- [ ] End-to-end testing
  - Create new experience from scratch
  - Add multiselect with AI options (promptFragment, promptMedia)
  - Configure AI node (model, prompt, refMedia)
  - Test run with test inputs
  - Verify resolution works correctly
  - Publish experience
  - Test in guest runtime
- [ ] Component testing
  - Test Lexical editor (mention insertion, serialization)
  - Test resolution algorithm (all step types)
  - Test validation (errors, warnings)
  - Test refMedia management (upload, edit, delete)
- [ ] Bug fixes
  - Address any issues found during testing
  - Fix edge cases
- [ ] Documentation
  - Update developer docs
  - Add code comments
  - Create usage examples
  - Update CLAUDE.md if needed

**Success Criteria**:

- ✅ E2E workflow works smoothly
- ✅ All components tested
- ✅ No critical bugs
- ✅ Documentation complete

---

### Phase 1 Total: ~21-27 days (4-5 weeks)

**Phase breakdown:**
- Phase 1a: 2-3 days
- Phase 1b: 3-4 days
- Phase 1b-2: 2-3 days (Transform Pipeline Editor)
- Phase 1c: 2-3 days
- Phase 1d: 3-4 days
- Phase 1e: 1-2 days
- Phase 1f: 3-4 days
- Phase 1g: 3-4 days
- Phase 1h: 2 days

Each sub-phase is **1-4 days**, making progress trackable and manageable.

---

## Code Reuse from AI Presets

The inline prompt architecture leverages significant code from the AI Presets implementation (Phases 1-4). Rather than starting from scratch, we adapt proven patterns and components.

### Reusable Code (~60% reuse)

#### Lexical Infrastructure (~90% reuse)

**Location**: `domains/ai-presets/lexical/`

**Reusable Components**:

- ✅ Mention node architecture (adapt for step/refMedia types)
- ✅ Autocomplete plugin pattern
- ✅ Serialization/deserialization utilities
- ✅ Smart paste plugin (convert plain @mentions)
- ✅ Mention validation plugin

**Adaptation Required**:

- Change mention types: `text`/`input`/`ref` → `step`/`ref`
- Update autocomplete data source: preset variables → experience steps
- Adjust serialization format: `@{text:var}` → `@{step:stepName}`
- Support step names with spaces (e.g., `@{step:Pet Choice}`)
- Update parsing regex to handle spaces within braces: `/@\{step:([^}]+)\}/g`

**New Location**: `domains/experience/designer/transform/lexical/`

---

#### Resolution & Validation Logic (~70% reuse)

**Location**: `domains/ai-presets/preview/lib/`

**Reusable Components**:

- ✅ Core resolution algorithm structure
- ✅ Validation patterns (missing refs, required fields)
- ✅ Media reference extraction logic
- ✅ Type guards and utilities

**Adaptation Required**:

- Replace preset variable resolution → step-based resolution
- Handle step types (capture, multiselect, text)
- Auto-reference pattern for step promptMedia
- mediaAssetId-based refs instead of names

**New Location**: `domains/experience/designer/transform/lib/`

---

#### Preview Components (UI Patterns)

**Location**: `domains/ai-presets/preview/components/`

**Reusable Patterns**:

- ✅ Test input form structure
- ✅ Resolved prompt display layout
- ✅ Media preview grid
- ✅ Validation display (errors/warnings)
- ✅ Test generation button (placeholder)

**Adaptation Required**:

- Generate inputs from experience steps (not preset variables)
- Adapt media grid for step promptMedia + refMedia
- Update validation messages for steps

**New Location**: `domains/experience/designer/transform/components/`

---

#### Media Management

**Location**: `domains/ai-presets/editor/components/`

**Reusable Components**:

- ✅ Upload hooks (`useUploadMediaAsset`)
- ✅ Media picker dialog patterns
- ✅ Thumbnail display components
- ✅ Media grid layout

**Adaptation Required**:

- Add displayName field to refMedia
- Validate displayName uniqueness
- Generate displayName from fileName

**New Location**: `domains/experience/designer/transform/components/`

---

### What to Archive (No Migration Needed)

Since we're pre-launch with no production data, we can archive the AI Presets implementation without migration:

**Archive Location**: `domains/_archived/ai-presets/`

**Files to Archive**:

- Preset CRUD services
- Preset editor containers
- Preset list page
- Variable management UI
- Value mappings editor
- Preset schemas

**Keep for Reference**: Documentation and learned patterns

---

### Code Reuse Strategy

1. **Copy Lexical Infrastructure**
   - Copy `domains/ai-presets/lexical/` → `domains/experience/designer/transform/lexical/`
   - Adapt mention node types
   - Update serialization patterns

2. **Adapt Resolution Logic**
   - Reference `domains/ai-presets/preview/lib/prompt-resolution.ts`
   - Rewrite for step-based resolution
   - Keep core algorithm structure

3. **Reuse UI Patterns**
   - Reference preview component layouts
   - Build new components with similar structure
   - Maintain consistent UX

4. **Leverage Media Components**
   - Reuse upload hooks directly
   - Adapt media grid for refMedia
   - Add displayName management

**Estimated Effort Savings**: ~60% compared to building from scratch

---

## Edge Cases & Validation

### Edge Case 1: Empty PromptFragment with PromptMedia

**Scenario**:

```typescript
Option: {
  value: "cat",
  promptFragment: "",  // Empty
  promptMedia: { mediaAssetId: "cat123" }
}
```

**Resolution**: Fallback to value

```
"cat (see <cat123>)"
```

**Rationale**: Provide sensible default rather than error

---

### Edge Case 2: Multi-Selection with Empty Array

**Scenario**:

```typescript
Step: multiSelect = true
Input: [] // No selections
```

**Resolution**: `<missing>` placeholder

**Rationale**: Indicates missing input clearly

---

### Edge Case 3: Undefined Step Reference

**Scenario**:

```typescript
Prompt: "@{step:unknownStep}"
Experience has no step named "unknownStep"
```

**Resolution**:

- Resolved: `<missing>`
- Validation: Error "Step 'unknownStep' not found"

**UI**: Show error in validation display, highlight in prompt editor

---

### Edge Case 4: Undefined RefMedia Reference

**Scenario**:

```typescript
Prompt: "@{ref:abc123xyz}"
Node refMedia doesn't include mediaAssetId "abc123xyz"
```

**Resolution**:

- Resolved: `<abc123xyz>` (placeholder kept)
- Validation: Warning "Media 'abc123xyz' not found in refMedia"

**Rationale**: Allow missing media to pass (might be from step option)

---

### Edge Case 5: DisplayName Collision

**Scenario**:

```typescript
RefMedia: [
  { mediaAssetId: 'abc', displayName: 'overlay' },
  { mediaAssetId: 'xyz', displayName: 'overlay' }, // Duplicate!
]
```

**Validation**: Error "DisplayName 'overlay' is used by multiple media. Names must be unique."

**UI**: Show error when adding/editing refMedia

---

### Edge Case 5a: Step Name Collision

**Scenario**:

```typescript
Steps: [
  { id: 'abc', name: 'Pet Choice', type: 'input.multiSelect' },
  { id: 'xyz', name: 'Pet Choice', type: 'input.multiSelect' }, // Duplicate!
]
```

**Validation**: Error "Step name 'Pet Choice' is already used. Names must be unique."

**UI**:
- Show inline error when editing step name
- Prevent saving duplicate names
- Suggest alternative names (e.g., "Pet Choice 2")

**Enforcement**:
- Case-sensitive matching ("Pet Choice" ≠ "pet choice")
- Validated on blur and on save
- Implemented in `useValidateStepName` hook

---

### Edge Case 6: Step Name Changes

**Scenario**:

1. Step named "Pet Choice" is referenced in prompt
2. User renames step to "Animal Choice"
3. Prompt still has `@{step:Pet Choice}`

**Solution**: Validation warning "Step 'Pet Choice' not found. Did you rename it?"

**Future Enhancement**: Auto-update references when step renamed

**Note**: Step names support spaces (e.g., "Pet Choice", "User Photo")

---

### Edge Case 7: Capture Step with No Upload

**Scenario**:

```typescript
Step: capture-photo
Test input: null (no image uploaded yet)
```

**Resolution**: `<missing>`

**Validation**: Error "Image required for step 'captureStep'"

---

### Edge Case 8: Text Step with Empty Input

**Scenario**:

```typescript
Step: input-short-text (required: true)
Test input: ""  // Empty string
```

**Resolution**: `<missing>`

**Validation**: Error "Value required for step 'phraseStep'"

---

### Validation Summary

**Errors** (block test generation):

- Missing required step inputs
- Undefined step references in prompt
- DisplayName collisions in refMedia
- Step name collisions (duplicate step names)
- Invalid step names (special characters, too long)

**Warnings** (allow test generation):

- Undefined refMedia references (might be from step options)
- Empty optional inputs

**Validation UI**:

```typescript
interface ValidationState {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: Array<{
    field: string
    message: string
  }>
  warnings: Array<{
    type: string
    message: string
  }>
}

// Status logic:
// 'incomplete' - Has errors (missing required)
// 'invalid' - Has warnings only
// 'valid' - No errors or warnings
```

---

### Validation Summary

**Errors** (block test generation):

- Missing required step inputs
- Undefined step references in prompt
- DisplayName collisions in refMedia
- Step name collisions (duplicate step names)
- Invalid step names (special characters, too long)

**Warnings** (allow test generation):

- Undefined refMedia references (might be from step options)
- Empty optional inputs

**Validation UI**:

```typescript
interface ValidationState {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: Array<{
    field: string
    message: string
  }>
  warnings: Array<{
    type: string
    message: string
  }>
}

// Status logic:
// 'incomplete' - Has errors (missing required)
// 'invalid' - Has warnings only
// 'valid' - No errors or warnings
```

---

## Appendix

### Gemini API Integration

```typescript
async function generateImage(
  node: AIImageNode,
  inputs: Record<string, any>,
  steps: ExperienceStep[],
): Promise<GeneratedImage> {
  // 1. Resolve prompt
  const resolved = resolvePrompt(
    node.config.prompt,
    steps,
    inputs,
    node.config.refMedia,
  )

  // 2. Fetch media data for all references
  const mediaParts = await Promise.all(
    resolved.mediaReferences.map(async (mediaId) => {
      const mediaData = await fetchMediaData(mediaId)
      return [
        { text: `Image Reference ID: <${mediaId}>` },
        mediaData, // Binary image data
      ]
    }),
  )

  // 3. Build Gemini request
  const parts = [...mediaParts.flat(), { text: resolved.text }]

  // 4. Call Gemini API
  const model = genAI.getGenerativeModel({ model: node.config.model })
  const result = await model.generateContent(parts)

  // 5. Return generated image
  return {
    url: result.response.candidates[0].content.parts[0].url,
    metadata: {
      model: node.config.model,
      aspectRatio: node.config.aspectRatio,
      promptLength: resolved.characterCount,
      mediaCount: resolved.mediaReferences.length,
    },
  }
}
```

---

### Future Enhancements (Out of Scope)

**Phase 2: Yes/No Steps**

- Implement yes/no with AI-aware options
- Similar to multiselect but simpler

**Phase 3: Template Library** (if needed)

- Workspace-level prompt templates
- "New from Template" / "Save as Template"
- Copy-based (not reference-based)

**Phase 4: Advanced Features**

- Step name change auto-update
- Prompt versioning
- Prompt analytics (which prompts work best)
- Bulk operations (duplicate node, etc.)

**Phase 5: DisplayMedia Field**

- Add `displayMedia` to step options
- Show in selection UI (separate from promptMedia)
- Visual preview during step selection

---

## Summary

The **Inline Prompt Architecture (v2)** provides a streamlined, intuitive approach to AI prompt configuration:

✅ **Simple**: No presets, no mapping - just inline configuration
✅ **Stable**: MediaAssetId-based references never break
✅ **Visual**: Lexical editor with colored pills
✅ **Flexible**: Direct step references, auto-composition
✅ **Testable**: Live preview with test run dialog
✅ **LLM-Ready**: Resolved format matches Gemini API exactly

**Three-Format System**:

- Storage: `@{step:name}`, `@{ref:mediaAssetId}` (parseable, supports spaces: `@{step:Pet Choice}`)
- Display: `@stepName`, `@displayName` (user-friendly pills in Lexical editor)
- Resolved: `<mediaAssetId>` (LLM-ready)

**Step Names**:

- Support spaces and human-friendly naming (e.g., "Pet Choice", "User Photo")
- Required and must be unique (case-sensitive)
- Max 50 characters, letters/numbers/spaces/hyphens/underscores only

**Implementation**: 9 phases, ~4-5 weeks total

**Code Reuse**: ~60% from AI Presets (Lexical, resolution, UI patterns)

**Next Steps**: Begin Phase 1a (Schemas & Foundation)
