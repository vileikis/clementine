/**
 * Editor Status Module
 *
 * Shared components and utilities for tracking editor state
 * across domains (events, experiences, etc.)
 */

// Components
export { EditorChangesBadge, EditorSaveStatus } from './components'

// Store factory
export { createEditorStore } from './store'

// Types
export type { EditorStore, VersionInfo } from './types'
