import React, { useState } from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showBadge?: boolean;
  withGlow?: boolean;
  useImage?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showBadge = false,
  withGlow = false,
  useImage = true,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 80;
      default: return 40;
    }
  };

  const dim = getDimension();
  const radiusClass = dim <= 28 ? 'rounded-lg' : dim <= 44 ? 'rounded-xl' : 'rounded-2xl';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {withGlow && (
        <div 
          className="absolute inset-0 rounded-2xl bg-emerald-500/25 blur-md -z-10 animate-pulse"
          style={{ width: dim * 1.1, height: dim * 1.1 }}
        />
      )}

      {useImage && !imageFailed ? (
        <img
          src="/src/assets/images/android_app_logo_1793116778829.jpg"
          alt="Rubel AI Assistant"
          width={dim}
          height={dim}
          className={`${radiusClass} object-cover shadow-md border border-emerald-500/30 transition-transform duration-200 hover:scale-105 shrink-0`}
          style={{ width: dim, height: dim }}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-200 hover:scale-105"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="logoCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="logoSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Squircle Base Frame */}
          <rect width="512" height="512" rx="112" fill="url(#logoBgGrad)" />

          {/* Subtle Inner Accent Border */}
          <rect
            x="12"
            y="12"
            width="488"
            height="488"
            rx="102"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="6"
            strokeOpacity="0.3"
          />

          {/* Inner Dark Tech Slate Layer */}
          <rect
            x="52"
            y="52"
            width="408"
            height="408"
            rx="82"
            fill="#0f172a"
            filter="url(#logoShadow)"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeOpacity="0.45"
          />

          {/* Central Geometric Symbol */}
          <g transform="translate(256, 256)">
            {/* Neural Connection Ring */}
            <circle
              cx="0"
              cy="0"
              r="105"
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeDasharray="6 8"
              strokeOpacity="0.4"
            />

            {/* Left Code Bracket */}
            <path
              d="M-85,-65 L-150,0 L-85,65"
              fill="none"
              stroke="url(#logoCoreGrad)"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right Code Bracket */}
            <path
              d="M85,-65 L150,0 L85,65"
              fill="none"
              stroke="url(#logoCoreGrad)"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tech Slash */}
            <path
              d="M20,-90 L-20,90"
              fill="none"
              stroke="#10b981"
              strokeWidth="14"
              strokeLinecap="round"
              strokeOpacity="0.35"
            />

            {/* AI Sparkle Star */}
            <path
              d="M0,-60 C0,-14 -14,0 -60,0 C-14,0 0,14 0,60 C0,14 14,0 60,0 C14,0 0,-14 0,-60 Z"
              fill="url(#logoSparkleGrad)"
            />

            {/* Core Dot & Nodes */}
            <circle cx="0" cy="0" r="10" fill="#ffffff" />
            <circle cx="-150" cy="0" r="11" fill="#6ee7b7" />
            <circle cx="150" cy="0" r="11" fill="#6ee7b7" />
            <circle cx="0" cy="-105" r="9" fill="#34d399" />
            <circle cx="0" cy="105" r="9" fill="#34d399" />
          </g>
        </svg>
      )}

      {showBadge && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white shadow-xs border border-white dark:border-stone-900">
          PRO
        </span>
      )}
    </div>
  );
};
