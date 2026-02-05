/**
 * AIImageNode Components
 *
 * Header and Settings components for AI Image nodes.
 * Kept together for maintainability.
 *
 * @deprecated This component is part of the node-based UI which is being replaced
 * by the outcome-based Create tab. Will be deleted in Phase 8 cleanup.
 */
import { useCallback, useEffect, useState } from 'react'

import { PromptComposer } from '../PromptComposer'
import { useRefMediaUpload } from '../../hooks'
import {
  addNodeRefMedia,
  removeNodeRefMedia,
  updateNodeAspectRatio,
  updateNodeModel,
  updateNodePrompt,
} from '../../lib/transform-operations'
import type {
  AIImageNode,
  ExperienceStep,
  MediaReference,
  TransformNode,
} from '@clementine/shared'
import { useAuth } from '@/domains/auth'
import { useDebounce } from '@/shared/utils/useDebounce'

export interface AIImageNodeProps {
  /** AI Image node data */
  node: AIImageNode
}

export interface AIImageNodeSettingsProps extends AIImageNodeProps {
  /** Current transform nodes array */
  transformNodes: TransformNode[]
  /** Experience steps for @mention in prompt editor */
  steps: ExperienceStep[]
  /** Workspace ID for media uploads */
  workspaceId: string
  /** Callback to update transform nodes */
  onUpdate: (nodes: TransformNode[]) => void
}

/**
 * AI Image Node Header
 *
 * Renders the summary line shown in the collapsed header:
 * - Node type label
 * - Model and aspect ratio
 */
export function AIImageNodeHeader({ node }: AIImageNodeProps) {
  const { config } = node

  return (
    <div className="min-w-0 flex-1">
      <div className="font-medium">AI Image Node</div>
      <div className="truncate text-sm text-muted-foreground">
        {config.model} · {config.aspectRatio}
      </div>
    </div>
  )
}

/** Debounce delay for prompt changes (ms) */
const PROMPT_DEBOUNCE_DELAY = 2000

/**
 * AI Image Node Settings
 *
 * Renders the expanded settings:
 * - PromptComposer (prompt input, model/aspect ratio selectors, reference media)
 *
 * @deprecated Will be deleted in Phase 8 cleanup.
 */
export function AIImageNodeSettings({
  node,
  transformNodes,
  steps,
  workspaceId,
  onUpdate,
}: AIImageNodeSettingsProps) {
  const { config } = node
  const { user } = useAuth()

  // Local state for prompt to enable debouncing
  const [localPrompt, setLocalPrompt] = useState(config.prompt)

  // Debounce the local prompt value
  const debouncedPrompt = useDebounce(localPrompt, PROMPT_DEBOUNCE_DELAY)

  // Update transform nodes when debounced prompt changes
  useEffect(() => {
    if (debouncedPrompt !== config.prompt) {
      const newNodes = updateNodePrompt(
        transformNodes,
        node.id,
        debouncedPrompt,
      )
      onUpdate(newNodes)
    }
  }, [debouncedPrompt])

  // Sync local prompt with config when it changes externally
  useEffect(() => {
    if (config.prompt !== localPrompt) {
      setLocalPrompt(config.prompt)
    }
  }, [config.prompt])

  // Handle model change
  const handleModelChange = useCallback(
    (model: string) => {
      const newNodes = updateNodeModel(
        transformNodes,
        node.id,
        model as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
      )
      onUpdate(newNodes)
    },
    [transformNodes, node.id, onUpdate],
  )

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      const newNodes = updateNodeAspectRatio(
        transformNodes,
        node.id,
        aspectRatio as '1:1' | '3:2' | '2:3' | '9:16' | '16:9',
      )
      onUpdate(newNodes)
    },
    [transformNodes, node.id, onUpdate],
  )

  // Handle remove reference media
  const handleRemoveRefMedia = useCallback(
    (mediaAssetId: string) => {
      const newNodes = removeNodeRefMedia(transformNodes, node.id, mediaAssetId)
      onUpdate(newNodes)
    },
    [transformNodes, node.id, onUpdate],
  )

  // Handle media uploaded - add to node's refMedia
  const handleMediaUploaded = useCallback(
    (mediaRef: MediaReference) => {
      const newNodes = addNodeRefMedia(transformNodes, node.id, [mediaRef])
      onUpdate(newNodes)
    },
    [transformNodes, node.id, onUpdate],
  )

  // Create a mock outcome for the upload hook (legacy compatibility)
  const mockOutcome = {
    type: 'image' as const,
    captureStepId: null,
    aiEnabled: true,
    imageGeneration: {
      prompt: config.prompt,
      refMedia: config.refMedia,
      model: config.model,
      aspectRatio: config.aspectRatio,
    },
    options: null,
  }

  // Reference media upload hook
  const { uploadingFiles, uploadFiles, canAddMore, isUploading } =
    useRefMediaUpload({
      workspaceId,
      userId: user?.uid,
      outcome: mockOutcome,
      onMediaUploaded: handleMediaUploaded,
    })

  return (
    <div className="space-y-4 border-t px-3 pb-4 pt-4">
      <PromptComposer
        prompt={localPrompt}
        onPromptChange={setLocalPrompt}
        model={config.model}
        onModelChange={handleModelChange}
        aspectRatio={config.aspectRatio}
        onAspectRatioChange={handleAspectRatioChange}
        refMedia={config.refMedia}
        onRefMediaRemove={handleRemoveRefMedia}
        uploadingFiles={uploadingFiles}
        onFilesSelected={uploadFiles}
        canAddMore={canAddMore}
        isUploading={isUploading}
        steps={steps}
      />
    </div>
  )
}
