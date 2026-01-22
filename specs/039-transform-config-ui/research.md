# Research: Transform Pipeline Creator Config UI

**Date**: 2026-01-22
**Feature**: 039-transform-config-ui

## Overview

This document captures research findings for implementing the Transform Pipeline Creator Config UI feature. All technical context is already established from the existing codebase - no external research needed.

---

## 1. Tabbed Panel Pattern

### Decision: Use Radix UI Tabs for Steps/Transform switching

**Rationale**:
- Radix UI Tabs (via shadcn/ui) provides accessible keyboard navigation out of the box
- Consistent with existing component library usage
- Supports controlled mode for URL sync if needed later

**Alternatives Considered**:
- Custom button toggle: Rejected - would need to implement accessibility manually
- Accordion: Rejected - doesn't match the side-by-side switching UX

**Implementation Pattern**:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui-kit/ui/tabs'

<Tabs defaultValue="steps">
  <TabsList>
    <TabsTrigger value="steps">Steps</TabsTrigger>
    <TabsTrigger value="transform">Transform</TabsTrigger>
  </TabsList>
  <TabsContent value="steps"><StepList /></TabsContent>
  <TabsContent value="transform"><TransformPanel /></TabsContent>
</Tabs>
```

---

## 2. Node List Drag-and-Drop

### Decision: Reuse existing @dnd-kit patterns from StepList

**Rationale**:
- StepList already implements a working drag-and-drop solution
- Same sensors (PointerSensor with 8px activation, KeyboardSensor)
- Same sortable context pattern with `verticalListSortingStrategy`
- Proven patterns reduce implementation risk

**Key Pattern from StepList**:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // Prevent accidental drag
  }),
  useSensor(KeyboardSensor)
)

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={nodeIds} strategy={verticalListSortingStrategy}>
    {nodes.map(node => <TransformNodeItem key={node.id} node={node} />)}
  </SortableContext>
</DndContext>
```

---

## 3. Save Patterns

### Decision: Mirror existing experience designer save patterns

**Pattern A - Immediate Save** (for list operations: add, delete, reorder nodes/variables):
- Update local state immediately
- Call mutation synchronously
- Use `updateExperienceConfigField` helper for atomic updates
- Increment `draftVersion` in transaction

**Pattern B - Debounced Auto-Save** (for node configuration editing):
- 2000ms debounce via `useAutoSave` hook
- react-hook-form for form state
- Optimistic UI updates (live preview)
- EditorSaveStatus component shows save feedback

**Rationale**: Consistency with existing step editing UX - users expect the same behavior.

---

## 4. Schema Extension Strategy

### Decision: Extend shared package schemas with PRD-defined node types

**Rationale**:
- PRD spec (requirements/transform-pipeline/spec.md) defines detailed schemas
- Current shared schema is simplified placeholder
- Discriminated union for node types enables type-safe config panels

**Schema Updates Required**:

1. **variableMappingSchema** - Update to PRD structure:
   - `type: 'answer' | 'capturedMedia'`
   - `stepId: string`
   - `field: string | null` (optional)
   - `defaultValue: string | number | boolean | null`

2. **nodeInputSourceSchema** - Discriminated union:
   - `{ source: 'variable', variableName: string }`
   - `{ source: 'previousNode' }`
   - `{ source: 'node', nodeId: string }`

3. **Node schemas** - Discriminated union by `type`:
   - `removeBackground`: input, mode
   - `composite`: layers (placeholder for Phase 6)
   - `backgroundSwap`: input, backgroundSource
   - `aiImage`: input, promptTemplate, model, aspectRatio, references

4. **transformConfigSchema** - Update structure:
   - `variableMappings: Record<string, VariableMapping>` (keyed by variable name)
   - `nodes: TransformNode[]`
   - `outputFormat: 'image' | 'gif' | 'video'`

---

## 5. Node Registry Pattern

### Decision: Create node registry similar to step registry

**Rationale**:
- Step registry pattern (`step-registry.ts`) works well for type definitions
- Provides centralized metadata (display names, icons, default configs)
- Enables consistent UI generation

**Registry Structure**:
```typescript
export const nodeRegistry = {
  removeBackground: {
    type: 'removeBackground',
    displayName: 'Cut Out',
    icon: Scissors,
    defaultConfig: { mode: 'keepSubject' },
  },
  composite: {
    type: 'composite',
    displayName: 'Combine',
    icon: Layers,
    defaultConfig: { layers: [], outputFormat: 'auto' },
  },
  backgroundSwap: {
    type: 'backgroundSwap',
    displayName: 'Background Swap',
    icon: ImageIcon,
    defaultConfig: { backgroundSource: null },
  },
  aiImage: {
    type: 'aiImage',
    displayName: 'AI Image',
    icon: Sparkles,
    defaultConfig: { promptTemplate: '', model: 'gemini-2.5-flash', aspectRatio: '1:1' },
  },
} as const
```

---

## 6. Right Panel Integration

### Decision: Extend StepConfigPanelContainer to handle both steps and nodes

**Approach**:
- When a step is selected (and Transform tab is not active), show step config
- When a node is selected (Transform tab active), show node config
- Use discriminated prop type to determine which to render

**Alternative Considered**:
- Separate containers for step vs node config: Rejected - would duplicate debounce/save logic

**Implementation**:
```tsx
// StepConfigPanelContainer already handles step config
// Add a mode prop or check selected item type
type ConfigTarget =
  | { type: 'step'; step: Step }
  | { type: 'node'; node: TransformNode }
```

---

## 7. Variable Mapping UI

### Decision: Collapsible section in TransformPanel with inline editing

**UX Flow**:
1. Variables section collapsed by default (show count)
2. Expand to see list of variable mappings
3. Each mapping shows: variable name → step name (data type)
4. Click to edit inline or via dialog
5. "Add Variable" button opens dialog with:
   - Variable name input (validated for uniqueness)
   - Step selector (filtered to existing steps)
   - Data type selector (answer or capturedMedia)
   - Default value input (optional)

**Validation**:
- Variable names must be unique
- Step must exist
- Show warning indicator if referenced step is deleted

---

## 8. Mobile Responsive Strategy

### Decision: Follow existing sheet-based mobile pattern

**From ExperienceDesignerPage**:
- Mobile: Hide left panel, show "Steps" button that opens Sheet
- Mobile: Hide right panel, show "Configure" button that opens Sheet

**For Transform**:
- Same pattern - Transform tab content shows in left sheet on mobile
- Node config shows in right sheet on mobile
- Tab switching works within the sheet

---

## Summary

All research questions resolved using existing codebase patterns:

| Topic | Decision | Source |
|-------|----------|--------|
| Tab UI | Radix UI Tabs | shadcn/ui library |
| Drag-and-drop | @dnd-kit with existing sensor config | StepList.tsx |
| Save patterns | Immediate (list) / Debounced (config) | ExperienceDesignerPage |
| Schemas | Extend with PRD definitions | requirements/transform-pipeline/spec.md |
| Node registry | Centralized metadata object | step-registry.ts pattern |
| Right panel | Extend existing container | StepConfigPanelContainer |
| Variable UI | Collapsible list with dialog | Standard pattern |
| Mobile | Sheet-based responsive | ExperienceDesignerPage |

No external research or clarifications needed - implementation can proceed.
