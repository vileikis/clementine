# Implementation Plan: AI Transform Pipeline

**Branch**: `029-ai-transform-pipeline` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/029-ai-transform-pipeline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add AI transformation capability to the media processing pipeline for single-image sessions. When `aiTransform: true` flag is provided in processMedia requests, the system will apply AI-powered image transformation using Google Gemini before applying overlay and encoding steps. The feature uses a mocked AI config with preset prompts and reference images, validates inputs, handles errors gracefully, and integrates seamlessly with the existing media pipeline architecture.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 runtime (Firebase Cloud Functions v2)
**Primary Dependencies**: Firebase Cloud Functions v2, Firebase Admin SDK (Firestore, Storage), Zod 3.x, FFmpeg (via ffmpeg-static binary), Google Generative AI SDK (@google/generative-ai or NEEDS CLARIFICATION)
**Storage**: Firebase Firestore (session state, processing metadata), Firebase Storage (input/output media, reference images at `media/{companyId}/ai-reference/`)
**Testing**: Jest (unit tests), manual testing with Firebase emulators
**Target Platform**: Firebase Cloud Functions v2 (europe-west1 region), Google Cloud infrastructure
**Project Type**: Backend microservice (Cloud Functions monorepo within pnpm workspace)
**Performance Goals**: AI transformation completes within 60 seconds end-to-end, reference image validation < 1 second
**Constraints**: Must maintain existing pipeline error handling patterns, must not block GIF/video pipelines, must use Admin SDK modular API
**Scale/Scope**: Single-image sessions only (GIF/video explicitly excluded), mocked AI config (no Firestore fetch), integration point in existing `image.pipeline.ts` (117 lines)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: N/A - Backend Cloud Functions feature with no direct mobile UI component
- [x] **Clean Code & Simplicity**: YAGNI applied (mocked config only, no premature AI provider abstraction beyond Gemini), single responsibility maintained (AI transform isolated in dedicated service)
- [x] **Type-Safe Development**: TypeScript strict mode enforced, Zod validation for aiTransform flag in processMediaRequestSchema, strongly typed AI config interface
- [x] **Minimal Testing Strategy**: Jest unit tests planned for AI provider service and integration tests for pipeline, co-located with source in `services/media-pipeline/`
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for session updates and Storage operations (modular API), schemas in `functions/src/lib/schemas/media-pipeline.schema.ts`, AI output URLs stored as full public URLs
- [x] **Feature Module Architecture**: N/A - Cloud Functions follow service-oriented architecture in `functions/src/services/`, not web app feature modules
- [x] **Technical Standards**: Backend standards reviewed (`backend/firebase.md`, `global/error-handling.md`, `global/validation.md`)

**Complexity Violations** (if any): None. The feature follows existing pipeline patterns and does not introduce new architectural complexity.

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
functions/
├── src/
│   ├── http/
│   │   └── processMedia.ts              # HTTP endpoint - add aiTransform validation
│   ├── tasks/
│   │   └── processMediaJob.ts           # Task handler - pass aiTransform to pipeline
│   ├── services/
│   │   └── media-pipeline/
│   │       ├── index.ts                 # Re-export AI services
│   │       ├── config.ts                # Add mocked AI config constant
│   │       ├── image.pipeline.ts        # Add AI transform step (before overlay)
│   │       ├── ai-transform.service.ts  # NEW: AI transformation orchestration
│   │       └── ai-providers/
│   │           ├── gemini.provider.ts   # NEW: Google Gemini implementation
│   │           └── types.ts             # NEW: AI provider interface
│   ├── lib/
│   │   ├── schemas/
│   │   │   └── media-pipeline.schema.ts # Add aiTransform: boolean field
│   │   ├── session.ts                   # Add 'ai-transform' processing state
│   │   └── storage.ts                   # Reference image validation helper
│   └── index.ts                         # No changes (re-exports functions)
└── tests/
    └── services/
        └── media-pipeline/
            ├── ai-transform.service.test.ts  # NEW: Unit tests
            └── gemini.provider.test.ts       # NEW: Provider tests
