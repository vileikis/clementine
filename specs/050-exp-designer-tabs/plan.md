# Implementation Plan: Experience Designer Tabs - Collect and Generate

**Branch**: `050-exp-designer-tabs` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/050-exp-designer-tabs/spec.md`

## Summary

Add tabbed navigation to the Experience Designer with two tabs: **Collect** (for managing data collection steps) and **Generate** (placeholder for future AI transformation configuration). The Collect tab preserves all existing step management functionality with URL-based step selection. The Generate tab displays a work-in-progress message. Additionally, remove deprecated `transform.pipeline` step type from shared schemas and frontend step system (the backend AI transform service remains independent and untouched).

**Technical Approach**: Follow the ProjectConfigDesignerLayout pattern for tab navigation in ExperienceDesignerLayout. Create two new routes using TanStack Router's file-based routing (`/collect` and `/generate` under the experience route). Rename existing ExperienceDesignerPage to ExperienceCollectPage. Create new `domains/experience/generate/` subdomain for GeneratePage and future transform pipeline functionality. Frontend cleanup involves removing `transform.pipeline` step type from shared schemas, step registry, validators, and UI components. Backend (`functions/`) remains completely untouched.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK for real-time data), Firebase Storage (media files)
**Testing**: Vitest (unit testing framework), Testing Library (component testing)
**Target Platform**: Web application (Chrome/Safari/Edge modern browsers), Mobile-first responsive design (320px-768px primary viewport)
**Project Type**: Web application (TanStack Start monorepo with apps/clementine-app frontend and functions/ backend)
**Performance Goals**: Tab navigation < 1 second, maintain existing step management performance (2-second debounced saves for config edits)
**Constraints**: Mobile-first design (minimum 44x44px touch targets), 100% feature parity for Collect tab with existing designer, no breaking changes to existing experience data model
**Scale/Scope**: Affects ~13 frontend files (routes, layouts, pages, components, step system), 2 shared package files (schemas), 0 backend files (functions/ untouched)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅

- Tab navigation uses TopNavBar tabs component (already mobile-responsive)
- Collect tab preserves existing mobile sheets for step list and config panel
- Generate tab placeholder will use same responsive layout patterns
- No new touch targets below 44x44px minimum
- Tab switching performance target < 1 second aligns with mobile-first goals

**Status**: PASS - Feature maintains mobile-first approach with existing responsive components

### Principle II: Clean Code & Simplicity ✅

- Tabs follow existing ProjectConfigDesignerLayout pattern (no new abstraction)
- Collect tab reuses existing ExperienceDesignerPage (rename only, no duplication)
- Generate tab is minimal placeholder in new subdomain (YAGNI principle, sets up for future)
- Frontend cleanup removes unused transform.pipeline step type (clean dead code)
- Backend remains untouched (AI transform service is independent)
- Route structure uses standard TanStack Router file-based routing

**Status**: PASS - Minimal changes, reuses existing patterns, removes complexity without touching backend

### Principle III: Type-Safe Development ✅

- TypeScript strict mode enabled (all routes, components fully typed)
- Route search params validated with Zod schemas
- No `any` escapes in route definitions or tab navigation
- Firestore mutations use existing typed hooks
- Step removal from schemas maintains discriminated union type safety

**Status**: PASS - Full type safety maintained across routing and data operations

### Principle IV: Minimal Testing Strategy ✅

- Focus testing on critical path: tab navigation, step selection preservation
- Test behavior (URL updates, tab highlighting) not implementation
- Existing step management tests remain (no additional test coverage needed)
- Backend cleanup tested via existing media pipeline tests (verify AI transform removed)

**Status**: PASS - Pragmatic testing focused on new tab navigation behavior

### Principle V: Validation Gates ✅

**Technical Validation (Automated)**:
- Run `pnpm app:check` before committing (format + lint + type-check)
- Test route navigation in local dev server (`pnpm dev`)
- Verify backend deploys cleanly after AI transform removal (`pnpm functions:build`)

**Standards Compliance Review (Manual)**:
- **Frontend Standards**: `frontend/design-system.md` (use theme tokens), `frontend/component-libraries.md` (shadcn/ui TopNavBar usage), `frontend/routing.md` (TanStack Router patterns)
- **Global Standards**: `global/project-structure.md` (domain-driven file organization), `global/code-quality.md` (validation workflow)
- **Backend Standards**: `backend/firebase-functions.md` (clean removal of deprecated functions)

**Status**: PASS - Standard validation gates apply, no deviations

### Principle VI: Frontend Architecture ✅

- Client-first pattern: Existing Firestore client SDK usage preserved
- SSR strategy: Routes use SSR for initial load (TanStack Start default)
- Real-time updates: Existing `onSnapshot` for experience data unchanged
- TanStack Query integration: Existing hooks for publish, save, preview maintained
- No server-side data fetching needed for tab navigation (client-side route transitions)

**Status**: PASS - Client-first architecture maintained, no new server dependencies

### Principle VII: Backend & Firebase ✅

- Client SDK usage: Experience data fetching remains client-side
- Admin SDK usage: Existing publish mutations unchanged
- Security rules: No changes to Firestore rules needed
- Backend cleanup: Removes deprecated AI transform step handlers, no impact on security model

**Status**: PASS - No changes to Firebase security or client/admin SDK patterns

### Principle VIII: Project Structure ✅

- Vertical slice architecture: Changes scoped to `domains/experience/`
- CollectPage in `designer/containers/` (renamed from ExperienceDesignerPage)
- GeneratePage in new `generate/` subdomain (reserves domain for future functionality)
- Route files follow TanStack Router file-based convention
- Barrel exports maintained for both designer and generate domains
- Shared package cleanup removes transform.pipeline step schema
- Backend (`functions/`) untouched - follows separation of concerns

**Status**: PASS - Follows established domain structure with new generate subdomain

### Standards Compliance Summary

All constitution principles pass without violations. No complexity tracking needed.

**Post-Phase 1 Re-check**: ✅ All principles continue to pass after design phase. No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/050-exp-designer-tabs/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── routes.md        # Route definitions and tab navigation contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This is a web application with frontend (TanStack Start) and backend (Firebase Functions):

```text
apps/clementine-app/
└── src/
    ├── app/
    │   └── workspace/
    │       └── $workspaceSlug.experiences/
    │           ├── $experienceId.tsx              # [MODIFY] Add redirect to /collect
    │           ├── $experienceId.collect.tsx      # [NEW] Collect tab route
    │           └── $experienceId.generate.tsx     # [NEW] Generate tab route
    └── domains/
        └── experience/
            ├── designer/
            │   ├── components/
            │   │   └── [existing files unchanged]
            │   ├── containers/
            │   │   ├── ExperienceDesignerLayout.tsx    # [MODIFY] Add tabs prop to TopNavBar
            │   │   ├── ExperienceDesignerPage.tsx      # [RENAME] → ExperienceCollectPage.tsx
            │   │   ├── ExperienceCollectPage.tsx       # [NEW] Renamed from ExperienceDesignerPage
            │   │   └── index.ts                        # [MODIFY] Update exports
            │   └── [hooks, stores unchanged]
            ├── generate/                               # [NEW] Generate subdomain
            │   ├── containers/
            │   │   └── ExperienceGeneratePage.tsx      # [NEW] Placeholder WIP page
            │   └── index.ts                            # [NEW] Barrel export
            └── steps/
                ├── config-panels/
                │   ├── TransformPipelineConfigPanel.tsx  # [DELETE]
                │   └── index.ts                          # [MODIFY] Remove export
                ├── renderers/
                │   ├── TransformPipelineRenderer.tsx     # [DELETE]
                │   └── index.ts                          # [MODIFY] Remove export
                ├── components/
                │   └── StepRendererRouter.tsx            # [MODIFY] Remove transform.pipeline case
                ├── registry/
                │   ├── step-registry.ts                  # [MODIFY] Remove transform.pipeline entry
                │   └── step-validation.ts                # [MODIFY] Remove transform.pipeline validation
                └── defaults.ts                           # [MODIFY] Remove createDefaultTransformPipelineConfig

