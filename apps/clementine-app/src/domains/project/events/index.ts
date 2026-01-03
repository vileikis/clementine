// Barrel export for project events domain
// Public API: components, hooks, types only (no internal implementation details)

// Components
export * from './components/ProjectEventsList'
export * from './components/ProjectEventItem'
export * from './components/CreateProjectEventButton'

// Containers
export * from './containers/ProjectEventsPage'

// Hooks
export * from './hooks/useProjectEvents'
export * from './hooks/useCreateProjectEvent'

// Types (exported from schemas)
export type {
  ProjectEvent,
  ProjectEventStatus,
  CreateProjectEventInput,
  UpdateProjectEventInput,
  ActivateProjectEventInput,
  DeactivateProjectEventInput,
  DeleteProjectEventInput,
} from './schemas/project-event.schema'
