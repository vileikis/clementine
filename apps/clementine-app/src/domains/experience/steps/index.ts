/**
 * Steps Domain
 *
 * Central module for step registry, renderers, and config panels.
 * Part of the Experience Designer (E2) epic.
 *
 * Note: Step schemas are now in @clementine/shared and re-exported
 * from domains/experience/shared/schemas.
 */

export * from './registry'
export * from './components'
export * from './defaults'
// Note: Renderers and config panels are lazy-loaded via step registry
// They will be exported from their barrel files as they are created