```

**Structure Decision**: Cloud Functions monorepo follows service-oriented architecture. AI transformation is integrated as a new step in `image.pipeline.ts` and implemented as isolated services in `services/media-pipeline/ai-providers/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations**. This feature adds minimal complexity:
- AI provider abstraction (interface + single implementation) follows existing FFmpeg pattern in codebase
- Mocked config constant avoids premature Firestore integration
- No new architectural patterns introduced
- Code integrated into existing pipeline structure

---

## Phase 0: Research Summary

**Key Findings** (see [research.md](./research.md) for full details):

1. **Google Generative AI SDK**: Use `@google/generative-ai` npm package for Gemini API access
2. **Model Selection**: `gemini-2.0-flash-exp` (experimental, fast) with `gemini-1.5-pro` as fallback
3. **CRITICAL DISCOVERY**: Gemini is generative text model, NOT image-to-image transformer
   - For true image transformation, need two-step: Gemini (analysis) → Image Generator (Imagen/SD/DALL-E)
   - For mocked implementation: Use placeholder pattern, defer actual image generation
4. **Reference Images**: Download to buffers, pass as base64 to Gemini SDK
5. **Error Handling**: Follow existing `markSessionFailed()` pattern with AI-specific codes
6. **Processing State**: Insert 'ai-transform' after 'downloading', before 'processing'
7. **Aspect Ratio**: AI ignores aspect ratio, FFmpeg handles formatting

**Dependencies to Add**:
```bash
pnpm add @google/generative-ai
```

**Environment Variables**:
```
GOOGLE_AI_API_KEY=<gemini-api-key>
```

---

## Phase 1: Design Artifacts

### Data Model ([data-model.md](./data-model.md))

**Extended Entities**:
- `ProcessMediaRequest` schema: Added `aiTransform: boolean` field (optional, default: false)
- `PipelineOptions` schema: Added `aiTransform: boolean` field
- `ProcessingState` type: Added `'ai-transform'` state value

**New Entities**:
- `AiTransformConfig` interface: Provider, model, prompt, referenceImages[], temperature
- `AiProvider` interface: Contract for AI transformation implementations
- `AiTransformError` class: Typed errors with codes (API_ERROR, REFERENCE_IMAGE_NOT_FOUND, etc.)

**State Transitions**:
```
Success: downloading → ai-transform → processing → uploading → completed
Skip: downloading → processing → uploading → completed (no ai-transform)
Error: ai-transform → failed (with error code)
```

### API Contracts ([contracts/](./contracts/))

**HTTP Endpoint** ([processMedia.http.contract.md](./contracts/processMedia.http.contract.md)):
- POST /processMedia with `aiTransform: boolean` field
- Backward compatible (field optional, defaults to false)
- Returns error codes: 400 (invalid), 404 (not found), 409 (already processing), 500 (internal)

**Internal Service** ([ai-transform-service.internal.contract.md](./contracts/ai-transform-service.internal.contract.md)):
- `transformImage(inputBuffer, config)` function
- Throws AiTransformError with specific codes
- Target: <60s end-to-end, <10MB memory usage
- Mocked config constant in `config.ts`

### Quickstart Guide ([quickstart.md](./quickstart.md))

- Architecture flow diagram (request → validation → task → pipeline → AI service → output)
- API usage examples (curl commands)
- Local development setup (emulators, reference images, testing)
- Error handling guide
- Performance targets and monitoring
- Troubleshooting common issues

---

## Implementation Plan

### Files to Create

1. **`functions/src/services/media-pipeline/ai-providers/types.ts`**
   - `AiTransformConfig` interface
   - `AiProvider` interface
   - `AiTransformError` class
   - `AiTransformErrorCode` type

2. **`functions/src/services/media-pipeline/ai-providers/gemini.provider.ts`**
   - `GoogleGeminiProvider` class implementing `AiProvider`
   - `transformImage()` method (Gemini API integration)
   - Error handling and logging

3. **`functions/src/services/media-pipeline/ai-transform.service.ts`**
   - `transformImage()` orchestration function
   - Config validation
   - Reference image loading
   - Provider instantiation and delegation

4. **`functions/tests/services/media-pipeline/ai-transform.service.test.ts`**
   - Unit tests for service layer
   - Mock Firebase Storage and Gemini provider

