import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

/**
 * Official Zapier Logo
 * Vibrant Zapier orange (#FF4F00) with white asterisk
 */
export function ZapierLogo({ className = 'w-4 h-4', size }: BrandIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-label="Zapier"
    >
      <rect width="32" height="32" rx="7" fill="#FF4F00" />
      <g fill="#FFFFFF">
        {/* Horizontal bar */}
        <rect x="6" y="14.25" width="20" height="3.5" rx="1.75" />
        {/* Vertical bar */}
        <rect x="14.25" y="6" width="3.5" height="20" rx="1.75" />
        {/* 45 degree bar */}
        <rect
          x="7.8"
          y="14.25"
          width="16.4"
          height="3.5"
          rx="1.75"
          transform="rotate(45 16 16)"
        />
        {/* -45 degree bar */}
        <rect
          x="7.8"
          y="14.25"
          width="16.4"
          height="3.5"
          rx="1.75"
          transform="rotate(-45 16 16)"
        />
      </g>
    </svg>
  );
}

/**
 * Official Obsidian Logo
 * Geometric purple multifaceted crystal origami
 */
export function ObsidianLogo({ className = 'w-4 h-4', size }: BrandIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-label="Obsidian"
    >
      <defs>
        <linearGradient id="obsidian_base" x1="16" y1="12" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8247E5" />
          <stop offset="1" stopColor="#4A154B" />
        </linearGradient>
      </defs>
      {/* Back contour */}
      <path
        d="M52 10C50.8 9 49 9.1 48 10.2L22 41C21.4 41.8 21.2 42.8 21.5 43.8L37 88C37.4 89.2 38.6 90 40 89.7L69 83.5C70.2 83.2 71 82.2 71.1 81L77 33.5C77.2 32.4 76.6 31.3 75.6 30.8L52 10Z"
        fill="url(#obsidian_base)"
      />
      {/* Front left facet */}
      <path
        d="M22 41L37 88C37.4 89.2 38.6 90 40 89.7L54 68L22 41Z"
        fill="#9333EA"
      />
      {/* Top central facet */}
      <path
        d="M52 10L22 41L54 68L52 10Z"
        fill="#A855F7"
      />
      {/* Top right facet */}
      <path
        d="M52 10L54 68L77 33.5L52 10Z"
        fill="#7C3AED"
      />
      {/* Bottom right facet */}
      <path
        d="M54 68L40 89.7L69 83.5L71.1 81L77 33.5L54 68Z"
        fill="#581C87"
      />
      {/* Highlight edge */}
      <path
        d="M52 10L54 68"
        stroke="#C084FC"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Official Notion Logo
 * Official Notion Cube with stylized 'N'
 */
export function NotionLogo({ className = 'w-4 h-4', size }: BrandIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-label="Notion"
    >
      <rect width="100" height="100" rx="22" fill="#000000" />
      <path
        d="M26 24C30.5 23.6 38 23 45 22.7C52 22.4 59.5 22.1 67 22C69 22 70.5 23.3 70.8 25.1C71.2 27.2 73.5 43 74.3 54C74.8 60.5 75 66.8 75 69C75 71 73.5 72.5 71.3 72.8C67 73.4 59 74.3 51.5 74.7C44.5 75.1 37.2 75.4 30 75.6C28 75.6 26.5 74.3 26.2 72.3C25.7 69.7 23.6 54.8 22.8 43.8C22.1 35.8 21.8 29.6 21.8 27.6C21.8 25.6 23.6 24.1 26 24Z"
        fill="#FFFFFF"
      />
      {/* Distinctive Notion cursive inner 'N' glyph in black */}
      <path
        d="M36 32.5C33.5 32.7 32.1 33.8 31.8 36.1L30.5 63C30.3 64.4 31.2 65.3 32.8 65.2C34.8 65.1 36.2 64.3 37.5 63.3L38.5 33.3C37.6 32.7 36.7 32.4 36 32.5ZM64.5 38.2C64.5 36.4 63.5 35.2 61.8 35.2C60.2 35.2 58.7 36 57.4 37.2L44.8 56L44 35.6C43.9 34.4 43.1 33.6 41.9 33.6C40.5 33.6 39.1 34.4 38.4 35.4L38.1 61.5C38.1 62.9 38.9 63.5 40.3 63.5C41.7 63.5 43.1 62.8 44.3 61.7L57.5 42.5L58.2 64.2C58.4 65.5 59.2 66.2 60.6 66.2C62.1 66.2 63.5 65.5 64.2 64.4L64.5 38.2Z"
        fill="#000000"
      />
    </svg>
  );
}

