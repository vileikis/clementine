// Barrel export for all project components

// Project Details Header (top-level component)
export { ProjectDetailsHeader } from "./ProjectDetailsHeader";

// Rename Project Dialog
export { RenameProjectDialog } from "./RenameProjectDialog";

// Project Page Layout (shared layout for project sub-pages)
export { ProjectPageLayout } from "./ProjectPageLayout";

// Create Project Button (quick-create with default name)
export { CreateProjectButton } from "./CreateProjectButton";

// Project List (grid with empty state)
export { ProjectList } from "./ProjectList";

// Empty Projects (empty state component)
export { EmptyProjects } from "./EmptyProjects";

// Studio Components (Project list & management)
export * from "./studio";

// Designer Components (Project builder UI)
export * from "./designer";

// Shared Components (Used across studio & designer)
export * from "./shared";
