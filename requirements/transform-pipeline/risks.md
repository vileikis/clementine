# Transform Pipeline - Risks & Mitigations

## Re-evaluated Risks

### R1: Prompt/Config Visibility to Clients

**Risk**: Transform configuration (prompts, node details) visible to technically-savvy users through:
- Experience document returned to client
- Network inspection

**Impact**: **LOW** (Re-evaluated from HIGH)

**Re-evaluation rationale**:
1. **Competitor validation**: Major market players (established photobooth SaaS) don't hide prompts, customers don't churn over this
2. **Who sees it?**: Only guests who inspect network requests - tiny fraction of users
3. **What's actually proprietary?**: Platform, UX, and speed of execution are the moat, not prompts
4. **Reverse engineering**: Users could screenshot outputs and reverse-engineer prompts anyway
5. **Concierge phase**: Early users are trusted partners, not adversaries

**Decision**: **Accept risk for MVP** - Embed transform config in experience document

**Mitigations** (still applied):
1. Error messages sanitized before returning to client
2. Don't market "secure prompts" as a feature
3. Document as intentional technical debt

**Revisit triggers**:
- Enterprise customer explicitly requests prompt security
- Evidence of prompt copying in the wild
- Scaling beyond concierge phase with untrusted users

**Migration path if needed**: Move to `/experiences/{expId}/transformConfigs/{stepId}` subcollection with admin-only security rules

**Status**: Accepted for MVP

---

### R2: Step Reference Integrity

**Risk**: Transform pipeline references steps that:
- Don't exist (deleted)
- Are after the transform step (invalid order)
- Have wrong type (expecting answer but step is capture)

**Impact**: MEDIUM - Pipeline failures, confusing errors

**Mitigations**:
1. Validate references on save (before publish)
2. Prevent deletion of steps that are referenced
3. Re-validate at job execution time
4. Clear error messages for admins

**Status**: Needs implementation design

---

### R3: Pipeline Execution Timeout

**Risk**: Complex pipelines (especially with AI) could exceed Cloud Task timeout limits.

**Impact**: MEDIUM - Job fails, guest sees error

**Mitigations**:
1. Set appropriate timeout (10 min for MVP)
2. Progress tracking so users know it's working
3. Optimize node execution (parallel where possible)
4. Consider chunking very long pipelines

**Status**: Needs capacity planning

---

### R4: AI Model Rate Limits / Failures

**Risk**: AI models (Gemini) have rate limits and can fail due to:
- Content policy violations
- Service outages
- Rate limiting

**Impact**: MEDIUM - Job fails

**Mitigations**:
1. Implement retry with exponential backoff
2. Consider fallback models
3. Queue management to stay under rate limits
4. Clear error handling and user messaging
5. Admin notification on repeated failures

**Status**: Needs implementation design

---

### R5: Storage Costs for Media Assets

**Risk**: Each job creates output media, intermediate files could accumulate.

**Impact**: LOW-MEDIUM - Unexpected costs

**Mitigations**:
1. Process intermediate results in memory where possible
2. Lifecycle policies to delete old job outputs
3. Compress outputs appropriately
4. Monitor storage usage

**Status**: Needs operational planning

---

## Medium Risks

### R6: Complex Pipeline Debugging

**Risk**: When a pipeline fails, it may be hard to identify which node failed and why.

**Impact**: MEDIUM - Developer/admin frustration

**Mitigations**:
1. Detailed server-side logging per node
2. Job document stores failed node ID
3. Admin UI shows pipeline execution trace
4. Ability to test individual nodes

**Status**: Needs UX design

---

### R7: Experience Version Mismatch

**Risk**: Job executes with different transform config than when session started (race condition during publish).

**Impact**: LOW-MEDIUM - Unexpected results

**Mitigations**:
1. Snapshot transform config version in job document
2. Use versioned config lookup at execution time
3. Don't allow publish while jobs are running (or warn)

**Status**: Design addressed in spec.md

---

### R8: Variable Mapping Complexity

**Risk**: {{variable}} syntax in prompts could become complex:
- What if variable value is array (multiSelect)?
- What if variable is empty?
- What about escaping {{ }} in prompts?

**Impact**: LOW-MEDIUM - Confusing behavior

**Mitigations**:
1. Clear documentation of variable syntax
2. Preview resolved prompt in admin UI
3. Handle edge cases explicitly (empty = "none", array = joined)
4. Escape syntax (e.g., \{\{ for literal braces)

**Status**: Needs detailed design

---

### R9: Node Type Evolution

**Risk**: Need to add/modify node types over time without breaking existing pipelines.

**Impact**: LOW - Development friction

**Mitigations**:
1. Version node schemas
2. Migration scripts for schema changes
3. Backwards-compatible additions
4. Deprecation path for removed features

**Status**: Standard versioning practices

---

### R10: Performance Variance

**Risk**: AI processing time varies significantly, hard to give accurate estimates.

**Impact**: LOW - UX frustration

**Mitigations**:
1. Show progress bar, not time estimate
2. Track actual times for future estimation
3. Under-promise, over-deliver approach

**Status**: Needs UX design

---

## Low Risks

### R11: Media Format Compatibility

**Risk**: Input media might not be in expected format.

**Impact**: LOW - Node fails

**Mitigations**:
1. Validate/convert on upload
2. Normalize formats at pipeline start
3. Clear error if unsupported format

---

### R12: Concurrent Job Limits

**Risk**: Too many jobs running simultaneously could overwhelm system.

**Impact**: LOW - Performance degradation

**Mitigations**:
1. Cloud Tasks rate limiting
2. Queue management
3. Monitoring and alerts

---

### R13: Asset Reference Staleness

**Risk**: Referenced assets (backgrounds, overlays) could be deleted from media library.

**Impact**: LOW - Pipeline fails

**Mitigations**:
1. Validate assets exist on save
2. Prevent deletion of referenced assets
3. Or: copy assets to transform-specific storage

---

## Risk Matrix

| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| R1: Config Visibility | Medium | **Low** | **P3** (Accepted) |
| R2: Step Reference Integrity | High | Medium | **P1** |
| R3: Timeout | Medium | Medium | **P1** |
| R4: AI Failures | High | Medium | **P1** |
| R5: Storage Costs | Medium | Low | **P2** |
| R6: Debugging | High | Medium | **P1** |
| R7: Version Mismatch | Low | Medium | **P2** |
| R8: Variable Mapping | Medium | Low | **P2** |
| R9: Node Evolution | Low | Low | **P3** |
| R10: Performance Variance | High | Low | **P2** |
| R11: Format Compatibility | Low | Low | **P3** |
| R12: Concurrent Jobs | Low | Low | **P3** |
| R13: Asset Staleness | Low | Low | **P3** |

## Next Steps

1. Address P1 risks in initial design (R2, R3, R4, R6)
2. Plan P2 mitigations for post-MVP
3. R1 (Config Visibility) accepted for MVP - revisit if enterprise customers request