/**
 * Official Google Meet Logo
 * Exact Google Workspace 4-color Camera mark (24x24 standard geometry)
 * Blue: #4285F4, Green: #00AC47, Yellow: #FBBC04, Red: #EA4335, Dark Green: #00832D
 */
export function GoogleMeetLogo({ className = 'w-4 h-4', size }: BrandIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={style}
      aria-label="Google Meet"
    >
      {/* Top yellow projector lens */}
      <path
        d="M17.5 7.5L22 4V11.5L17.5 8.5V7.5Z"
        fill="#FBBC04"
      />
      {/* Bottom red projector lens */}
      <path
        d="M17.5 15.5L22 18.5V11.5L17.5 14.5V15.5Z"
        fill="#EA4335"
      />
      {/* Center green projector lens */}
      <path
        d="M17.5 8.5L22 11.5L17.5 14.5V8.5Z"
        fill="#00AC47"
      />
      {/* Camera body rounded rect - base Blue */}
      <rect
        x="2"
        y="5"
        width="15.5"
        height="14"
        rx="2.5"
        fill="#4285F4"
      />
      {/* Top right green overlap */}
      <path
        d="M12 5H15C16.3807 5 17.5 6.11929 17.5 7.5V12H12V5Z"
        fill="#00AC47"
      />
      {/* Bottom left green / dark green overlap */}
      <path
        d="M2 13.5H7.5V19H4.5C3.11929 19 2 17.8807 2 16.5V13.5Z"
        fill="#00832D"
      />
      {/* Top left yellow highlight */}
      <path
        d="M4.5 5H10V10.5H2V7.5C2 6.11929 3.11929 5 4.5 5Z"
        fill="#FFBA00"
      />
      {/* Bottom right blue */}
      <path
        d="M10 12H17.5V16.5C17.5 17.8807 16.3807 19 15 19H10V12Z"
        fill="#2684FC"
      />
    </svg>
  );
}

/**
 * Standard badge displaying brand logo alongside its official text name
 */
export function BrandPill({
  brand,
  size = 'sm',
  showText = true,
  className = '',
}: {
  brand: 'zapier' | 'obsidian' | 'notion' | 'meet';
  size?: 'xs' | 'sm' | 'md';
  showText?: boolean;
  className?: string;
}) {
  const brandConfig = {
    zapier: {
      name: 'Zapier',
      Logo: ZapierLogo,
      bg: 'bg-orange-50/80 hover:bg-orange-100/80 border-orange-200 text-orange-900',
    },
    obsidian: {
      name: 'Obsidian',
      Logo: ObsidianLogo,
      bg: 'bg-purple-50/80 hover:bg-purple-100/80 border-purple-200 text-purple-900',
    },
    notion: {
      name: 'Notion',
      Logo: NotionLogo,
      bg: 'bg-neutral-100/90 hover:bg-neutral-200/90 border-neutral-300 text-neutral-900',
    },
    meet: {
      name: 'Google Meet',
      Logo: GoogleMeetLogo,
      bg: 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900',
    },
  };

  const config = brandConfig[brand];
  const { Logo, name } = config;

  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1.5',
    sm: 'text-xs px-2.5 py-1 gap-2',
    md: 'text-sm px-3.5 py-1.5 gap-2.5 font-medium',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-medium transition-colors shadow-2xs ${sizeClasses[size]} ${config.bg} ${className}`}
    >
      <Logo className={iconSizes[size]} />
      {showText && <span>{name}</span>}
    </span>
  );
}
