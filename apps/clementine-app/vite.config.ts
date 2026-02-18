import { defineConfig, loadEnv } from 'vite'
import type { PluginOption, Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react'
import { sentryRollupPlugin } from '@sentry/rollup-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      // Allow ngrok and similar tunneling services for mobile testing
      allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok-free.dev'],
    },
    plugins: createPlugins(mode, env),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
    },
  }
})

function createPlugins(
  mode: string,
  env: Record<string, string>,
): PluginOption[] {
  const isTest = mode === 'test'
  const plugins: PluginOption[] = [
    devtools(),
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
  ]

  if (!isTest) {
    plugins.push(
      nitro({
        node: true,
        rollupConfig: {
          // Externalize firebase-admin to prevent bundling —
          // it uses native Node.js crypto libraries that break when bundled.
          external: ['firebase-admin', 'fsevents'],
          // Nitro hardcodes sourcemapExcludeSources: true with highest defu priority,
          // so we use a Rollup plugin hook to override it after config merging.
          plugins: [
            includeSourcesInSourceMaps(),
            sentryRollupPlugin({
              org: env.VITE_SENTRY_ORG,
              project: env.VITE_SENTRY_PROJECT,
              authToken: env.SENTRY_AUTH_TOKEN,
            }),
          ],
          output: { sourcemap: true },
        },
      }),
      tanstackStart({ router: { routesDirectory: 'app' } }),
    )
  }

  plugins.push(
    sentryTanstackStart({
      org: env.VITE_SENTRY_ORG,
      project: env.VITE_SENTRY_PROJECT,
      authToken: env.SENTRY_AUTH_TOKEN,
    }),
    viteReact(),
  )

  return plugins
}

/**
 * Rollup plugin that overrides Nitro's hardcoded `sourcemapExcludeSources: true`
 * so that server source maps include the original source content (`sourcesContent`).
 * This is required for Sentry to properly symbolicate server-side stack traces.
 */
function includeSourcesInSourceMaps(): Plugin {
  return {
    name: 'include-sources-in-sourcemaps',
    outputOptions(options) {
      return { ...options, sourcemapExcludeSources: false }
    },
  }
}
