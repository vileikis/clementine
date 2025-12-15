# Feature Specification: Monorepo Foundation

**Feature Branch**: `027-monorepo-foundation`
**Created**: 2025-12-15
**Status**: Draft
**Input**: User description: "Stage 0: Monorepo Foundation - Establish shared packages and deployment infrastructure before any business logic"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Imports Shared Types (Priority: P1)

A developer working on the web application or Firebase functions needs to use common type definitions (Session, Experience, Event) without duplicating code. They import types from a shared package that is available in both workspaces.

**Why this priority**: Type sharing is the core value proposition of the monorepo structure. Without this, both workspaces would maintain duplicate type definitions, leading to drift and bugs.

**Independent Test**: Can be tested by importing a type (e.g., `Session`) in both the web app and functions, and verifying TypeScript compilation succeeds with consistent type checking.

**Acceptance Scenarios**:

1. **Given** a developer in the web workspace, **When** they import `Session` from `@clementine/shared`, **Then** TypeScript recognizes the type and provides autocomplete/type checking
2. **Given** a developer in the functions workspace, **When** they import `Session` from `@clementine/shared`, **Then** TypeScript recognizes the same type definition as in the web workspace
3. **Given** a type change in the shared package, **When** the shared package is rebuilt, **Then** both web and functions workspaces see the updated type

---

### User Story 2 - Developer Deploys Functions (Priority: P2)

A developer needs to deploy Firebase Cloud Functions to production. They run a single deploy script that builds all dependencies in the correct order and deploys to Firebase.

**Why this priority**: Deployment capability is essential for the functions to provide value, but comes after type sharing since functions are useless without shared type definitions.

**Independent Test**: Can be tested by running the deploy script and verifying that the function endpoint responds correctly.

**Acceptance Scenarios**:

1. **Given** a developer with valid Firebase credentials, **When** they run the deploy script, **Then** the shared package builds first, then functions build, then deployment occurs
2. **Given** a successful deployment, **When** they access the function URL, **Then** they receive a valid JSON response confirming the function is operational
3. **Given** an error in the shared package build, **When** they run the deploy script, **Then** the script stops and reports the error before attempting to deploy

---

### User Story 3 - Developer Runs Local Development (Priority: P3)

A developer wants to test functions locally using Firebase emulators before deploying to production. They can run emulators with hot-reload capability.

**Why this priority**: Local development improves developer experience but is not strictly required for MVP delivery. Developers can deploy directly to test.

**Independent Test**: Can be tested by starting the emulator, making a request to the local function endpoint, and verifying the response.

**Acceptance Scenarios**:

1. **Given** a developer with Firebase CLI installed, **When** they run the serve command, **Then** the functions emulator starts and serves the function locally
2. **Given** the emulator is running, **When** they make a request to the local endpoint, **Then** they receive the expected JSON response

---

### Edge Cases

- What happens when pnpm install fails due to workspace resolution errors?
- How does the system handle mismatched TypeScript versions between workspaces?
- What happens when Firebase credentials are missing or invalid during deployment?
- How does the system handle a build failure in the shared package during deployment?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a pnpm workspace configuration that includes web, functions, and packages/* directories
- **FR-002**: System MUST provide a shared types package (`@clementine/shared`) that can be imported from both web and functions workspaces
- **FR-003**: Shared package MUST export type definitions for Session, InputAsset, ProcessingState, ProcessingError, and SessionOutputs
- **FR-004**: Functions package MUST be able to import and use types from the shared package without type errors
- **FR-005**: System MUST provide a deploy script that builds dependencies in correct order (shared → functions → deploy)
- **FR-006**: System MUST provide a hello world function that returns JSON confirming operational status and shared types integration
- **FR-007**: Deploy script MUST fail fast if any build step fails, preventing partial deployments
- **FR-008**: Functions package MUST integrate with Firebase Functions v2 HTTP triggers
- **FR-009**: System MUST provide local development capability via Firebase emulators

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Not applicable - this feature establishes backend/build infrastructure with no user-facing UI

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All shared types MUST be defined with strict TypeScript (no `any` types)
- **TSR-002**: TypeScript strict mode MUST be enabled in all workspace tsconfig.json files
- **TSR-003**: Shared types MUST include appropriate optional markers (`?`) and union types for nullable fields

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Functions MUST use Firebase Functions v2 SDK (`firebase-functions/v2/https`)
- **FAR-002**: Firebase Admin SDK MUST be available for future Firestore operations
- **FAR-003**: Firebase configuration MUST specify the functions source directory and build predeploy hook
- **FAR-004**: Functions MUST be deployed to the existing Firebase project (configured in .firebaserc)

### Key Entities *(include if feature involves data)*

- **Session**: Represents a guest's photo capture session, linking inputs to outputs with processing state tracking
- **InputAsset**: Represents a single input file (image or video) with its URL, type, and order
- **ProcessingState**: Tracks the current state of media processing including step, attempts, and errors
- **ProcessingError**: Captures error details including message, code, step, and retryability
- **SessionOutputs**: Represents the final processed media with URL, format, dimensions, and timing

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `pnpm install` from the repository root completes successfully without errors
- **SC-002**: Importing `Session` type in both web and functions workspaces compiles without TypeScript errors
- **SC-003**: The deploy script completes in under 5 minutes on a standard connection
- **SC-004**: The deployed hello world function returns valid JSON within 2 seconds of request
- **SC-005**: Local emulator starts and responds to requests within 30 seconds of command execution

## Assumptions

- Firebase project is already created and configured in .firebaserc
- Firebase CLI is installed and authenticated for deployment
- pnpm is the package manager (v8+)
- TypeScript 5.x is used across all workspaces
- Node.js 18+ is available (Firebase Functions Gen 2 requirement)

## Out of Scope

- Business logic for media processing (covered in subsequent stages)
- Firestore database setup and security rules
- Authentication and authorization
- CI/CD pipeline configuration
- Environment variable management for different environments
