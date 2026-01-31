/**
 * ControlRow Component
 *
 * Bottom row of PromptComposer containing model select,
 * aspect ratio select, and add media button.
 */
import {
  updateNodeAspectRatio,
  updateNodeModel,
} from '../../lib/transform-operations'
import { AddMediaButton } from './AddMediaButton'
import type { AIImageNode, TransformNode } from '@clementine/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui-kit/ui/select'

export interface ControlRowProps {
  /** AI Image node being edited */
  node: AIImageNode
  /** Current transform nodes array */
  transformNodes: TransformNode[]
  /** Callback to update transform nodes */
  onUpdate: (nodes: TransformNode[]) => void
  /** Callback when files are selected for upload */
  onFilesSelected: (files: File[]) => void
  /** Whether the add media button is disabled */
  isAddDisabled?: boolean
  /** Whether controls are disabled */
  disabled?: boolean
}

/** Available AI models */
const AI_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
] as const

/** Available aspect ratios */
const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
] as const

/**
 * ControlRow - Model, aspect ratio, and add media controls
 */
export function ControlRow({
  node,
  transformNodes,
  onUpdate,
  onFilesSelected,
  isAddDisabled,
  disabled,
}: ControlRowProps) {
  const { config } = node

  const handleModelChange = (value: string) => {
    const newNodes = updateNodeModel(
      transformNodes,
      node.id,
      value as (typeof AI_MODELS)[number]['value'],
    )
    onUpdate(newNodes)
  }

  const handleAspectRatioChange = (value: string) => {
    const newNodes = updateNodeAspectRatio(
      transformNodes,
      node.id,
      value as (typeof ASPECT_RATIOS)[number]['value'],
    )
    onUpdate(newNodes)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Model Select */}
      <Select
        value={config.model}
        onValueChange={handleModelChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-11 w-auto min-w-32 border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
          aria-label="Select AI model"
        >
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Aspect Ratio Select */}
      <Select
        value={config.aspectRatio}
        onValueChange={handleAspectRatioChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-11 w-auto min-w-20 border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
          aria-label="Select aspect ratio"
        >
          <SelectValue placeholder="Ratio" />
        </SelectTrigger>
        <SelectContent>
          {ASPECT_RATIOS.map((ratio) => (
            <SelectItem key={ratio.value} value={ratio.value}>
              {ratio.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Spacer to push add button to right */}
      <div className="flex-1" />

      {/* Add Media Button */}
      <AddMediaButton
        onFilesSelected={onFilesSelected}
        disabled={isAddDisabled}
      />
    </div>
  )
}
