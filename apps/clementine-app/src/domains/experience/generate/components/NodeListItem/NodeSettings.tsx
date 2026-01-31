/**
 * NodeSettings Component
 *
 * Dispatcher for node settings components.
 * Routes to the appropriate settings based on node type.
 */
import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'

import { AIImageNodeSettings } from './AIImageNode'
import { UnknownNodeSettings } from './UnknownNode'
import type { AIImageNode, TransformNode } from '@clementine/shared'

export interface NodeSettingsProps {
  /** Transform node data */
  node: TransformNode
}

/**
 * Node Settings Dispatcher
 *
 * Routes to the appropriate settings component based on node type.
 * Add new node types to the switch as they are implemented.
 */
export function NodeSettings({ node }: NodeSettingsProps) {
  switch (node.type) {
    case AI_IMAGE_NODE_TYPE:
      return <AIImageNodeSettings node={node as AIImageNode} />

    // Add future node types here:
    // case FILTER_NODE_TYPE:
    //   return <FilterNodeSettings node={node} />

    default:
      return <UnknownNodeSettings nodeType={(node as { type: string }).type} />
  }
}
