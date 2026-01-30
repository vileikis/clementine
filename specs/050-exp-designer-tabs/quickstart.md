# Quickstart: Experience Designer Tabs - Collect and Generate

**Feature**: 050-exp-designer-tabs
**Date**: 2026-01-30
**Purpose**: Quick reference for developers implementing this feature

## Overview

Add tabbed navigation to Experience Designer:
- **Collect tab**: Step management (existing functionality, renamed)
- **Generate tab**: Transform pipeline placeholder in new subdomain (WIP message)
- **Frontend cleanup**: Remove `transform.pipeline` step type (backend untouched)

## Prerequisites

- Branch `050-exp-designer-tabs` checked out
- Dependencies installed: `pnpm install`
- Familiar with TanStack Router file-based routing
- Familiar with existing `ProjectConfigDesignerLayout` tab pattern

## Implementation Checklist

### Phase 1: Frontend Routes (Collect & Generate Tabs)

- [ ] **Create Collect route** (`$experienceId.collect.tsx`)
  - Copy pattern from `$projectId.welcome.tsx` (project config designer)
  - Define search schema for `?step=` param
  - Import and render `ExperienceDesignerLayout` + `ExperienceCollectPage`

- [ ] **Create Generate route** (`$experienceId.generate.tsx`)
  - No search schema (ignores query params)
  - Import and render `ExperienceDesignerLayout` + `ExperienceGeneratePage`

- [ ] **Update parent route** (`$experienceId.tsx`)
  - Add `beforeLoad` redirect to `/collect`
  - Remove existing component (only redirects now)

### Phase 2: Layout & Tab Configuration

- [ ] **Update ExperienceDesignerLayout**
  - Define `experienceDesignerTabs` array (similar to `projectConfigDesignerTabs`)
  - Pass `tabs` prop to `TopNavBar`
  - Verify `right` slot (preview, publish buttons) unchanged

### Phase 3: Page Components

- [ ] **Rename ExperienceDesignerPage → ExperienceCollectPage**
  - Rename file: `designer/containers/ExperienceDesignerPage.tsx` → `ExperienceCollectPage.tsx`
  - Rename component export
  - Update imports in Collect route
  - Update barrel export (`designer/containers/index.ts`)

- [ ] **Create Generate subdomain**
  - Create new directory: `domains/experience/generate/`
  - Create subdirectories: `containers/`
  - Create barrel export: `generate/index.ts`

- [ ] **Create ExperienceGeneratePage**
  - New file: `generate/containers/ExperienceGeneratePage.tsx`
  - Centered placeholder with Sparkles icon + "Coming soon" message
  - Export from `generate/containers/index.ts`
  - Export from `generate/index.ts`

### Phase 4: Frontend AI Transform Step Cleanup

- [ ] **Delete config panel**
  - Delete `config-panels/TransformPipelineConfigPanel.tsx`
  - Remove export from `config-panels/index.ts`

- [ ] **Delete renderer**
  - Delete `renderers/TransformPipelineRenderer.tsx`
  - Remove export from `renderers/index.ts`

- [ ] **Update step registry**
  - Remove `transform.pipeline` entry from `step-registry.ts`
  - Remove validation in `step-validation.ts`
  - Remove `createDefaultTransformPipelineConfig` from `defaults.ts`

- [ ] **Update step router**
  - Remove `transform.pipeline` case from `StepRendererRouter.tsx`

### Phase 5: Shared Package Schema Cleanup

- [ ] **Delete transform pipeline schema**
  - Delete `packages/shared/src/schemas/experience/steps/transform-pipeline.schema.ts`

- [ ] **Update step schema**
  - Remove `transformPipelineStepSchema` from discriminated union in `step.schema.ts`
  - Remove import statement

- [ ] **Build shared package**
  - Run `pnpm --filter @clementine/shared build`
  - Verify no TypeScript errors

### Phase 6: Validation & Testing

- [ ] **Frontend validation**
  - Run `pnpm app:type-check` (apps/clementine-app)
  - Run `pnpm app:check` (format + lint + type-check)
  - Search for remaining references: `grep -r "transform\.pipeline" apps/ packages/`

- [ ] **Shared package validation**
  - Run `pnpm --filter @clementine/shared build`
  - Run `pnpm --filter @clementine/shared test`

- [ ] **Manual testing**
  - Start dev server: `pnpm dev`
  - Navigate to experience designer
  - Verify redirect: `/experiences/{id}` → `/experiences/{id}/collect`
  - Test tab switching: Collect ↔ Generate
  - Test step selection preservation: `/collect?step=abc` → Generate → back to Collect
  - Test mobile responsive tabs (resize browser)
  - Verify Generate placeholder displays correctly

