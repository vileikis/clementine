<!--
  SYNC IMPACT REPORT

  Version Change: 1.0.0 → 1.1.0

  Modified Principles:
  - Created VI. Firebase Architecture Standards

  Added Sections:
  - Core Principles section expanded (6 principles now)

  Removed Sections: N/A

  Templates Requiring Updates:
  ✅ plan-template.md - Added Firebase architecture checkpoint to Constitution Check section
  ✅ spec-template.md - Added Firebase Architecture Requirements section (FAR-001 through FAR-005)
  ✅ tasks-template.md - No changes needed (validation loop covers Firebase standards)

  Follow-up TODOs:
  - None (all templates updated)

  Previous Changes (1.0.0):
  - Created I. Mobile-First Responsive Design
  - Created II. Clean Code & Simplicity
  - Created III. Type-Safe Development
  - Created IV. Minimal Testing Strategy
  - Created V. Validation Loop Discipline
-->

# Clementine Constitution

## About Product

You can find all product vision and strategy info in (`./product.md`)

## Core Principles

### I. Mobile-First Responsive Design

All features MUST be designed and implemented with mobile devices as the primary target (320px - 768px viewport).

- Start every feature with mobile layout first, then enhance for tablet (768px+) and desktop (1024px+)
- Interactive elements MUST meet minimum touch target size of 44x44px
- Typography MUST maintain readability on mobile (minimum 14px for body text, 16px preferred)
- Test on real mobile devices before considering a feature complete
- Performance targets: page load < 2 seconds on 4G networks, AI transformation < 60 seconds

**Rationale**: Clementine is a digital photobooth platform where guests interact primarily via mobile devices at events. Desktop usage is secondary (creator dashboard). Mobile-first ensures the core guest experience is exceptional.

### II. Clean Code & Simplicity

Code MUST prioritize clarity, maintainability, and simplicity over premature optimization or abstraction.

