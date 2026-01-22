# Quickstart: Transform Pipeline Creator Config UI

**Date**: 2026-01-22
**Feature**: 039-transform-config-ui

## Prerequisites

- Node.js 20+
- pnpm 10.18.1
- Firebase emulators (optional for local testing)

## Setup

```bash
# From monorepo root
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine

# Install dependencies
pnpm install

# Build shared package (schemas)
pnpm --filter @clementine/shared build

# Start development server
pnpm app:dev
```

## Development Workflow

### 1. Schema Changes First

Update transform schemas in shared package:

```bash
# Edit schema file
code packages/shared/src/schemas/experience/transform.schema.ts

# Rebuild shared package
pnpm --filter @clementine/shared build

# Run type check to verify
pnpm app:type-check
```

### 2. Component Development

New components go in the transform subdomain:

```bash
# Create transform module structure
mkdir -p apps/clementine-app/src/domains/experience/transform/{components,config-panels,hooks,registry}
```

### 3. Running Locally

```bash
# Start dev server
pnpm app:dev

# Navigate to experience designer
# URL: http://localhost:3000/workspace/{slug}/experiences/{id}
```

### 4. Validation Before Commit

```bash
# Run all checks
pnpm app:check

# Or individually
pnpm app:format
pnpm app:lint
pnpm app:type-check
pnpm app:test
```

## Key Files to Reference

### Existing Patterns

| Pattern | Reference File |
|---------|---------------|
| Drag-and-drop list | `apps/clementine-app/src/domains/experience/designer/components/StepList.tsx` |
| List item with sortable | `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx` |
| Config panel container | `apps/clementine-app/src/domains/experience/designer/containers/StepConfigPanelContainer.tsx` |
| Config panel component | `apps/clementine-app/src/domains/experience/steps/renderers/InfoRenderer/InfoStepConfigPanel.tsx` |
| Step registry | `apps/clementine-app/src/domains/experience/steps/registry/step-registry.ts` |
| Mutation hooks | `apps/clementine-app/src/domains/experience/designer/hooks/useUpdateDraftSteps.ts` |
| Editor controls | `apps/clementine-app/src/shared/editor-controls/` |

### Schemas

| Schema | Location |
|--------|----------|
| Transform config | `packages/shared/src/schemas/experience/transform.schema.ts` |
| Experience config | `packages/shared/src/schemas/experience/experience.schema.ts` |
| Step schemas | `packages/shared/src/schemas/experience/steps/` |

## Testing Checklist

- [ ] Transform tab appears in experience designer
- [ ] Can add each node type (Cut Out, Combine, Background Swap, AI Image)
- [ ] Can reorder nodes via drag-and-drop
- [ ] Can delete nodes
- [ ] Can add/edit/remove variable mappings
- [ ] Node config panel shows when node selected
- [ ] Changes persist after page reload
- [ ] Mobile responsive (sheets work correctly)

## Common Issues

### Schema Type Errors

If you get type errors after schema changes:

```bash
# Rebuild shared package
pnpm --filter @clementine/shared build

# Restart TS server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Drag-and-drop Not Working

Check that:
1. `DndContext` wraps the list
2. `SortableContext` has correct `items` array (node IDs)
3. `useSortable` hook is used in item component
4. `setNodeRef` and `style` are applied to item wrapper

### Save Not Triggering

Check that:
1. Mutation is called after state update
2. `invalidateQueries` is called on success
3. No errors in console (check Sentry)

## Standards Compliance

Before marking complete, review:

- [ ] `standards/frontend/design-system.md` - No hard-coded colors
- [ ] `standards/frontend/component-libraries.md` - Using shadcn/ui
- [ ] `standards/global/project-structure.md` - Correct file naming
- [ ] `standards/global/code-quality.md` - Clean, simple code