packages/shared/
└── src/
    └── schemas/
        └── experience/
            ├── steps/
            │   ├── transform-pipeline.schema.ts      # [DELETE]
            │   └── [other step schemas unchanged]
            └── step.schema.ts                        # [MODIFY] Remove transform.pipeline from union

functions/                                            # [NO CHANGES]
└── src/                                              # Backend AI transform service
    └── [all files unchanged - independent service]  # remains independent and untouched
```

**Structure Decision**: Following existing TanStack Start app structure with file-based routing. Experience designer changes scoped to `domains/experience/designer/` following vertical slice architecture. New `domains/experience/generate/` subdomain created for Generate tab and future transform pipeline functionality. Shared package cleanup removes `transform.pipeline` step type. Backend (`functions/`) completely untouched - AI transform service is independent.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitution checks pass.

## Phase 0: Research (Complete ✅)

Research findings documented in [research.md](./research.md):

1. ✅ TanStack Router tab navigation pattern (follow ProjectConfigDesignerLayout)
2. ✅ Route redirect strategy (use `beforeLoad` with `redirect()`)
3. ✅ Step selection query param preservation (automatic by TanStack Router)
4. ✅ Component reuse strategy (rename ExperienceDesignerPage → ExperienceCollectPage)
5. ✅ Generate tab placeholder design (minimal centered message in new generate subdomain)
6. ✅ Frontend cleanup strategy (remove transform.pipeline step type, backend untouched)

**Result**: All technical decisions documented. No unresolved clarifications.

## Phase 1: Design & Contracts (Complete ✅)

Design artifacts generated:

1. ✅ **Data Model** ([data-model.md](./data-model.md))
   - Tab configuration entity
   - Route search parameters
   - Schema changes (remove transform.pipeline)
   - State management (shared across tabs)

2. ✅ **Contracts** ([contracts/routes.md](./contracts/routes.md))
   - Route hierarchy and paths
   - Search parameter schemas
   - Navigation behavior contracts
   - Performance contracts (< 1s tab switch)

3. ✅ **Quickstart Guide** ([quickstart.md](./quickstart.md))
   - Implementation checklist (9 phases)
   - Quick commands reference
   - File structure reference
   - Common issues & solutions

4. ✅ **Agent Context Update**
   - Updated CLAUDE.md with feature technologies
   - Preserved manual additions between markers

**Result**: Complete design artifacts ready for implementation.

## Next Steps

This planning phase is now complete. To proceed with implementation:

1. **Generate Tasks**: Run `/speckit.tasks` to create detailed implementation tasks
2. **Implement Feature**: Follow tasks in dependency order
3. **Validation**: Run validation checklist from quickstart.md
4. **Manual Testing**: Test tab navigation, step selection, backend cleanup
5. **Create PR**: Reference spec and plan in PR description

**Artifacts Generated**:
- ✅ `plan.md` (this file)
- ✅ `research.md` (Phase 0 research findings)
- ✅ `data-model.md` (Phase 1 data model)
- ✅ `contracts/routes.md` (Phase 1 route contracts)
- ✅ `quickstart.md` (Phase 1 implementation guide)
- ⏳ `tasks.md` (Phase 2 - generated by `/speckit.tasks` command)
