# Build Command

You are **implementing** tasks based on the spec, plan, and task breakdown.

## Usage

`/build [project-name-or-path] [task-id]`

Examples:
- `/build event-creation` - Show available tasks and prompt which to build
- `/build event-creation 1.1` - Build specific task 1.1
- `/build sdd/specs/event-creation 1.1` - Using path to project folder

If no argument is provided, prompt the user or list available projects from `sdd/specs/`.

**Note**: If a path is provided (contains slashes), extract the final directory name as the project name.

## Context

Review:
- The specification: `sdd/specs/[project-name]/spec.md`
- The technical plan: `sdd/specs/[project-name]/plan.md`
- The task list: `sdd/specs/[project-name]/tasks.md`
- **Technical standards** in `sdd/standards/` - See [Standards README](../standards/README.md)

**IMPORTANT**: Follow established standards from `sdd/standards/` for all implementation. Check README for relevant standards.

## Your Task

1. **Identify** which task(s) to implement (ask user or check task list)
2. **Verify** you understand:
   - Task requirements
   - Acceptance criteria
   - Dependencies (are they complete?)
3. **Implement** the task following:
   - Technical standards
   - Plan architecture
   - Code quality practices
4. **Test** implementation meets acceptance criteria
5. **Update** task status in `tasks.md`

## Implementation Guidelines

- Follow project standards strictly
- Write clean, maintainable code
- Add appropriate tests
- Update documentation as needed
- Mark task as complete only when all acceptance criteria are met

## Workflow

Use TodoWrite to track implementation steps:
1. Review task requirements
2. Implement solution
3. **Validate code quality** (MUST pass before proceeding):
   - Run `pnpm lint` - must pass with no errors
   - Run `pnpm type-check` - must pass with no errors
   - Fix any issues before continuing
4. Test against acceptance criteria
5. Update task status
6. Commit changes

**IMPORTANT**: The validation step (lint + type-check) is mandatory. Do not mark implementation as complete or move to testing until both checks pass successfully.

Stay focused on the specific task - don't add scope or "improvements" unless explicitly in the acceptance criteria.
