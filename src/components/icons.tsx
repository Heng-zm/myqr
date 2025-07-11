import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.5v4.75A1.75 1.75 0 0 1 19.25 19h-4.5A1.75 1.75 0 0 1 13 17.25v-4.5A1.75 1.75 0 0 1 14.75 11h4.5A1.75 1.75 0 0 1 21 12.75Z" />
      <path d="M10 5H6a1 1 0 0 0-1 1v4" />
      <path d="M14 5h1a1 1 0 0 1 1 1v1" />
      <path d="M3 10v4a1 1 0 0 0 1 1h4" />
      <path d="M3 6a1 1 0 0 1 1-1h1" />
    </svg>
  ),
};
