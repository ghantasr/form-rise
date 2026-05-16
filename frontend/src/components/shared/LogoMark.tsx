interface LogoMarkProps {
  size?: number;
  /** 'dark' = green bg (sidebar), 'light' = white bg (landing nav on light), 'bare' = no bg, colored bars */
  variant?: 'dark' | 'light' | 'bare';
  className?: string;
}

export function LogoMark({ size = 28, variant = 'dark', className = '' }: LogoMarkProps) {
  const radius = Math.round(size * 0.25);
  const barColor = variant === 'bare' ? '#1B6B4A' : 'white';
  const bgColor = variant === 'light' ? 'white' : '#1B6B4A';

  const s = size;
  const pad = s * 0.125;
  const barW = (s - pad * 2 - 2 * (s * 0.09)) / 3;
  const gap = s * 0.09;
  const b = s - pad;

  const x1 = pad;
  const x2 = pad + barW + gap;
  const x3 = pad + barW * 2 + gap * 2;

  const h1 = s * 0.28;
  const h2 = s * 0.50;
  const h3 = s * 0.72;

  const barRadius = Math.max(1, barW * 0.32);

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${className}`}
      style={
        variant !== 'bare'
          ? {
              width: size,
              height: size,
              borderRadius: radius,
              background: bgColor,
              boxShadow: variant === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : '0 0 0 1px rgba(0,0,0,0.08)',
            }
          : { width: size, height: size }
      }
    >
      <svg width={s * 0.7} height={s * 0.7} viewBox={`0 0 ${s} ${s}`} fill="none">
        <rect x={x1} y={b - h1} width={barW} height={h1} rx={barRadius} fill={barColor} />
        <rect x={x2} y={b - h2} width={barW} height={h2} rx={barRadius} fill={barColor} />
        <rect x={x3} y={b - h3} width={barW} height={h3} rx={barRadius} fill={barColor} />
      </svg>
    </div>
  );
}
