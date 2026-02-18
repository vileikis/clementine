import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react'

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
  const plugins: PluginOption[] = []

  plugins.push(devtools())

  if (!isTest) {
    plugins.push(nitro({ rollupConfig: { output: { sourcemap: true } } }))
  }

  plugins.push(
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
  )

  if (!isTest) {
    plugins.push(tanstackStart({ router: { routesDirectory: 'app' } }))
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
