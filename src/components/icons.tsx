// Inline SVG icons. All of them draw with `currentColor`, so the colour comes from CSS.
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const icon = (props: IconProps, viewBox: string, defaultSize: number) => {
  const { size = defaultSize, ...rest } = props
  return { width: size, height: size, viewBox, fill: 'none', 'aria-hidden': true, ...rest }
}

export const MenuIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 22 16', 22)} height={16}>
    <rect width="22" height="2" rx="1" fill="currentColor" />
    <rect y="7" width="22" height="2" rx="1" fill="currentColor" />
    <rect y="14" width="22" height="2" rx="1" fill="currentColor" />
  </svg>
)

export const UserIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export const SignInIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 15)}>
    <path
      d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

export const CardIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="4" cy="9" r="1" fill="currentColor" />
  </svg>
)

export const SettingsIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const PartnersIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M1 13c0-2 1.3-3.5 3-3.5M13 13c0-2-1.3-3.5-3-3.5M6 13c0-1.8 1-3 2-3s2 1.2 2 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const SupportIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 9V7.5c1.2-.3 2-1.2 2-2.5a2 2 0 0 0-4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="7" cy="11" r="0.7" fill="currentColor" />
  </svg>
)

export const QuestionIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M5.4 5.4a1.7 1.7 0 1 1 2.5 1.5c-.7.4-.9.8-.9 1.5M7 10.5v.1"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

export const CalendarIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4.5 1v3M9.5 1v3M1.5 6h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path
      d="M4 9h1.5M4 11.5h1.5M8.5 9h1.5M8.5 11.5h1.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
)

export const DocumentIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
)

export const LogoutIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 15)}>
    <path
      d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M9 10l4-3-4-3M13 7H5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ExternalLinkIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 15)}>
    <path
      d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 12 12', 11)}>
    <path
      d="m2.5 4.5 3.5 3 3.5-3"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 16)}>
    <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const CopyIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 16)}>
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

export const DownloadIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 16)}>
    <path
      d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 11v2.5h11V11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const WalletIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 15)}>
    <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="5" cy="10" r="1" fill="currentColor" />
  </svg>
)

export const SparkleIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 18 18', 18)}>
    <path
      d="M7.2 2.5c.45 3.05 1.9 4.5 4.95 4.95-3.05.45-4.5 1.9-4.95 4.95-.45-3.05-1.9-4.5-4.95-4.95 3.05-.45 4.5-1.9 4.95-4.95Z"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinejoin="round"
    />
    <circle cx="14.3" cy="3.5" r="1.35" stroke="currentColor" strokeWidth="1.35" />
  </svg>
)

/** Bolder sparkle drawn on a 20px grid, used inside the "Build prompt" button. */
export const SparkleBoldIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 20 20', 18)}>
    <path
      d="M8 2.5c.5 3.4 2.1 5 5.5 5.5C10.1 8.5 8.5 10.1 8 13.5 7.5 10.1 5.9 8.5 2.5 8 5.9 7.5 7.5 5.9 8 2.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const BoltIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 14 14', 14)}>
    <path d="M8 1L2 8h5l-1 5 7-8H8l1-4z" fill="currentColor" />
  </svg>
)

export const GearIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 24 24', 18)}>
    <path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

export const SlidersIcon = (props: IconProps) => (
  <svg {...icon(props, '0 0 16 16', 16)}>
    <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)
