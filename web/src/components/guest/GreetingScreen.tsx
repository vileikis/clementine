"use client"

interface GreetingScreenProps {
  eventTitle: string
  showTitleOverlay: boolean
  onGetStarted: () => void
}

/**
 * Initial greeting screen for guests
 * Shows event branding and Get Started button to begin camera flow
 */
export function GreetingScreen({
  eventTitle,
  showTitleOverlay,
  onGetStarted,
}: GreetingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Event Title */}
        {showTitleOverlay && (
          <h1 className="text-4xl font-bold text-foreground">{eventTitle}</h1>
        )}

        {/* Brand Circle */}
        <div className="flex justify-center">
          <div
            className="w-32 h-32 rounded-full"
            style={{ backgroundColor: "var(--brand)" }}
          />
        </div>

        {/* Welcome Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome!
          </h2>
          <p className="text-muted-foreground text-lg">
            Get ready to create your AI-transformed photo experience
          </p>
        </div>

        {/* Get Started Button */}
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-6 text-lg font-medium rounded-lg text-white transition-transform active:scale-95"
          style={{ backgroundColor: "var(--brand)" }}
        >
          Get Started
        </button>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground">
          You&apos;ll be asked to allow camera access to take your photo
        </p>
      </div>
    </div>
  )
}
