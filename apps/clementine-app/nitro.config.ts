import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // Externalize firebase-admin to prevent bundling
  // This is critical because firebase-admin uses native Node.js crypto libraries
  // that break when bundled
  externals: ['firebase-admin'],

  // Ensure Node.js modules are available
  node: true,

  // Additional rollup options to ensure externalization
  rollupConfig: {
    external: ['firebase-admin'],
  },
})
