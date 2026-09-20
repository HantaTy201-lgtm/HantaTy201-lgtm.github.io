import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9.5 21.5V13h5v8.5" />
    </>
  ),
  note: (
    <>
      <path d="M14.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7.5z" />
      <path d="M14.5 2.5v5h5" />
      <path d="M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  canvas: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v13c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-13" />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  'check-square': (
    <>
      <path d="m8.5 11.5 2.5 2.5 5-5.5" />
      <path d="M20 12.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3.5 10h17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </>
  ),
  'chevron-left': <path d="m14 6-6 6 6 6" />,
  'chevron-right': <path d="m10 6 6 6-6 6" />,
  'chevron-down': <path d="m6 10 6 6 6-6" />,
  'chevron-up': <path d="m6 14 6-6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  tag: (
    <>
      <path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L3.5 14.3V3.5H14l6.5 6.5a2.5 2.5 0 0 1 0 3.5z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9z" />
      <path d="M19 3v3M20.5 4.5h-3" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.5 18h5M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.8V15h7v-1.2A6 6 0 0 0 12 3z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  'arrow-right': <path d="M4 12h15m-5.5-5.5L19 12l-5.5 5.5" />,
  'arrow-up-right': <path d="M7 17 17 7m0 0h-7m7 0v7" />,
  undo: (
    <>
      <path d="M4 9h9.5a5.5 5.5 0 0 1 0 11H8" />
      <path d="m8 5-4 4 4 4" />
    </>
  ),
  redo: (
    <>
      <path d="M20 9h-9.5a5.5 5.5 0 0 0 0 11H16" />
      <path d="m16 5 4 4-4 4" />
    </>
  ),
  maximize: <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5V8m13-5h3.5A1.5 1.5 0 0 1 21 4.5V8M8 21H4.5A1.5 1.5 0 0 1 3 19.5V16m18 0v3.5a1.5 1.5 0 0 1-1.5 1.5H16" />,
  cursor: <path d="M5.5 3.5 19 11l-5.6 1.6L11 18.5z" />,
  square: <rect x="4" y="4" width="16" height="16" rx="2.5" />,
  type: <path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" />,
  pen: (
    <>
      <path d="M12.5 5.5 18.5 11.5 9 21H4v-5z" />
      <path d="m15 8 3 3" />
    </>
  ),
  eraser: (
    <>
      <path d="M8 20h12" />
      <path d="m4.5 16.5 7-7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8l-3.5 3.5H7z" />
    </>
  ),
  wand: (
    <>
      <path d="M5 19 16.5 7.5" />
      <path d="m14 5 5 5" />
      <path d="M6 5v3M4.5 6.5h3M18 15v3M16.5 16.5h3" />
    </>
  ),
  branch: (
    <>
      <circle cx="7" cy="6" r="2.5" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="12" r="2.5" />
      <path d="M7 8.5v7M9.5 18h2a3 3 0 0 0 3-3v-1.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5z" />
      <path d="m4 12.5 8 4.3 8-4.3M4 16.8l8 4.2 8-4.2" />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z" />,
  filter: <path d="M4 5h16l-6.2 7.3V20l-3.6-2v-5.7z" />,
  more: (
    <>
      <circle cx="12" cy="5.5" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="12" cy="18.5" r="1.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  flag: <path d="M6 21V4h11l-1.5 4.5L17 13H6" />,
  folder: <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h6.5A1.5 1.5 0 0 1 19 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 17.5z" />,
  network: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5.5" cy="18" r="2.5" />
      <circle cx="18.5" cy="18" r="2.5" />
      <path d="M12 7.5 6.5 15.7M12 7.5l5.5 8.2M8 18h8" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  download: <path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 20h15" />,
  upload: <path d="M12 20.5v-11m0 0 4 4m-4-4-4 4M4.5 4h15" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  rocket: (
    <>
      <path d="M13.5 4.5c3.5 0 6 2.5 6 6 0 4.5-6 9-6 9l-3-3s4.5-6 9-6" />
      <path d="M10.5 13.5 7 17l-1.5 4 4-1.5 3.5-3.5" />
      <circle cx="15" cy="9" r="1.4" />
    </>
  ),
  zap: <path d="M13 3 5 13.5h5.5L10 21l8-10.5h-5.5z" />,
  'corner-arrow': <path d="M6 5v8a4 4 0 0 0 4 4h8m0 0-3.5-3.5M18 17l-3.5 3.5" />,
  columns: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15M15 4.5v15" />
    </>
  ),
  side: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9 4.5v15" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" />,
  send: <path d="M4 12 20 4l-8 16-2-6z" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name] ?? P.dot}
    </svg>
  );
}

export function OrgMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M27.5 27.5c-1.6-5.4-4.6-9.4-8.6-12.2" />
      <path d="M24.6 22.2c-3.6-2-7.4-1.6-10.4 1" />
      <path d="M21.6 17.4c-1.3-3.8-.8-7.4 1.4-10.2" />
      <path d="M36.5 27.5c1.6-5.4 4.6-9.4 8.6-12.2" />
      <path d="M39.4 22.2c3.6-2 7.4-1.6 10.4 1" />
      <path d="M42.4 17.4c1.3-3.8.8-7.4-1.4-10.2" />
      <path d="M32 25.5c-3.9 2.6-5.9 7.2-5.9 12.2 0 8.2 2.6 14.8 5.9 18.3 3.3-3.5 5.9-10.1 5.9-18.3 0-5-2-9.6-5.9-12.2Z" />
      <path d="M26.1 34.4c-2.9-1.9-5.7-2.2-8.3-.6" />
      <path d="M37.9 34.4c2.9-1.9 5.7-2.2 8.3-.6" />
    </svg>
  );
}
