// Reflow logo — flowing curve that loops back, evoking refund + flow
export default function Logo({ size = 32, className = '', mono = false, withWordmark = false }) {
  const fillColor = mono ? 'currentColor' : 'url(#reflow-gradient)';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="reflow-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {/* Rounded square background */}
        <rect width="40" height="40" rx="10" fill={fillColor} />
        {/* The R-flow mark: a stylized R formed by an arrow that loops back */}
        <path
          d="M13 10 L13 30 M13 10 L22 10 Q28 10 28 16 Q28 22 22 22 L13 22 M22 22 L29 30"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Tiny return arrow accent */}
        <circle cx="29" cy="30" r="1.6" fill="white" />
      </svg>
      {withWordmark && (
        <span className="font-bold tracking-tight text-gray-900" style={{ fontSize: size * 0.55 }}>
          Reflow
        </span>
      )}
    </span>
  );
}
