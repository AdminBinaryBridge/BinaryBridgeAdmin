import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps, path: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path}
    </svg>
  );
}

export const DashboardIcon = (props: IconProps) =>
  base(
    props,
    <path d="M3.75 12h4.5v8.25h-4.5V12zM9.75 3.75h4.5v16.5h-4.5V3.75zM15.75 8.25h4.5v12h-4.5v-12z" />,
  );

export const GlobeIcon = (props: IconProps) =>
  base(
    props,
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.75 12h16.5M12 3.75c2.5 2.3 3.75 5.2 3.75 8.25s-1.25 5.95-3.75 8.25c-2.5-2.3-3.75-5.2-3.75-8.25S9.5 6.05 12 3.75z" />
    </>,
  );

export const UsersIcon = (props: IconProps) =>
  base(
    props,
    <>
      <circle cx="9" cy="8.25" r="3" />
      <path d="M3.75 19.5c0-2.9 2.35-5.25 5.25-5.25s5.25 2.35 5.25 5.25M15 9a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2zM16.5 14.5c2.1.4 3.75 2.3 3.75 4.7" />
    </>,
  );

export const ImageIcon = (props: IconProps) =>
  base(
    props,
    <>
      <rect x="3.75" y="4.5" width="16.5" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4.5 16.5l4.5-4.5 3 3 3.75-4.5 4.75 6" />
    </>,
  );

export const ChatIcon = (props: IconProps) =>
  base(
    props,
    <path d="M4.5 5.25h15a.75.75 0 01.75.75v9a.75.75 0 01-.75.75H9l-4.5 3.75V6a.75.75 0 01.75-.75z" />,
  );

export const FlagIcon = (props: IconProps) =>
  base(
    props,
    <path d="M5.25 3.75v16.5M5.25 4.5h9l-1.5 3.75 1.5 3.75h-9V4.5z" />,
  );

export const MailIcon = (props: IconProps) =>
  base(
    props,
    <>
      <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2" />
      <path d="M3.75 6l8.25 6.75L20.25 6" />
    </>,
  );

export const DocIcon = (props: IconProps) =>
  base(
    props,
    <>
      <path d="M6.75 3.75h7.5l4.5 4.5v11.25a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V4.5a.75.75 0 01.75-.75z" />
      <path d="M14.25 3.75V8.5h4.5M9 12.75h6M9 15.75h6M9 9.75h2.25" />
    </>,
  );

export const TagIcon = (props: IconProps) =>
  base(
    props,
    <>
      <path d="M11.25 4.5H6a1.5 1.5 0 00-1.5 1.5v5.25L13 20a1.5 1.5 0 002.12 0l5.38-5.38a1.5 1.5 0 000-2.12L11.25 4.5z" />
      <circle cx="8.25" cy="8.25" r="1.125" />
    </>,
  );

export const GearIcon = (props: IconProps) =>
  base(
    props,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.7 7.7 0 000-3l1.9-1.5-1.9-3.3-2.3.7a7.6 7.6 0 00-2.6-1.5L14 2.5h-4l-.5 2.4a7.6 7.6 0 00-2.6 1.5l-2.3-.7-1.9 3.3 1.9 1.5a7.7 7.7 0 000 3l-1.9 1.5 1.9 3.3 2.3-.7c.77.65 1.65 1.16 2.6 1.5l.5 2.4h4l.5-2.4a7.6 7.6 0 002.6-1.5l2.3.7 1.9-3.3-1.9-1.5z" />
    </>,
  );

export const LogoutIcon = (props: IconProps) =>
  base(
    props,
    <path d="M9 21H5.25a1.5 1.5 0 01-1.5-1.5v-15a1.5 1.5 0 011.5-1.5H9M15.75 16.5l4.5-4.5-4.5-4.5M20.25 12H9" />,
  );
