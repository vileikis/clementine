import { createFileRoute } from '@tanstack/react-router'
import {
  Route as RouteIcon,
  Server,
  Shield,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const features = []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <h1>WIP</h1>
    </div>
  )
}
