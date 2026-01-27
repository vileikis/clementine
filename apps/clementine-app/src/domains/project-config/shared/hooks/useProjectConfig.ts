/**
 * useProjectConfig Hook
 *
 * Convenience re-export of useProject from the project domain.
 * Project config now lives directly on the project document.
 *
 * Note: This is provided for migration convenience. New code should
 * import useProject directly from @/domains/project/shared.
 *
 * @example
 * ```tsx
 * // Preferred: Import directly from project domain
 * import { useProject } from '@/domains/project/shared'
 * const { data: project } = useProject(projectId)
 * const theme = project?.draftConfig?.theme
 *
 * // Migration: This alias also works
 * import { useProjectConfig } from '@/domains/project-config/shared'
 * const { data: project } = useProjectConfig(projectId)
 * ```
 */
export { useProject as useProjectConfig } from '@/domains/project/shared/hooks/useProject'
