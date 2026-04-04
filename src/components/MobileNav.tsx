'use client';

import { useState } from 'react';
import { useApiKey } from '@/components/ApiKeyProvider';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { setShowSettings } = useApiKey();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded"
        style={{ color: '#2d3435' }}
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" />
          )}
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 px-4 pb-4 pt-2 flex flex-col gap-1"
          style={{ background: 'rgba(249,249,249,0.95)', backdropFilter: 'blur(12px)' }}
        >
          {[
            { href: '/cases', label: 'Case Studies' },
            { href: '/live', label: 'Live Analysis' },
            { href: '/challenge', label: 'Evidence Discovery', accent: true },
            { href: '/results', label: 'Results' },
            { href: '/validation', label: 'Validation' },
            { href: '/help', label: 'Help' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 px-3 rounded text-sm transition-colors"
              style={{
                color: item.accent ? '#a23f00' : '#2d3435',
                fontWeight: item.accent ? 600 : 400,
                background: 'transparent',
              }}
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={() => { setShowSettings(true); setOpen(false); }}
            className="text-left py-2.5 px-3 rounded text-sm"
            style={{ color: '#6b7374' }}
          >
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
