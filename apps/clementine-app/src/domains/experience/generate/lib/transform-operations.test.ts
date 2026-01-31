/**
 * Tests for Transform Operations
 *
 * Unit tests for the pure transform configuration manipulation functions.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_IMAGE_NODE_TYPE } from '@clementine/shared'

import { nanoid } from 'nanoid'
import {
  DEFAULT_TRANSFORM_CONFIG,
  addNode,
  createDefaultAIImageNode,
  duplicateNode,
  removeNode,
  reorderNodes,
} from './transform-operations'
import type { TransformConfig, TransformNode } from '@clementine/shared'

// Mock nanoid to return predictable IDs
vi.mock('nanoid', () => ({
  nanoid: vi.fn(),
}))

const mockedNanoid = vi.mocked(nanoid)

describe('transform-operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset nanoid to return sequential IDs
    let idCounter = 0
    mockedNanoid.mockImplementation(() => `test-id-${++idCounter}`)
  })

  describe('DEFAULT_TRANSFORM_CONFIG', () => {
    it('should have empty nodes array', () => {
      expect(DEFAULT_TRANSFORM_CONFIG.nodes).toEqual([])
    })

    it('should have null outputFormat', () => {
      expect(DEFAULT_TRANSFORM_CONFIG.outputFormat).toBeNull()
    })
  })

  describe('createDefaultAIImageNode', () => {
    it('should create a node with correct type', () => {
      const node = createDefaultAIImageNode()

      expect(node.type).toBe(AI_IMAGE_NODE_TYPE)
    })

    it('should create a node with unique id from nanoid', () => {
      const node = createDefaultAIImageNode()

      expect(node.id).toBe('test-id-1')
      expect(mockedNanoid).toHaveBeenCalledOnce()
    })

    it('should create a node with default model', () => {
      const node = createDefaultAIImageNode()

      expect(node.config.model).toBe('gemini-2.5-flash-image')
    })

    it('should create a node with default aspect ratio', () => {
      const node = createDefaultAIImageNode()

      expect(node.config.aspectRatio).toBe('3:2')
    })

    it('should create a node with empty prompt', () => {
      const node = createDefaultAIImageNode()

      expect(node.config.prompt).toBe('')
    })

    it('should create a node with empty refMedia array', () => {
      const node = createDefaultAIImageNode()

      expect(node.config.refMedia).toEqual([])
    })

    it('should create different IDs for each call', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()

      expect(node1.id).toBe('test-id-1')
      expect(node2.id).toBe('test-id-2')
      expect(node1.id).not.toBe(node2.id)
    })
  })

  describe('addNode', () => {
    it('should add a node to empty config', () => {
      const result = addNode(null)

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].type).toBe(AI_IMAGE_NODE_TYPE)
    })

    it('should add a node to undefined config', () => {
      const result = addNode(undefined)

      expect(result.nodes).toHaveLength(1)
    })

    it('should add a node to existing config', () => {
      const existing: TransformConfig = {
        nodes: [createDefaultAIImageNode()],
        outputFormat: null,
      }

      const result = addNode(existing)

      expect(result.nodes).toHaveLength(2)
    })

    it('should preserve existing nodes when adding', () => {
      const existingNode = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [existingNode],
        outputFormat: null,
      }

      const result = addNode(existing)

      expect(result.nodes[0]).toEqual(existingNode)
    })

    it('should preserve outputFormat when adding node', () => {
      const existing: TransformConfig = {
        nodes: [],
        outputFormat: { aspectRatio: '1:1', quality: 80 },
      }

      const result = addNode(existing)

      expect(result.outputFormat).toEqual({ aspectRatio: '1:1', quality: 80 })
    })

    it('should return a new object (immutability)', () => {
      const existing: TransformConfig = {
        nodes: [],
        outputFormat: null,
      }

      const result = addNode(existing)

      expect(result).not.toBe(existing)
      expect(result.nodes).not.toBe(existing.nodes)
    })

    it('should append new node at the end', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2],
        outputFormat: null,
      }

      const result = addNode(existing)

      expect(result.nodes).toHaveLength(3)
      expect(result.nodes[2].id).toBe('test-id-3')
    })
  })

  describe('removeNode', () => {
    it('should remove a node by id', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2],
        outputFormat: null,
      }

      const result = removeNode(existing, node1.id)

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe(node2.id)
    })

    it('should return empty nodes when removing last node', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = removeNode(existing, node.id)

      expect(result.nodes).toHaveLength(0)
    })

    it('should not modify config when node id not found', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = removeNode(existing, 'non-existent-id')

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe(node.id)
    })

    it('should handle null config', () => {
      const result = removeNode(null, 'any-id')

      expect(result.nodes).toHaveLength(0)
    })

    it('should handle undefined config', () => {
      const result = removeNode(undefined, 'any-id')

      expect(result.nodes).toHaveLength(0)
    })

    it('should preserve outputFormat when removing node', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: { aspectRatio: '9:16', quality: 90 },
      }

      const result = removeNode(existing, node.id)

      expect(result.outputFormat).toEqual({ aspectRatio: '9:16', quality: 90 })
    })

    it('should return a new object (immutability)', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = removeNode(existing, node.id)

      expect(result).not.toBe(existing)
      expect(result.nodes).not.toBe(existing.nodes)
    })

    it('should preserve order of remaining nodes', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const node3 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2, node3],
        outputFormat: null,
      }

      const result = removeNode(existing, node2.id)

      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].id).toBe(node1.id)
      expect(result.nodes[1].id).toBe(node3.id)
    })
  })

  describe('duplicateNode', () => {
    it('should duplicate a node', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node.id)

      expect(result.nodes).toHaveLength(2)
    })

    it('should give duplicate a new id', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node.id)

      expect(result.nodes[0].id).toBe(node.id)
      expect(result.nodes[1].id).not.toBe(node.id)
    })

    it('should copy config to duplicate', () => {
      const node = createDefaultAIImageNode()
      node.config.prompt = 'Test prompt'
      node.config.aspectRatio = '16:9'
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node.id)

      expect(result.nodes[1].config.prompt).toBe('Test prompt')
      expect(result.nodes[1].config.aspectRatio).toBe('16:9')
    })

    it('should insert duplicate after original', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const node3 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2, node3],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node2.id)

      expect(result.nodes).toHaveLength(4)
      expect(result.nodes[0].id).toBe(node1.id)
      expect(result.nodes[1].id).toBe(node2.id)
      // Duplicate at index 2
      expect(result.nodes[2].id).not.toBe(node2.id)
      expect(result.nodes[2].config).toEqual(node2.config)
      expect(result.nodes[3].id).toBe(node3.id)
    })

    it('should throw error when node not found', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      expect(() => duplicateNode(existing, 'non-existent-id')).toThrow(
        'Node with id non-existent-id not found',
      )
    })

    it('should throw error on null config', () => {
      expect(() => duplicateNode(null, 'any-id')).toThrow(
        'Node with id any-id not found',
      )
    })

    it('should throw error on undefined config', () => {
      expect(() => duplicateNode(undefined, 'any-id')).toThrow(
        'Node with id any-id not found',
      )
    })

    it('should preserve outputFormat when duplicating', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: { aspectRatio: '2:3', quality: 75 },
      }

      const result = duplicateNode(existing, node.id)

      expect(result.outputFormat).toEqual({ aspectRatio: '2:3', quality: 75 })
    })

    it('should return a new object (immutability)', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node.id)

      expect(result).not.toBe(existing)
      expect(result.nodes).not.toBe(existing.nodes)
    })

    it('should create independent config copy (deep copy)', () => {
      const node = createDefaultAIImageNode()
      node.config.refMedia = [
        {
          mediaAssetId: 'asset-1',
          displayName: 'Reference 1',
          url: 'https://example.com/reference-1.jpg',
          filePath: null,
        },
      ]
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = duplicateNode(existing, node.id)

      // Configs should be equal but not the same reference
      expect(result.nodes[1].config).toEqual(node.config)
      expect(result.nodes[1].config).not.toBe(node.config)
    })
  })

  describe('reorderNodes', () => {
    it('should reorder nodes', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const node3 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2, node3],
        outputFormat: null,
      }

      const result = reorderNodes(existing, [node3, node1, node2])

      expect(result.nodes[0].id).toBe(node3.id)
      expect(result.nodes[1].id).toBe(node1.id)
      expect(result.nodes[2].id).toBe(node2.id)
    })

    it('should handle empty new nodes array', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = reorderNodes(existing, [])

      expect(result.nodes).toHaveLength(0)
    })

    it('should handle null config', () => {
      const node = createDefaultAIImageNode()

      const result = reorderNodes(null, [node])

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe(node.id)
    })

    it('should handle undefined config', () => {
      const node = createDefaultAIImageNode()

      const result = reorderNodes(undefined, [node])

      expect(result.nodes).toHaveLength(1)
    })

    it('should preserve outputFormat when reordering', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2],
        outputFormat: { aspectRatio: '1:1', quality: 100 },
      }

      const result = reorderNodes(existing, [node2, node1])

      expect(result.outputFormat).toEqual({ aspectRatio: '1:1', quality: 100 })
    })

    it('should return a new object (immutability)', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node],
        outputFormat: null,
      }

      const result = reorderNodes(existing, [node])

      expect(result).not.toBe(existing)
    })

    it('should use provided nodes array directly', () => {
      const node1 = createDefaultAIImageNode()
      const node2 = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [node1, node2],
        outputFormat: null,
      }
      const newOrder: TransformNode[] = [node2, node1]

      const result = reorderNodes(existing, newOrder)

      expect(result.nodes).toBe(newOrder)
    })

    it('should work with single node', () => {
      const node = createDefaultAIImageNode()
      const existing: TransformConfig = {
        nodes: [],
        outputFormat: null,
      }

      const result = reorderNodes(existing, [node])

      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0]).toBe(node)
    })
  })
})
