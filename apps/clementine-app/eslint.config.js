//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      '.output/**',
      'src/examples/**',
      'src/lib/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  ...tanstackConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
    },
  },
]
