<!--
  SYNC IMPACT REPORT

  Version Change: 1.0.0 → 1.1.0 (MINOR - Material expansion of Principle V)

  Modified Principles:
  - Principle V: Validation Gates
    - OLD: Technical validation only (format, lint, type-check)
    - NEW: Technical validation + Standards compliance review
    - Added mandatory standards compliance check before marking features complete
    - Expanded validation loop to include standards verification

  Added Sections:
  - Standards Compliance Review subsection in Principle V
  - Reference to design-system.md and other standards for compliance enforcement
  - Explicit requirement to review code against applicable standards before commit

  Removed Sections:
  - None

  Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section already references gates (no change needed)
  ✅ spec-template.md - Already references standards (no change needed)
  ✅ tasks-template.md - Already includes validation tasks (no change needed)

  Follow-up TODOs:
  - None (all templates already align with expanded validation gates)

  Amendment Rationale:
  - Added standards compliance gate to Principle V (Validation Gates)
  - Ensures code is reviewed against /standards/ directory before completion
  - Particularly important for new design-system.md strict compliance rules
  - Prevents standards violations from reaching code review or production
  - Maintains backward compatibility (existing validation gates still required)
-->

# Clementine Constitution

## Core Principles

### I. Mobile-First Design

All features MUST be designed and implemented with mobile devices as the primary target.

- Primary viewport: 320px-768px (mobile and tablet)
- Minimum touch target size: 44x44px for all interactive elements
- Test on real mobile devices before considering a feature complete
- Performance targets: page load < 2 seconds on 4G networks, AI transformation < 60 seconds

**Rationale**: Clementine is a digital photobooth platform where guests interact primarily via mobile devices at events. Desktop usage is secondary (creator dashboard). Mobile-first ensures the core guest experience is exceptional.

### II. Clean Code & Simplicity

Code MUST prioritize clarity, maintainability, and simplicity over premature optimization or abstraction.

