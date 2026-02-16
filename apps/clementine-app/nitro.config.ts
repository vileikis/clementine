import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // Ensure Node.js modules are available
  node: true,

  // Externalize firebase-admin to prevent bundling
  // This is critical because firebase-admin uses native Node.js crypto libraries
  // that break when bundled
  rollupConfig: {
    external: ['firebase-admin', 'fsevents'],
  },
})