## Quick Commands

```bash
# Development
pnpm dev                          # Start dev server (test routes)
pnpm app:check                    # Format + lint + type-check (frontend)
pnpm app:type-check               # TypeScript validation only

# Shared package
pnpm --filter @clementine/shared build    # Build shared schemas
pnpm --filter @clementine/shared test     # Run shared package tests

# Search for remaining references
grep -r "transform\.pipeline" apps/ packages/
grep -r "TransformPipeline" apps/
```

## File Structure Reference

```
apps/clementine-app/src/
├── app/workspace/$workspaceSlug.experiences/
│   ├── $experienceId.tsx              # [MODIFY] Redirect to /collect
│   ├── $experienceId.collect.tsx      # [NEW] Collect route
│   └── $experienceId.generate.tsx     # [NEW] Generate route
└── domains/experience/
    ├── designer/containers/
    │   ├── ExperienceDesignerLayout.tsx     # [MODIFY] Add tabs
    │   └── ExperienceCollectPage.tsx        # [NEW] Renamed from ExperienceDesignerPage
    ├── generate/                            # [NEW] Generate subdomain
    │   ├── containers/
    │   │   └── ExperienceGeneratePage.tsx   # [NEW] Placeholder
    │   └── index.ts                         # [NEW] Barrel export
    └── steps/
        ├── config-panels/
        │   └── [DELETE TransformPipelineConfigPanel.tsx]
        ├── renderers/
        │   └── [DELETE TransformPipelineRenderer.tsx]
        ├── registry/
        │   ├── step-registry.ts       # [MODIFY] Remove transform.pipeline
        │   └── step-validation.ts     # [MODIFY] Remove validation
        ├── components/
        │   └── StepRendererRouter.tsx # [MODIFY] Remove case
        └── defaults.ts                # [MODIFY] Remove factory

packages/shared/src/schemas/experience/
├── steps/
│   └── [DELETE transform-pipeline.schema.ts]
└── step.schema.ts                     # [MODIFY] Remove from union

functions/                             # [NO CHANGES - Backend untouched]
```

## Common Issues & Solutions

### Issue: TypeScript errors after removing transform.pipeline

**Solution**: Make sure you've removed ALL references:
1. Schema from `step.schema.ts` discriminated union
2. Import statement for `transformPipelineStepSchema`
3. Registry entry in `step-registry.ts`
4. Validation in `step-validation.ts`
5. Router case in `StepRendererRouter.tsx`

### Issue: Tab navigation doesn't work

**Solution**: Check TabItem configuration in `ExperienceDesignerLayout`:
- Ensure `to` paths match route file names
- Verify `tabs` prop passed to `TopNavBar`
- Check route files exist in correct locations

### Issue: Step selection lost when switching tabs

**Solution**: This is expected behavior. Step selection is Collect-tab specific. When returning to Collect, TanStack Router preserves `?step=` param from URL.

## Testing Scenarios

### 1. Tab Navigation
- [ ] Click Collect tab → URL updates to `/collect`
- [ ] Click Generate tab → URL updates to `/generate`
- [ ] Browser back button → Returns to previous tab
- [ ] Browser forward button → Navigates forward
- [ ] Refresh page → Current tab preserved

### 2. Step Selection (Collect Tab)
- [ ] Click step in list → URL updates with `?step={id}`
- [ ] Switch to Generate → Step param preserved in URL
- [ ] Switch back to Collect → Step selection restored
- [ ] Invalid step ID in URL → No step selected (graceful)

### 3. Experience Actions (Cross-Tab)
- [ ] Preview button works from Collect tab
- [ ] Preview button works from Generate tab
- [ ] Publish button works from both tabs
- [ ] Save status indicators consistent across tabs
- [ ] Experience details dialog accessible from both tabs

### 4. Mobile Responsive
- [ ] Tabs render correctly on mobile (320px width)
- [ ] Tab touch targets ≥ 44x44px
- [ ] Mobile sheets work in Collect tab
- [ ] Generate placeholder centered on mobile

## Next Steps

After implementation:
1. Run validation checklist (Phase 9)
2. Manual testing on localhost
3. Create PR with implementation
4. Reference this spec in PR description
5. Run `/speckit.tasks` to generate implementation tasks (if needed)

## References

- **Spec**: `specs/050-exp-designer-tabs/spec.md`
- **Plan**: `specs/050-exp-designer-tabs/plan.md`
- **Research**: `specs/050-exp-designer-tabs/research.md`
- **Data Model**: `specs/050-exp-designer-tabs/data-model.md`
- **Route Contracts**: `specs/050-exp-designer-tabs/contracts/routes.md`
- **Example Pattern**: `src/domains/project-config/designer/` (project config tabs)
