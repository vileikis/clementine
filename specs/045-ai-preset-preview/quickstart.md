# Quickstart Guide: AI Preset Editor - Preview Panel

**Feature**: 045-ai-preset-preview
**Date**: 2025-01-28
**Status**: Ready for Development

## Overview

This guide provides everything you need to start developing the AI Preset Editor Preview Panel feature. Follow these steps to set up your environment, understand the codebase, and begin implementation.

## Prerequisites

- Node.js 18+ installed
- pnpm 10.18.1 installed (`npm install -g pnpm@10.18.1`)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to Clementine project repository
- Firebase project credentials configured

## Quick Start

### 1. Checkout Feature Branch

```bash
git checkout 045-ai-preset-preview
```

### 2. Install Dependencies

```bash
# From repository root
pnpm install
```

### 3. Start Development Server

```bash
# Start TanStack Start dev server
pnpm app:dev
```

The app will be available at `http://localhost:3000`

### 4. Navigate to AI Preset Editor

```bash
# URL pattern:
http://localhost:3000/workspace/{workspaceSlug}/ai-presets/{presetId}

# Example:
http://localhost:3000/workspace/my-workspace/ai-presets/abc123
```

**Note**: You'll need an existing workspace and preset. Create them via the UI or seed test data.

### 5. Verify Phase 3 Editor

Before starting development, verify the Phase 3 editor works:

1. Navigate to any AI preset
2. Click "Edit" tab (should be active by default)
3. Verify you can:
   - Edit prompt template in Lexical editor
   - Add/edit/delete variables
   - Upload media to registry
   - See `@{type:name}` mentions autocomplete

### 6. Preview Panel Development

The Preview panel will be added as a new tab in the left panel:

- **Edit tab** (existing): Prompt template + variables configuration
- **Preview tab** (NEW): Test inputs + live preview

## Project Structure

### Key Directories

```
apps/clementine-app/src/
├── domains/ai-presets/
│   ├── editor/                 # EXISTING: Phase 3 (Configuration)
│   │   ├── components/
│   │   │   ├── MediaRegistrySection.tsx
│   │   │   ├── PromptTemplateEditor.tsx
│   │   │   └── VariablesSection.tsx
│   │   ├── containers/
│   │   │   └── AIPresetEditorContent.tsx # MODIFY: Add Preview tab
│   │   ├── hooks/
│   │   │   ├── useUpdateVariables.ts
│   │   │   └── useUpdateMediaRegistry.ts
│   │   └── lib/
│   │       └── updateAIPresetDraft.ts
│   │
│   ├── preview/                # NEW: Phase 4 (Testing/Preview)
│   │   ├── components/
│   │   │   ├── AIPresetPreviewPanel.tsx
│   │   │   ├── TestInputsForm.tsx
│   │   │   ├── PromptPreview.tsx
│   │   │   ├── MediaPreviewGrid.tsx
│   │   │   ├── ValidationDisplay.tsx
│   │   │   └── TestGenerationButton.tsx
│   │   ├── hooks/
│   │   │   ├── useTestInputs.ts
│   │   │   ├── useTestInputs.test.ts      # Colocated test
│   │   │   ├── usePromptResolution.ts
│   │   │   ├── usePromptResolution.test.ts # Colocated test
│   │   │   ├── usePresetValidation.ts
│   │   │   └── usePresetValidation.test.ts # Colocated test
│   │   └── lib/
│   │       ├── prompt-resolution.ts
│   │       └── prompt-resolution.test.ts  # Colocated test
│   │
│   ├── lexical/                # EXISTING: Shared Lexical infrastructure
│   ├── queries/                # EXISTING: Shared TanStack Query hooks
│   │   └── useAIPreset.ts     # Used by both editor and preview
│   └── schemas/                # EXISTING: Shared types/schemas
│
└── shared/
    ├── media/
    │   └── components/
    │       └── MediaPickerField.tsx  # EXISTING: Reuse for test image uploads
    └── editor-status/          # EXISTING: Save status tracking
```

### Important Existing Files

1. **AIPresetEditorContent.tsx** (`editor/containers/`)
   - Container for Edit/Preview tabs
   - Currently shows Edit tab only
   - **Modification needed**: Add Preview tab UI and import AIPresetPreviewPanel

2. **useAIPreset.ts** (`queries/`)
   - TanStack Query hook to fetch preset data
   - Returns preset object with variables, mediaRegistry, promptTemplate
   - **No modification needed**: Reuse from preview domain

3. **MediaPickerField.tsx** (`shared/media/components/`)
   - Component for image uploads
   - Handles Firebase Storage integration
   - **No modification needed**: Import and reuse for test input image uploads

4. **serialization.ts** (`lexical/utils/`)
   - Contains regex pattern for parsing `@{type:name}` references
   - Pattern: `/@\{(text|input|ref):([a-zA-Z_][a-zA-Z0-9_]*)\}/g`
   - **No modification needed**: Reference for consistency in preview domain

## Development Workflow

### Step 1: Create Preview Domain

Create new domain directory structure:

