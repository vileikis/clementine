# Quickstart: AI Preset Editor

**Branch**: `043-ai-preset-editor` | **Date**: 2025-01-26

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Firebase project configured
- Workspace with admin access

## Development Setup

### 1. Install Dependencies

```bash
cd /Users/iggyvileikis/Projects/@attempt-n2/ai-preset-editor
pnpm install
```

### 2. Start Development Server

```bash
pnpm app:dev
```

Navigate to `http://localhost:3000/workspace/{workspaceSlug}/ai-presets/{presetId}`

### 3. Run Validation

Before committing:

```bash
pnpm app:check    # Format + lint fixes
pnpm app:type-check  # TypeScript validation
```

---

## File Creation Guide

### Phase 1: Foundation (Editor Subdomain Setup)

Create the editor subdomain structure:

```bash
mkdir -p apps/clementine-app/src/domains/ai-presets/editor/{components,containers,hooks,stores,schemas}
```

**Files to create:**

1. **Store** - `stores/useAIPresetEditorStore.ts`
   ```typescript
   import { createEditorStore } from '@/shared/editor-status'
   export const useAIPresetEditorStore = createEditorStore()
   ```

2. **Hooks** - `hooks/useAIPreset.ts`
   - Single preset fetch with real-time subscription
   - Pattern: onSnapshot → setQueryData

3. **Hooks** - `hooks/useUpdateAIPreset.ts`
   - Partial update mutation
   - Uses transaction, serverTimestamp

4. **Schemas** - `schemas/ai-preset-editor.schemas.ts`
   - UpdateAIPresetInput schema
   - Variable/media input schemas

5. **Barrel exports** - `index.ts` files in each folder

### Phase 2: Layout Components

**Files to create:**

1. **Container** - `containers/AIPresetEditorPage.tsx`
   - Main page component
   - Fetches preset, renders layout

2. **Layout Container** - `containers/AIPresetEditorLayout.tsx`
   - TopNavBar with breadcrumbs
   - Two-column layout
   - Save button, save status
   - **Note**: In containers/ (orchestrates state), not components/

3. **Name Badge** - `components/AIPresetNameBadge.tsx`
   - Editable preset name
   - Click to edit, Enter/Escape handling

### Phase 3: Configuration Sections

**Files to create:**

1. **Model Settings** - `components/ModelSettingsSection.tsx`
   - Model dropdown (SelectField)
   - Aspect ratio dropdown (SelectField)

2. **Media Registry** - `components/MediaRegistrySection.tsx`
   - Thumbnail grid
   - Add Media button (opens AddMediaDialog)
   - Individual item with delete

3. **Add Media Dialog** - `components/AddMediaDialog.tsx`
   - Dialog with MediaPickerField for upload
   - Name input for reference name
   - Uses existing upload infrastructure

4. **Media Item** - `components/MediaRegistryItem.tsx`
   - Thumbnail preview
   - Name display
   - Delete on hover

### Phase 4: Variables System

**Files to create:**

1. **Variables Section** - `components/VariablesSection.tsx`
   - List of VariableCards
   - Add Variable button

2. **Variable Card** - `components/VariableCard.tsx`
   - Collapsible card
   - Summary: @name, type badge, label
   - Expands to VariableEditor

3. **Variable Editor** - `components/VariableEditor.tsx`
   - Name input (with validation)
   - Label input
   - Type selector
   - Required toggle
   - Default value (text only)
   - Value mappings (text only)

4. **Value Mappings** - `components/ValueMappingsEditor.tsx`
   - Table of mappings
   - Add/remove rows
   - Value → Text inputs

### Phase 5: Prompt Template Editor

**Files to create:**

1. **Prompt Editor** - `components/PromptTemplateEditor.tsx`
   - ContentEditable wrapper
   - @ trigger detection
   - Pill rendering for mentions
   - Serialization/deserialization

2. **Autocomplete** - `components/MentionAutocomplete.tsx`
   - Dropdown positioned at cursor
   - Filtered suggestions
   - Keyboard navigation
   - Variable (blue) vs Media (green) indicators

### Phase 6: Route Update

Update existing route file:

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.ai-presets/$presetId.tsx`

Replace placeholder with:
```typescript
import { AIPresetEditorPage } from '@/domains/ai-presets/editor'

// Route component imports and renders AIPresetEditorPage
```

---

## Key Patterns to Follow

### 1. Editor Store Pattern

```typescript
// Create store instance
export const useAIPresetEditorStore = createEditorStore()

// In component
const { pendingSaves, lastCompletedAt, resetSaveState } = useAIPresetEditorStore()

// Cleanup on unmount
useEffect(() => () => resetSaveState(), [resetSaveState])
```

### 2. Tracked Mutation Pattern

```typescript
const updateMutation = useMutation({ ... })
const trackedMutation = useTrackedMutation(updateMutation, useAIPresetEditorStore())
```

### 3. Real-Time Subscription Pattern

```typescript
useEffect(() => {
  const docRef = doc(firestore, `workspaces/${workspaceId}/aiPresets/${presetId}`)
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = convertFirestoreDoc(snapshot, aiPresetSchema)
      queryClient.setQueryData(['aiPreset', workspaceId, presetId], data)
    }
  })
  return () => unsubscribe()
}, [workspaceId, presetId, queryClient])
```

### 4. Partial Update Pattern

```typescript
// Only send changed fields
const updatePreset = useMutation({
  mutationFn: async (updates: Partial<AIPreset>) => {
    await runTransaction(firestore, async (transaction) => {
      transaction.update(presetRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    })
  }
})
```

---

## Testing Checklist

Before marking complete:

- [ ] Navigate from list to editor works
- [ ] Preset name editable and saves
- [ ] Model/aspect ratio selection persists
- [ ] Media can be added via upload dialog
- [ ] Media can be removed from registry
- [ ] Variables can be created (text and image)
- [ ] Variables can be edited and deleted
- [ ] Value mappings work for text variables
- [ ] Prompt template @mentions trigger autocomplete
- [ ] @mention pills render correctly
- [ ] Auto-save works on all changes
- [ ] Save status indicator shows correctly
- [ ] Back navigation to list works
- [ ] Page reload preserves all data

---

## Standards Compliance Checklist

Before PR:

- [ ] No hard-coded colors (use theme tokens)
- [ ] Using shadcn/ui components where available
- [ ] Accessibility preserved (focus, keyboard nav)
- [ ] Barrel exports in all folders
- [ ] TypeScript strict mode passing
- [ ] Zod validation on all inputs
- [ ] Error handling with user feedback
- [ ] Loading states for async operations
