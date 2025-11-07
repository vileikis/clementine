# Plan Command

You are creating a **technical implementation plan** based on an existing specification.

## Usage

`/plan [project-name-or-path]`

Examples:
- `/plan event-creation` (project name)
- `/plan sdd/specs/event-creation` (path to project folder)

If no argument is provided, prompt the user for it or list available projects from `sdd/specs/`.

**Note**: If a path is provided (contains slashes), extract the final directory name as the project name.

## Context

Review:
- The project specification in `sdd/specs/[project-name]/spec.md`
- Technical standards in `sdd/standards/`
- Current codebase architecture (from CLAUDE.md)

## Your Task

Create a detailed technical plan that covers:

1. **Architecture**
   - Components/modules to build
   - Data models and schemas
   - API contracts
   - Integration points

2. **Technical Decisions**
   - Technology choices (justified)
   - Design patterns to use
   - Third-party libraries/services

3. **Implementation Strategy**
   - Development approach (phases, increments)
   - Testing strategy
   - Deployment considerations

4. **Risks & Mitigations**
   - Technical risks
   - Dependencies
   - Mitigation strategies

## Output

Create `sdd/specs/[project-name]/plan.md` with:
- Clear technical architecture
- Component breakdown
- Data models/schemas
- Implementation phases
- Testing approach

Ensure the plan adheres to project standards and is detailed enough for task breakdown.
