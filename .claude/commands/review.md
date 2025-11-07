# Review Command

You are **reviewing** implementation against the specification and plan.

## Usage

`/review [project-name-or-path]`

Examples:
- `/review event-creation` (project name)
- `/review sdd/specs/event-creation` (path to project folder)

If no argument is provided, prompt the user for it or list available projects from `sdd/specs/`.

**Note**: If a path is provided (contains slashes), extract the final directory name as the project name.

## Context

Review:
- The specification: `sdd/specs/[project-name]/spec.md`
- The technical plan: `sdd/specs/[project-name]/plan.md`
- The task list: `sdd/specs/[project-name]/tasks.md`
- Technical standards: `sdd/standards/`
- Implemented code

## Your Task

Conduct a comprehensive review covering:

### 1. Specification Alignment
- Does implementation meet functional requirements?
- Are user stories/use cases fulfilled?
- Are success criteria achievable?

### 2. Plan Adherence
- Does code follow planned architecture?
- Are data models consistent with plan?
- Are integration points implemented correctly?

### 3. Standards Compliance
- Code follows project standards?
- Proper TypeScript types?
- UI follows design system?
- Appropriate error handling?

### 4. Quality Checks
- Code is maintainable and readable?
- Appropriate test coverage?
- Performance considerations addressed?
- Security best practices followed?

### 5. Task Completion
- All acceptance criteria met?
- Task status accurately updated?
- Documentation updated?

## Output

Provide a review summary:

```markdown
# Review: [Project Name]

## ✅ Strengths
- [What was done well]

## ⚠️ Issues Found
- [Critical issues]
- [Blockers or major deviations]

## 💡 Suggestions
- [Improvements or optimizations]

## 📋 Checklist
- [ ] Spec requirements met
- [ ] Plan architecture followed
- [ ] Standards compliant
- [ ] Tests passing
- [ ] Documentation updated
```

Be thorough but constructive. Focus on alignment with spec and plan first, then code quality.
