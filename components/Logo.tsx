interface LogoProps {
  className?: string
  size?: "sm" | "lg"
}

function PixelSword({ className = "" }: { className?: string }) {
  // 8-bit pixel sword on a 16x16 grid: grip at the top, blade running down.
  // The outer rotate() tilts it so the tip points down-left (right → left).
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* pommel */}
      <rect x="6" y="0" width="4" height="1" fill="#f2b24b" />
      {/* grip */}
      <rect x="6" y="1" width="4" height="1" fill="#92400e" />
      <rect x="6" y="2" width="4" height="1" fill="#78350f" />
      <rect x="6" y="3" width="4" height="1" fill="#92400e" />
      <rect x="6" y="4" width="4" height="1" fill="#78350f" />
      {/* crossguard */}
      <rect x="3" y="5" width="10" height="1" fill="#f2b24b" />
      <rect x="4" y="6" width="8" height="1" fill="#f59e0b" />
      {/* blade */}
      <rect x="6" y="7" width="4" height="1" fill="#f8fafc" />
      <rect x="6" y="8" width="4" height="1" fill="#e2e8f0" />
      <rect x="6" y="9" width="4" height="1" fill="#cbd5e1" />
      <rect x="6" y="10" width="4" height="1" fill="#e2e8f0" />
      <rect x="6" y="11" width="4" height="1" fill="#cbd5e1" />
      <rect x="6" y="12" width="4" height="1" fill="#e2e8f0" />
      {/* tip */}
      <rect x="7" y="13" width="2" height="1" fill="#e2e8f0" />
      <rect x="7" y="14" width="2" height="1" fill="#cbd5e1" />
      <rect x="8" y="15" width="1" height="1" fill="#f8fafc" />
    </svg>
  )
}

export default function Logo({ className = "", size = "sm" }: LogoProps) {
  const swordSize = size === "lg" ? "w-10 h-10 sm:w-14 sm:h-14" : "w-5 h-5 sm:w-6 sm:h-6"
  const textSize = size === "lg" ? "text-5xl sm:text-7xl" : "text-lg"
  return (
    <span className={`relative inline-flex items-center font-display font-extrabold tracking-tight ${textSize} ${className}`}>
      <span className="text-gradient">SprintQuest</span>
      <PixelSword
        className={`pointer-events-none absolute left-1/2 top-1/2 ${swordSize} -translate-x-1/2 -translate-y-1/2 rotate-[35deg] drop-shadow-[0_2px_6px_rgba(242,178,75,0.45)] opacity-95`}
      />
    </span>
  )
}
