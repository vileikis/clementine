# Inline Prompt Architecture with Template Library

**Status**: Approved
**Created**: 2026-01-29
**Replaces**: AI Presets (Phases 1-4)

---

## Executive Summary

This document specifies the **Inline Prompt Architecture** - a revised approach to AI prompt configuration that embeds prompt configuration directly in Experience transform pipelines, supported by an optional workspace-level Prompt Template Library.

### Key Decisions

1. **Inline AI Configuration**: Prompt configuration lives in Experience transform pipeline (not separate presets)
2. **Prompt Template Library**: Workspace-level templates provide reusable starting points (copy-based, not reference-based)
3. **Enhanced Steps**: Experience steps support AI-aware fields (prompt fragments, media references)
4. **Direct Step Mentions**: Prompts reference steps by name using `@step_name` syntax
5. **Copy Model**: Templates are copied into experiences, not referenced (no fragile coupling)

### Architecture Goals

✅ **Simplify Workflow**: Remove preset-to-experience mapping layer
✅ **Enable Model Flexibility**: Easy to vary model/settings per experience
✅ **Support Prompt Patterns**: Share common prompts via template library
✅ **Prioritize Prompt Engineering**: Dedicated template workspace with testing
✅ **Marketplace Ready**: Experiences are complete, self-contained units
✅ **Progressive Complexity**: Simple inline (beginners) → Templates (advanced)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Document Hierarchy](#document-hierarchy)
3. [Data Models & Schemas](#data-models--schemas)
4. [User Workflows & Scenarios](#user-workflows--scenarios)
5. [Implementation Plan](#implementation-plan)
6. [Migration from AI Presets](#migration-from-ai-presets)
7. [Technical Details](#technical-details)
8. [Open Questions](#open-questions)

---

## Architecture Overview

### Two-Layer System

```
┌─────────────────────────────────────────────────────────┐
│         WORKSPACE PROMPT TEMPLATE LIBRARY               │
│              (Optional, Reusable Patterns)              │
│                                                         │
│  Templates:                                             │
│    - "Hobbitify Portrait"                               │
│    - "Pirate Adventure"                                 │
│    - "Space Explorer"                                   │
│                                                         │
│  Each has:                                              │
│    - Prompt template                                    │
│    - Suggested variable names                           │
│    - Media registry                                     │
│    - Tags, description                                  │
└─────────────────────────────────────────────────────────┘
                      │
                      │ Copy (not reference)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPERIENCE                           │
│                                                         │
│  Steps (AI-Aware):                                      │
│    - captureStep (photo)                                │
│    - petStep (multiselect)                              │
│        options: [                                       │
│          { value: "cat",                                │
│            prompt: "holding a cat (see @cat)",          │
│            media: <cat_ref> },                          │
│          { value: "dog",                                │
│            prompt: "holding a dog (see @dog)",          │
│            media: <dog_ref> }                           │
│        ]                                                │
│    - bgStep (multiselect)                               │
│        options: [                                       │
│          { value: "hobbiton",                           │
│            prompt: "in the Shire @hobbiton",            │
│            media: <hobbiton_ref> }                      │
│        ]                                                │
│                                                         │
│  Transform Pipeline:                                    │
│    AI Image Node (inline):                              │
│      model: "gemini-2.5-pro"                            │
│      aspectRatio: "3:2"                                 │
│      promptTemplate:                                    │
│        "Transform @captureStep into hobbit              │
│         @petStep @bgStep"                               │
│      mediaRegistry: [                                   │
│        { name: "cat", mediaId: "..." },                 │
│        { name: "dog", mediaId: "..." },                 │
│        { name: "hobbiton", mediaId: "..." }             │
│      ]                                                  │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Experience is the Unit**: Complete, self-contained configuration
2. **Copy, Don't Reference**: Templates → experiences (no live binding)
3. **Direct Step References**: `@step_name` in prompts (no mapping layer)
4. **Flexible Customization**: Each experience can vary model, steps, media
5. **Optional Templates**: Start inline or from template (progressive disclosure)

---

## Document Hierarchy

### Firestore Collections

```
/workspaces/{workspaceId}/
  ├── promptTemplates/{templateId}     # NEW: Template library
  │   ├── name: "Hobbitify Portrait"
  │   ├── promptTemplate: "Transform @photo..."
  │   ├── suggestedVariables: ["photo", "pet", "background"]
  │   ├── mediaRegistry: [...]
  │   └── tags: ["fantasy", "portrait"]
  │
  ├── experiences/{experienceId}       # ENHANCED: AI-aware steps
  │   ├── steps: [...]                 # Now with prompt/media fields
  │   └── transformConfig:
  │       └── nodes: [
  │           {
  │             type: "ai.imageGeneration",
  │             config: {               # INLINE: Full AI config
  │               model: "gemini-2.5-pro",
  │               aspectRatio: "3:2",
  │               promptTemplate: "...",
  │               mediaRegistry: [...]
  │             }
  │           }
  │         ]
  │
  └── projects/{projectId}
      └── experiences: [experienceId]  # Many events → one experience
```

### Reusability Flow

```
10 Events (Projects)
  ↓ all use
1 Experience (with inline AI config)
  ↓ optionally copied from
1 Prompt Template (workspace library)
```

**Key Insight**: Reusability at Experience level (events → experience), not AI config level.

---

## Data Models & Schemas

### 1. Prompt Template Schema

**Location**: `/workspaces/{workspaceId}/promptTemplates/{templateId}`

```typescript
/**
 * Workspace-level prompt template for reusable AI patterns
 */
const promptTemplateSchema = z.object({
  // Identity
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  // Prompt Configuration
  promptTemplate: z.string().min(1),  // With @{variable} placeholders
  suggestedVariables: z.array(z.string()).default([]),  // Hint for step names

  // Media Registry
  mediaRegistry: z.array(z.object({
    name: z.string(),  // Reference name (@name in prompt)
    mediaAssetId: z.string(),
    url: z.string(),
    filePath: z.string(),
  })).default([]),

  // Organization
  tags: z.array(z.string()).default([]),  // "fantasy", "portrait", etc.

  // Metadata
  createdBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // Usage tracking (optional)
  usageCount: z.number().default(0),  // How many times copied
})

export type PromptTemplate = z.infer<typeof promptTemplateSchema>
```

**Key Points**:
- Templates are **starting points**, not live configurations
- No draft/published pattern (templates aren't used at runtime)
- Suggested variables help users map to steps
- Media registry provides reference images
- Tags enable discovery/filtering

---

### 2. Enhanced Step Schemas

**Multiselect with AI Support**:

```typescript
/**
 * Multiselect option with AI-aware fields
 */
const multiSelectOptionSchema = z.object({
  // Core
  value: z.string().min(1).max(100),  // Simple identifier

  // AI-Aware (optional)
  prompt: z.string().max(500).optional(),  // Prompt fragment for this option
  media: z.object({                        // Reference image for this option
    mediaAssetId: z.string(),
    url: z.string(),
    filePath: z.string(),
  }).optional(),
})

/**
 * Multiselect step configuration
 */
const experienceInputMultiSelectStepConfigSchema = z.object({
  title: z.string().max(200),
  required: z.boolean().default(false),
  options: z.array(multiSelectOptionSchema).min(2).max(10),
  multiSelect: z.boolean().default(false),
})
```

**Yes/No with AI Support**:

```typescript
/**
 * Yes/No option with AI-aware fields
 */
const yesNoOptionSchema = z.object({
  value: z.enum(['yes', 'no']),
  prompt: z.string().max(500).optional(),  // "with wings" / "without wings"
  media: z.object({
    mediaAssetId: z.string(),
    url: z.string(),
    filePath: z.string(),
  }).optional(),
})

/**
 * Yes/No step configuration
 */
const experienceInputYesNoStepConfigSchema = z.object({
  title: z.string().max(200),
  required: z.boolean().default(false),
  options: z.object({
    yes: yesNoOptionSchema.optional(),
    no: yesNoOptionSchema.optional(),
  }).optional(),
})
```

**Key Points**:
- Backward compatible (prompt/media are optional)
- Steps without AI config just use `value` field
- Prompt fragments compose into final prompt
- Media can show in selection UI (optional feature)

---

### 3. AI Image Node Schema

**Location**: In Experience `transformConfig.nodes[]`

```typescript
/**
 * AI Image Generation Node (inline configuration)
 */
const aiImageNodeSchema = z.object({
  type: z.literal('ai.imageGeneration'),
  id: z.string(),

  // Inline Configuration
  config: z.object({
    // Model Settings
    model: z.enum([
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.0',
    ]),
    aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']),

    // Prompt Template
    promptTemplate: z.string().min(1),  // With @step_name mentions

    // Media Registry (node-level)
    mediaRegistry: z.array(z.object({
      name: z.string(),  // Reference name (@name in prompt)
      mediaAssetId: z.string(),
      url: z.string(),
      filePath: z.string(),
    })).default([]),

    // Template Source (optional, for tracking)
    sourceTemplateId: z.string().optional(),
    copiedAt: z.number().optional(),
  }),

  // Input (optional, from previous node)
  input: nodeInputSourceSchema.optional(),
})

export type AIImageNode = z.infer<typeof aiImageNodeSchema>
```

**Key Points**:
- All config inline (no external preset reference)
- Prompt references steps by name: `@captureStep`, `@petStep`
- Media registry at node level (not experience level)
- Optional tracking of template source (provenance)

---

## User Workflows & Scenarios

### Scenario 1: Simple Unique Prompt

**User**: Creating one-off experience with unique prompt

**Workflow**:
1. Create experience, define steps:
   - `captureStep`: Photo capture
   - `styleStep`: Multiselect with options
2. Add AI Image Node to transform pipeline
3. Write prompt directly: `"Transform @captureStep into @styleStep"`
4. Set model and aspect ratio
5. Upload media to node registry (if needed)
6. Click "Test Run" → preview with test inputs
7. Iterate on prompt until satisfied
8. Publish experience

**Benefits**:
- ✅ Simple, no templates needed
- ✅ All in one place
- ✅ Immediate testing feedback

---

### Scenario 2: Start from Template

**User**: Creating experience similar to existing pattern

**Workflow**:
1. Create experience, define steps
2. Add AI Image Node to transform pipeline
3. Click "New from Template"
4. Browse template library, select "Hobbitify Portrait"
5. Template is **copied** into node config:
   - Prompt template copied
   - Media registry copied
   - Model suggestion shown (can change)
6. Customize:
   - Change model: gemini-2.5-flash (different from template)
   - Adjust prompt: add "with dramatic lighting"
   - Map @photo → @captureStep (auto-suggest if name matches)
7. Test run → iterate
8. Publish experience

**Benefits**:
- ✅ Faster start with proven pattern
- ✅ Freedom to customize
- ✅ No coupling to template

---

### Scenario 3: Share Prompt Pattern

**User**: Created great prompt, want to reuse in other experiences

**Workflow**:
1. Experience A complete with tested prompt
2. In AI node editor: "Save as Template"
3. Dialog:
   - Name: "Hobbitify Portrait v2"
   - Description: "Improved lighting and detail"
   - Tags: "fantasy", "portrait"
   - Suggested variables: Extract from prompt (@photo, @pet, @background)
4. Template saved to workspace library
5. Create Experience B:
   - Different steps (different pet options)
   - "New from Template" → "Hobbitify Portrait v2"
   - Copies prompt
   - Customize model: gemini-2.5-pro (vs. v1's flash)
6. Both experiences have similar prompts, different configs

**Benefits**:
- ✅ Share successful patterns
- ✅ No live coupling (safe to diverge)
- ✅ Can vary model/steps per experience

---

### Scenario 4: Evolve Shared Pattern

**User**: Template improved, want to update experiences using it

**Workflow**:
1. Template "Hobbitify Portrait" used in 3 experiences
2. Prompt engineer tests improvements in template workspace
3. Update template with new prompt version
4. Experience editors notified (optional):
   - "Template 'Hobbitify Portrait' has updates. Review changes?"
5. For each experience, user chooses:
   - **Option A**: "Update from Template" → copies new version (overwrites)
   - **Option B**: "View Diff" → see changes, selectively merge
   - **Option C**: "Keep Current" → stick with customized version
6. Users control when/how to sync

**Benefits**:
- ✅ Share improvements
- ✅ User controls updates (not automatic)
- ✅ Can choose per experience

---

### Scenario 5: Multi-Node Pipeline

**User**: Experience with multiple AI transformations

**Workflow**:
1. Experience with steps: capture, style, frame
2. Transform pipeline with 2 AI nodes:
   - **Node 1**: Portrait generation
     - Prompt: `"Transform @capture into @style portrait"`
     - Model: gemini-2.5-pro
   - **Node 2**: Frame overlay
     - Prompt: `"Add @frame border to image"`
     - Model: gemini-2.5-flash (cheaper for simple task)
3. Each node can reference same steps or different steps
4. No namespacing needed (clear separation by node)

**Benefits**:
- ✅ Multiple nodes, each with own config
- ✅ Can reuse steps across nodes
- ✅ Different models per node

---

### Scenario 6: Prompt Engineering Workflow

**User**: Dedicated prompt engineer role

**Workflow**:
1. Prompt engineer works in **Template Library workspace**
2. Create new template:
   - Name, description, tags
   - Write prompt with `@{variable}` placeholders
   - Upload reference media
   - Define suggested variable names
3. **Test template in isolation**:
   - "Test Template" button
   - Enter mock values for variables
   - See resolved prompt
   - Preview media usage
   - Validate references
4. Iterate until prompt is optimized
5. Publish template to library
6. Experience designers browse library, use template
7. Feedback loop:
   - Designers report issues
   - Engineer updates template
   - Designers pull updates

**Benefits**:
- ✅ Dedicated prompt engineering workspace
- ✅ Can test prompts without full experience
- ✅ Library becomes team knowledge base
- ✅ Separation of concerns (prompts vs. experiences)

---

## Implementation Plan

### Phase 1: Inline AI Configuration (2-3 weeks)

**Goal**: Enable inline AI config in experiences with full testing capability

#### 1.1 Schema Updates

**Tasks**:
- [ ] Enhance `experienceInputMultiSelectStepConfigSchema` with optional `prompt` and `media` on options
- [ ] Enhance `experienceInputYesNoStepConfigSchema` with optional `prompt` and `media` on options
- [ ] Create `aiImageNodeSchema` with inline config
- [ ] Update `transformNodeSchema` to support typed node configs
- [ ] Create Zod validation schemas for AI node editor inputs

**Files**:
- `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`
- `packages/shared/src/schemas/experience/steps/input-yes-no.schema.ts`
- `packages/shared/src/schemas/experience/transform.schema.ts`
- `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts` (new)

**Timeline**: 2-3 days

---

#### 1.2 Step Editor Enhancements

**Tasks**:
- [ ] Add optional prompt field to multiselect option editor
- [ ] Add optional media picker to multiselect option editor
- [ ] Add optional prompt/media fields to yes/no option editor
- [ ] Visual indicator when option is "AI-aware" (has prompt or media)
- [ ] Validation: prompt fragments can contain `@media_name` references

**Components** (new or enhanced):
- `domains/experience/designer/steps/components/MultiSelectOptionEditor.tsx`
- `domains/experience/designer/steps/components/YesNoOptionEditor.tsx`

**Timeline**: 3-4 days

---

#### 1.3 AI Image Node Editor

**Tasks**:
- [ ] Create AI image node editor container
- [ ] Model & aspect ratio controls
- [ ] **Prompt template editor** (Lexical-based):
  - Reuse Lexical infrastructure from ai-presets
  - Mentions source: Experience step names (not preset variables)
  - Autocomplete shows steps with their options
  - Visual pills for step mentions: `@captureStep`, `@petStep`
  - Character count display
- [ ] **Media registry section**:
  - Upload media (reuse `MediaPickerField` or simplified upload)
  - Display thumbnail grid
  - Edit media name
  - Delete media
- [ ] Auto-save to experience draft
- [ ] Save status indicator

**Components** (new):
- `domains/experience/designer/transform/components/AIImageNodeEditor.tsx`
- `domains/experience/designer/transform/components/AIPromptTemplateEditor.tsx`
- `domains/experience/designer/transform/components/AIMediaRegistry.tsx`
- `domains/experience/designer/transform/components/AIModelSettings.tsx`

**Reuse from ai-presets**:
- `domains/ai-presets/lexical/` (entire folder, adapt for step mentions)
- Mention nodes, plugins, serialization utils

**Timeline**: 5-6 days

---

#### 1.4 Test Run Dialog

**Tasks**:
- [ ] "Test Run" button in AI node editor
- [ ] Open dialog with preview panel
- [ ] **Generate test input form dynamically**:
  - Read experience steps
  - For each step referenced in prompt:
    - If capture: "Upload test photo" input
    - If multiselect: Dropdown with options (or text input if no options)
    - If yes/no: Yes/No selector
    - If text: Text input
- [ ] **Prompt resolution**:
  - Reuse resolution logic from ai-presets
  - Adapt for step-based inputs
  - Handle step value → prompt fragment mapping
  - Handle `@media_name` references
- [ ] **Validation display**:
  - Missing required step inputs
  - Undefined step references in prompt
  - Undefined media references
- [ ] **Resolved prompt preview**:
  - Show final text
  - Character count
  - Visual mention pills
- [ ] **Media preview grid**:
  - Show images from media registry
  - Show images from step options (if any)
  - "X of Y media used" indicator
- [ ] **Test generation button** (placeholder for Phase 5):
  - Disabled with tooltip
  - Visual placeholder for future functionality

**Components** (new):
- `domains/experience/designer/transform/components/AITestRunDialog.tsx`
- `domains/experience/designer/transform/components/AITestInputsForm.tsx`
- `domains/experience/designer/transform/components/AIPromptPreview.tsx`
- `domains/experience/designer/transform/components/AIMediaPreviewGrid.tsx`
- `domains/experience/designer/transform/components/AIValidationDisplay.tsx`

**Reuse from ai-presets**:
- `domains/ai-presets/preview/lib/prompt-resolution.ts` (adapt)
- `domains/ai-presets/preview/lib/validation.ts` (adapt)
- `domains/ai-presets/preview/components/*` (reference patterns)

**Timeline**: 5-6 days

---

#### 1.5 Experience Transform Pipeline UI

**Tasks**:
- [ ] Update transform pipeline canvas/editor to show AI nodes
- [ ] Add "Add AI Image Node" button/menu
- [ ] Node card shows: model, aspect ratio, prompt preview (truncated)
- [ ] Click node → open AI node editor
- [ ] Delete node
- [ ] Reorder nodes (if multi-node support)

**Components** (new or enhanced):
- `domains/experience/designer/transform/containers/TransformPipelineEditor.tsx`
- `domains/experience/designer/transform/components/AIImageNodeCard.tsx`

**Timeline**: 2-3 days

---

#### 1.6 Migration & Testing

**Tasks**:
- [ ] Migrate existing test experiences from AI presets to inline
- [ ] Update any existing transform pipeline configurations
- [ ] Test all workflows end-to-end
- [ ] Update developer documentation

**Timeline**: 2 days

---

**Phase 1 Total**: ~15-18 days (3 weeks)

---

### Phase 2: Prompt Template Library (1-2 weeks)

**Goal**: Enable workspace-level prompt template library for pattern reusability

#### 2.1 Template Schema & Services

**Tasks**:
- [ ] Create `promptTemplateSchema` in shared package
- [ ] Firestore service: CRUD operations
  - `createTemplate(workspaceId, data)`
  - `getTemplate(workspaceId, templateId)`
  - `updateTemplate(workspaceId, templateId, data)`
  - `deleteTemplate(workspaceId, templateId)` (soft delete)
  - `listTemplates(workspaceId, filters?)` (with tags, search)
- [ ] React Query hooks:
  - `usePromptTemplates(workspaceId)`
  - `usePromptTemplate(workspaceId, templateId)`
  - `useCreatePromptTemplate(workspaceId)`
  - `useUpdatePromptTemplate(workspaceId, templateId)`
  - `useDeletePromptTemplate(workspaceId, templateId)`

**Files** (new):
- `packages/shared/src/schemas/prompt-template/prompt-template.schema.ts`
- `domains/prompt-templates/services/prompt-template.service.ts`
- `domains/prompt-templates/hooks/usePromptTemplates.ts`
- `domains/prompt-templates/hooks/usePromptTemplate.ts`
- `domains/prompt-templates/hooks/useCreatePromptTemplate.ts`
- `domains/prompt-templates/hooks/useUpdatePromptTemplate.ts`
- `domains/prompt-templates/hooks/useDeletePromptTemplate.ts`

**Timeline**: 2-3 days

---

#### 2.2 Template Library Page

**Tasks**:
- [ ] Route: `/workspace/:workspaceSlug/prompt-templates`
- [ ] Navigation: Add to workspace sidebar
- [ ] Template list view:
  - Grid or list layout
  - Search by name/description
  - Filter by tags
  - Sort by: recent, popular (usage count)
- [ ] Template card shows:
  - Name, description, tags
  - Usage count
  - Preview snippet (first line of prompt)
  - Last updated
  - Actions: Edit, Delete, Duplicate
- [ ] "Create Template" button → editor
- [ ] Empty state

**Components** (new):
- `domains/prompt-templates/containers/PromptTemplateListPage.tsx`
- `domains/prompt-templates/components/PromptTemplateCard.tsx`
- `domains/prompt-templates/components/PromptTemplateFilters.tsx`

**Route** (new):
- `app/workspace/$workspaceSlug.prompt-templates.tsx`

**Timeline**: 2-3 days

---

#### 2.3 Template Editor

**Tasks**:
- [ ] Route: `/workspace/:workspaceSlug/prompt-templates/:templateId`
- [ ] Template editor UI:
  - Name, description fields
  - Tags input (multi-select or chips)
  - **Prompt template editor** (Lexical):
    - Mentions are generic `@{variable_name}` (not tied to specific steps)
    - Autocomplete shows suggested variables
    - Can define new variables on-the-fly
  - **Suggested variables list**:
    - Extracted from prompt mentions
    - User can add/edit/remove
    - Help text: "These will map to experience steps"
  - **Media registry section**:
    - Same as AI node editor
    - Upload, manage reference media
  - Auto-save
  - Save status indicator
- [ ] "Test Template" button → test dialog (see 2.4)
- [ ] Breadcrumb navigation

**Components** (new):
- `domains/prompt-templates/containers/PromptTemplateEditorPage.tsx`
- `domains/prompt-templates/components/PromptTemplateEditor.tsx`
- `domains/prompt-templates/components/SuggestedVariablesList.tsx`

**Route** (new):
- `app/workspace/$workspaceSlug.prompt-templates.$templateId.tsx`

**Reuse**:
- Lexical editor (adapt for generic variables)
- Media registry components

**Timeline**: 3-4 days

---

#### 2.4 Template Test Dialog

**Tasks**:
- [ ] "Test Template" button in editor
- [ ] Dialog with:
  - **Mock input form**: Dynamic fields for each suggested variable
    - Text variables: Text input
    - Media variables: Upload input
  - **Resolved prompt preview**: Show substituted text
  - **Media preview**: Show referenced media
  - **Validation**: Check for undefined references
- [ ] Purpose: Test prompt without full experience context

**Components** (new):
- `domains/prompt-templates/components/TemplateTestDialog.tsx`

**Reuse**:
- Resolution logic (adapt for generic variables)
- Preview components

**Timeline**: 2 days

---

#### 2.5 Template Integration in AI Node

**Tasks**:
- [ ] AI node editor: "New from Template" button
- [ ] Template picker dialog:
  - Browse templates
  - Search, filter by tags
  - Preview template details
  - Select template
- [ ] **Copy template to node**:
  - Copy promptTemplate
  - Copy mediaRegistry
  - Auto-suggest step mappings:
    - If template has `@photo` and experience has `captureStep` → suggest mapping
    - Show mapping UI: `@photo` → `@captureStep` (or choose different step)
  - Replace generic `@{variable}` with `@step_name`
  - Set sourceTemplateId, copiedAt (for provenance)
- [ ] **"Save as Template" button** (reverse flow):
  - Extract node config → new template
  - Genericize step names → `@{variable}` placeholders
  - Pre-fill suggested variables from step names
  - Open template editor with pre-filled data

**Components** (new):
- `domains/prompt-templates/components/TemplatePickerDialog.tsx`
- `domains/prompt-templates/components/TemplateCopyMappingDialog.tsx`
- `domains/experience/designer/transform/components/SaveAsTemplateButton.tsx`

**Timeline**: 3-4 days

---

#### 2.6 Template Update Notifications (Optional)

**Tasks**:
- [ ] Track template → node relationships (if sourceTemplateId exists)
- [ ] When template updates, notify experiences using it
- [ ] "Template has updates" badge in AI node editor
- [ ] "Update from Template" button:
  - Show diff (old vs new prompt)
  - User chooses: accept all, reject, or selective merge
- [ ] Clear notification after action

**Components** (new):
- `domains/experience/designer/transform/components/TemplateUpdateNotification.tsx`
- `domains/experience/designer/transform/components/TemplateUpdateDiffDialog.tsx`

**Timeline**: 2-3 days (optional, can defer)

---

**Phase 2 Total**: ~8-12 days (1.5-2 weeks)

---

### Phase 3: Polish & Documentation (Optional)

**Tasks**:
- [ ] Template categories/folders (if needed)
- [ ] Template ratings/favorites (if marketplace-like)
- [ ] Template analytics (usage tracking, popular templates)
- [ ] Bulk operations (duplicate, archive templates)
- [ ] Better template search (fuzzy search, advanced filters)
- [ ] User documentation & guides
- [ ] Video tutorials (how to use templates)

**Timeline**: 1-2 weeks (as needed)

---

## Migration from AI Presets

### What to Keep

✅ **Lexical Infrastructure** (`domains/ai-presets/lexical/`)
- Mention nodes, plugins, serialization
- Reuse for both AI node editor and template editor
- Adapt mention source (presets vars → steps or template vars)

✅ **Resolution Logic** (`domains/ai-presets/preview/lib/`)
- `prompt-resolution.ts` → adapt for step-based resolution
- `validation.ts` → adapt for step-based validation
- Core algorithms remain the same

✅ **Preview Components** (patterns)
- Test input form patterns
- Resolved prompt display
- Media preview grid
- Validation display
- Reference for building AI node test dialog

✅ **Media Management**
- Upload hooks
- Media picker patterns
- Thumbnail display components

### What to Archive

❌ **AI Preset Domain** (`domains/ai-presets/`)
- Editor containers (preset-specific)
- Preset CRUD services
- Preset schemas (move to archive)
- Preset list page
- Variable management (different in inline approach)

❌ **Preset-Specific Hooks**
- `useAIPreset`, `useUpdateAIPreset`, etc.
- Replace with template hooks

### Migration Steps

1. **Extract Reusable Code**:
   - Move Lexical infrastructure to `shared/lexical/` or `ui-kit/lexical/`
   - Move resolution/validation utils to `shared/ai-prompt/`
   - Generalize mention system for multiple contexts

2. **Update Existing Experiences**:
   - For each experience using AI preset:
     - Read preset config
     - Copy into inline AI node config
     - Map preset variables to step names
     - Delete preset reference

3. **Archive Preset Domain**:
   - Move `domains/ai-presets/` to `domains/_archived/ai-presets/`
   - Keep for reference, don't import
   - Update documentation

4. **Update PRD Documents**:
   - Mark `prd-phases.md` as superseded
   - Reference this document as new spec

### Data Migration Script

```typescript
/**
 * Migrate AI Presets to Inline AI Nodes
 *
 * For each experience:
 * 1. Find AI preset reference in transform pipeline
 * 2. Fetch preset config
 * 3. Create inline AI node config
 * 4. Map preset variables to step names
 * 5. Update experience document
 * 6. Log migration result
 */
async function migratePresetsToInline(workspaceId: string) {
  const experiences = await getExperiences(workspaceId)

  for (const experience of experiences) {
    // Find AI preset reference (if any)
    const aiNode = experience.transformConfig.nodes.find(
      node => node.type === 'aiImage' && 'presetId' in node
    )

    if (!aiNode || !aiNode.presetId) continue

    // Fetch preset
    const preset = await getAIPreset(workspaceId, aiNode.presetId)

    // Create inline config
    const inlineConfig = {
      model: preset.published.model,
      aspectRatio: preset.published.aspectRatio,
      promptTemplate: mapPresetPromptToSteps(
        preset.published.promptTemplate,
        aiNode.variableBindings,
        experience.steps
      ),
      mediaRegistry: preset.published.mediaRegistry,
      sourceTemplateId: null,  // No template source
    }

    // Update experience
    await updateExperience(workspaceId, experience.id, {
      transformConfig: {
        ...experience.transformConfig,
        nodes: experience.transformConfig.nodes.map(node =>
          node.id === aiNode.id
            ? { type: 'ai.imageGeneration', id: node.id, config: inlineConfig }
            : node
        )
      }
    })

    console.log(`Migrated experience ${experience.id}`)
  }
}

function mapPresetPromptToSteps(
  promptTemplate: string,
  variableBindings: Record<string, { stepId: string }>,
  steps: ExperienceStep[]
): string {
  // Replace @{text:var} with @stepName
  // Replace @{input:var} with @stepName
  // Replace @{ref:media} with @media (unchanged)

  let result = promptTemplate

  for (const [varName, binding] of Object.entries(variableBindings)) {
    const step = steps.find(s => s.id === binding.stepId)
    const stepName = step?.name || varName

    // Replace all mention patterns
    result = result
      .replace(new RegExp(`@\\{text:${varName}\\}`, 'g'), `@${stepName}`)
      .replace(new RegExp(`@\\{input:${varName}\\}`, 'g'), `@${stepName}`)
  }

  // Media refs stay the same: @{ref:media} → @media
  result = result.replace(/@\{ref:(\w+)\}/g, '@$1')

  return result
}
```

---

## Technical Details

### Prompt Resolution Algorithm

**Input**:
- Prompt template with `@step_name` mentions
- Experience steps with configurations
- Test input values (for preview)
- Media registry

**Process**:
```typescript
function resolvePrompt(
  template: string,
  steps: ExperienceStep[],
  testInputs: Record<string, any>,
  mediaRegistry: MediaEntry[]
): ResolvedPrompt {
  let resolved = template
  const unresolvedRefs: Reference[] = []

  // 1. Find all @step_name mentions
  const stepMentions = extractStepMentions(template)

  // 2. For each step mention
  for (const mention of stepMentions) {
    const step = steps.find(s => s.name === mention.stepName)

    if (!step) {
      unresolvedRefs.push({ type: 'step', name: mention.stepName })
      continue
    }

    const inputValue = testInputs[step.name]

    // 3. Resolve based on step type
    let replacement = ''

    switch (step.type) {
      case 'input-multi-select':
      case 'input-yes-no':
        // Look for option with prompt fragment
        const option = step.config.options.find(
          opt => opt.value === inputValue
        )
        if (option?.prompt) {
          replacement = option.prompt  // Use prompt fragment
        } else {
          replacement = inputValue || `[No value: ${step.name}]`
        }
        break

      case 'capture-photo':
        // Show placeholder for image
        replacement = `<${step.name}>`
        break

      case 'input-short-text':
      case 'input-long-text':
        replacement = inputValue || `[No value: ${step.name}]`
        break
    }

    // 4. Replace @step_name with resolved value
    resolved = resolved.replace(
      new RegExp(`@${mention.stepName}`, 'g'),
      replacement
    )
  }

  // 5. Extract media references (may be in prompt or option fragments)
  const mediaRefs = extractMediaMentions(resolved)

  // 6. Validate media references
  for (const mediaRef of mediaRefs) {
    const media = mediaRegistry.find(m => m.name === mediaRef.name)
    if (!media) {
      unresolvedRefs.push({ type: 'media', name: mediaRef.name })
    }
  }

  return {
    text: resolved,
    characterCount: resolved.length,
    hasUnresolved: unresolvedRefs.length > 0,
    unresolvedRefs,
  }
}
```

### Step Mention Syntax

**Format**: `@step_name`
- Simple, readable
- No type prefix (step type inferred from step config)
- Consistent with general @ mention pattern

**Examples**:
```
Transform @captureStep into hobbit @petStep in @backgroundStep
              ↓                        ↓              ↓
         (photo step)           (multiselect)   (multiselect)
```

**Lexical Node**:
```typescript
class StepMentionNode extends DecoratorNode {
  __stepName: string

  getStepName(): string {
    return this.__stepName
  }

  // Render as pill with step name
  decorate(): JSX.Element {
    return <StepMentionPill stepName={this.__stepName} />
  }

  // Serialize to plain text
  exportText(): string {
    return `@${this.__stepName}`
  }
}
```

### Media References in Option Prompts

**Option prompt can include media refs**:
```typescript
{
  value: 'cat',
  prompt: 'holding a cat (see @cat)',  // References media from registry
  media: <cat_image_ref>  // Visual for selection UI
}
```

**Resolution handles nested refs**:
1. User selects "cat" → prompt fragment: `"holding a cat (see @cat)"`
2. Fragment inserted into main prompt: `"Transform @photo into hobbit holding a cat (see @cat)"`
3. Media extraction finds `@cat` → includes cat image
4. Final LLM input: prompt + photo + cat image

### Testing Infrastructure

**Test Run Dialog State**:
```typescript
interface TestRunState {
  // Test inputs (one per step)
  inputs: Record<string, TestInputValue>

  // Resolved prompt
  resolvedPrompt: ResolvedPrompt

  // Validation
  validation: ValidationState

  // Media references
  mediaReferences: MediaReference[]
}

type TestInputValue =
  | string                    // Text/select value
  | MediaReference            // Image upload
  | null                      // Unset

interface ResolvedPrompt {
  text: string
  characterCount: number
  hasUnresolved: boolean
  unresolvedRefs: Reference[]
}

interface ValidationState {
  status: 'valid' | 'invalid' | 'incomplete'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

**Test Input Generation**:
```typescript
function generateTestInputForm(
  aiNode: AIImageNode,
  experienceSteps: ExperienceStep[]
): TestInputField[] {
  // Extract step mentions from prompt
  const stepMentions = extractStepMentions(aiNode.config.promptTemplate)

  // For each mentioned step, create input field
  return stepMentions.map(mention => {
    const step = experienceSteps.find(s => s.name === mention.stepName)

    if (!step) {
      return {
        stepName: mention.stepName,
        type: 'missing',
        label: `${mention.stepName} (step not found)`,
      }
    }

    switch (step.type) {
      case 'capture-photo':
        return {
          stepName: step.name,
          type: 'image-upload',
          label: step.config.title || step.name,
          required: step.config.required,
        }

      case 'input-multi-select':
        return {
          stepName: step.name,
          type: step.config.multiSelect ? 'multi-select' : 'select',
          label: step.config.title || step.name,
          options: step.config.options.map(opt => opt.value),
          required: step.config.required,
        }

      case 'input-yes-no':
        return {
          stepName: step.name,
          type: 'yes-no',
          label: step.config.title || step.name,
          required: step.config.required,
        }

      case 'input-short-text':
      case 'input-long-text':
        return {
          stepName: step.name,
          type: 'text',
          label: step.config.title || step.name,
          required: step.config.required,
        }
    }
  })
}
```

---

## Open Questions

### 1. Template Versioning

**Question**: Should templates have version history?

**Options**:
- A: No versioning, templates are mutable (simpler)
- B: Version history with rollback (more complex)
- C: Immutable templates, create new for changes (strictest)

**Recommendation**: Start with A (no versioning), add B later if needed.

---

### 2. Template Marketplace

**Question**: Should workspace templates be shareable across workspaces?

**Options**:
- A: Workspace-private only (simpler)
- B: Public template marketplace (more complex)
- C: Team-level sharing (middle ground)

**Recommendation**: Start with A, enable B for Phase 3 (marketplace feature).

---

### 3. Step Name Changes

**Question**: What happens if step name changes after prompt references it?

**Options**:
- A: Break the reference, show validation error (explicit)
- B: Auto-update references in prompts (magic, risky)
- C: Warn user, offer to update (best UX)

**Recommendation**: C - show warning with "Update references" button.

---

### 4. Media Scope

**Question**: Should media registry be experience-level or node-level?

**Decision**: Node-level (each AI node has own registry)

**Rationale**:
- Media is specific to prompt context
- Avoids namespace pollution
- Clearer what images are used where
- Multi-node pipelines can have separate media

---

### 5. Prompt Fragment Composition

**Question**: Should option prompts be required for AI-aware steps?

**Decision**: Optional (graceful fallback to value)

**Rationale**:
- Not all options need custom fragments
- Simple cases: just use value
- Advanced cases: customize with fragments
- Progressive disclosure

---

### 6. Template Categories

**Question**: Should templates have categories/folders?

**Recommendation**: Start with tags (simpler), add folders later if needed.

**Rationale**:
- Tags are flexible (multiple per template)
- Search + filter covers most use cases
- Folders add organizational complexity

---

## Appendix: Comparison Table

| Aspect | AI Presets (Current) | Inline + Templates (Proposed) |
|--------|---------------------|-------------------------------|
| **Configuration Location** | Workspace-level preset | Experience transform node |
| **Reusability Model** | Live reference (fragile) | Copy template (safe) |
| **Mapping Layer** | Required (vars → steps) | Not needed (direct @step refs) |
| **Model Flexibility** | Preset-level (shared) | Experience-level (flexible) |
| **Prompt Testing** | Standalone preset editor | AI node test dialog |
| **Pattern Sharing** | Preset library | Template library (copy-based) |
| **Marketplace Unit** | Preset or Experience | Experience (complete) |
| **Step Awareness** | No (steps separate) | Yes (steps have prompt fields) |
| **Multi-Node Support** | Separate presets per node | Inline config per node |
| **Coupling Risk** | High (live binding) | Low (copy model) |
| **Learning Curve** | 3 concepts (preset, step, binding) | 2 concepts (step, template) |
| **Code Reuse** | N/A | 60% (Lexical, resolution, validation) |
| **Migration Risk** | N/A | Low (pre-launch, few experiences) |

---

## Summary

The **Inline + Template Library** architecture provides:

✅ **Simpler workflow**: Remove mapping layer, direct step references
✅ **Flexible customization**: Model/settings per experience
✅ **Pattern reusability**: Template library for proven prompts
✅ **Safe evolution**: Copy model prevents fragile coupling
✅ **Prompt engineering focus**: Dedicated template workspace
✅ **Marketplace ready**: Experiences are complete, shareable units
✅ **Progressive disclosure**: Simple inline → advanced templates

**Timeline**: 3-5 weeks for full implementation (Phase 1 + 2)

**Next Steps**: Begin Phase 1 implementation.