```bash
mkdir -p apps/clementine-app/src/domains/ai-presets/preview/{components,hooks,lib}
```

### Step 2: Create Preview Components

Create components (in priority order):

```bash
cd apps/clementine-app/src/domains/ai-presets/preview/components
touch AIPresetPreviewPanel.tsx TestInputsForm.tsx PromptPreview.tsx \
      MediaPreviewGrid.tsx ValidationDisplay.tsx TestGenerationButton.tsx
```

1. **AIPresetPreviewPanel.tsx** - Container component
2. **TestInputsForm.tsx** - Dynamic form for variable inputs (P1)
3. **PromptPreview.tsx** - Resolved prompt display (P2)
4. **MediaPreviewGrid.tsx** - Media thumbnails (P3)
5. **ValidationDisplay.tsx** - Errors/warnings (P4)
6. **TestGenerationButton.tsx** - Placeholder button (P5)

### Step 3: Implement Core Hooks (with Colocated Tests)

Create hooks with test files:

```bash
cd apps/clementine-app/src/domains/ai-presets/preview/hooks
touch useTestInputs.ts useTestInputs.test.ts \
      usePromptResolution.ts usePromptResolution.test.ts \
      usePresetValidation.ts usePresetValidation.test.ts
```

Implementation order:

1. **useTestInputs.ts** + test - State management for test inputs
2. **usePromptResolution.ts** + test - Resolution logic (parse + substitute)
3. **usePresetValidation.ts** + test - Validation logic (errors + warnings)

### Step 4: Add Utility Functions (with Colocated Tests)

Create lib files with tests:

```bash
cd apps/clementine-app/src/domains/ai-presets/preview/lib
touch prompt-resolution.ts prompt-resolution.test.ts
```

Pure functions for:
- `resolvePrompt()` - Main resolution logic
- `extractMediaReferences()` - Extract image references
- `validatePresetInputs()` - Validation logic (may move to separate file if large)

### Step 5: Modify Existing Editor Container

Update `editor/containers/AIPresetEditorContent.tsx`:

```typescript
// Import preview panel from preview domain
import { AIPresetPreviewPanel } from '@/domains/ai-presets/preview'

// Add Preview tab to tabs array
const tabs = [
  { id: 'edit', label: 'Edit' },
  { id: 'preview', label: 'Preview' }  // NEW
]

// Add tab panel for Preview
{activeTab === 'preview' && (
  <AIPresetPreviewPanel
    preset={preset}
    workspaceId={workspaceId}
  />
)}
```

### Step 6: Add Barrel Exports

Create barrel export for preview domain:

```bash
# Create index.ts in preview domain
cd apps/clementine-app/src/domains/ai-presets/preview
touch index.ts
```

```typescript
// preview/index.ts
export { AIPresetPreviewPanel } from './components/AIPresetPreviewPanel'
// Export other public components/hooks as needed
```

**Note**: Tests are already colocated with source files (no separate test directory needed).

## Testing

### Run Unit Tests

```bash
# Run all preview domain tests
pnpm app:test domains/ai-presets/preview

# Run specific test file (colocated with source)
pnpm app:test prompt-resolution.test.ts

# Run all AI preset tests (editor + preview)
pnpm app:test domains/ai-presets

# Watch mode
pnpm app:test --watch domains/ai-presets/preview
```

### Run Type Check

```bash
pnpm app:type-check
```

### Run Linter

```bash
# Check for linting issues
pnpm app:lint

# Auto-fix linting issues
pnpm app:check
```

### Manual Testing

1. **Create Test Preset**:
   - Navigate to AI Presets list
   - Click "Create Preset"
   - Add variables:
     - Text variable with value map: `style` → { modern: "minimalist", vintage: "retro" }
     - Text variable without value map: `userName`
     - Image variable: `userPhoto`
   - Add media to registry: `styleReference`
   - Add prompt template:
     ```
     Create a @{text:style} portrait of @{text:userName}.
     @{input:userPhoto}
     @{ref:styleReference}
     ```

2. **Test Preview Panel**:
   - Switch to "Preview" tab
   - Verify test inputs form shows:
     - Dropdown for `style` with "modern" and "vintage" options
     - Text input for `userName`
     - Upload zone for `userPhoto`
   - Fill in values:
     - Select "modern" from dropdown
     - Type "Alice" in userName
     - Upload an image for userPhoto
   - Verify resolved prompt shows:
     ```
     Create a minimalist portrait of Alice.
     [Image: userPhoto]
     [Media: styleReference]
     ```
   - Verify media preview grid shows 2 thumbnails
   - Verify validation shows "Valid" status

3. **Test Edge Cases**:
   - Delete a variable, verify test input form updates
   - Remove reference from prompt, verify media preview updates
   - Clear an input, verify validation shows error
   - Upload large image (>10MB), verify error handling

## Common Issues & Solutions

### Issue: Preset data not loading

**Solution**:
- Check Firestore security rules allow read access
- Verify workspaceId and presetId are valid
- Check browser console for TanStack Query errors
- Ensure Firebase is initialized (`useFirebase` hook)

