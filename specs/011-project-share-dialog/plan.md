# Implementation Plan: Project Share Dialog

**Branch**: `011-project-share-dialog` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-project-share-dialog/spec.md`

## Summary

Add a share dialog accessible from the top navigation bar on project pages (`/workspace/[slug]/projects/[projectId]`) that enables users to share their project via a guest URL and QR code. The dialog provides one-click link copying, client-side QR code generation with regeneration capability, and downloadable QR codes for promotional materials. All functionality is client-side with no server processing required.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**:
- React 19.2
- TanStack Start 1.132
- TanStack Router 1.132
- shadcn/ui + Radix UI (Dialog, Button components)
- NEEDS CLARIFICATION: QR code generation library (qrcode.react vs qr-code-styling vs react-qr-code)
- Lucide React (Share icon)

**Storage**: N/A (no data persistence - feature is entirely client-side URL generation and display)
**Testing**: Vitest + Testing Library (component tests)
**Target Platform**: Web (desktop and mobile browsers)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**:
- Dialog open < 100ms
- QR code generation < 2 seconds (SC-003)
- QR code regeneration < 2 seconds (SC-007)
- Clipboard copy operation < 500ms

**Constraints**:
- Client-side only (FR-012) - no server processing
- Must work with existing TopNavActions system
- Must use existing shadcn/ui Dialog component
- QR code must be 512x512 minimum for print quality (SC-004)
- Must handle clipboard API fallback for older browsers

**Scale/Scope**: Single feature - 1 dialog component, 1 hook, minimal integration points

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅

- Dialog component must be responsive (320px-768px mobile viewports)
- Touch targets (buttons) must be 44x44px minimum
- QR code must scale appropriately on mobile screens
- Help instructions must be readable without horizontal scrolling

**Status**: PASS - Feature is designed for both desktop and mobile. Dialog components from shadcn/ui are already mobile-responsive.

### Principle II: Clean Code & Simplicity ✅

- Single responsibility: Dialog only handles sharing UI
- No premature abstraction - QR generation is straightforward
- No dead code or over-engineering
- Component structure follows existing patterns (TopNavActions integration)

**Status**: PASS - Simple feature with clear boundaries. Single dialog, single hook, minimal logic.

### Principle III: Type-Safe Development ✅

- TypeScript strict mode enabled
- Zod validation: NEEDS CLARIFICATION - Do we need runtime validation for projectId/URL generation?
- All props and state fully typed
- No `any` escapes

**Status**: CONDITIONAL PASS - URL generation from projectId should be validated. Will define Zod schema for guest URL format.

### Principle IV: Minimal Testing Strategy ✅

- Focus on critical user flow: dialog open, copy link, QR display
- Test behavior: successful clipboard copy, QR code rendering, download trigger
- No E2E tests (unit/component tests only with Vitest)

**Status**: PASS - Feature has clear testable behaviors. Will write component tests for dialog interactions.

### Principle V: Validation Gates ✅

- Before commit: format, lint, type-check via `pnpm app:check`
- Standards review:
  - Frontend: design-system.md (theme tokens, no hard-coded colors)
  - Component Libraries: component-libraries.md (shadcn/ui Dialog usage)
  - Project Structure: project-structure.md (vertical slice architecture)
  - Code Quality: code-quality.md (clean, simple, well-named)

**Status**: PASS - Will follow validation loop before marking complete.

### Principle VI: Frontend Architecture ✅

- Client-first pattern: All logic is client-side (FR-012)
- No server-side rendering needed (dialog is interactive UI)
- No Firebase data operations (URLs are generated, not persisted)
- Uses existing client-side routing context for URL construction

**Status**: PASS - Feature is 100% client-side, aligns perfectly with client-first architecture.

### Principle VII: Backend & Firebase ✅

- No Firebase integration required
- No Firestore reads/writes
- No Firebase Storage operations
- Guest URL is constructed from route params, not fetched from database

**Status**: PASS - No backend involvement. Feature is entirely frontend.

### Principle VIII: Project Structure ✅

- Vertical slice architecture: Create new domain `domains/project/share/` OR extend existing `domains/project/` domain
- NEEDS CLARIFICATION: Should this be `domains/project/share/` (new domain) or added to existing project domain structure?
- Components: `ShareDialog.tsx`, `QRCodeDisplay.tsx`
- Hooks: `useShareDialog.tsx`, `useQRCodeGenerator.tsx`
- Utils: `shareUrl.utils.ts` (URL generation logic)

**Status**: CONDITIONAL PASS - Need to decide on domain structure. Will research existing project domain organization in Phase 0.

### Constitution Compliance Summary

**PASSES**: 7/8 principles (100% once clarifications resolved)
**NEEDS CLARIFICATION**:
1. QR code library selection (Technical Context)
2. Zod validation for URL generation (Principle III)
3. Domain structure location (Principle VIII)

**VIOLATIONS**: None

## Project Structure

### Documentation (this feature)

```text
specs/011-project-share-dialog/
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
├── domains/
│   └── project/
│       └── share/                    # New vertical slice domain
│           ├── components/
│           │   ├── ShareDialog.tsx           # Main dialog component
│           │   ├── ShareDialog.test.tsx      # Component tests
│           │   ├── QRCodeDisplay.tsx         # QR code rendering component
│           │   ├── QRCodeDisplay.test.tsx    # QR code tests
│           │   └── ShareLinkSection.tsx      # Link copy section component
│           ├── hooks/
│           │   ├── useShareDialog.tsx        # Dialog state management
│           │   ├── useShareDialog.test.tsx   # Hook tests
│           │   ├── useQRCodeGenerator.tsx    # QR code generation logic
│           │   └── useCopyToClipboard.tsx    # Clipboard API abstraction
│           ├── utils/
│           │   ├── shareUrl.utils.ts         # Guest URL generation
│           │   └── shareUrl.utils.test.ts    # URL generation tests
│           └── index.ts                      # Barrel export (components, hooks only)
│
├── app/
│   └── workspace/
│       └── $workspaceSlug.projects/
│           └── $projectId.tsx        # Update to add Share button to TopNavActions
│
└── ui-kit/
    └── components/
        └── dialog.tsx                # Existing shadcn/ui Dialog (no changes needed)
