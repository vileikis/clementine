// esbuild configuration for Cloud Functions
// Bundles TypeScript source into optimized ESM output

import { build } from 'esbuild'

// Build configuration
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  sourcemap: true,

  // Don't bundle node_modules - let Node.js load them
  // This prevents issues with dynamic requires and native modules
  packages: 'external',

  // Preserve function names for Firebase
  keepNames: true,

  // Tree shaking
  treeShaking: true,

  // Minification (optional - disable for debugging)
  minify: false,

  // Log output
  logLevel: 'info',
}).catch(() => process.exit(1))

console.log('✓ Cloud Functions built successfully')
