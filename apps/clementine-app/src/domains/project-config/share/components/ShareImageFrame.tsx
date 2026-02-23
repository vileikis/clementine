/**
 * ShareImageFrame Component
 *
 * Displays a result image with a blurred, scaled background fill.
 * The sharp image renders centered with object-contain while the
 * blurred duplicate fills the container edges — no black letterboxing.
 */

interface ShareImageFrameProps {
  /** Image source URL */
  src: string
  /** Additional CSS classes on the outer container */
  className?: string
}

export function ShareImageFrame({ src, className }: ShareImageFrameProps) {
  return (
    <div className={`relative overflow-hidden bg-black ${className ?? ''}`}>
      {/* Background layer — blurred, scaled, dimmed */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-[0.5]"
      />

      {/* Foreground layer — sharp, centered, preserves aspect ratio */}
      <img
        src={src}
        alt="Generated result"
        className="relative h-full w-full object-contain"
      />
    </div>
  )
}
