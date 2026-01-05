# Implementation Plan: Event Settings - Sharing Configuration & Draft/Publish

**Branch**: `012-event-settings-sharing-publish` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-event-settings-sharing-publish/spec.md`

## Summary

Implement the Settings tab in the event designer with sharing configuration UI and draft/publish workflow. This enables event creators to configure sharing options (download, copy link, social media platforms) with auto-save, and publish draft configurations to make them live for guests. Also refactors the event designer architecture to move UI ownership from route files to the event domain, following DDD principles.

**Technical Approach**: Build domain-specific mutation hooks (useUpdateShareOptions, usePublishEvent) using TanStack Query + Firestore transactions, create EventDesignerLayout container to own complete UI (including EventDesignerTopBar), implement SharingOptionCard components with React Hook Form + auto-save, and integrate version-based change detection for draft/publish workflow.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (NoSQL database with client SDK), Firebase Storage (media files)
**Testing**: Vitest (unit testing framework)
**Target Platform**: Web (mobile-first responsive design, 320px-768px primary)
**Project Type**: Web application (TanStack Start full-stack)
**Performance Goals**: <2s page load on 4G, <300ms auto-save debounce, <1s publish operation
**Constraints**: Mobile-first design (44x44px touch targets), client-first architecture (90% client SDK, 10% SSR), strict TypeScript (no `any`), Firestore-safe schemas (null not undefined)
**Scale/Scope**: Multi-tenant SaaS, event creator dashboard, real-time updates via Firestore onSnapshot

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS

- Primary viewport: 320px-768px ✅
- Minimum touch target: 44x44px for all interactive elements (SharingOptionCard, publish button) ✅
- Performance: Auto-save debounce (300ms), publish operation (<1s) ✅
- **Action**: Ensure all cards and buttons meet 44x44px touch target, test on mobile devices

### Principle II: Clean Code & Simplicity ✅ PASS

- YAGNI: Only implementing required features (no preview, no rollback, no version history) ✅
- Single Responsibility: Each component has one job (SharingOptionCard = toggle, EventDesignerTopBar = nav) ✅
- Small functions: Components under 100 lines, hooks focused on single mutation ✅
- No dead code: Architecture refactor removes route file complexity ✅
- DRY: Shared transaction helper (updateEventConfigField) for simple updates ✅
- **Action**: Extract shared logic to helper, keep components focused

### Principle III: Type-Safe Development ✅ PASS

- TypeScript strict mode: Enabled ✅
- No implicit any: All types explicit ✅
- Strict null checks: Firestore-safe schemas (nullable, defaults) ✅
- Runtime validation: Zod schemas for all mutations (SharingConfig, publish input) ✅
- Server-side validation: Firestore client SDK uses transactions, security enforced by rules ✅
- **Action**: Validate all mutation inputs with Zod before Firestore operations

### Principle IV: Minimal Testing Strategy ✅ PASS

- Focus: Critical user flows (auto-save → publish workflow) ✅
- Behavior testing: Test form submission, mutation success, query invalidation ✅
- Coverage goals: 70%+ overall, 90%+ for mutation hooks ✅
- **Action**: Write tests for mutation hooks (useUpdateShareOptions, usePublishEvent) and auto-save integration

### Principle V: Validation Gates ✅ PASS

#### Technical Validation (Automated)
- Format, lint, type-check before commit ✅
- Auto-fix command: `pnpm check` ✅
- Breaking changes: Verify in dev server ✅
- **Action**: Run `pnpm check && pnpm type-check` before marking complete

#### Standards Compliance (Manual)
**Applicable Standards**:
- ✅ **Frontend/Component Libraries** - Using shadcn/ui Button, React Hook Form
- ✅ **Frontend/Design System** - Must use theme tokens, paired background/foreground
- ✅ **Global/Project Structure** - Following vertical slice architecture, domain ownership
- ✅ **Global/Zod Validation** - Validating all mutations with Zod schemas
- ✅ **Global/Client-First Architecture** - Using Firestore client SDK, transactions for atomicity
- **Action**: Review design-system.md for color tokens, component-libraries.md for shadcn/ui patterns

### Principle VI: Frontend Architecture ✅ PASS

- Client-first pattern: Firestore client SDK for all data operations ✅
- SSR strategy: Route loaders only for data prefetch (not mutations) ✅
- Security enforcement: Firestore rules (not server code) ✅
- Real-time by default: onSnapshot listeners via useProjectEvent hook ✅
- TanStack Query integration: Mutations invalidate queries, cache updates ✅
- **Action**: All mutations use Firestore client SDK, no server functions needed

### Principle VII: Backend & Firebase ✅ PASS

- Client SDK: All reads and writes (useProjectEvent, useUpdateShareOptions, usePublishEvent) ✅
- Admin SDK: Not needed for this feature ✅
- Security rules: Allow reads, deny writes (mutations validated) ✅
- Public URLs: Not applicable (no media in this feature) ✅
- **Action**: Ensure Firestore security rules validate draftConfig/publishedConfig updates

### Principle VIII: Project Structure ✅ PASS

- Vertical slice architecture: Event domain owns designer, settings, theme, welcome subdomains ✅
- Organized by technical concern: components/, containers/, hooks/, schemas/ ✅
- Explicit file naming: `EventDesignerLayout.tsx`, `useUpdateShareOptions.ts` ✅
- Barrel exports: All subdomains export via index.ts ✅
- Restricted public API: Only components, hooks, types exported (not mutation internals) ✅
- **Action**: Maintain domain structure, add hooks/ to settings subdomain

## Project Structure

### Documentation (this feature)

```text
specs/012-event-settings-sharing-publish/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (Firestore schema design)
├── quickstart.md        # Phase 1 output (implementation quickstart)
└── contracts/           # Phase 1 output (API contracts - N/A for this feature)
```

### Source Code (TanStack Start App)

```text
apps/clementine-app/src/
├── domains/
│   └── event/
│       ├── designer/
│       │   ├── components/
│       │   │   └── EventDesignerTopBar.tsx       # NEW: Event-specific top bar
│       │   ├── containers/
│       │   │   ├── EventDesignerLayout.tsx       # NEW: Main layout shell
│       │   │   └── EventDesignerPage.tsx         # EXISTING: Tabs navigation
│       │   ├── hooks/
│       │   │   └── usePublishEvent.ts            # NEW: Publish mutation
│       │   └── index.ts                          # UPDATED: Export new components
│       │
│       ├── settings/
│       │   ├── components/
│       │   │   ├── SharingOptionCard.tsx         # NEW: Toggle card component
│       │   │   ├── SharingSection.tsx            # NEW: Sharing section container
│       │   │   └── (OverlaysSection.tsx)         # FUTURE: Overlays section
│       │   ├── containers/
│       │   │   └── SettingsSharingPage.tsx       # NEW: Settings page (renders sections)
│       │   ├── hooks/
│       │   │   └── useUpdateShareOptions.ts      # NEW: Sharing mutation
│       │   └── index.ts                          # UPDATED: Export new components
│       │
│       └── shared/
│           ├── schemas/
│           │   ├── project-event-config.schema.ts # EXISTING: Already has sharing config
│           │   └── project-event-full.schema.ts   # EXISTING: Already has draft/published
│           ├── hooks/
│           │   └── useProjectEvent.ts            # EXISTING: Real-time subscription
│           ├── lib/
│           │   └── updateEventConfigField.ts     # NEW: Shared transaction helper
│           └── index.ts                          # UPDATED: Export helper
│
├── shared/
│   └── forms/
│       ├── hooks/
│       │   └── useAutoSave.ts                    # EXISTING: Auto-save hook
│       └── utils/
│           └── form-diff.ts                       # EXISTING: Form comparison
│
└── app/
    └── workspace/$workspaceSlug.projects/$projectId.events/
        ├── $eventId.tsx                          # UPDATED: Use EventDesignerLayout
        └── $eventId.settings.tsx                 # UPDATED: Use SettingsSharingPage
```

**Structure Decision**: This feature follows the existing vertical slice architecture in the event domain. The designer subdomain owns the top-level layout and publish logic, while the settings subdomain owns sharing configuration UI and mutations. Shared transaction logic lives in event/shared/lib/ for reuse across all event config mutations.

**Settings Modularity**: The settings subdomain uses a section-based architecture for future extensibility:
- **SharingSection.tsx**: Self-contained component that handles all sharing UI logic (renders SharingOptionCard components, manages form state, handles auto-save)
- **SettingsSharingPage.tsx**: Thin container that renders section components (currently only SharingSection)
- **Future sections**: OverlaysSection, ThemePresetsSection, etc. can be added without modifying existing code

This pattern allows each settings section to be developed, tested, and maintained independently.

## Complexity Tracking

> **No violations** - Feature follows all constitution principles without exceptions.
