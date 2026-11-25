import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import {
  ApiKeyProvider,
  ApiKeyBanner,
  ApiKeySettings,
} from '@/components/ApiKeyProvider';
import { ScribbleLogo } from '@/components/ScribbleLogo';
import MobileNav from '@/components/MobileNav';
import SideRail from '@/components/SideRail';

export const metadata: Metadata = {
  title: 'Rewriting History',
  description:
    'A scientific approach to detecting historical inconsistencies using Bayesian inference, causal models, and knowledge graphs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <ApiKeyProvider>
          <div className="shell app-shell">
            <SideRail />
            <div className="tray app-main">
              <header className="app-head">
                <Link href="/" className="app-brand">
                  <ScribbleLogo size={28} />
                  <span className="label" style={{ color: 'var(--ink)' }}>Rewriting History</span>
                </Link>
                <div className="flex-1" />
                <div className="hidden md:block">
                  <NavSettingsButton />
                </div>
                <MobileNav />
              </header>
              <ApiKeyBanner />
              <ApiKeySettings />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </ApiKeyProvider>
      </body>
    </html>
  );
}

function NavSettingsButton() {
  return <NavSettingsButtonClient />;
}

// Separate client component for the nav button
import { NavSettingsButtonClient } from '@/components/NavSettingsButton';
