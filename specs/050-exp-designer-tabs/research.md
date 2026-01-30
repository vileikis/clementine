# Research: Experience Designer Tabs - Collect and Generate

**Feature**: 050-exp-designer-tabs
**Date**: 2026-01-30
**Purpose**: Document technical decisions, routing patterns, and backend cleanup strategy

## Overview

This document captures research findings for implementing tabbed navigation in the Experience Designer and removing deprecated AI transform step functionality.

## Research Areas

### 1. TanStack Router Tab Navigation Pattern

**Question**: How should we implement tab navigation using TanStack Router's file-based routing?

**Research Findings**:

Examined `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx` and `ProjectConfigDesignerLayout.tsx` to understand the existing tab pattern.

**Pattern Identified**:
1. **Parent route** (`$experienceId.tsx`): Redirects to default tab
2. **Child routes** (`$experienceId.collect.tsx`, `$experienceId.generate.tsx`): Handle each tab
3. **Layout component** (`ExperienceDesignerLayout`): Defines tab configuration and passes to TopNavBar
4. **Tab configuration**: Array of `TabItem` with `id`, `label`, and `to` (route path)

**Decision**: Follow the ProjectConfigDesignerLayout pattern exactly.

**Rationale**:
- Proven pattern already in use (project config designer)
- Consistent user experience across designers
- Type-safe routing with TanStack Router's `createFileRoute`
- URL-based tab state (bookmarkable, shareable, browser back/forward support)

**Implementation Details**:
```typescript
// Tab configuration in ExperienceDesignerLayout
const experienceDesignerTabs: TabItem[] = [
  {
    id: 'collect',
    label: 'Collect',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
  },
  {
    id: 'generate',
    label: 'Generate',
    to: '/workspace/$workspaceSlug/experiences/$experienceId/generate',
  },
]

// Pass to TopNavBar
<TopNavBar
  breadcrumbs={[...]}
  tabs={experienceDesignerTabs}
  right={<>...</>}
/>
```

**Alternatives Considered**:
- **Client-side tab state with React useState**: Rejected because URL state is lost on page refresh, not bookmarkable
- **Query parameter approach** (`?tab=collect`): Rejected because TanStack Router file-based routing provides better type safety and route matching

**References**:
- `apps/clementine-app/src/domains/project-config/designer/containers/ProjectConfigDesignerLayout.tsx` (lines 20-41)
- `apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx`

---

### 2. Route Redirect Strategy for Default Tab

**Question**: How should we handle `/workspace/{slug}/experiences/{expId}` (no tab) to redirect to the Collect tab?

**Research Findings**:

Examined parent route in project config designer: `$projectId.tsx` uses `redirect()` from TanStack Router.

**Decision**: Use TanStack Router's `redirect()` in the parent route's `beforeLoad` hook to redirect to `/collect`.

**Rationale**:
- Server-side redirect (SEO-friendly, no flash of wrong content)
- Type-safe redirect using route params
- Consistent with existing pattern in project config designer

**Implementation Details**:
```typescript
// In $experienceId.tsx
export const Route = createFileRoute('/.../experiences/$experienceId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/experiences/$experienceId/collect',
      params,
    })
  },
})
```

**Alternatives Considered**:
- **Client-side redirect with useEffect**: Rejected because it causes content flash and is not SSR-friendly
- **Component-level redirect**: Rejected because `beforeLoad` is more efficient (redirects before rendering)

**References**:
- TanStack Router documentation on redirects
- `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx`

---

### 3. Preserving Step Selection Query Params Across Tabs

**Question**: How do we preserve `?step={stepId}` when navigating from Collect to Generate and back?

**Research Findings**:

Examined `useStepSelection` hook: Uses TanStack Router's `navigate()` with `search` param updates.

**Decision**: Query parameters are automatically preserved by TanStack Router when navigating between child routes. No special handling needed.

