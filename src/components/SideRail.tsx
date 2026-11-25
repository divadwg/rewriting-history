'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/cases',
    label: 'Case Studies',
    icon: <path d="M3.5 5.5h4.2l1.6 2h7.2v8h-13z" />,
  },
  {
    href: '/live',
    label: 'Live Analysis',
    icon: <path d="M2.5 10.5h3.2l2-5.5 3.6 10 2-4.5h4.2" />,
  },
  {
    href: '/challenge',
    label: 'Evidence Discovery',
    icon: (
      <>
        <circle cx="9" cy="9" r="5" />
        <path d="M12.8 12.8l4 4" />
      </>
    ),
  },
  {
    href: '/results',
    label: 'Results',
    icon: <path d="M5.5 3.5h9v13l-4.5-3.2-4.5 3.2z" />,
  },
  {
    href: '/validation',
    label: 'Validation',
    icon: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="M7.2 10.2l2 2 3.6-4" />
      </>
    ),
  },
  {
    href: '/help',
    label: 'Help',
    icon: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="M8.2 8.2a1.9 1.9 0 1 1 2.9 1.6c-.7.4-1.1.8-1.1 1.5" />
        <path d="M10 13.6v.1" />
      </>
    ),
  },
];

export function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function SideRail() {
  const pathname = usePathname();

  return (
    <nav className="rail key hidden md:flex" aria-label="Sections">
      <Link href="/" data-tip="Home" aria-label="Home" aria-current={pathname === '/' ? 'page' : undefined}>
        <NavIcon>
          <path d="M3.5 9.2L10 3.8l6.5 5.4v7.3h-4.3v-4.6H7.8v4.6H3.5z" />
        </NavIcon>
      </Link>
      <div className="rail-sep" />
      {NAV_ITEMS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          data-tip={item.label}
          aria-label={item.label}
          aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
        >
          <NavIcon>{item.icon}</NavIcon>
        </Link>
      ))}
    </nav>
  );
}
