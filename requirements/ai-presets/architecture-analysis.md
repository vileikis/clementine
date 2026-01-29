# AI Presets Architecture Analysis: Separate Domain vs Inline Approach

**Date**: 2026-01-29
**Status**: Decision Point
**Context**: Phase 4 of AI Presets complete, evaluating UX concerns before Phase 5-6 integration

---

## Executive Summary

After implementing Phases 1-4 of AI Presets (separate domain approach), significant UX friction has been identified in the workflow. This document analyzes the **current architecture** versus a **proposed inline approach** across three dimensions:

1. **Value**: Which approach delivers more user value?
2. **Viability**: Technical feasibility and maintainability
3. **UX Risk**: Cognitive load and error proneness

**Recommendation**: See [Final Recommendation](#final-recommendation) section.

---

## Current Architecture: AI Presets as Separate Domain

### Design Overview

```
┌─────────────────────────────────────┐
│      AI PRESET (Workspace-level)    │
│  - Variables with value mappings    │
│  - Media registry                   │
│  - Prompt template                  │
│  - Model settings                   │
└─────────────────────────────────────┘
              │ referenced by
              ▼
┌─────────────────────────────────────┐
│         EXPERIENCE                  │
│  - Steps (capture, multiselect, etc)│
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      TRANSFORM PIPELINE             │
│  - presetId reference               │
│  - variableBindings: {              │
│      pet: { stepId: "petStep" }     │
│      bg: { stepId: "bgStep" }       │
│    }                                │
└─────────────────────────────────────┘
```

### User Workflow

1. **Create AI Preset** (separate workspace page):
   - Define variables (`pet`, `background`)
   - Create value mappings for each variable:
     - `pet: "cat"` → `"holding a cat (see @cat)"`
     - `pet: "dog"` → `"holding a dog (see @dog)"`
   - Upload media to registry (`@cat`, `@dog`, `@hobbiton`)
   - Write prompt template: `"Transform @user_photo... @pet... @background..."`
   - Set model and aspect ratio
   - Test with preview panel

2. **Create Experience** (experience designer):
   - Define steps:
     - `captureStep`: Photo capture
     - `petStep`: Multi-select with options `["cat", "dog", "none"]`
     - `bgStep`: Multi-select with options `["hobbiton", "rivendell"]`

3. **Configure Transform Pipeline** (experience transform tab):
   - Select AI Preset
   - Map preset variables to experience steps:
     - `@pet` → `petStep`
     - `@background` → `bgStep`
     - `@user_photo` → `captureStep`

### Identified Pain Points

#### 1. **Redundant Value Definition**
- Preset has value mappings: `cat`, `dog`, `none`
- Experience step has options: `["cat", "dog", "none"]`
- **Problem**: Same values defined twice, must match exactly

#### 2. **Fragile Coupling**
- If preset variable changes (renamed, deleted, values changed):
  - All experiences using that preset may break
  - No clear error message until runtime
- If experience step changes:
  - Binding may become invalid
  - Hard to trace impact

#### 3. **Cognitive Overhead**
- User must understand three separate concepts:
  - Preset variables (abstract)
  - Experience steps (concrete user inputs)
  - Variable bindings (the mapping layer)
- Context switching between workspace presets and experience config

#### 4. **Extra Mapping Step**
- Even with identical names, user must explicitly wire preset vars → steps
- Feels redundant when variable name matches step name

---

## Proposed Architecture: Inline AI Configuration

### Design Overview

```
┌─────────────────────────────────────────────────────────┐
│                    EXPERIENCE                           │
│                                                         │
│  Steps:                                                 │
│    - captureStep (photo)                                │
│    - petStep (multiselect)                              │
│        options: [                                       │
│          { value: "cat",                                │
│            prompt: "holding a cat (see @cat)",          │
│            media: <cat_image_ref> },                    │
│          { value: "dog",                                │
│            prompt: "holding a dog (see @dog)",          │
│            media: <dog_image_ref> }                     │
│        ]                                                │
│    - bgStep (multiselect)                               │
│        options: [                                       │
│          { value: "hobbiton",                           │
│            prompt: "in the Shire @hobbiton",            │
│            media: <hobbiton_image_ref> }                │
│        ]                                                │
│                                                         │
│  Transform Pipeline:                                    │
│    AI Image Node (inline):                              │
│      model: "gemini-2.5-pro"                            │
│      aspectRatio: "3:2"                                 │
│      promptTemplate:                                    │
│        "Transform @captureStep into hobbit              │
│         @petStep @bgStep"                               │
│      mediaRegistry: [                                   │
│        { name: "cat", mediaId: "..." },                 │
│        { name: "dog", mediaId: "..." }                  │
│      ]                                                  │
└─────────────────────────────────────────────────────────┘
```

### User Workflow

1. **Create Experience**:
   - Define steps with enriched options:
     - `petStep` options:
       - Value: `"cat"`, Prompt: `"holding a cat (see @cat)"`, Media: `<cat_image>`
       - Value: `"dog"`, Prompt: `"holding a dog (see @dog)"`, Media: `<dog_image>`
   - Upload media to experience media registry

2. **Configure Transform AI Node** (inline in transform pipeline):
   - Write prompt: `"Transform @captureStep into hobbit @petStep @bgStep"`
   - Set model and aspect ratio
   - Preview/test directly in node editor (all step data available)

### Claimed Benefits

1. **No Mapping Layer**: Direct step reference by name
2. **Single Source of Truth**: Options defined once (in steps)
3. **Co-located Data**: Steps and transform in same document
4. **Simpler Mental Model**: One less abstraction layer

---

## Comparative Analysis

### 1. Value Proposition

| Dimension | Separate Presets (Current) | Inline (Proposed) | Winner |
|-----------|---------------------------|-------------------|--------|
| **Reusability** | ✅ One preset → many experiences | ❌ Copy/paste between experiences | **Presets** |
| **Testability in Isolation** | ✅ Test preset without experience | ⚠️ Need experience context | **Presets** |
| **Workflow Simplicity** | ❌ 3-step process with mapping | ✅ 2-step process, no mapping | **Inline** |
| **Consistency Across Experiences** | ✅ Change preset → all update | ❌ Must update each experience | **Presets** |
| **Discoverability** | ✅ Workspace-level preset library | ❌ Hidden in each experience | **Presets** |
| **Learning Curve** | ❌ Higher (3 concepts) | ✅ Lower (2 concepts) | **Inline** |

**Value Analysis**:
- **Current** wins on reusability, testability, and consistency
- **Proposed** wins on simplicity and learning curve
- **Trade-off**: Productivity (inline) vs. maintainability at scale (presets)

---

### 2. Viability (Technical Feasibility)

#### Current Architecture Strengths

✅ **Already Implemented**: Phase 1-4 complete, working system
✅ **Separation of Concerns**: AI logic independent from experience logic
✅ **Type Safety**: Full TypeScript typing with Zod schemas
✅ **Draft/Publish Pattern**: Safe editing without affecting live experiences
✅ **Tested**: Resolution logic, validation, serialization all tested
✅ **Lexical Integration**: Rich text editor with mention system

#### Proposed Architecture Challenges

⚠️ **Schema Complexity**: Steps become AI-aware
```typescript
// Current: Simple
options: string[]

// Proposed: Complex
options: Array<{
  value: string,
  prompt?: string,  // Optional for AI-enabled steps
  media?: MediaReference  // Optional
}>
```

⚠️ **Step Type Explosion**: Need AI-aware variants
- `input-multi-select` (current) vs `input-multi-select-ai` (proposed)?
- Or make all steps optionally AI-aware? (violates separation of concerns)

⚠️ **Resolution Logic Complexity**:
- Must handle steps with/without prompt fragments
- Must traverse experience doc to find step configs during transform
- Circular reference risk (step → transform → step)

⚠️ **Migration Path**:
- Cannot just extend current step schemas (breaking change)
- Must support both patterns during transition (complexity)

⚠️ **Preview/Test Context**:
- Current: Preset editor has all data (variables, media, prompt)
- Proposed: AI node needs entire experience context
- **Question**: Where does test input state live?

⚠️ **Code Reuse**:
- Lexical editor, resolution logic, validation already built
- Would need to adapt for inline context (non-trivial refactor)

**Viability Analysis**:
- **Current**: Proven, stable, modular
- **Proposed**: Significant refactor, schema changes, migration complexity
- **Risk**: 2-3 weeks of development to match current functionality

---

### 3. UX Risk Analysis

#### Pain Point 1: Redundant Value Definition

**Current Problem**:
```typescript
// AI Preset
variables: [{
  name: 'pet',
  valueMap: [
    { value: 'cat', text: '...' },
    { value: 'dog', text: '...' }
  ]
}]

// Experience Step
petStep: {
  options: ['cat', 'dog', 'none']  // Must match!
}
```

**Inline Solution**: Only define in step
```typescript
petStep: {
  options: [
    { value: 'cat', prompt: '...' },
    { value: 'dog', prompt: '...' }
  ]
}
```

**Hybrid Alternative** (keep presets):
- Auto-suggest preset variables based on experience steps
- Or: Auto-create bindings when names match
- Or: Preset "imports" step options dynamically

**Analysis**: Pain is real, but fixable without full refactor

---

#### Pain Point 2: Fragile Coupling

**Current Problem**: Preset changes break experiences

**Root Cause**: Separate lifecycle management

**Inline Solution**: Co-located = easier to see impact

**But Consider**:
- **Shared Presets**: If 5 experiences use one preset, inline means:
  - 5x duplication of prompt/media/mappings
  - Change prompt = update 5 experiences manually
  - No consistency guarantee

- **Versioning**: Separate presets can have version history
  - Experience locks to preset v2
  - Admin can update preset to v3 without breaking experience
  - Inline has no version concept

**Hybrid Alternative**:
- Preset versioning/locking
- Usage tracking ("3 experiences use this preset")
- Migration tools ("update all experiences to new preset version")

**Analysis**: Inline trades fragility for duplication; both have costs

---

#### Pain Point 3: Cognitive Overhead

**Current**: 3 concepts (presets, steps, bindings)
**Proposed**: 2 concepts (steps, transform)

**But Consider**:
- **Current Mental Model**:
  - Preset = "AI prompt template" (familiar concept)
  - Experience = "User journey" (familiar concept)
  - Binding = "Connect them" (clear purpose)

- **Proposed Mental Model**:
  - Steps = "User inputs + AI prompt fragments" (conflated)
  - Transform = "AI generation with step refs" (still mapping)

**Question**: Is removing bindings worth conflating steps with AI logic?

**Analysis**: Simpler ≠ better if it hides important distinctions

---

#### Pain Point 4: Extra Mapping Step

**Current**: Explicit mapping UI
**Proposed**: Implicit (reference by step name)

**Trade-off**:
- **Explicit**: More clicks, but clear intent
- **Implicit**: Fewer clicks, but "magic" behavior

**Hybrid Alternative**:
- Auto-bind when names match (with confirmation)
- "Import step options" button in preset editor
- Visual flow diagram showing preset → step connections

**Analysis**: Mapping step can be streamlined without removing abstractions

---

### 4. Strategic Considerations

#### Multi-Experience Scenarios

**Scenario**: Brand has 3 events, all use same "Hobbit Portrait" style

**Current (Presets)**:
1. Create one "Hobbit Portrait" preset
2. Use in all 3 experiences
3. Update preset → all experiences get new style

**Proposed (Inline)**:
1. Create first experience with inline config
2. Copy/paste config to 2nd experience
3. Copy/paste config to 3rd experience
4. Update style → must update 3 times manually

**Impact**: At scale, inline approach doesn't scale

---

#### Template/Starter Experiences

**Scenario**: Clementine wants to offer starter templates

**Current (Presets)**:
- Ship with preset library (e.g., "Portrait Styles", "Location Overlays")
- User clones experience → preset connection intact
- Preset updates → user gets improvements

**Proposed (Inline)**:
- Inline config in template
- User clones → config is duplicated
- Template updates → user must manually merge

**Impact**: Harder to maintain quality templates

---

#### Multi-Node Pipelines (Future)

**Scenario**: Pipeline with 2 AI nodes
- Node 1: Generate portrait (uses `@style`, `@mood`)
- Node 2: Add frame overlay (uses `@frame_type`)

**Current (Presets)**:
- Preset A: Portrait generation
- Preset B: Frame overlay
- Each has isolated variables, no conflict

**Proposed (Inline)**:
- Both nodes reference same steps
- Must carefully name to avoid confusion
- Or: Namespacing (`node1.style` vs `node2.style`)

**Impact**: Inline doesn't simplify multi-node case

---

#### Testing & QA Workflow

**Current (Presets)**:
- Admin tests preset in isolation
- Confirms prompt works before connecting to experience
- Preview panel shows exactly what LLM will receive

**Proposed (Inline)**:
- Must create or edit experience to test AI prompt
- Cannot test "just the AI part" separately
- Preview requires full experience context

**Impact**: Harder to iterate on prompts quickly

---

## Alternative Solutions (Hybrid Approaches)

### Option A: Smart Auto-Binding

**Keep presets, reduce mapping friction**:
1. When adding AI node to pipeline, auto-suggest bindings:
   - If preset has `@pet` and experience has `petStep` → auto-bind
   - If preset has `@background` and experience has `bgStep` → auto-bind
2. Validation shows which variables need binding
3. One-click "Auto-bind matching names"

**Benefits**: Keeps separation, removes friction
**Cost**: 1-2 days implementation

---

### Option B: Preset "Templates" with Import

**Let presets learn from experiences**:
1. Preset has variable `@pet` with no valueMap
2. In pipeline editor, "Import step options" button
3. Copies `petStep.options` into preset valueMap
4. User can then customize prompt fragments

**Benefits**: Reduces duplication, maintains separation
**Cost**: 2-3 days implementation

---

### Option C: Preset Versioning & Locking

**Address fragility concern directly**:
1. Experiences lock to specific preset version
2. Preset updates create new version
3. Experience admin chooses when to upgrade
4. Migration preview shows changes

**Benefits**: Safe evolution, no breakage
**Cost**: 1 week implementation

---

### Option D: Hybrid Model

**Best of both worlds**:
1. **Default**: Inline AI config (simple experiences)
2. **Advanced**: Extract to workspace preset (reusability)
3. "Extract to Preset" button in AI node editor
4. "Embed Preset" button to inline a preset copy

**Benefits**: Progressive disclosure, flexibility
**Cost**: 2-3 weeks implementation (both systems)

---

## Risk Assessment

### Current Architecture Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Preset changes break experiences | Medium | High | Versioning/locking (Option C) |
| Users confused by mapping | Medium | Medium | Auto-binding (Option A) |
| Redundant value definitions | High | Low | Import feature (Option B) |
| Context switching overhead | Low | Medium | Better navigation/preview |

### Proposed Architecture Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cannot reuse AI configs | High | High | Manual copy/paste |
| Duplication at scale | High | High | Template system |
| Schema complexity | High | Medium | Careful design |
| Migration bugs | Medium | High | Phased rollout |
| Loss of isolated testing | High | Medium | New test harness |
| 2-3 week refactor delay | High | High | None (sunk cost) |

---

## Final Recommendation

### Recommendation: **Enhance Current Architecture** (Hybrid Option A + B)

#### Rationale

The pain points identified are **real and valid**, but they are **workflow friction**, not fundamental architectural flaws. The proposed inline approach trades:
- ✅ Short-term simplicity
- ❌ Long-term maintainability
- ❌ Reusability
- ❌ Testability

At Clementine's scale (multi-experience, multi-workspace), **reusability and consistency** are more valuable than **initial setup simplicity**.

#### Recommended Solution

**Phase 4.5: UX Enhancements** (1-2 weeks)

1. **Smart Auto-Binding** (Option A):
   - Auto-suggest variable bindings based on name matching
   - "Auto-bind all" button for quick setup
   - Visual indicators for bound/unbound variables

2. **Import Step Options** (Option B):
   - Button in preset editor: "Import from Experience Step"
   - Copies step options into preset valueMap
   - User customizes prompt fragments

3. **Improved Preset Picker**:
   - Show preset variables inline during selection
   - Preview how preset will integrate with current steps
   - Usage count ("Used in 3 experiences")

4. **Better Error Messages**:
   - "Preset requires @pet but experience has no matching step"
   - Suggest creating step or changing binding
   - Validation before publish

5. **Navigation Streamlining**:
   - "Edit Preset" link from transform pipeline
   - Breadcrumb trail showing preset → experience connection
   - Split-screen preview option

**Phase 5-6: Continue as Planned**
- Test generation (Phase 5)
- Pipeline integration with enhanced binding UX (Phase 6)

**Future: Versioning** (Phase 7+)
- Implement Option C (preset versioning)
- Experience locks to preset version
- Migration preview for updates

---

### Why Not Inline Approach?

1. **Sunk Cost**: 4 phases complete, working system (but this alone isn't decisive)

2. **Strategic Value**:
   - Multi-experience reusability is core to platform value
   - Template marketplace requires preset abstraction
   - Quality at scale needs consistency mechanisms

3. **Technical Debt**:
   - Inline means 2-3 weeks refactor for parity
   - Schema migrations are risky
   - Would need to rebuild resolution/validation

4. **UX Trade-offs**:
   - Inline simplifies initial setup (1 experience)
   - Presets simplify maintenance (N experiences)
   - Platform bias: optimize for scale, not one-offs

5. **Future-Proofing**:
   - Multi-node pipelines need preset-like abstraction
   - Versioning is easier with separate entities
   - Workspace-level preset library is a feature, not a bug

---

### Alternative Path (If Strong Preference for Inline)

If stakeholders still prefer inline after this analysis:

**Recommended Approach**: Implement Option D (Hybrid Model)

1. Build inline AI config first (simpler default)
2. Add "Extract to Preset" for reusability
3. Support both patterns (inline + preset reference)
4. Let usage data guide which is primary

**Timeline**: 3-4 weeks to achieve parity + new inline system
**Risk**: Higher complexity, two code paths to maintain

---

## Decision Framework

**Choose Current (Enhanced)** if:
- You expect users to create 5+ experiences per workspace
- Template marketplace is important
- Consistency across experiences is valued
- 1-2 week enhancement timeline is acceptable

**Choose Inline (Hybrid)** if:
- Most users will create 1-2 experiences max
- Setup simplicity is paramount
- Willing to invest 3-4 weeks for refactor
- Reusability can be manual (copy/paste)

**Choose Full Inline (Refactor)** if:
- Philosophically opposed to separate abstractions
- Willing to accept reusability limitations
- 2-3 weeks refactor + risk is acceptable
- Planning major template system rework anyway

---

## Conclusion (Updated 2026-01-29)

After further analysis and stakeholder discussion, the original recommendation has been revised.

### Initial Assessment (Flawed)

The original analysis assumed presets provided reusability at the AI configuration level across multiple experiences. However, this misunderstood the actual **document hierarchy**:

**Assumed (Incorrect)**:
```
10 Events → 10 Experiences → 1 AI Preset
```

**Actual (Correct)**:
```
10 Events → 1 Experience (with AI config)
```

**Key Insight**: Reusability happens at the **Experience level**, not the AI Preset level. Whether AI config is in a preset or inline in the experience doesn't change reusability for events using that experience.

### Critical Use Case Identified

**Real-world scenario**:
```
Hobbitify Experience v1:
  Steps: pet (cat, dog, chicken)
  Prompt: "Transform @photo into hobbit @pet in @background"
  Model: gemini-2.5-pro

Hobbitify Experience v2:
  Steps: pet (goat, sheep, rabbit)
  Prompt: "Transform @photo into hobbit @pet in @background"  // SAME
  Model: gemini-2.5-flash  // DIFFERENT
```

**Requirements**:
- Same prompt pattern across different experiences
- Different model/settings per experience
- Different step configurations per experience
- Easy prompt iteration and testing
- Prompt engineering as first-class concern

**Neither pure approach solves this**:
- Pure Presets: Can't easily vary model per experience, fragile coupling
- Pure Inline: Must copy/paste, no pattern sharing, duplicate prompt maintenance

### Revised Recommendation: Inline + Prompt Template Library

**Architecture**:
1. **Primary**: Inline AI configuration in Experience transform pipeline
2. **Supporting**: Workspace-level Prompt Template Library (optional, copy-based)

**Key Principle**: **Copy, Don't Reference**
- Templates provide starting points (like Tailwind components)
- Copy into experience
- Customize freely (model, steps, media)
- No live binding, no fragility
- Can sync updates when desired

**Benefits**:
- ✅ Simpler workflow (no mapping layer)
- ✅ Model flexibility per experience
- ✅ Prompt pattern reusability (via templates)
- ✅ Prompt engineering workspace (template library)
- ✅ No fragile coupling (copy model)
- ✅ Marketplace ready (experiences are complete units)
- ✅ Progressive disclosure (simple inline, advanced templates)

**Timeline**:
- Phase 1: Inline AI config with testing (2-3 weeks)
- Phase 2: Prompt template library (1-2 weeks)
- Total: 3-5 weeks

**See**: `/requirements/ai-presets/inline-prompt-architecture.md` for detailed architecture specification.

### Why This Decision

**Context**:
- Pre-launch (no customer migration concerns)
- Template marketplace will sell complete experiences (90% confidence)
- Both shared and unique prompt patterns expected
- Prompt engineering is high priority
- Same person will likely do prompt + experience design

**Key Validation Points**:
1. ✅ Reusability happens at experience level (presets don't add value here)
2. ✅ Need to share prompt patterns while varying models/steps
3. ✅ Prompt iteration/testing is critical
4. ✅ Existing code (Lexical, resolution, validation) is reusable (~60%)
5. ✅ Pre-launch allows schema evolution without migration pain

**Decision**: Proceed with inline + template library architecture.

---

## Next Steps

1. ✅ Review and approve inline + template architecture
2. Implement Phase 1: Inline AI config (2-3 weeks)
   - Enhance step schemas with prompt/media fields
   - Create AI Image Node inline config
   - Build AI node editor with Lexical (adapt to step mentions)
   - Build test run dialog with preview
   - Migrate existing test experiences
3. Implement Phase 2: Prompt template library (1-2 weeks)
   - Create template schema and CRUD
   - Build template library page
   - Add "New from Template" / "Save as Template" flows
   - Template preview/test workspace
4. Deprecate AI Presets domain (optional cleanup)
   - Keep Lexical infrastructure (reused)
   - Archive preset schemas
   - Update documentation
