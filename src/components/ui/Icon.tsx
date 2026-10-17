import type { SVGProps } from "react";

export type IconName =
  | "alert"
  | "arrow-up-right"
  | "book"
  | "briefcase"
  | "check"
  | "chevron-down"
  | "clipboard"
  | "external"
  | "eye"
  | "key"
  | "link"
  | "lock"
  | "mail"
  | "menu"
  | "message"
  | "moon"
  | "printer"
  | "refresh"
  | "search"
  | "shield-check"
  | "shield"
  | "sparkle"
  | "sun"
  | "truck"
  | "wifi-off"
  | "x";

const paths: Record<IconName, React.ReactNode> = {
  alert: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
  "arrow-up-right": <><path d="M7 17 17 7M8 7h9v9" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M8 9h8M8 13h6" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3-.5L4 20l1.5-4A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5c4.2 0 8 2.8 8 7Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
  printer: <><path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6zM18 12h.01" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.7-3L3 11" /><path d="M3 5v6h6M4 13a8 8 0 0 0 14.7 3L21 13" /><path d="M21 19v-6h-6" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  "shield-check": <><path d="M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  shield: <path d="M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6l8-3Z" />,
  sparkle: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3ZM19 16l.5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  "wifi-off": <><path d="M2 8.5a16 16 0 0 1 16.5-1M5 12a11 11 0 0 1 8.5-1M8.5 15.5a6 6 0 0 1 3-.5M12 20h.01" /><path d="m3 3 18 18" /></>,
  x: <><path d="m5 5 14 14M19 5 5 19" /></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      {paths[name]}
    </svg>
  );
}
