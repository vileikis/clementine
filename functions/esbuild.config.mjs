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

  // External packages - not bundled, loaded at runtime by Node.js
  // Includes: Firebase (runtime requirement), native modules, SDKs
  // Excludes: @clementine/* workspace packages (bundled inline)
  external: [
    'firebase-admin',
    'firebase-admin/*',
    'firebase-functions',
    'firebase-functions/*',
    '@google/genai',
    'ffmpeg-static',
    'ffprobe-static',
    'tmp',
    'zod',
    'nodemailer',
  ],

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
