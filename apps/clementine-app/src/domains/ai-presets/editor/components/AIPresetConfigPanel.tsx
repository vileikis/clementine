/**
 * AIPresetConfigPanel Component
 *
 * Left panel control interface for configuring AI preset settings.
 * Organized into collapsible sections: Model Settings, Media Registry, Variables.
 */

import { MediaRegistrySection } from './MediaRegistrySection'
import { ModelSettingsSection } from './ModelSettingsSection'
import { VariablesSection } from './VariablesSection'
import type { AIPresetConfig } from '@clementine/shared'
import { EditorSection } from '@/shared/editor-controls'

export interface AIPresetConfigPanelProps {
  /** Current AI preset draft values */
  draft: AIPresetConfig
  /** Workspace ID for updates */
  workspaceId: string
  /** Preset ID for updates */
  presetId: string
  /** User ID for media uploads */
  userId: string
  /** Whether controls are disabled (e.g., during publish) */
  disabled?: boolean
}

/**
 * AI preset configuration panel with collapsible sections
 *
 * Contains:
 * - Model Settings: AI model and aspect ratio selection
 * - Media Registry: Media asset management
 * - Variables: Dynamic prompt variable definitions
 *
 * @example
 * ```tsx
 * <AIPresetConfigPanel
 *   draft={preset.draft}
 *   workspaceId={workspaceId}
 *   presetId={preset.id}
 *   userId={user.uid}
 *   disabled={isPublishing}
 * />
 * ```
 */
export function AIPresetConfigPanel({
  draft,
  workspaceId,
  presetId,
  userId,
  disabled = false,
}: AIPresetConfigPanelProps) {
  return (
    <div className="space-y-0">
      {/* Model Settings Section */}
      <EditorSection title="Model Settings">
        <ModelSettingsSection
          model={draft.model}
          aspectRatio={draft.aspectRatio}
          workspaceId={workspaceId}
          presetId={presetId}
          disabled={disabled}
        />
      </EditorSection>

      {/* Media Registry Section */}
      <EditorSection title="Media Registry">
        <MediaRegistrySection
          mediaRegistry={draft.mediaRegistry}
          workspaceId={workspaceId}
          presetId={presetId}
          userId={userId}
          disabled={disabled}
        />
      </EditorSection>

      {/* Variables Section */}
      <EditorSection title="Variables">
        <VariablesSection
          variables={draft.variables}
          media={draft.mediaRegistry}
          workspaceId={workspaceId}
          presetId={presetId}
          disabled={disabled}
        />
      </EditorSection>
    </div>
  )
}
