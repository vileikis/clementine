/**
 * Project Repository
 *
 * CRUD operations for Project documents in Firestore.
 * Path: /projects/{projectId}
 */
import { db } from '../infra/firebase-admin'
import {
  projectSchema,
  type Project,
  type AspectRatio,
  type MediaReference,
  type OverlaysConfig,
  type MainExperienceReference,
} from '@clementine/shared'
import { convertFirestoreDoc } from '../utils/firestore-utils'

/**
 * Get the Firestore reference for a project document
 */
function getProjectRef(projectId: string) {
  return db.collection('projects').doc(projectId)
}

/**
 * Fetch a project document from Firestore
 *
 * @param projectId - Project document ID
 * @returns Parsed project or null if not found
 */
export async function fetchProject(projectId: string): Promise<Project | null> {
  const doc = await getProjectRef(projectId).get()

  if (!doc.exists) {
    return null
  }

  return convertFirestoreDoc(doc, projectSchema)
}

/**
 * Pick the overlay to apply for a job
 *
 * Resolution priority:
 * 1. Experience flag: If applyOverlay is false, no overlay
 * 2. Exact match: overlays[aspectRatio] if configured
 * 3. Default fallback: overlays['default'] if configured
 * 4. No overlay: null if nothing found
 *
 * @param project - Project document (or null)
 * @param configSource - Which config to use ('draft' or 'published')
 * @param experienceId - Experience ID to find applyOverlay setting
 * @param aspectRatio - Target aspect ratio from outcome config
 * @returns Resolved overlay reference or null
 */
export function pickOverlay(
  project: Project | null,
  configSource: 'draft' | 'published',
  experienceId: string,
  aspectRatio: AspectRatio,
): MediaReference | null {
  if (!project) return null

  const config = configSource === 'published'
    ? project.publishedConfig
    : project.draftConfig

  const overlays = config?.overlays
  const applyOverlay = findApplyOverlay(config?.experiences, experienceId)

  return resolveOverlay(overlays, applyOverlay, aspectRatio)
}

/**
 * Find applyOverlay setting for an experience in project config
 */
function findApplyOverlay(
  experiences: { main?: MainExperienceReference[] } | null | undefined,
  experienceId: string,
): boolean {
  if (!experiences?.main) return true // default to true

  const ref = experiences.main.find((exp) => exp.experienceId === experienceId)
  return ref?.applyOverlay ?? true
}

/**
 * Resolve overlay based on aspect ratio with fallback logic
 */
function resolveOverlay(
  overlays: OverlaysConfig | null | undefined,
  applyOverlay: boolean,
  aspectRatio: AspectRatio,
): MediaReference | null {
  if (!applyOverlay) return null
  if (!overlays) return null

  // Try exact aspect ratio match, then fall back to default
  return overlays[aspectRatio] ?? overlays['default'] ?? null
}