```

**Structure Decision**:

Using **vertical slice architecture** as mandated by Principle VIII. Created new domain `domains/project/share/` to encapsulate all share-related functionality. This keeps the feature self-contained and aligns with existing project structure patterns.

The share dialog integrates into the existing project route (`$projectId.tsx`) by adding a Share button to the TopNavActions array, following the established pattern used for other project-level actions.

**Alternative Considered**: Adding share components directly to `domains/project/` root. Rejected because share functionality is substantial enough to warrant its own subdomain, improving maintainability and discoverability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations. All principles pass or have clarifications that will be resolved in Phase 0 research.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design (research.md, data-model.md, contracts)*

### Initial NEEDS CLARIFICATION - All Resolved ✅

1. **QR code library selection** ✅
   - **Decision**: react-qr-code
   - **Rationale**: Smallest bundle (5KB), SVG-based, TypeScript support, React 19 compatible
   - **Resolution**: See research.md Section 1

2. **Zod validation for URL generation** ✅
   - **Decision**: Yes - validate projectId and guest URL
   - **Rationale**: External input from route params, security requirement (Principle III)
   - **Resolution**: See data-model.md - Validation Schemas section

3. **Domain structure location** ✅
   - **Decision**: `domains/project/share/` (new subdomain)
   - **Rationale**: Follows existing project/events pattern, vertical slice architecture
   - **Resolution**: See research.md Section 3

### Updated Technical Context

**Primary Dependencies** (updated):
- React 19.2
- TanStack Start 1.132
- TanStack Router 1.132
- shadcn/ui + Radix UI (Dialog, Button components)
- **react-qr-code v4.0.0** (resolved)
- Lucide React (Share icon)
- Zod 4.1.12 (validation)

### Constitution Compliance - Final Status

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Dialog responsive, QR scales, touch targets 44x44px |
| II. Clean Code & Simplicity | ✅ PASS | Single responsibility, no over-engineering, minimal abstractions |
| III. Type-Safe Development | ✅ PASS | Strict TypeScript, Zod validation for external inputs, no `any` |
| IV. Minimal Testing Strategy | ✅ PASS | Component + hook + utility tests, 70%+ coverage target |
| V. Validation Gates | ✅ PASS | Will run pnpm app:check + standards review before commit |
| VI. Frontend Architecture | ✅ PASS | 100% client-side, no server code, aligns with client-first |
| VII. Backend & Firebase | ✅ PASS | No backend involvement, no Firestore/Storage operations |
| VIII. Project Structure | ✅ PASS | Vertical slice: domains/project/share/ with barrel exports |

**Final Score**: 8/8 principles PASS (100% compliance)

**Ready for Implementation**: All technical unknowns resolved, design complete, no constitution violations.
