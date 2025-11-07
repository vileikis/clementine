# Build Command

You are **implementing** tasks based on the spec, plan, and task breakdown.

## Usage

`/build [project-name] [task-id]`

Examples:
- `/build event-creation` - Show available tasks and prompt which to build
- `/build event-creation 1.1` - Build specific task 1.1

If no project name is provided, prompt the user or list available projects from `sdd/specs/`.

## Context

Review:
- The specification: `sdd/specs/[project-name]/spec.md`
- The technical plan: `sdd/specs/[project-name]/plan.md`
- The task list: `sdd/specs/[project-name]/tasks.md`
- Technical standards: `sdd/standards/`

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
3. Test against acceptance criteria
4. Update task status
5. Commit changes

Stay focused on the specific task - don't add scope or "improvements" unless explicitly in the acceptance criteria.