**Rationale**:
- TanStack Router merges search params by default when navigating
- `useStepSelection` already handles URL sync for Collect tab
- Generate tab ignores step param (doesn't use it)
- Returning to Collect tab restores step param from URL

**Implementation Details**:
- Collect route: Defines `search` schema with `step: z.string().optional()`
- Generate route: No search schema (ignores query params)
- Tab navigation: TopNavBar uses `<Link>` with `to` prop (preserves search params)

**Verification**:
Test scenario: `/collect?step=abc123` → click Generate tab → `/generate?step=abc123` → click Collect tab → `/collect?step=abc123` (step selection restored)

**Alternatives Considered**:
- **Manual search param preservation**: Rejected because TanStack Router handles this automatically
- **Clear step param when switching tabs**: Rejected because it breaks user expectation (lose place in workflow)

**References**:
- `apps/clementine-app/src/domains/experience/designer/hooks/useStepSelection.ts`
- TanStack Router documentation on search param merging

---

### 4. Component Reuse Strategy for Collect Tab

**Question**: Should we reuse ExperienceDesignerPage or create a new component?

**Research Findings**:

Examined existing `ExperienceDesignerPage.tsx`: Contains all step management logic (step list, preview, config panel, mobile sheets).

**Decision**: Rename `ExperienceDesignerPage` to `ExperienceCollectPage` and use it in the Collect route.

**Rationale**:
- 100% feature parity requirement (FR-008 to FR-012) - no changes to step management
- YAGNI principle - don't create new abstraction when renaming suffices
- Maintains all existing behavior (drag-and-drop, mobile sheets, save debouncing)
- Clear naming convention: `ExperienceCollectPage` matches `ExperienceGeneratePage`

**Implementation Details**:
1. Rename file: `ExperienceDesignerPage.tsx` → `ExperienceCollectPage.tsx`
2. Rename component: `ExperienceDesignerPage` → `ExperienceCollectPage`
3. Update imports in Collect route
4. Update barrel export in `containers/index.ts`

**Alternatives Considered**:
- **Create new CollectPage that wraps DesignerPage**: Rejected because it adds unnecessary indirection
- **Keep name as DesignerPage**: Rejected because it's confusing when there's also a GeneratePage

**References**:
- `apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerPage.tsx`

---

### 5. Generate Tab Placeholder Design

**Question**: What should the Generate tab placeholder look like?

**Research Findings**:

Reviewed common WIP/placeholder patterns in UI design and existing Clementine components.

**Decision**: Create minimal placeholder with centered message and icon indicating future functionality.

**Rationale**:
- YAGNI principle - don't over-design placeholder
- Clear communication to users that feature is coming
- Consistent layout (uses same container structure as other designer pages)
- Mobile-responsive (centered content works on all screen sizes)

**Implementation Details**:
```typescript
export function ExperienceGeneratePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4">
        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">AI Transform Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Configure AI transformation settings for your experience.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Coming soon
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Alternatives Considered**:
- **Empty page with no message**: Rejected because it's confusing (looks broken)
- **Detailed feature roadmap**: Rejected because it's speculative and adds unnecessary complexity
- **Interactive demo/preview**: Rejected because it's out of scope for MVP placeholder

**References**:
- shadcn/ui empty state patterns
- Lucide icons for WIP indicators

---

### 6. Frontend Cleanup Strategy for Transform Pipeline Step Type

**Question**: What needs to be removed to clean up the unused `transform.pipeline` step type?

**Research Findings**:

Analyzed `transform.pipeline` step type usage in frontend and shared package. Key findings:
- **Step type only**: `transform.pipeline` is a frontend step type in the shared schema
- **No production data**: Never used in production (placeholder only)
- **Backend independence**: Backend AI transform service is separate and unrelated to this step type
- **Clean separation**: Removing the step type doesn't affect backend functionality

**Decision**: Remove `transform.pipeline` step type from shared schema and frontend step system. Leave backend (`functions/`) completely untouched.

**Rationale**:
- Backend AI transform service is independent (doesn't depend on shared step schema)
- `transform.pipeline` step type was never connected to the backend service
- Clean removal with minimal scope (13 frontend files + 2 shared files)
- TypeScript compiler will catch any missed references (strict mode)
- No backward compatibility needed (feature never used in production)

**Implementation Strategy**:

**Shared Package Cleanup**:
1. Delete step schema: `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts`
2. Remove from step union: `packages/shared/src/schemas/experience/step.schema.ts`
   - Remove `transformPipelineStepSchema` from discriminated union
   - Remove import statement

**Frontend Cleanup** (apps/clementine-app):
1. Delete config panel: `src/domains/experience/steps/config-panels/TransformPipelineConfigPanel.tsx`
2. Delete renderer: `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx`
3. Update step registry: `step-registry.ts` (remove transform.pipeline entry)
4. Update validation: `step-validation.ts` (remove transform.pipeline validation)
5. Update defaults: `defaults.ts` (remove `createDefaultTransformPipelineConfig`)
6. Update router: `StepRendererRouter.tsx` (remove transform.pipeline case)
7. Update barrel exports: Remove from `index.ts` files

**Backend** (functions/):
- **No changes** - AI transform service remains independent and untouched

**Verification**:
- Run `pnpm app:type-check` (frontend type safety)
- Run `pnpm --filter @clementine/shared build` (shared package builds)
- Search for remaining step type references: `grep -r "transform\.pipeline" apps/ packages/`
- Search for remaining imports: `grep -r "TransformPipeline" apps/`

**Alternatives Considered**:
- **Remove backend AI service too**: Rejected because backend service is independent and may be used elsewhere
- **Keep schema but mark deprecated**: Rejected because it leaves dead code in codebase
- **Gradual migration**: Rejected because feature was never used in production

**References**:
- `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts` (empty placeholder schema)
- `packages/shared/src/schemas/experience/experience.schema.ts` (experience-level `transform` field is separate)

---

## Summary

All research findings support the technical approach outlined in the implementation plan:

1. **Tab Navigation**: Follow ProjectConfigDesignerLayout pattern with file-based routing
2. **Default Redirect**: Use `beforeLoad` redirect in parent route
3. **Step Selection**: TanStack Router automatically preserves query params
4. **Collect Tab**: Rename ExperienceDesignerPage to ExperienceCollectPage
5. **Generate Tab**: Minimal placeholder in new `domains/experience/generate/` subdomain
6. **Frontend Cleanup**: Remove `transform.pipeline` step type from shared schema and frontend (backend untouched)

**Revised Scope**:
- **Frontend**: 13 files (3 new, 1 renamed, 2 deleted, 6 modified, 1 new subdomain)
- **Shared Package**: 2 files (1 deleted, 1 modified)
- **Backend**: 0 files (completely untouched - AI service is independent)

No unresolved clarifications remain. Ready for Phase 1 (Design & Contracts).
