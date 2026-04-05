interface SparklineLogoProps {
  size?: number;
}

export function SparklineLogo({ size = 36 }: SparklineLogoProps) {
  return (
    <svg
      aria-label="Sparkline logo"
      height={size}
      role="img"
      viewBox="0 0 40 40"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sparkline-bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="55%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="sparkline-line" x1="0%" x2="100%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id="sparkline-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur result="blur" stdDeviation="1.8" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect fill="url(#sparkline-bg)" height="40" rx="10" width="40" />
      <polyline
        fill="none"
        filter="url(#sparkline-glow)"
        points="6,27 14,22 19,24 26,13 34,9"
        stroke="url(#sparkline-line)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
      />
      <circle cx="34" cy="9" fill="#FFFFFF" filter="url(#sparkline-glow)" r="2.4" />
      <line stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.3" x1="34" x2="34" y1="2.5" y2="5.5" />
      <line stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.3" x1="29.6" x2="31.8" y1="4.6" y2="6.5" />
      <line stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.3" x1="36.2" x2="38.4" y1="6.5" y2="4.6" />
    </svg>
  );
}
