# Research: Evolve Experiences Schema

**Feature**: 003-experience-schema
**Date**: 2025-11-19
**Status**: Complete

## Overview

This document captures the research and architectural decisions made during the planning phase for evolving the experiences schema from a flat structure to a discriminated union pattern.

## Research Areas

### 1. TypeScript Discriminated Unions for Schema Design

**Question**: What is the best TypeScript pattern for modeling multiple experience types with type-specific configuration?

**Decision**: TypeScript discriminated unions with a `type` field as the discriminator

**Rationale**:
- **Type Safety**: TypeScript narrows types automatically when checking the `type` field, providing compile-time guarantees
- **Extensibility**: Adding new experience types requires only adding to the union, not refactoring existing code
- **Standard Pattern**: Widely used in TypeScript codebases (Redux actions, GraphQL unions, API responses)
- **Runtime Validation**: Zod's `.discriminatedUnion()` provides first-class support for this pattern
- **Zero Runtime Overhead**: Discriminated unions are a compile-time construct with no performance penalty

**Alternatives Considered**:
1. **Class Hierarchy** - Rejected because JavaScript classes add runtime overhead and don't serialize to Firestore naturally
2. **Separate Collections** - Rejected because it would complicate queries and force denormalization across multiple collections
3. **Single Schema with All Fields Optional** - Rejected because it sacrifices type safety (can't enforce which fields are required for each type)

**References**:
- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Zod Discriminated Unions](https://zod.dev/?id=discriminated-unions)

---

### 2. Backward Compatibility Strategy

**Question**: How do we migrate existing photo experiences from the flat schema to the new discriminated union without data loss?

**Decision**: Implement migration-on-save pattern with backward-compatible reads

**Rationale**:
- **Zero Downtime**: No batch migration script needed, experiences migrate lazily as users edit them
- **Data Safety**: Read operations support both old and new schemas, preventing errors during transition
- **Atomic Updates**: Migration happens during user-initiated save operations, ensuring data consistency
- **Testable**: Migration logic isolated in `migration.ts` file, easy to unit test
- **Reversible**: Old documents remain readable, allowing rollback if needed

**Migration Strategy**:
1. **Phase 1 (Read)**: Support both old flat schema and new schema in UI (new schema takes precedence)
2. **Phase 2 (Write)**: All saves write to new schema and remove legacy flat fields
3. **Phase 3 (Cleanup)**: After all experiences migrated, remove backward compatibility read logic

**Alternatives Considered**:
1. **Batch Migration Script** - Rejected because it's risky (can fail mid-batch), requires downtime, and doesn't handle experiences created during migration window
2. **Dual-Write Period** - Rejected because it adds complexity (writing to both old and new fields) and delays full migration
3. **Breaking Change** - Rejected because it would lose existing photo experiences or require manual data recovery

**References**:
- [Zero-Downtime Migrations](https://martinfowler.com/articles/evodb.html)
- Firebase best practices for schema evolution

---

### 3. Config Object Structure

**Question**: How should type-specific configuration be organized within each experience type?

**Decision**: Use `config` object for type-specific settings and `aiConfig` object for shared AI configuration

**Rationale**:
- **Clear Separation of Concerns**: Type-specific settings (countdown, overlay) separated from AI settings (prompt, model, aspect ratio)
- **Reusability**: `aiConfig` structure can be reused across video/gif experiences in the future
- **Type Safety**: Discriminated union allows different `config` shapes per type (PhotoConfig, VideoConfig, etc.)
- **Discoverability**: Developers know where to look for settings based on category
- **Shallow Nesting**: Avoids deep nesting (no `config.ai.model`, just `aiConfig.model`)

**Example Structure**:
```typescript
// Photo Experience
{
  type: "photo",
  config: {
    countdown?: number,
    overlayFramePath?: string
  },
  aiConfig: {
    enabled: boolean,
    model?: string,
    prompt?: string,
    aspectRatio: "1:1" | "3:4" | ...
  }
}

// Future Video Experience
{
  type: "video",
  config: {
    maxDurationSeconds: number,
    allowRetake: boolean
  },
  aiConfig: {
    enabled: boolean,
    model?: string,
    prompt?: string,
    aspectRatio: "9:16" | "16:9"
  }
}
```

**Alternatives Considered**:
1. **All Settings in Root** - Rejected because it doesn't scale as we add more experience types (would create a massive flat schema)
2. **Single Nested Config** - Rejected because it mixes type-specific and shared concerns (e.g., `config.aiModel` vs `config.countdown`)
3. **Deeply Nested** - Rejected because it creates verbose access patterns (`experience.config.ai.settings.model`)

---

### 4. Default Values Strategy

**Question**: What default values should be used when creating new photo experiences?

**Decision**:
- `config.countdown`: `0` (no countdown by default)
- `aiConfig.enabled`: `false` (AI disabled by default)
- `aiConfig.aspectRatio`: `"1:1"` (square format, most common for photobooths)

**Rationale**:
- **Minimize Friction**: Creators can start with just a title and enable features later
- **Safe Defaults**: Disabling AI by default prevents accidental generation costs
- **Progressive Disclosure**: Simple default state, advanced features opt-in
- **User Expectations**: 1:1 aspect ratio aligns with Instagram and most social platforms

**User Research Insights**: None (this is a refactoring, not a new feature), but defaults align with existing behavior in current flat schema

**Alternatives Considered**:
1. **Countdown Default: 3 seconds** - Rejected because not all creators want countdown delay
2. **AI Enabled by Default** - Rejected because it could lead to unexpected API costs
3. **Required AI Configuration** - Rejected because it adds friction to creation flow

---

### 5. "Coming Soon" UI Pattern

**Question**: How should we indicate that video/gif/wheel/survey experiences are not yet available?

**Decision**: Disable type selection options with visible "coming soon" badge in the UI

**Rationale**:
- **Set Expectations**: Users see the product roadmap and know features are planned
- **Prevent Support Tickets**: Clear indication reduces confusion about why options are disabled
- **Schema Readiness**: Schema definitions exist now, reducing future refactoring when types are implemented
- **Progressive Enhancement**: Easy to enable types by removing the disabled state

**UI Pattern**:
```tsx
<SelectItem value="video" disabled>
  <div className="flex items-center justify-between w-full">
    <span>Video Experience</span>
    <Badge variant="outline">Coming Soon</Badge>
  </div>
</SelectItem>
```

**Alternatives Considered**:
1. **Hide Unavailable Types** - Rejected because users won't know what's planned
2. **Show but Error on Selection** - Rejected because it's frustrating UX
3. **Fully Implement All Types** - Rejected because it's out of scope for this refactoring

---

### 6. Zod Validation Strategy

**Question**: How should we validate the discriminated union at runtime?

**Decision**: Use Zod's `.discriminatedUnion()` method with separate schemas per type

**Rationale**:
- **First-Class Support**: Zod has built-in support for discriminated unions via `.discriminatedUnion()`
- **Precise Error Messages**: Validation errors specify which type-specific field failed
- **Type Inference**: `z.infer<typeof photoExperienceSchema>` produces correct TypeScript types
- **Composability**: Shared schemas (like `aiConfigSchema`) can be reused across types

**Example Implementation**:
```typescript
const photoConfigSchema = z.object({
  countdown: z.number().int().min(0).max(10).optional(),
  overlayFramePath: z.string().optional(),
});

const aiConfigSchema = z.object({
  enabled: z.boolean(),
  model: z.string().optional(),
  prompt: z.string().max(600).optional(),
  referenceImagePaths: z.array(z.string()).optional(),
  aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]),
});

const photoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("photo"),
  config: photoConfigSchema,
  aiConfig: aiConfigSchema,
});

const experienceSchema = z.discriminatedUnion("type", [
  photoExperienceSchema,
  videoExperienceSchema, // future
  gifExperienceSchema,   // future
  wheelExperienceSchema, // future
  surveyExperienceSchema // future
]);
```

**Alternatives Considered**:
1. **Manual Type Guards** - Rejected because it's error-prone and requires maintaining separate runtime and compile-time logic
2. **Single Schema with Refinements** - Rejected because Zod's `.refine()` doesn't provide type narrowing
3. **No Runtime Validation** - Rejected because it violates Type-Safe Development principle (Constitution III)

---

### 7. Migration Test Coverage

**Question**: What aspects of the migration logic require testing?

**Decision**: Unit test migration function with legacy data fixtures covering all edge cases

**Test Cases Identified**:
1. **Legacy photo experience** → migrates to `config` + `aiConfig`
2. **Experience with both old and new fields** → new fields take precedence, old fields removed
3. **Experience missing AI fields** → defaults `aiConfig.enabled = false`
4. **Experience missing countdown** → defaults `config.countdown = 0`
5. **Experience with invalid legacy data** → validation catches errors

**Rationale**:
- **Critical Path**: Migration affects all existing photo experiences, must be bulletproof
- **Data Safety**: Tests ensure zero data loss during migration
- **Regression Prevention**: Future schema changes won't accidentally break migration logic

**Alternatives Considered**:
1. **Manual Testing Only** - Rejected because it's not repeatable and doesn't prevent regressions
2. **E2E Tests Only** - Rejected because migration is a pure function, unit tests are faster and more focused

---

## Technology Choices

### Zod 4.1.12
- **Why**: Already in use in the project, provides TypeScript-first runtime validation
- **Best Practices**: Use `.strict()` on schemas to catch unknown fields, use `.transform()` for data normalization
- **Resources**: [Zod Documentation](https://zod.dev/)

### TypeScript Discriminated Unions
- **Why**: Built-in language feature, zero runtime cost, excellent type narrowing
- **Best Practices**: Use string literal types for discriminator field, ensure all union members have same discriminator property
- **Resources**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

### Firebase Firestore (Existing)
- **Why**: Already storing experiences in `/events/{eventId}/experiences/{experienceId}`
- **Best Practices**: Use Admin SDK for mutations (Server Actions), Client SDK for real-time reads (`onSnapshot`)
- **Migration Pattern**: Lazy migration (migrate on save) to avoid batch operations
- **Resources**: `standards/backend/firebase.md`

---

## Risk Assessment

### High Risk
- **Data Loss During Migration**: Mitigated by extensive unit tests, backward-compatible reads, and migration-on-save pattern
- **Performance Degradation**: Mitigated by shallow object structure (no deep nesting), indexed queries remain efficient

### Medium Risk
- **Type Confusion**: Mitigated by discriminated union type guards, Zod validation on all writes
- **Incomplete Migration**: Mitigated by supporting both schemas during read operations

### Low Risk
- **Breaking Client SDK Subscriptions**: Mitigated by preserving all existing fields during migration (only adding/restructuring)

---

## Open Questions & Decisions Deferred

### For Future Implementation
1. **Video/Gif/Wheel/Survey Config Shapes**: Not defined in detail yet, will be specified when those types are implemented
2. **AspectRatio Values for Video**: Likely `["9:16", "16:9", "1:1"]` but can be refined later
3. **Wheel Experience Schema**: May need `items` array, to be designed when feature is specified

### No Impact on Current Feature
- **Authentication for Experience Builder**: Already handled by existing event access patterns
- **Analytics Tracking**: Denormalized counters on Event document remain unchanged
- **Preview Image Generation**: Existing upload flow works with new schema (stores public URLs)

---

## Summary

All research areas have been resolved. The implementation plan can proceed to Phase 1 (Design) with:
1. TypeScript discriminated unions for type-safe schema modeling
2. Migration-on-save pattern for backward compatibility
3. `config` + `aiConfig` structure for clear separation of concerns
4. Zod `.discriminatedUnion()` for runtime validation
5. Safe defaults (countdown: 0, aiConfig.enabled: false, aspectRatio: "1:1")
6. "Coming soon" UI badges for unimplemented types
7. Comprehensive unit tests for migration logic

No blockers remain for proceeding to data model and contract generation.