5. **`functions/tests/services/media-pipeline/gemini.provider.test.ts`**
   - Unit tests for Gemini provider
   - Mock Gemini SDK responses

### Files to Modify

1. **`functions/src/lib/schemas/media-pipeline.schema.ts`**
   - Add `aiTransform: z.boolean().optional().default(false)` to `processMediaRequestSchema`
   - Add `aiTransform` to `pipelineOptionsSchema`

2. **`functions/src/http/processMedia.ts`**
   - Extract `aiTransform` from request body (schema handles validation)
   - Pass `aiTransform` to Cloud Task payload

3. **`functions/src/tasks/processMediaJob.ts`**
   - Extract `aiTransform` from task payload
   - Pass to `pipelineOptions` object

4. **`functions/src/services/media-pipeline/config.ts`**
   - Add `MOCKED_AI_CONFIG` constant
   - Export `AiTransformConfig` type

5. **`functions/src/services/media-pipeline/image.pipeline.ts`**
   - Import `transformImage` from `ai-transform.service`
   - After downloading input, check `options.aiTransform`
   - If true: call `transformImage()`, update state to 'ai-transform', use transformed buffer
   - Wrap in try-catch, handle `AiTransformError` → `markSessionFailed()`

6. **`functions/src/services/media-pipeline/index.ts`**
   - Re-export `transformImage` function
   - Re-export AI types

7. **`@clementine/shared` package (processing state)**
   - Add `'ai-transform'` to `ProcessingState` type union
   - Location: `shared/src/types/session.ts` (or equivalent)

8. **`functions/package.json`**
   - Add dependency: `@google/generative-ai`

### Validation Checklist

Before marking feature complete:

- [ ] Run `pnpm lint` from root (no errors)
- [ ] Run `pnpm type-check` from root (no errors)
- [ ] Run `pnpm test` from functions/ (all tests pass, >70% coverage)
- [ ] Test locally with emulators (success, skip, error paths)
- [ ] Verify all acceptance scenarios from spec.md
- [ ] Update MANUAL-TESTING.md with AI transform test cases

---

## Re-Evaluated Constitution Check

_After Phase 1 design completion:_

- [x] **Mobile-First Responsive Design**: N/A - Backend feature
- [x] **Clean Code & Simplicity**: ✅ Design maintains simplicity:
  - Mocked config avoids premature Firestore abstraction
  - Single AI provider (Gemini) without over-architecting multi-provider support
  - Reuses existing error handling and state management patterns
  - Minimal new code surface (~300 LOC total)
- [x] **Type-Safe Development**: ✅ All schemas use Zod, all interfaces strictly typed, no `any` escapes
- [x] **Minimal Testing Strategy**: ✅ Jest unit tests for service and provider, manual integration testing
- [x] **Validation Loop Discipline**: ✅ Validation tasks included in checklist above
- [x] **Firebase Architecture Standards**: ✅ Admin SDK for Storage (modular API), schemas in proper location, output URLs stored as full public URLs
- [x] **Feature Module Architecture**: ✅ N/A - Cloud Functions architecture
- [x] **Technical Standards**: ✅ Backend standards followed (Firebase modular API, error handling, validation)

**Final Result**: ✅ **All principles satisfied. No violations.**

---

## Delivery Summary

**Branch**: `029-ai-transform-pipeline`
**Status**: Plan complete, ready for `/speckit.tasks`

**Artifacts Generated**:
- ✅ Technical Context filled
- ✅ Constitution Check passed (initial + re-evaluation)
- ✅ Phase 0: [research.md](./research.md) - 7 research decisions documented
- ✅ Phase 1: [data-model.md](./data-model.md) - 7 entities + state transitions
- ✅ Phase 1: [contracts/processMedia.http.contract.md](./contracts/processMedia.http.contract.md) - HTTP API specification
- ✅ Phase 1: [contracts/ai-transform-service.internal.contract.md](./contracts/ai-transform-service.internal.contract.md) - Internal service contract
- ✅ Phase 1: [quickstart.md](./quickstart.md) - Developer guide with examples
- ✅ Phase 1: Agent context updated (CLAUDE.md)

**Next Step**: Run `/speckit.tasks` to generate actionable task breakdown for implementation.