### Issue: Test input state not updating

**Solution**:
- Verify useState is called at component top level
- Check that updateInput function is passed to child components
- Use React DevTools to inspect state
- Ensure input onChange handlers call updateInput

### Issue: Resolved prompt not updating

**Solution**:
- Check useMemo dependencies include all relevant state
- Verify regex pattern matches reference syntax
- Console.log resolved prompt to debug substitution
- Check for typos in variable names

### Issue: Media thumbnails not displaying

**Solution**:
- Verify media registry URLs are accessible
- Check File objects are converted to blob URLs
- Ensure img tags have proper src attribute
- Check browser network tab for 404 errors

### Issue: Type errors in TypeScript

**Solution**:
- Run `pnpm app:type-check` to see all errors
- Ensure all imports have proper types
- Check that shared types are exported correctly
- Verify Zod schemas match TypeScript types

## Code Style Guidelines

### Component Structure

```typescript
// components/preview/TestInputsForm.tsx
import { type PresetVariable } from '@clementine/shared'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type TestInputsFormProps = {
  variables: PresetVariable[]
  testInputs: TestInputState
  onInputChange: (name: string, value: string | File | null) => void
  onReset: () => void
}

export function TestInputsForm({
  variables,
  testInputs,
  onInputChange,
  onReset
}: TestInputsFormProps) {
  return (
    <div className="space-y-4">
      {/* Component implementation */}
    </div>
  )
}
```

### Hook Structure

```typescript
// hooks/usePromptResolution.ts
import { useMemo } from 'react'
import { type ResolvedPrompt, type TestInputState } from '../types'
import { resolvePrompt } from '../lib/prompt-resolution'

export function usePromptResolution(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): ResolvedPrompt {
  return useMemo(() => {
    return resolvePrompt(promptTemplate, testInputs, variables, mediaRegistry)
  }, [promptTemplate, testInputs, variables, mediaRegistry])
}
```

### Utility Function Structure

```typescript
// lib/prompt-resolution.ts
import { type ResolvedPrompt, type TestInputState } from '../types'

export function resolvePrompt(
  promptTemplate: string,
  testInputs: TestInputState,
  variables: PresetVariable[],
  mediaRegistry: PresetMediaEntry[]
): ResolvedPrompt {
  // Pure function implementation
  // No side effects, no external dependencies
  // Easy to test
}
```

## Design System Usage

### Colors (Theme Tokens Only)

```typescript
// ✅ Correct - Use theme tokens
<div className="bg-primary text-primary-foreground">
<div className="border-destructive text-destructive">
<div className="bg-muted text-muted-foreground">

// ❌ Wrong - Never hard-code colors
<div style={{ backgroundColor: '#3B82F6' }}>
<div className="text-[#FF0000]">
```

### Component Imports

```typescript
// ✅ Correct - Import from @/components/ui/
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

// ❌ Wrong - Don't import from node_modules directly
import { Button } from '@radix-ui/react-button'
```

### Touch Targets

```typescript
// ✅ Correct - Minimum 44px touch targets
<Button size="lg">Run Test</Button>  // Large button (44px+)
<Input className="h-11" />           // Tall input (44px)

// ❌ Wrong - Too small for mobile
<Button size="sm">Run</Button>  // Small button (32px)
```

## Performance Tips

1. **Memoize Components**:
   ```typescript
   export const PromptPreview = React.memo(PromptPreviewInner)
   ```

2. **Debounce Expensive Operations**:
   ```typescript
   // useMemo already debounces by not recomputing when deps don't change
   const resolved = useMemo(() => resolve(...), [deps])
   ```

3. **Lazy Load Images**:
   ```typescript
   <img loading="lazy" src={url} alt={name} />
   ```

4. **Optimize Re-renders**:
   ```typescript
   // Split state to minimize re-renders
   const [userName, setUserName] = useState('')  // Only TextField re-renders
   // vs
   const [allInputs, setAllInputs] = useState({})  // Entire form re-renders
   ```

## Next Steps

1. ✅ Read this quickstart guide
2. ✅ Set up development environment
3. ✅ Review Phase 3 editor (understand existing code)
4. **Next**: Run `/speckit.tasks` to generate step-by-step implementation tasks

**Command**: `/speckit.tasks`

This will create `tasks.md` with prioritized tasks matching the user stories (P1-P5).

## Resources

- **Spec**: [spec.md](./spec.md) - Feature requirements and acceptance criteria
- **Plan**: [plan.md](./plan.md) - Technical architecture and decisions
- **Research**: [research.md](./research.md) - Technical research findings
- **Data Model**: [data-model.md](./data-model.md) - Entity definitions and relationships
- **Standards**: `/standards/` directory - Code quality, design system, architecture
- **PRD**: `/requirements/ai-presets/prd-phases.md` - Phase 4 context

## Support

If you encounter issues not covered in this guide:

1. Check existing Phase 3 code for patterns
2. Review standards in `/standards/` directory
3. Consult research.md for technical decisions
4. Ask team for clarification on ambiguous requirements
