# Quickstart: Step System & Experience Editor

**Feature**: 022-step-system-editor
**Date**: 2026-01-13

## Prerequisites

- Node.js 20+ and pnpm 10.18.1
- Firebase project configured (dev environment)
- Experience data layer (E1) implemented
- Access to workspace with existing experiences

## Development Setup

```bash
# From monorepo root
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine

# Install dependencies (if not already)
pnpm install

# Start development server
pnpm app:dev
```

## Key Files to Implement

### Phase 1: Step Registry & Schemas

```
apps/clementine-app/src/domains/experience/steps/
├── registry/
│   ├── step-registry.ts     # START HERE - central registry
│   └── step-utils.ts        # Profile filtering helpers
└── schemas/
    ├── info.schema.ts       # Zod schemas for each type
    └── ...
```

### Phase 2: Editor Layout

```
apps/clementine-app/src/domains/experience/designer/
├── containers/
│   └── ExperienceDesignerPage.tsx  # 3-column layout orchestration
└── components/
    ├── StepList.tsx                 # Left column
    ├── StepPreview.tsx              # Center column
    └── StepConfigPanel.tsx          # Right column
```

### Phase 3: Step Renderers (Edit Mode)

```
apps/clementine-app/src/domains/experience/steps/renderers/
├── InfoStepRenderer.tsx
├── InputScaleRenderer.tsx
└── ...
```

### Phase 4: Config Panels

```
apps/clementine-app/src/domains/experience/steps/config-panels/
├── InfoStepConfigPanel.tsx
├── InputScaleConfigPanel.tsx
└── ...
```

### Phase 5: Step Management

```
apps/clementine-app/src/domains/experience/designer/
├── components/
│   └── AddStepDialog.tsx
└── hooks/
    └── useStepSelection.ts
```

### Phase 6: Auto-Save & Publish

```
apps/clementine-app/src/domains/experience/designer/hooks/
├── useUpdateExperienceDraft.ts
└── usePublishExperience.ts
```

## Testing the Feature

### Manual Testing Path

1. **Navigate to experience editor**:
   ```
   http://localhost:3000/workspace/{slug}/experiences/{experienceId}
   ```

2. **Test step creation**:
   - Click "Add Step" → Select step type
   - Verify step appears in list and is selected
   - Verify preview shows default content

3. **Test configuration**:
   - Modify fields in config panel
   - Verify preview updates immediately (<100ms)

4. **Test reordering**:
   - Drag step to new position
   - Verify order persists after refresh

5. **Test auto-save**:
   - Make changes, wait 2 seconds
   - Verify "Saving..." → "Saved" indicator
   - Refresh page, verify changes persisted

6. **Test publish**:
   - With valid steps: Click Publish → Success toast
   - With no steps: Click Publish → Validation error
   - With invalid config: Click Publish → Field-level errors

### Profile Filtering Test

| Profile | Expected Available Steps |
|---------|-------------------------|
| freeform | All 8 types |
| survey | 7 types (no transform.pipeline) |
| story | 1 type (info only) |

## Existing Patterns to Follow

### Editor Controls (reuse from shared)

```tsx
import {
  TextField,
  TextareaField,
  SelectField,
  SliderField,
  EditorSection,
  EditorRow
} from '@/shared/editor-controls'
```

### Auto-Save Hook

```tsx
import { useAutoSave } from '@/shared/forms/hooks/useAutoSave'

const { triggerSave } = useAutoSave({
  form,
  originalValues: experience.draft,
  onUpdate: async (updates) => {
    await updateDraft.mutateAsync({ ...updates })
  },
  fieldsToCompare: ['steps'],
  debounceMs: 2000,
})
```

### Preview Shell

```tsx
import { PreviewShell } from '@/shared/preview-shell'

<PreviewShell enableViewportSwitcher enableFullscreen>
  <StepRenderer mode="edit" step={selectedStep} config={selectedStep.config} />
</PreviewShell>
```

### Editor Store (save status tracking)

```tsx
import { useExperienceDesignerStore } from '../stores/useExperienceDesignerStore'

const { pendingSaves, lastCompletedAt } = useExperienceDesignerStore()

// In mutation wrapper
const { startSave, completeSave } = useExperienceDesignerStore()
```

## Validation Commands

```bash
# Before committing
pnpm app:check          # Format + lint fix
pnpm app:type-check     # TypeScript validation
pnpm app:test           # Run tests

# Development
pnpm app:dev            # Start dev server
```

## Reference Implementations

- **Welcome Editor**: `domains/event/welcome/` - 2-column editor pattern
- **Event Designer Layout**: `domains/event/designer/` - Publish flow, save status
- **Tracked Mutations**: `domains/event/designer/hooks/useTrackedMutation.ts`

## Notes

- Step schemas use `z.looseObject()` for Firestore forward compatibility
- Lazy load renderers and config panels to reduce bundle size
- URL sync via TanStack Router search params: `?step={stepId}`
- Mobile: Use Sheet component for config panel on small screens
