# Tasks Command

You are breaking down a technical plan into **concrete, actionable tasks**.

## Usage

`/tasks [project-name-or-path]`

Examples:
- `/tasks event-creation` (project name)
- `/tasks sdd/specs/event-creation` (path to project folder)

If no argument is provided, prompt the user for it or list available projects from `sdd/specs/`.

**Note**: If a path is provided (contains slashes), extract the final directory name as the project name.

## Context

Review:
- The specification: `sdd/specs/[project-name]/spec.md`
- The technical plan: `sdd/specs/[project-name]/plan.md`
- **Technical standards** in `sdd/standards/` - See [Standards README](../standards/README.md) for available standards

**IMPORTANT**: Always check `sdd/standards/README.md` for relevant standards. Follow established patterns for task breakdown, naming, and organization.

## Your Task

Create a task list that:

1. **Breaks down** the plan into small, testable units
2. **Orders tasks** by dependencies (what must be done first)
3. **Estimates complexity** (S/M/L or hours)
4. **Defines acceptance criteria** for each task

## Task Properties

Each task should:
- Be completable in 1-4 hours
- Have clear acceptance criteria
- Be independently testable
- Have explicit dependencies

## Output

Create `sdd/specs/[project-name]/tasks.md` with format:

```markdown
# Tasks for [Project Name]

## Phase 1: [Phase Name]

### Task 1.1: [Task Title]
- **Complexity**: S/M/L
- **Dependencies**: None / Task X.Y
- **Description**: What to build
- **Acceptance Criteria**:
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Files**: List files to create/modify

[Continue for all tasks...]
```

Group related tasks into phases and number them for easy reference.
