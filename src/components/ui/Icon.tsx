import type { SVGProps } from 'react';

/**
 * One icon set, one drawing language: 24px grid, 1.75 stroke, round caps and
 * joins, `currentColor`. Decorative by default (`aria-hidden`); a caller whose
 * icon is the only content of a control labels the control, not the icon.
 */
const paths = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  chat: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  rocket: (
    <>
      <path d="M14 4c3.5-.5 5.5-.3 6-.3.2.5.4 2.5-.3 6L14 15.5 8.5 10 14 4Z" />
      <path d="M8.5 10 5 10.5 3 14l4 .5M14 15.5l-.5 3.5-3.5 2-.5-4" />
      <circle cx="15.5" cy="8.5" r="1.25" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  minus: <path d="M6 12h12" />,
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
