/**
 * MentionValidationPlugin
 *
 * Validates variable and media mentions in the editor and marks invalid ones.
 * Runs when variables or media registries change.
 *
 * Invalid mentions (deleted variables/media) are styled with:
 * - Red background
 * - Strikethrough text
 * - Tooltip showing the mention no longer exists
 */
import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { $isMediaMentionNode } from '../nodes/MediaMentionNode'
import { $isVariableMentionNode } from '../nodes/VariableMentionNode'
import type { PresetMediaEntry, PresetVariable } from '@clementine/shared'

interface MentionValidationPluginProps {
  /** Current list of variables */
  variables: PresetVariable[]
  /** Current list of media entries */
  media: PresetMediaEntry[]
}

/**
 * Plugin to validate mentions against current variables and media
 *
 * Marks mentions as invalid (red, strikethrough) when:
 * - Variable has been deleted
 * - Media has been removed from registry
 *
 * @example
 * ```tsx
 * <LexicalComposer>
 *   <MentionValidationPlugin
 *     variables={preset.draft.variables}
 *     media={preset.draft.mediaRegistry}
 *   />
 * </LexicalComposer>
 * ```
 */
export function MentionValidationPlugin({
  variables,
  media,
}: MentionValidationPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Build lookup sets for efficient validation
    const validVariableIds = new Set(variables.map((v) => v.id))
    const validMediaIds = new Set(media.map((m) => m.mediaAssetId))

    // Use a timeout to avoid interfering with mention insertion
    const timeoutId = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot()
        const allNodes = root.getAllTextNodes()

        allNodes.forEach((node) => {
          // Validate variable mentions
          if ($isVariableMentionNode(node)) {
            const variableId = node.getVariableId()
            const isValid = validVariableIds.has(variableId)
            const shouldBeInvalid = !isValid

            // Only update if the state actually needs to change
            if (node.getIsInvalid() !== shouldBeInvalid) {
              node.setInvalid(shouldBeInvalid)
            }
          }

          // Validate media mentions
          if ($isMediaMentionNode(node)) {
            const mediaId = node.getMediaId()
            const isValid = validMediaIds.has(mediaId)
            const shouldBeInvalid = !isValid

            // Only update if the state actually needs to change
            if (node.getIsInvalid() !== shouldBeInvalid) {
              node.setInvalid(shouldBeInvalid)
            }
          }
        })
      })
    }, 100) // Small delay to avoid interfering with insertion

    return () => clearTimeout(timeoutId)
  }, [editor, variables, media])

  return null
}
