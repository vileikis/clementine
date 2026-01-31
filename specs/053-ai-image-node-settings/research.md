# Research: AI Image Node Settings

**Feature**: 053-ai-image-node-settings
**Date**: 2026-01-31

## Existing Codebase Analysis

### 1. Transform Pipeline Editor Structure

**Location**: `apps/clementine-app/src/domains/experience/generate/`

The transform pipeline editor follows a well-established pattern:

```
generate/
├── components/
│   ├── NodeListItem/           # Node rendering with drag/collapse
│   │   ├── AIImageNode.tsx     # Current placeholder implementation
│   │   ├── NodeHeader.tsx      # Dispatcher for headers
│   │   ├── NodeSettings.tsx    # Dispatcher for settings
│   │   └── NodeListItem.tsx    # Wrapper with dnd-kit integration
│   ├── NodeEditorPanel.tsx     # Sheet-based editor (unused)
│   └── ...
├── containers/
│   └── TransformPipelineEditor.tsx
├── hooks/
│   └── useUpdateTransformConfig.ts
└── lib/
    └── transform-operations.ts
```

**Decision**: Follow the existing dispatcher pattern. AIImageNodeSettings will delegate to PromptComposer.
**Rationale**: Consistency with codebase patterns, extensibility for future node types.

### 2. Existing AIImageNode Implementation

**Current State**: Placeholder with collapsible sections:
- Model Settings (Phase 1e placeholder)
- Prompt (Phase 1d placeholder) - shows truncated preview
- Reference Media (Phase 1c placeholder) - shows item count
- Test Run (Phase 1g placeholder)

**Decision**: Replace Prompt and Reference Media placeholders with functional PromptComposer. Keep Model Settings separate for now (controlled by ControlRow dropdowns).
**Rationale**: Matches the spec's PromptComposer layout requirements.

### 3. Data Mutation Pattern

**Hook**: `useUpdateTransformConfig(workspaceId, experienceId)`

```typescript
// Usage pattern
const updateTransform = useUpdateTransformConfig(workspaceId, experience.id)
updateTransform.mutate({ transform: newTransformConfig })
```

**Features**:
- TanStack Mutation with optimistic updates
- Auto-increments `draftVersion` for conflict detection
- Invalidates query cache on success
- Sentry error capture with domain tags
- Save status tracking via `useTrackedMutation`

**Decision**: Reuse existing hook, compute new config with pure functions in `transform-operations.ts`.
**Rationale**: Established pattern, no need for custom mutation logic.

### 4. Schema Definitions

**Location**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

```typescript
export const aiImageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
])

export const aiImageAspectRatioSchema = z.enum([
  '1:1', '3:2', '2:3', '9:16', '16:9',
])

export const aiImageNodeConfigSchema = z.object({
  model: aiImageModelSchema,
  aspectRatio: aiImageAspectRatioSchema,
  prompt: z.string(),
  refMedia: z.array(mediaReferenceSchema),
})
```

**MediaReference Schema** (`packages/shared/src/schemas/media/media-reference.schema.ts`):
```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: z.string().default('Untitled'),
})
```

**Decision**: Use schemas directly for type inference and validation.
**Rationale**: Type-safe, single source of truth.

### 5. UI Component Patterns

**shadcn/ui Components Used**:
- `Button` - with variants (default, ghost, outline, destructive)
- `Select` + `SelectTrigger` + `SelectValue` + `SelectContent` + `SelectItem`
- `Textarea` - for multiline input
- `ScrollArea` - for scrollable containers
- Icons from `lucide-react`

**Editor Controls** (`shared/editor-controls/`):
- `SelectField` - dropdown with label
- `TextareaField` - multiline with character counter
- `MediaPickerField` - image upload with drag-drop

**Decision**: Use raw shadcn/ui components for the custom PromptComposer layout (not EditorRow/EditorSection wrappers).
**Rationale**: Spec requires a unified bordered container without individual field labels/borders.

### 6. Media Upload Pattern

**Existing Hooks** (`domains/media-library/`):
- `useUploadMediaAsset(workspaceId, userId)` - Core upload mutation
  - Returns `MediaReference` with `mediaAssetId`, `url`, `displayName`, `filePath`
  - Handles one file at a time
  - Invalidates `mediaAssets` query on success

**Composition Hook Pattern** (from `project-config/`):
```typescript
// Example: useUploadAndUpdateOverlays
export function useUploadAndUpdateOverlays(projectId, workspaceId, userId) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateOverlays = useUpdateOverlays(projectId)

  const mutation = useMutation({
    mutationFn: async ({ file, aspectRatio, onProgress }) => {
      // Step 1: Upload to Storage
      const mediaRef = await uploadAsset.mutateAsync({ file, type: 'overlay', onProgress })
      // Step 2: Update config
      await updateOverlays.mutateAsync({ [aspectRatio]: mediaRef })
      return mediaRef
    },
  })

  return useTrackedMutation(mutation)
}
```

**Decision**: Create simple AddMediaButton with native `<input type="file" multiple>`. Use `useUploadMediaAsset` for uploads, then update transform config with new refs. No MediaPickerField needed.
**Rationale**: MediaPickerField is too heavy (single image, preview, replace). We just need a plus button that opens file picker for multiple selection.

