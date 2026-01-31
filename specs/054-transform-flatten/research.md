# Research: Flatten Transform Configuration

**Feature**: 054-transform-flatten
**Date**: 2026-01-31

## Research Summary

This refactor is straightforward with no open questions. All technical decisions are clear from the codebase analysis.

## Decisions

### D-001: Field Naming Convention

**Decision**: Use `transformNodes` (camelCase with plural noun)

**Rationale**:
- Matches existing `steps` field naming pattern in `ExperienceConfig`
- Follows TypeScript/JavaScript naming conventions
- Clearly indicates the field contains an array of nodes

**Alternatives Considered**:
- `nodes` - Too generic, loses context
- `transform_nodes` - Inconsistent with codebase snake_case avoidance
- `pipelineNodes` - Introduces new terminology

### D-002: Default Value Strategy

**Decision**: Default `transformNodes` to empty array `[]`

**Rationale**:
- Matches current behavior of `transformConfigSchema.nodes.default([])`
- Eliminates null-checking: `config.transformNodes` vs `config.transform?.nodes ?? []`
- Consistent with `steps` field which also defaults to `[]`

**Alternatives Considered**:
- Nullable field with `null` default - Adds unnecessary null checks
- Required field with no default - Breaking change for existing code

### D-003: Removal of outputFormatSchema

**Decision**: Remove `outputFormatSchema`, `outputAspectRatioSchema`, and related types

**Rationale**:
- Feature spec explicitly states these are unused (Assumption: "The `outputFormat` field is unused")
- Per-node aspect ratio configuration already exists in `aiImageNodeConfigSchema`
- Cloud Functions `outputFormat` parameter is a different concept (request-level image/gif/video)

**Alternatives Considered**:
- Keep as deprecated - Adds confusion, YAGNI principle violation
- Move to node-level - Already exists there for AI Image nodes

### D-004: Schema Migration Approach

**Decision**: Direct schema replacement (no backward compatibility layer)

**Rationale**:
- Pre-launch status means no production data to migrate
- TypeScript compiler will catch all broken references
- Clean break is simpler than dual-schema support

**Alternatives Considered**:
- Zod `transform()` for backward compat - Unnecessary complexity for pre-launch
- Runtime migration layer - Over-engineering for the use case

## Code Location Analysis

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/shared/src/schemas/experience/transform.schema.ts` | Major | Remove `transformConfigSchema`, `outputFormatSchema`; keep `transformNodeSchema` |
| `packages/shared/src/schemas/experience/transform.schema.test.ts` | Major | Update tests for removed schemas |
| `packages/shared/src/schemas/experience/experience.schema.ts` | Moderate | Replace `transform: transformConfigSchema` with `transformNodes: z.array(transformNodeSchema)` |
| `packages/shared/src/index.ts` | Minor | Update exports |
| `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.ts` | Major | Update all functions to use `transformNodes` |
| `apps/clementine-app/src/domains/experience/generate/lib/transform-operations.test.ts` | Major | Update test fixtures |
| `apps/clementine-app/src/domains/experience/shared/schemas/index.ts` | Minor | Update re-exports |
| `functions/src/repositories/job.ts` | Minor | Update `buildJobSnapshot()` |

### Files That May Have Additional References

Need to search for:
- `transform?.nodes`
- `transform.nodes`
- `config.transform`
- `TransformConfig` type usage

### Files Unchanged

- `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts` - Node schema stays the same
- `functions/src/http/processMedia.ts` - Uses request-level `outputFormat` (different concept)
- `functions/src/services/media-pipeline/config.ts` - Uses request-level `outputFormat`

## Dependencies

No external dependencies or new packages required. This is a pure refactoring of existing Zod schemas.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed reference to old path | Low | Medium | TypeScript strict mode will catch compile errors |
| Test failures | Medium | Low | Update tests as part of refactor |
| Runtime validation mismatch | Low | High | Run full test suite after changes |

## Conclusion

No open questions or NEEDS CLARIFICATION items. Proceed to Phase 1 design.