- Follow YAGNI (You Aren't Gonna Need It) - implement only what is needed now
- Single Responsibility Principle - each function, component, and module does one thing well
- Meaningful names - variables, functions, and components self-document their purpose
- DRY (Don't Repeat Yourself) - extract common logic only when duplication becomes problematic
- Remove dead code immediately - no commented-out code (use git history)
- Prefer composition over configuration in React components (shadcn/ui style)
- Small, focused functions - if a function exceeds ~30 lines, consider refactoring

**Rationale**: Simple code is easier to understand, debug, and extend. Clementine is an early-stage product where requirements will evolve rapidly. Clean, simple code enables fast iteration without accumulating technical debt.

### III. Type-Safe Development

TypeScript strict mode is NON-NEGOTIABLE. All code MUST be fully typed without `any` escapes.

- Strict mode enabled: all TypeScript strict checks enforced
- No implicit `any` - explicitly define all types
- Strict null checks - handle `null` and `undefined` explicitly
- Prefer interfaces for object shapes, types for unions/intersections
- Runtime validation with Zod for all external inputs (API requests, form submissions, file uploads)
- Server-side validation is REQUIRED - client-side validation is optional (for UX only)

**Rationale**: Type safety catches bugs at compile time, improves code editor experience, and serves as living documentation. Runtime validation with Zod ensures type safety extends to external data sources, preventing runtime errors from malicious or malformed input.

### IV. Minimal Testing Strategy

Testing is pragmatic and focused on value - write minimal tests during development, comprehensive tests only for critical paths.

- **Unit tests with Jest ONLY** - no E2E tests (Playwright) in current scope
- Test behavior, not implementation details
- Focus on critical user flows: event creation, photo upload, AI generation
- Co-locate tests with source files (`Component.tsx` → `Component.test.tsx`)
- Coverage goals: 70%+ overall, 90%+ for critical paths
- Use React Testing Library for component tests (accessible queries: `getByRole`, `getByLabelText`)
- Mock external dependencies (Firebase, APIs) using Jest mocks
- Clear all mocks in `beforeEach()` to prevent test pollution

**Rationale**: Comprehensive test suites slow down early-stage iteration. Focus testing effort on high-value areas (critical user flows) rather than chasing 100% coverage. As the product matures, expand test coverage strategically.

### V. Validation Loop Discipline

Before marking any feature complete, MUST run validation loop to ensure code quality and correctness.

- Run `pnpm lint` and fix all errors/warnings
- Run `pnpm type-check` and resolve all TypeScript errors
- Run `pnpm test` and ensure all tests pass
- For breaking changes, verify in local dev server (`pnpm dev`)
- Commit only after validation loop passes cleanly

**Rationale**: Validation loop catches issues early before they reach code review or production. This discipline prevents broken main branch states and ensures every commit meets quality standards. Automated checks (CI) complement but don't replace local validation.

### VI. Firebase Architecture Standards

All Firebase integration MUST follow the hybrid Client SDK + Admin SDK pattern defined in `standards/backend/firebase.md`.

- **Backend (Server Actions, API Routes)**: ALWAYS use Admin SDK (`web/src/lib/firebase/admin.ts`) for all write operations, business logic, and privileged reads
- **Frontend (Client Components)**: ALWAYS use Client SDK (`web/src/lib/firebase/client.ts`) for real-time subscriptions (`onSnapshot`) and optimistic reads
- **Security Rules**: Allow reads, deny writes - all mutations MUST go through Server Actions using Admin SDK
- **Data Schemas**: All Zod schemas and validation logic MUST be located in `web/src/lib/schemas/` directory
- **Public Images**: ALWAYS store full public URLs (not relative paths) in Firestore for instant rendering without additional API calls

**Rationale**: The hybrid pattern provides real-time updates (Client SDK) while ensuring security and validation (Admin SDK). Centralizing schemas in one location makes validation logic discoverable and reusable. Storing full public URLs eliminates latency from signed URL generation and enables instant image rendering across client and server components.

## Technical Standards

All development MUST adhere to standards defined in `standards/`:

### Global Standards (Always Applicable)

- **Tech Stack** (`global/tech-stack.md`): Next.js 16, React 19, TypeScript strict mode, Tailwind CSS v4, shadcn/ui
- **Coding Style** (`global/coding-style.md`): Naming conventions (PascalCase components, camelCase functions, UPPER_SNAKE_CASE constants)
- **Conventions** (`global/conventions.md`): Git workflow, branch strategy, environment config, dependency management
- **Validation** (`global/validation.md`): Zod for type-safe validation, server-side validation required, client-side optional
- **Error Handling** (`global/error-handling.md`): Type-safe error handling, React error boundaries, graceful degradation
- **Commenting** (`global/commenting.md`): When to comment, JSDoc for public APIs, self-documenting code

### Frontend Standards (UI/UX Work)

- **CSS** (`frontend/css.md`): Tailwind CSS v4 utility classes, CSS variables for theming, mobile-first responsive design
- **Responsive Design** (`frontend/responsive.md`): Mobile-first (320px-768px primary), Tailwind breakpoints, touch-friendly design
- **Accessibility** (`frontend/accessibility.md`): WCAG AA compliance, semantic HTML, keyboard navigation, 4.5:1 color contrast
- **Components** (`frontend/components.md`): React component structure, composition over configuration, Server vs Client components

### Backend Standards (API/Data Work)

- **Firebase** (`backend/firebase.md`): Hybrid Client SDK + Admin SDK pattern, security rules (allow reads, deny writes), Server Actions for mutations
- **API** (`backend/api.md`): RESTful design, HTTP methods and status codes, authentication with Firebase, rate limiting

### Testing Standards

- **Test Writing** (`testing/test-writing.md`): Jest for unit tests, React Testing Library for components, minimal testing philosophy, co-located test files

**Enforcement**: All code reviews MUST verify adherence to applicable standards. Feature specifications MUST reference relevant standards before implementation begins.

## Development Workflow

### Spec-Driven Development

All features MUST follow the spec-driven development workflow defined in `CLAUDE.md`:

1. **Specify** (`/speckit.specify`): Create feature specification with user stories, requirements, success criteria
2. **Plan** (`/speckit.plan`): Generate technical implementation plan, architecture decisions, data models
3. **Tasks** (`/speckit.tasks`): Break down plan into actionable tasks organized by user story
4. **Implement** (`/speckit.implement`): Execute tasks systematically, mark complete after validation
5. **Review**: Verify implementation against spec and plan, ensure all acceptance criteria met

**Rationale**: Spec-driven development ensures features are well-understood before implementation begins, reducing rework and misalignment with product goals.

### Monorepo Structure

This is a pnpm workspace monorepo (`pnpm-workspace.yaml`):

- **`web/`**: Next.js 16 app (React 19, TypeScript, Tailwind CSS v4) - mobile-first guest experience and creator dashboard
- **`functions/`**: Firebase Cloud Functions (placeholder for future n8n/webhook integration)

All commands run from root directory: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test`

### Git Workflow

- Feature branches: `###-feature-name` format (e.g., `001-event-creation`)
- Commit messages: Clear, concise, imperative mood (e.g., "Add event creation form")
- Commits: Small, logical units - commit after each task or logical group
- No merge commits: Rebase or squash when merging to main
- Clean working directory: Commit or stash before switching branches

## Governance

### Constitution Authority

This constitution supersedes all other development practices, conventions, and preferences. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

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

### Compliance Review

- All pull requests MUST verify compliance with constitution principles
- Code reviewers MUST enforce standards and principles
- Features MUST reference applicable standards before implementation
- Validation loop (lint, type-check, test) MUST pass before merge
- Complexity violations MUST be explicitly justified in implementation plan

### Simplicity Justification

If a feature requires violating the "Clean Code & Simplicity" principle (e.g., introducing new abstraction layers, architectural patterns not yet in use), the implementation plan MUST include a "Complexity Tracking" section documenting:

- What principle/rule is being violated
- Why the complexity is needed for this specific use case
- What simpler alternatives were considered and why they were rejected

**Version**: 1.1.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-17
