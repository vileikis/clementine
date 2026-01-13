# Implementation Plan: Share Screen Editor

**Branch**: `024-share-editor` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-share-editor/spec.md`

## Summary

Implement a new "Share" tab in the event designer that allows admins to configure the share screen appearance (title, description, CTA button) and share options (platform toggles) with a live phone-frame preview. This includes:
- New `share` field for content/presentation config (title, description, CTA)
- Rename existing `sharing` field to `shareOptions` (FR-017)
- Share options editable in both Share tab (with preview) and Settings tab (existing)
- New shared `SelectOptionCard` component optimized for narrow ConfigPanel sidebars
- Reuse existing `useUpdateShareOptions` hook for share options mutations

The technical approach follows the established Welcome/Theme tab patterns: 2-column layout, react-hook-form with useWatch for live preview, auto-save with debounce, and PreviewShell with ThemeProvider.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, TanStack Query 5.66.5, Zod 4.1.12, react-hook-form, shadcn/ui, Radix UI
**Storage**: Firebase Firestore (client SDK) - `projects/{projectId}/events/{eventId}` with nested `draftConfig.share` field
**Testing**: Vitest
**Target Platform**: Web (mobile-first), Chrome/Safari/Firefox
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Preview update < 500ms from input, auto-save triggers within 2s debounce
**Constraints**: Mobile-first design (44px touch targets), real-time preview updates
**Scale/Scope**: Single new tab with ~10 form controls, 1 preview component, ~8 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Preview uses PreviewShell with mobile viewport (375x667px iPhone SE) |
| II. Clean Code & Simplicity | ✅ PASS | Following existing Welcome/Theme tab patterns, no new abstractions |
| III. Type-Safe Development | ✅ PASS | Zod schemas with strict TypeScript, no `any` types |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical paths only |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` + standards compliance review |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ PASS | Client SDK for mutations, dot-notation updates |
| VIII. Project Structure | ✅ PASS | Vertical slice in `domains/event/share/` |

**Pre-Design Gate**: ✅ PASSED - No violations to justify.

**Post-Design Gate (Phase 1 Complete)**: ✅ PASSED
- Schema design uses existing Zod patterns with `.nullable().default(null)`
- Two-zone preview layout uses simple CSS flexbox (no complex JS positioning)
- Form validation uses standard react-hook-form + Zod patterns
- All files follow vertical slice architecture in `domains/event/share/`
- No new abstractions or unnecessary complexity introduced

## Project Structure

### Documentation (this feature)

```text
specs/024-share-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/
│   └── editor-controls/
│       └── components/
│           └── SelectOptionCard.tsx     # NEW: Compact toggle card for ConfigPanels
├── domains/event/
│   ├── share/                           # NEW: Share tab domain
│   │   ├── index.ts                     # Barrel exports
│   │   ├── containers/
│   │   │   └── ShareEditorPage.tsx      # 2-column: form + preview
│   │   ├── components/
│   │   │   ├── index.ts                 # Component barrel exports
│   │   │   ├── ShareConfigPanel.tsx     # Form controls sidebar (uses SelectOptionCard)
│   │   │   └── SharePreview.tsx         # Live preview component
│   │   ├── hooks/
│   │   │   ├── index.ts                 # Hooks barrel exports
│   │   │   └── useUpdateShare.ts        # Mutation hook for share content
│   │   └── constants/
│   │       └── defaults.ts              # DEFAULT_SHARE constant
│   ├── settings/
│   │   ├── components/
│   │   │   └── SharingSection.tsx       # MODIFY: Read from shareOptions
│   │   └── hooks/
│   │       └── useUpdateShareOptions.ts # MODIFY: Update prefix to shareOptions
│   ├── shared/
│   │   └── schemas/
│   │       └── project-event-config.schema.ts  # MODIFY: Add share, rename sharing→shareOptions
│   └── designer/
│       └── containers/
│           └── EventDesignerLayout.tsx  # MODIFY: Add Share tab
├── app/
│   └── workspace/$workspaceSlug.projects/$projectId.events/
│       └── $eventId.share.tsx           # NEW: Route file
```

**Structure Decision**: Following vertical slice architecture with dedicated `domains/event/share/` module. New shared `SelectOptionCard` component in `shared/editor-controls/` for reuse across ConfigPanels.

## Complexity Tracking

> No violations - complexity tracking not required.