### 7. Drag-and-Drop Patterns

**Library**: `@dnd-kit` (already used for node reordering)

**For File Drop** (different use case - multiple files):
- Use native HTML5 drag-and-drop API (`ondragover`, `ondrop`)
- Access `e.dataTransfer.files` (FileList) for multiple files
- Filter to image MIME types only

```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  setIsDragOver(false)

  // Get all dropped files, filter to images
  const files = Array.from(e.dataTransfer.files).filter(
    file => file.type.startsWith('image/')
  )

  if (files.length > 0) {
    onFilesSelected(files) // Handle multiple uploads
  }
}
```

**Decision**: Use native HTML5 drag-drop API for file drops with multi-file support.
**Rationale**: Native API handles multiple files via `FileList`. No new dependency needed.

## Technical Decisions Summary

| Decision | Choice | Alternatives Considered |
|----------|--------|------------------------|
| Component structure | Dedicated PromptComposer directory | Inline in AIImageNode (rejected: too complex) |
| Mutation pattern | Reuse useUpdateTransformConfig | Custom hook (rejected: duplicates existing) |
| UI components | Raw shadcn/ui (no EditorRow wrappers) | EditorRow/EditorSection (rejected: spec layout differs) |
| File picker | Simple `<input type="file" multiple>` | MediaPickerField (rejected: too heavy, single file only) |
| File drop | Native HTML5 drag-drop with multi-file | react-dropzone (rejected: adds dependency) |
| Upload hook | useUploadMediaAsset from media-library | Custom upload logic (rejected: duplicates existing) |
| Validation | Zod schemas from shared package | Manual validation (rejected: inconsistent) |
| Reference limit | Enforced in pure functions (10 max) | UI-only limit (rejected: must validate on mutation) |

## Component Architecture

```
PromptComposer (container with border, drop zone)
├── ReferenceMediaStrip (conditional, above prompt)
│   └── ReferenceMediaItem[] (thumbnails with remove, upload progress)
├── PromptInput (multiline textarea, no border)
└── ControlRow (model, aspect ratio, plus button)
    ├── ModelSelect (unlabeled dropdown)
    ├── AspectRatioSelect (unlabeled dropdown)
    └── AddMediaButton (plus icon, native <input type="file" multiple>)
```

## Upload Flow (Multiple Files)

**Trigger**: Plus button click OR drag-and-drop files

```
1. User selects/drops multiple image files
2. Filter to valid image MIME types
3. Check limit: (current refs + new files) <= 10
4. For each file (sequential or parallel):
   a. Show uploading state in ReferenceMediaStrip
   b. Call useUploadMediaAsset.mutateAsync({ file, type: 'refMedia' })
   c. Receive MediaReference on success
5. Dedupe by mediaAssetId against existing refs
6. Update transform config with new refs (batch)
7. Clear uploading state
```

**Upload States per Item**:
- `uploading` - Show spinner/progress in thumbnail slot
- `success` - Show thumbnail with remove button
- `error` - Show error state (optional: retry)

**Composition Hook Option** (`useUploadAndAddRefMedia`):
```typescript
// Similar to useUploadAndUpdateOverlays pattern
export function useUploadAndAddRefMedia(
  workspaceId: string,
  userId: string,
  experienceId: string,
  nodeId: string,
) {
  const uploadAsset = useUploadMediaAsset(workspaceId, userId)
  const updateTransform = useUpdateTransformConfig(workspaceId, experienceId)

  return useMutation({
    mutationFn: async ({ files, currentTransform }) => {
      // Upload all files (could be sequential or parallel)
      const mediaRefs = await Promise.all(
        files.map(file => uploadAsset.mutateAsync({ file, type: 'refMedia' }))
      )
      // Add refs to transform config
      const newTransform = addNodeRefMedia(currentTransform, nodeId, mediaRefs)
      await updateTransform.mutateAsync({ transform: newTransform })
      return mediaRefs
    },
  })
}
```

## State Management

**Local UI State**:
- `isDragOver: boolean` - highlight state for drop zone
- `uploadingFiles: Map<string, { file: File, progress: number }>` - files currently uploading (keyed by temp ID)

**Derived from Props**:
- `config.prompt` - current prompt text
- `config.model` - selected model
- `config.aspectRatio` - selected aspect ratio
- `config.refMedia` - reference media array (already uploaded)

**Mutations**:
- `onPromptChange(prompt: string)` → update transform config
- `onModelChange(model: AIImageModel)` → update transform config
- `onAspectRatioChange(ratio: AIImageAspectRatio)` → update transform config
- `onFilesSelected(files: File[])` → upload files, then add refs to transform config
- `onRemoveRefMedia(mediaAssetId: string)` → filter from refMedia

## Validation Rules

1. **Prompt**: Non-empty at publish time (validated by schema, shown in UI)
2. **Duplicates**: Prevent by `mediaAssetId` before adding
3. **Max References**: Enforce 10 limit before adding
4. **File Types**: Accept only images (validate MIME type on drop)

## Accessibility Considerations

- All interactive elements: 44px minimum touch target
- Keyboard navigation: Tab through controls, Enter to activate
- Screen reader: ARIA labels on unlabeled dropdowns
- Focus management: Focus prompt after removing reference
- Drag-drop alternative: Plus button provides non-drag method
