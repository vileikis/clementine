import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      // Allow ngrok and similar tunneling services for mobile testing
      allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok-free.dev'],
    },
    plugins: [
      devtools(),
      mode !== 'test' && nitro(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      mode !== 'test' &&
        tanstackStart({
          router: {
            routesDirectory: 'app', // Relative to srcDirectory (defaults to 'src')
          },
        }),
      sentryTanstackStart({
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
      viteReact(),
    ].filter(Boolean),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
    },
  }
})

export default config
