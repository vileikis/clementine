# Tasks: Project Router Restructure

**Input**: Design documents from `/specs/056-project-router/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested in this feature specification. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (pnpm monorepo)**: All source paths relative to `apps/clementine-app/src/`
- **Routes**: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/`
- **Domains**: `apps/clementine-app/src/domains/`
- **Shared**: `apps/clementine-app/src/shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared components and directory structure needed by multiple user stories

- [x] T001 Create `WipPlaceholder` shared component in `apps/clementine-app/src/shared/components/WipPlaceholder.tsx` — centered layout with icon (LucideIcon prop), title, and description using theme tokens (`text-muted-foreground`, `bg-muted`). Export from `apps/clementine-app/src/shared/components/index.ts`
- [x] T002 Create `project/layout` subdomain directory structure: `apps/clementine-app/src/domains/project/layout/containers/ProjectLayout.tsx`, `apps/clementine-app/src/domains/project/layout/containers/index.ts`, `apps/clementine-app/src/domains/project/layout/index.ts` — all with empty barrel exports for now

**Checkpoint**: Shared infrastructure ready — user story implementation can begin

---

## Phase 2: User Story 1 & 2 — Navigate Between Project Layers + Access Designer Section (Priority: P1) 🎯 MVP

**Goal**: Restructure the project router to display four primary tabs (Designer, Distribute, Connect, Analytics) and nest the existing Designer sub-tabs (Welcome, Share, Theme, Settings) under a `/designer/` route segment. US1 and US2 are co-dependent — the primary navigation (US1) requires the Designer sub-layout (US2) to exist, and US2 needs primary tabs to be navigable. They are implemented together as the MVP.

**Independent Test**: Navigate to a project → see four primary tabs in TopNavBar → click Designer → see sub-tabs (Welcome, Share, Theme, Settings) → click between primary tabs → each loads correct content → refresh preserves current tab

### Implementation for US1 + US2

- [x] T003 [US1] Build `ProjectLayout` container in `apps/clementine-app/src/domains/project/layout/containers/ProjectLayout.tsx` — accepts `project: Project` and `workspaceSlug: string` props. Renders `TopNavBar` with breadcrumbs (`project.name` with `FolderOpen` icon linking to projects list), primary tabs (Designer, Distribute, Connect, Analytics using `TabItem[]`), and conditional right-side publish workflow. Publish workflow (EditorSaveStatus, EditorChangesBadge, Share icon button, Publish button) visible only when route matches `/designer` or `/distribute` — use TanStack Router's `useMatch` or `useLocation` to check. Renders `ShareDialog` and `<Outlet />`. Move publish logic (usePublishProjectConfig, useProjectConfigDesignerStore, change detection, handlePublish) from `ProjectConfigDesignerLayout` into this component. Export from barrel files in `apps/clementine-app/src/domains/project/layout/index.ts`
- [x] T004 [US1] Update `project` domain barrel export in `apps/clementine-app/src/domains/project/index.ts` — add exports for `ProjectLayout` from `./layout`
- [x] T005 [US2] Simplify `ProjectConfigDesignerLayout` in `apps/clementine-app/src/domains/project-config/designer/containers/ProjectConfigDesignerLayout.tsx` — REMOVE: TopNavBar, breadcrumbs, publish workflow controls (EditorSaveStatus, EditorChangesBadge, Publish button, Share icon button), ShareDialog, `usePublishProjectConfig`, `useProjectConfigDesignerStore`, change detection logic, `h-screen` wrapper. KEEP: sub-tabs NavTabs (Welcome, Share, Theme, Settings) and `<Outlet />` via `ProjectConfigDesignerPage`. Update sub-tab paths to include `/designer/` prefix (e.g., `to: '/workspace/$workspaceSlug/projects/$projectId/designer/welcome'`). Render as a simple wrapper: `NavTabs` + `ProjectConfigDesignerPage`. Remove unused imports
- [x] T006 [US2] Update `project-config` domain barrel export in `apps/clementine-app/src/domains/project-config/index.ts` — ensure `ProjectConfigDesignerLayout` is still exported (it's now the sub-layout for designer)
- [x] T007 [US1] Modify project layout route in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx` — change `ProjectLayout` function to import and render `ProjectLayout` from `@/domains/project` instead of `ProjectConfigDesignerLayout` from `@/domains/project-config`. Pass `project` and `workspaceSlug` props
- [x] T008 [US1] Update project index redirect in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.index.tsx` — change redirect target from `/workspace/$workspaceSlug/projects/$projectId/welcome` to `/workspace/$workspaceSlug/projects/$projectId/designer/welcome`
- [x] T009 [US2] Create designer layout route in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.designer.tsx` — thin route that imports and renders `ProjectConfigDesignerLayout` from `@/domains/project-config`. Uses `createFileRoute('/workspace/$workspaceSlug/projects/$projectId/designer')`
- [x] T010 [US2] Create designer index redirect in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.designer.index.tsx` — redirects to `/workspace/$workspaceSlug/projects/$projectId/designer/welcome` using `beforeLoad` with `throw redirect()`
- [x] T011 [P] [US2] Rename and update `$projectId.welcome.tsx` to `$projectId.designer.welcome.tsx` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` — update `createFileRoute` path to `/workspace/$workspaceSlug/projects/$projectId/designer/welcome`. Keep component import unchanged (`WelcomeEditorPage` from `@/domains/project-config`)
- [x] T012 [P] [US2] Rename and update `$projectId.share.tsx` to `$projectId.designer.share.tsx` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` — update `createFileRoute` path to `/workspace/$workspaceSlug/projects/$projectId/designer/share`. Keep component import unchanged (`ShareEditorPage` from `@/domains/project-config/share`)
- [x] T013 [P] [US2] Rename and update `$projectId.theme.tsx` to `$projectId.designer.theme.tsx` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` — update `createFileRoute` path to `/workspace/$workspaceSlug/projects/$projectId/designer/theme`. Keep component import unchanged (`ThemeEditorPage` from `@/domains/project-config`)
- [x] T014 [P] [US2] Rename and update `$projectId.settings.tsx` to `$projectId.designer.settings.tsx` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` — update `createFileRoute` path to `/workspace/$workspaceSlug/projects/$projectId/designer/settings`. Keep component import unchanged (`ProjectConfigSettingsPage` from `@/domains/project-config/settings`)
- [x] T015 [US1] Create placeholder route for Connect tab in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.connect.tsx` — thin route rendering `ConnectPage` from `@/domains/project` (temporary inline WipPlaceholder until T019 is complete). Uses `createFileRoute('/workspace/$workspaceSlug/projects/$projectId/connect')`
- [x] T016 [US1] Create placeholder route for Analytics tab in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.analytics.tsx` — thin route rendering `AnalyticsPage` from `@/domains/project` (temporary inline WipPlaceholder until T020 is complete). Uses `createFileRoute('/workspace/$workspaceSlug/projects/$projectId/analytics')`
- [x] T017 [US1] Delete old route files that were renamed: remove `$projectId.welcome.tsx`, `$projectId.share.tsx`, `$projectId.theme.tsx`, `$projectId.settings.tsx` from `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` (only if not already handled by rename in T011-T014)
- [x] T018 [US1] Run `pnpm app:type-check` and `pnpm app:lint` from monorepo root to verify all route changes compile and pass linting. Fix any type errors from the restructure (especially auto-generated `routeTree.gen.ts` which regenerates on dev server start)

**Checkpoint**: US1 + US2 complete — four primary tabs visible, Designer sub-tabs functional, all existing editor pages accessible under `/designer/*` paths, publish workflow conditionally visible

---

## Phase 3: User Story 3 — Access Distribute Section (Priority: P2)

**Goal**: Create a full-page Distribute section that displays the project's shareable guest URL, QR code, and usage instructions — replacing the dialog-only share experience with a dedicated page

**Independent Test**: Navigate to Distribute tab → see guest URL with copy button → see QR code with download → see help instructions → copy URL successfully → publish controls visible in TopNavBar

### Implementation for US3

- [x] T019 [US3] Create `distribute` subdomain directory structure and `DistributePage` container in `apps/clementine-app/src/domains/project/distribute/containers/DistributePage.tsx` — gets `projectId` from route params via `Route.useParams()`. Renders full-page layout (centered `max-w-md` container with vertical spacing): page heading "Distribute Your Project", `ShareLinkSection` (from `@/domains/project/share`), `QRCodeDisplay` (from `@/domains/project/share`), and help instructions section (same content as ShareDialog's help section). Uses `useCopyToClipboard`, `useQRCodeGenerator`, `generateGuestUrl` from `@/domains/project/share`. Create barrel exports: `apps/clementine-app/src/domains/project/distribute/containers/index.ts` and `apps/clementine-app/src/domains/project/distribute/index.ts`
- [x] T020 [US3] Update `project` domain barrel export in `apps/clementine-app/src/domains/project/index.ts` — add export for `DistributePage` from `./distribute`
- [x] T021 [US3] Create distribute route in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.distribute.tsx` — thin route that imports and renders `DistributePage` from `@/domains/project`. Uses `createFileRoute('/workspace/$workspaceSlug/projects/$projectId/distribute')`

**Checkpoint**: US3 complete — Distribute page shows URL, QR code, and help instructions as a full page. Publish controls visible in TopNavBar

---

## Phase 4: User Story 4 — Access Analytics & Connect WIP Sections (Priority: P3)

**Goal**: Create properly structured WIP placeholder pages for Analytics and Connect sections, replacing any temporary inline placeholders

**Independent Test**: Navigate to Analytics tab → see WIP placeholder with BarChart3 icon and descriptive message. Navigate to Connect tab → see WIP placeholder with Plug icon and descriptive message. No publish controls visible on either page.

### Implementation for US4

- [x] T022 [P] [US4] Create `analytics` subdomain and `AnalyticsPage` container in `apps/clementine-app/src/domains/project/analytics/containers/AnalyticsPage.tsx` — renders `WipPlaceholder` (from `@/shared/components`) with `BarChart3` icon (from lucide-react), title "Analytics", description "Track engagement, shares, and campaign performance." Create barrel exports: `apps/clementine-app/src/domains/project/analytics/containers/index.ts` and `apps/clementine-app/src/domains/project/analytics/index.ts`
- [x] T023 [P] [US4] Create `connect` subdomain and `ConnectPage` container in `apps/clementine-app/src/domains/project/connect/containers/ConnectPage.tsx` — renders `WipPlaceholder` (from `@/shared/components`) with `Plug` icon (from lucide-react), title "Connect", description "Set up integrations and webhooks to automatically send results to Dropbox, Google Drive, and more." Create barrel exports: `apps/clementine-app/src/domains/project/connect/containers/index.ts` and `apps/clementine-app/src/domains/project/connect/index.ts`
- [x] T024 [US4] Update `project` domain barrel export in `apps/clementine-app/src/domains/project/index.ts` — add exports for `AnalyticsPage` from `./analytics` and `ConnectPage` from `./connect`
- [x] T025 [US4] Update route files `$projectId.analytics.tsx` and `$projectId.connect.tsx` in `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/` to import `AnalyticsPage` and `ConnectPage` from `@/domains/project` instead of any temporary inline placeholders

**Checkpoint**: US4 complete — Analytics and Connect show proper WIP placeholders. All four tabs functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and verification across all stories

- [x] T026 Run `pnpm app:type-check` from monorepo root — fix any remaining TypeScript errors across all modified and new files
- [x] T027 Run `pnpm app:check` from monorepo root — apply lint and format fixes across all modified and new files
- [x] T028 Verify deep linking works for all routes — manually test or confirm that direct URL navigation to `/designer/welcome`, `/designer/share`, `/designer/theme`, `/designer/settings`, `/distribute`, `/connect`, `/analytics` all load correctly without redirect loops
- [x] T029 Verify publish workflow conditional visibility — confirm EditorSaveStatus, EditorChangesBadge, and Publish button are visible on Designer and Distribute, hidden on Connect and Analytics
- [x] T030 Clean up any unused imports or dead code in modified files — especially `ProjectConfigDesignerLayout.tsx` (removed publish workflow), old route files, and `project/index.ts` barrel export

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 + US2)**: Depends on Phase 1 (T001 for WipPlaceholder, T002 for directory structure)
- **Phase 3 (US3)**: Depends on Phase 2 (route structure must be in place)
- **Phase 4 (US4)**: Depends on Phase 1 (T001 for WipPlaceholder) and Phase 2 (route files exist)
- **Phase 5 (Polish)**: Depends on all previous phases

### Task Dependencies Within Phase 2

```
T003 (ProjectLayout) ──────→ T007 (update route to use ProjectLayout)
T005 (simplify DesignerLayout) → T009 (designer layout route)
T009 (designer layout route) ──→ T010, T011, T012, T013, T014 (designer child routes)
T011-T014 (rename routes) ────→ T017 (delete old route files)
T015, T016 (Connect/Analytics routes) ← T003 (ProjectLayout must define tabs)
All above ─────────────────────→ T018 (type-check and lint)
```

### Parallel Opportunities

**Phase 1**: T001 and T002 can run in parallel (different directories)

**Phase 2**:
- T011, T012, T013, T014 can all run in parallel (different route files, same operation)
- T015 and T016 can run in parallel (different route files)

**Phase 4**: T022 and T023 can run in parallel (different subdomain directories)

---

## Parallel Example: Phase 2 Route Renames

```bash
# Launch all designer route renames together:
Task: "Rename $projectId.welcome.tsx to $projectId.designer.welcome.tsx"
Task: "Rename $projectId.share.tsx to $projectId.designer.share.tsx"
Task: "Rename $projectId.theme.tsx to $projectId.designer.theme.tsx"
Task: "Rename $projectId.settings.tsx to $projectId.designer.settings.tsx"
```

## Parallel Example: Phase 4 WIP Pages

```bash
# Launch both WIP page containers together:
Task: "Create AnalyticsPage in domains/project/analytics/"
Task: "Create ConnectPage in domains/project/connect/"
```

---

## Implementation Strategy

### MVP First (US1 + US2 — Phase 1 + Phase 2)

1. Complete Phase 1: Setup (WipPlaceholder + directory structure)
2. Complete Phase 2: US1 + US2 (ProjectLayout + Designer restructure + route changes)
3. **STOP and VALIDATE**: Four primary tabs visible, Designer sub-tabs work, all existing editor pages accessible
4. Deploy/demo if ready — Distribute and Analytics/Connect show temporary placeholders

### Incremental Delivery

1. Complete Phase 1 + Phase 2 → Primary navigation restructure live (MVP!)
2. Add Phase 3 (US3) → Distribute page with full sharing experience → Deploy
3. Add Phase 4 (US4) → Polished WIP placeholders for Connect + Analytics → Deploy
4. Phase 5 → Final cleanup and validation

### Suggested MVP Scope

**Phase 1 + Phase 2 only** (T001–T018). This delivers the complete navigation restructure with four primary tabs and all existing Designer functionality preserved. Distribute shows a temporary placeholder, and Connect/Analytics show WIP pages. This is the minimum viable restructure.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are implemented together because they are co-dependent (primary tabs need designer layout, designer layout needs primary tabs)
- No new Firestore schema changes — this is purely a routing and UI restructure
- The auto-generated `routeTree.gen.ts` will regenerate when the dev server starts after route file changes
- Commit after each phase checkpoint to enable safe rollback