- YAGNI (You Aren't Gonna Need It): implement only what is needed now
- Single Responsibility Principle: each function/component does one thing well
- Small, focused functions: ~30 lines maximum before considering refactoring
- Remove dead code immediately (no commented-out code - use git history)
- DRY (Don't Repeat Yourself): extract common logic only when duplication becomes problematic

**Rationale**: Simple code is easier to understand, debug, and extend. Clementine is an early-stage product where requirements will evolve rapidly. Clean, simple code enables fast iteration without accumulating technical debt.

### III. Type-Safe Development

TypeScript strict mode is NON-NEGOTIABLE. All code MUST be fully typed without `any` escapes.

- TypeScript strict mode enabled (all strict checks enforced)
- No implicit `any` - explicitly define all types
- Strict null checks - handle `null` and `undefined` explicitly
- Runtime validation with Zod for all external inputs (API requests, form submissions, file uploads)
- Server-side validation REQUIRED - client-side validation optional (UX only)

**Rationale**: Type safety catches bugs at compile time, improves developer experience, and serves as living documentation. Runtime validation with Zod ensures type safety extends to external data sources, preventing runtime errors from malicious or malformed input.

**Reference**: See `standards/global/zod-validation.md` for validation patterns.

### IV. Minimal Testing Strategy

Testing is pragmatic and focused on value - write minimal tests during development, comprehensive tests only for critical paths.

- Jest unit tests only (no E2E in current scope)
- Test behavior, not implementation details
- Focus on critical user flows: event creation, photo upload, AI generation
- Coverage goals: 70%+ overall, 90%+ for critical paths

**Rationale**: Comprehensive test suites slow down early-stage iteration. Focus testing effort on high-value areas (critical user flows) rather than chasing 100% coverage. As the product matures, expand test coverage strategically.

**Reference**: See `standards/testing/testing.md` for testing guidelines.

### V. Validation Gates

Before marking any feature complete or committing code, MUST run validation loop to ensure code quality, correctness, and standards compliance.

#### Technical Validation (Automated)

- **Before every commit**: Run format, lint, type-check
- **Auto-fix command**: `pnpm app:check` (applies lint and format fixes automatically)
- **Validation loop**: Ensure all checks pass before marking complete
- **Breaking changes**: Verify in local dev server (`pnpm dev`) before committing
- Commit only after validation loop passes cleanly

#### Standards Compliance Review (Manual)

**Before marking feature complete**, MUST review code against applicable standards:

1. **Identify applicable standards** from `/standards/` directory based on your changes:
   - **UI/Frontend work** → Review `frontend/design-system.md` + `frontend/component-libraries.md`
   - **Data/Backend work** → Review `backend/firestore.md` + `backend/firestore-security.md`
   - **New features** → Review `global/project-structure.md` + domain-specific standards
   - **All changes** → Review `global/code-quality.md` + `global/security.md`

2. **Verify compliance** with each applicable standard:
   - Design System: No hard-coded colors? Using theme tokens? Paired background/foreground?
   - Component Libraries: Using shadcn/ui? Extending properly? Accessibility preserved?
   - Project Structure: Following vertical slice architecture? Correct file naming?
   - Code Quality: Clean, simple, well-named? No dead code?
   - Security: Input validated? No XSS/injection vulnerabilities?

3. **Document deviations** (if any):
   - If you MUST deviate from a standard, document why in code comments or PR description
   - Get approval for standard deviations before merging

**Rationale**: Validation gates catch issues early before they reach code review or production. Technical validation ensures basic quality (linting, types). Standards compliance ensures architectural consistency, design system adherence, and security best practices. Together, they prevent broken main branch states and maintain codebase quality.

**Reference**: See `standards/global/code-quality.md` for validation workflows and standards index.

### VI. Frontend Architecture

All frontend development MUST follow the client-first architectural pattern defined in standards.

- **Client-first pattern**: Use Firebase client SDKs for data operations by default (90% of code)
- **SSR strategy**: Server-side rendering ONLY for SEO/metadata and entry points (10% of code)
- **Security enforcement**: Enforce via Firestore/Storage rules, NOT server code
- **Real-time by default**: Leverage `onSnapshot` for collaborative features and live updates
- **TanStack Query integration**: Client-side data fetching with caching and state management

**Rationale**: Client-first architecture with Firebase enables real-time updates, reduces server complexity, and provides security through database rules. SSR is used strategically for SEO and initial page load performance, not as the primary data layer.

**Reference**: See `standards/frontend/architecture.md` for complete architectural guidance.

### VII. Backend & Firebase

All Firebase integration MUST follow security-first patterns with appropriate SDK usage.

- **Client SDK**: Use for reads and real-time subscriptions (`onSnapshot`)
- **Admin SDK**: Use ONLY for operations requiring elevated permissions (server functions)
- **Security rules**: Allow reads, deny writes - force all mutations through validated server code
- **Public URLs**: Store full public URLs (not relative paths) in Firestore for instant rendering

**Rationale**: The hybrid pattern provides real-time updates (Client SDK) while ensuring security and validation (Admin SDK when needed). Firestore security rules are the primary security boundary, not application code. Storing full public URLs eliminates latency from signed URL generation.

**Reference**: See `standards/backend/firestore.md` and `standards/backend/firestore-security.md` for Firebase patterns and security rules.

### VIII. Project Structure

All product features MUST follow the vertical slice architecture defined in standards.

- **Vertical slice architecture**: One feature = one domain (encapsulate components, hooks, actions, schemas, types)
- **Organized by technical concern**: Group files by purpose (`actions/`, `repositories/`, `schemas/`, `components/`)
- **Explicit file naming**: Use `[domain].[purpose].[ext]` pattern for instant recognition
- **Barrel exports**: Every folder MUST have an `index.ts` that re-exports its contents
- **Restricted public API**: Feature-level exports ONLY components, hooks, and types (NOT actions, schemas, or repositories)

**Rationale**: Vertical slice architecture keeps related code together, improving discoverability and maintainability. Each feature is self-contained and can be developed, tested, and modified independently. The restricted public API prevents server-only code from leaking into client bundles.

**Reference**: See `standards/global/project-structure.md` for feature module architecture.

## Standards Compliance

All development MUST adhere to standards defined in `/standards/` directory:

### Global Standards (Always Applicable)

- **Code Quality** (`global/code-quality.md`): Validation workflows, linting, formatting
- **Coding Style** (`global/coding-style.md`): Naming conventions, file organization
- **Project Structure** (`global/project-structure.md`): Feature modules, barrel exports
- **Zod Validation** (`global/zod-validation.md`): Type-safe runtime validation
- **Error Handling** (`global/error-handling.md`): Error boundaries, graceful degradation
- **Security** (`global/security.md`): Security best practices

### Frontend Standards (UI/UX Work)

- **Architecture** (`frontend/architecture.md`): Client-first pattern, SSR strategy
- **Design System** (`frontend/design-system.md`): Theme tokens, strict compliance rules
- **Component Libraries** (`frontend/component-libraries.md`): shadcn/ui patterns
- **Responsive Design** (`frontend/responsive.md`): Mobile-first breakpoints
- **Accessibility** (`frontend/accessibility.md`): WCAG AA compliance
- **State Management** (`frontend/state-management.md`): TanStack Query, Zustand
- **Performance** (`frontend/performance.md`): Performance budgets, optimization
- **Routing** (`frontend/routing.md`): TanStack Router patterns

### Backend Standards (API/Data Work)

- **Firestore** (`backend/firestore.md`): Firestore client/admin patterns
- **Firestore Security** (`backend/firestore-security.md`): Security rules
- **Firebase Functions** (`backend/firebase-functions.md`): Cloud Functions patterns

### Testing Standards

- **Testing** (`testing/testing.md`): Jest patterns, coverage goals, testing philosophy

**Enforcement**: All code reviews MUST verify adherence to applicable standards. Feature specifications MUST reference relevant standards before implementation begins. Validation gates (Principle V) MUST include standards compliance review.

## Governance

### Constitution Authority

This constitution supersedes all other development practices, conventions, and preferences. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

### Validation Enforcement

All pull requests MUST pass validation gates before merge:

1. **Technical Validation** (Automated):
   - **Format** → **Lint** → **Type-check** → **Test**
   - **Auto-fix command**: `pnpm app:check` for automated lint and format fixes
   - **No merge without clean validation**: All checks must pass
   - **Breaking changes**: Verify in local dev server before committing

2. **Standards Compliance** (Manual Review):
   - **Identify applicable standards** based on files changed
   - **Verify compliance** with each applicable standard
   - **Document deviations** if standard cannot be followed (with justification)
   - **No merge without standards review**: Code reviewers MUST verify compliance

### Standards Compliance Review

- All PRs MUST verify compliance with constitution principles
- Code reviewers MUST enforce standards and principles
- Features MUST reference applicable standards from `/standards/` directory before implementation
- Validation loop (technical + standards) MUST pass before merge
- Complexity violations MUST be explicitly justified in implementation plan

### Simplicity Justification

If a feature requires violating the "Clean Code & Simplicity" principle (Principle II), the implementation plan MUST include a "Complexity Tracking" section documenting:

- What principle/rule is being violated
- Why the complexity is needed for this specific use case
- What simpler alternatives were considered and why they were rejected

### Amendments

Constitution changes require:

1. **Documentation**: Clearly document the proposed change and rationale
2. **Impact analysis**: Identify affected templates, standards, and code
3. **Version bump**: Increment version according to semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
4. **Propagation**: Update all affected templates, standards, and documentation
5. **Sync Impact Report**: Document changes at top of constitution file (HTML comment)

**Version**: 1.1.0 | **Ratified**: 2025-12-26 | **Last Amended**: 2025-12-28
