# Research: Schema Foundations (PRD 1A)

**Date**: 2026-02-04
**Status**: Complete

## Overview

This feature requires no external research. All schema shapes are fully specified in PRD 1A, and implementation patterns are established in the existing codebase.

## Decisions

### 1. Media Display Name Validation

**Decision**: Use regex `/^[a-zA-Z0-9 \-_.]+$/` with `.catch('Untitled')` for backward compatibility.

**Rationale**:
- PRD 1A explicitly specifies this regex
- Characters `}`, `:`, `{` break the `@{ref:displayName}` mention syntax
- Existing documents may have invalid names, so `.catch()` prevents parse failures

**Alternatives Considered**:
- Stricter validation (reject all special chars) - Rejected: periods are commonly used in filenames
- No backward compatibility - Rejected: would break existing media documents

### 2. Discriminated Union Pattern

**Decision**: Use `kind` field as discriminator for outcome options.

**Rationale**:
- PRD 1A specifies `kind: 'image' | 'gif' | 'video'`
- Zod's `z.discriminatedUnion()` provides type-safe narrowing
- Matches existing patterns in codebase (e.g., step type discrimination)

**Alternatives Considered**:
- Using `type` field - Rejected: `type` already used at top level for outcome type
- No discriminated union - Rejected: loses type safety for options

### 3. Session Response Context Field

**Decision**: Use `z.unknown().nullable().default(null)` for context field.

**Rationale**:
- Different step types have different context shapes (MediaReference[], MultiSelectOption[], etc.)
- Using `unknown` avoids coupling to specific step type schemas
- Nullable with default allows simple inputs to omit context

**Alternatives Considered**:
- Discriminated union by stepType - Rejected: too complex, couples response schema to all step types
- Typed context per step type - Rejected: requires updating response schema for every new step type

### 4. Schema File Organization

**Decision**: Create new files in existing domain directories.

**Rationale**:
- `create-outcome.schema.ts` in `experience/` - outcome is part of experience config
- `session-response.schema.ts` in `session/` - responses are session data
- `mediaDisplayNameSchema` in existing `media-reference.schema.ts` - display name is a media reference field

**Alternatives Considered**:
- New `create/` directory - Rejected: would fragment experience-related schemas
- Single monolithic schema file - Rejected: violates single responsibility

### 5. Model and Aspect Ratio Schemas

**Decision**: Define `aiImageModelSchema` and `aiImageAspectRatioSchema` locally in `create-outcome.schema.ts`. Do NOT import from `nodes/ai-image-node.schema.ts`.

**Rationale**:
- The `transformNodes` system (including `nodes/`) is being deprecated in this epic
- PRD 4 will remove the old transform code entirely
- Creating a dependency would make cleanup harder
- The new create outcome system should be self-contained

**Alternatives Considered**:
- Reuse from ai-image-node.schema.ts - Rejected: couples new system to deprecated code
- Extract to shared common file - Rejected: premature abstraction; cleanup in PRD 4 may change requirements

**Note**: `mediaReferenceSchema` IS still reused since it's in the `media/` domain (not being deprecated).

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| zod | 4.1.12 | Schema validation library |

No new dependencies required. All schemas use existing Zod patterns.

## Existing Code References

| Schema | File | Usage |
|--------|------|-------|
| `mediaReferenceSchema` | `media/media-reference.schema.ts` | Used for refMedia in imageGeneration |
| `experienceStepNameSchema` | `experience/step.schema.ts` | Pattern reference for display name validation |

**Not referenced** (to avoid coupling to deprecated code):
| Schema | File | Reason |
|--------|------|--------|
| `aiImageModelSchema` | `experience/nodes/ai-image-node.schema.ts` | Part of deprecated transformNodes |
| `aiImageAspectRatioSchema` | `experience/nodes/ai-image-node.schema.ts` | Part of deprecated transformNodes |

## Testing Strategy

Unit tests for each schema covering:
1. Valid input acceptance
2. Invalid input rejection with descriptive errors
3. Default value application
4. Backward compatibility (`.catch()` behavior)
5. Type inference verification

Test file locations:
- `packages/shared/src/schemas/media/media-reference.schema.test.ts` (extend existing)
- `packages/shared/src/schemas/experience/create-outcome.schema.test.ts` (new)
- `packages/shared/src/schemas/session/session-response.schema.test.ts` (new)
