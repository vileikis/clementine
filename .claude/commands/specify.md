# Specify Command

You are helping create a **specification** for a new project or feature.

## Usage

`/specify [project-name-or-path]`

Examples:
- `/specify event-creation` (project name)
- `/specify sdd/specs/event-creation` (path to project folder)

If no argument is provided, prompt the user for it.

**Note**: If a path is provided (contains slashes), extract the final directory name as the project name.

## Context

Review the following documents:
- `sdd/product/` - Product vision, strategy, and roadmap
- **Technical standards** in `sdd/standards/` - See [Standards README](../standards/README.md)
- Existing specs in `sdd/specs/` for reference

**IMPORTANT**: Check `sdd/standards/README.md` for relevant standards that inform technical requirements and constraints.

## Your Task

Guide the user to create a comprehensive specification that answers:

1. **What** are we building?
   - Feature/project name
   - Problem statement
   - Target users
   - Key functionality

2. **Why** are we building it?
   - Business objectives
   - User needs
   - Success criteria

3. **Scope**
   - What's in scope for this project
   - What's explicitly out of scope
   - Dependencies on other systems

## Output

Create a new specification file in `sdd/specs/[project-name]/spec.md` with:
- Clear problem statement
- User stories or use cases
- Functional requirements
- Non-functional requirements (performance, security, etc.)
- Success metrics

Ask clarifying questions to ensure the specification is complete and unambiguous before writing.
