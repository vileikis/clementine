/**
 * NodeHeader Component
 *
 * Dispatcher for node header components.
 * Routes to the appropriate header based on node type.
 */
import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'

import { AIImageNodeHeader } from './AIImageNode'
import { UnknownNodeHeader } from './UnknownNode'
import type { AIImageNode, TransformNode } from '@clementine/shared'

export interface NodeHeaderProps {
  /** Transform node data */
  node: TransformNode
}

/**
 * Node Header Dispatcher
 *
 * Routes to the appropriate header component based on node type.
 * Add new node types to the switch as they are implemented.
 */
export function NodeHeader({ node }: NodeHeaderProps) {
  switch (node.type) {
    case AI_IMAGE_NODE_TYPE:
      return <AIImageNodeHeader node={node as AIImageNode} />

    // Add future node types here:
    // case FILTER_NODE_TYPE:
    //   return <FilterNodeHeader node={node} />

    default:
      return <UnknownNodeHeader nodeType={(node as { type: string }).type} />
  }
}
