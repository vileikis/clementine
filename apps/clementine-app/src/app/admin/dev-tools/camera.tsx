import { createFileRoute } from '@tanstack/react-router'
import { CameraDevTools } from '@/domains/dev-tools/camera'

/**
 * Route: /admin/dev-tools/camera
 *
 * Interactive camera module testing interface with prop controls,
 * mobile preview, and callback logging.
 */
export const Route = createFileRoute('/admin/dev-tools/camera')({
  component: CameraDevTools,
})
