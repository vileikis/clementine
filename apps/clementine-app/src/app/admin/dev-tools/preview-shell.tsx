import { createFileRoute } from '@tanstack/react-router'
import { DevToolsPreviewShell } from '@/domains/dev-tools/preview-shell'

/**
 * Route: /admin/dev-tools/preview-shell
 *
 * Dev-tools testing interface for preview-shell module
 * Allows interactive testing of viewport switching, fullscreen, and state persistence
 */
export const Route = createFileRoute('/admin/dev-tools/preview-shell')({
  component: DevToolsPreviewShell,
})
