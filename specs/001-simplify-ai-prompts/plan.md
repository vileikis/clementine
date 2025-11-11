# Implementation Plan: Simplify AI Prompts

**Branch**: `001-simplify-ai-prompts` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-simplify-ai-prompts/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace hardcoded AI effect types (background_swap, deep_fake) with a flexible prompt-based system where event creators define custom AI transformations using natural language prompts and optional reference images. If no prompt is provided, skip AI transformation and copy input photo directly to result (passthrough mode). Remove legacy `effect`, `defaultPrompt` fields and hardcoded prompt templates from codebase.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16, React 19
**Primary Dependencies**: Next.js 16, React 19, Firebase (client + admin SDKs), Zod 4.x, Tailwind CSS 4, shadcn/ui
**Storage**: Firebase Storage (images), Firestore (scene/session metadata)
**Testing**: Jest 30.x with React Testing Library 16.x, co-located test files
**Target Platform**: Web (mobile-first 320px-768px, responsive up to desktop)
**Project Type**: Monorepo web application (`web/` workspace, Next.js App Router)
**Performance Goals**: AI transformation < 60 seconds, passthrough mode < 5 seconds, page load < 2 seconds on 4G
**Constraints**: Mobile-first (touch targets ≥44x44px, typography ≥14px), strict TypeScript (no `any`), Zod validation for all external inputs
**Scale/Scope**: ~20 files affected (types, schemas, AI providers, UI components, server actions), removal of 2 hardcoded effect templates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
  - Prompt text input uses mobile-appropriate keyboard type
  - Reference image upload button meets 44x44px minimum touch target
  - Preview components responsive for small screens
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
  - Simplifies codebase by removing hardcoded effect templates
  - No new abstraction layers introduced
  - Reuses existing Scene schema, adds validation to existing fields
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
  - Scene `prompt` field validated with Zod (string, max 600 chars, nullable)
  - Reference image uploads validated for type/size
  - AI transformation logic type-checks prompt before processing
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
  - Update existing tests: `scenes.test.ts`, `sessions.test.ts` for prompt-based logic
  - Add tests for passthrough mode (empty prompt → copy input to result)
  - Test prompt validation (600 char limit)
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
  - Final task includes running `pnpm lint`, `pnpm type-check`, `pnpm test`
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced
  - Global: validation.md (Zod schemas), error-handling.md (type-safe errors)
  - Frontend: responsive.md (mobile-first), components.md (composition)
  - Backend: firebase.md (Firestore schema updates), api.md (Server Actions)

**Complexity Violations** (if any):
None. This feature reduces complexity by removing hardcoded templates and simplifying the effect system.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/
├── lib/
│   ├── types/
│   │   └── firestore.ts              # Remove EffectType, update Scene interface
│   ├── schemas/
│   │   └── firestore.ts              # Update SceneSchema with prompt validation
│   ├── ai/
│   │   ├── types.ts                  # Update TransformParams to use prompt
│   │   ├── prompts.ts                # DELETE: Remove buildPromptForEffect function
│   │   ├── client.ts                 # Update to use prompt directly
│   │   ├── nano-banana.ts            # Update to handle passthrough mode
│   │   └── providers/
│   │       ├── google-ai.ts          # Update to use prompt directly
│   │       ├── n8n-webhook.ts        # Update to use prompt directly
│   │       └── mock.ts               # Update to use prompt directly
│   ├── repositories/
│   │   ├── scenes.ts                 # Remove defaultPrompt handling
│   │   ├── scenes.test.ts            # Update tests for prompt validation
│   │   └── sessions.test.ts          # Add passthrough mode tests
│   └── storage/
│       └── upload.ts                 # Add copyImageToResult function (passthrough)
├── app/
│   ├── actions/
│   │   ├── scenes.ts                 # Update createScene/updateScene actions
│   │   └── sessions.ts               # Update triggerTransformAction for passthrough
│   └── events/[eventId]/scene/
│       └── page.tsx                  # Remove effect picker, keep prompt editor
└── components/
    └── organizer/
        ├── EffectPicker.tsx          # DELETE: Remove predefined effect UI
        ├── PromptEditor.tsx          # Update for 600 char validation
        └── RefImageUploader.tsx      # Keep as-is (already supports reference images)
```

**Structure Decision**: Monorepo web application structure. All changes are within the `web/` workspace using Next.js App Router patterns (Server Actions, React Server Components). No new directories needed - modifications to existing files plus removal of deprecated components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No complexity violations**. This feature reduces overall codebase complexity by:

- Removing hardcoded effect templates (buildPromptForEffect function)
- Removing deprecated fields (effect, defaultPrompt)
- Simplifying AI transformation logic (direct prompt usage)
- No new abstraction layers introduced

---

## Re-evaluation: Constitution Check (Post-Phase 1)

_Re-checked after Phase 1 design (data-model.md, contracts, quickstart.md generated)_

All constitution principles remain satisfied after detailed design:

- [x] **Mobile-First Responsive Design**: Design artifacts confirm mobile-first approach
  - PromptEditor uses appropriate mobile keyboard type
  - Reference image uploader has 44x44px touch targets
  - Character count visible on mobile viewport
- [x] **Clean Code & Simplicity**: Design reduces complexity
  - Removed: buildPromptForEffect function, EffectPicker component, EffectType enum
  - Added: Single copyImageToResult utility function (< 20 lines)
  - Net change: -100 LOC (approximate)
- [x] **Type-Safe Development**: Validation strategy documented
  - Zod schema for prompt (max 600 chars, nullable)
  - Server-side validation in all Server Actions
  - Client-side validation for UX
- [x] **Minimal Testing Strategy**: Test plan documented in quickstart.md
  - Update existing tests (scenes.test.ts, sessions.test.ts)
  - Add passthrough mode tests
  - Add prompt validation tests
  - Target: 70%+ overall, 90%+ critical paths
- [x] **Validation Loop Discipline**: Validation tasks included in quickstart.md
  - Lint, type-check, test commands documented
  - Manual testing checklist provided
- [x] **Technical Standards**: Standards applied throughout design
  - Zod validation (global/validation.md)
  - Server Actions pattern (backend/api.md)
  - Mobile-first UI (frontend/responsive.md)
  - Co-located tests (testing/test-writing.md)

**Design Quality**: ✅ All artifacts complete, no gaps or clarifications needed

---

## Phase 2: Tasks Breakdown

**Note**: Phase 2 (tasks.md generation) is handled by the `/speckit.tasks` command, not `/speckit.plan`.

The implementation plan is complete. Next steps:

1. Run `/speckit.tasks 001-simplify-ai-prompts` to generate actionable task breakdown
2. Run `/speckit.implement 001-simplify-ai-prompts` to execute tasks systematically

---

## Artifacts Summary

**Generated Documents**:

- ✅ `plan.md` - This file (implementation plan)
- ✅ `research.md` - Technical research and design decisions
- ✅ `data-model.md` - Entity schemas, validation rules, state transitions
- ✅ `contracts/server-actions.md` - API contracts for Server Actions and AI providers
- ✅ `quickstart.md` - Developer guide with implementation checklist

**Ready for Implementation**: Yes, all design artifacts complete.
