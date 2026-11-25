'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApiKey } from '@/components/ApiKeyProvider';
import { NAV_ITEMS, NavIcon, isCurrent } from '@/components/SideRail';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { setShowSettings } = useApiKey();
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-icon"
        aria-label="Menu"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" />
          )}
        </svg>
      </button>
      {open && (
        <div
          className="card nav-rows absolute left-3 right-3 z-50 p-2 flex flex-col gap-0.5"
          style={{ top: 62 }}
        >
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </Link>
          ))}
          <button onClick={() => { setShowSettings(true); setOpen(false); }}>
            <NavIcon>
              <circle cx="7" cy="10" r="3.2" />
              <path d="M10.2 10h6.3M14 10v2.4M16.5 10v1.8" />
            </NavIcon>
            API key settings
          </button>
        </div>
      )}
    </div>
  );
}
