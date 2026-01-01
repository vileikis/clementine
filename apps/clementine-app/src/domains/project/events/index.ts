// Barrel export for project events domain
// Public API: components, hooks, types only (no schemas or internal implementation)

// Components
export * from './components/ProjectEventsList'
export * from './components/ProjectEventItem'
export * from './components/CreateProjectEventButton'
export * from './components/DeleteProjectEventDialog'
export * from './components/RenameProjectEventDialog'

// Containers
export * from './containers/ProjectEventsPage'

// Hooks
export * from './hooks/useProjectEvents'
export * from './hooks/useCreateProjectEvent'
export * from './hooks/useRenameProjectEvent'
export * from './hooks/useDeleteProjectEvent'
export * from './hooks/useActivateProjectEvent'

// Types
export * from './types/project-event.types'
