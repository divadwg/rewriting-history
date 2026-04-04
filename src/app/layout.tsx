import type { Metadata } from "next";
import "./globals.css";
import { ApiKeyProvider, ApiKeyBanner, ApiKeySettings } from "@/components/ApiKeyProvider";
import { ScribbleLogo } from "@/components/ScribbleLogo";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Rewriting History",
  description: "A scientific approach to detecting historical inconsistencies using Bayesian inference, causal models, and knowledge graphs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Work+Sans:ital,wght@0,100..900;1,100..900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: '#f9f9f9', color: '#2d3435' }}>
        <ApiKeyProvider>
          <nav className="glass-nav sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-8">
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              <ScribbleLogo size={28} />
              <span className="text-xs sm:text-sm font-medium tracking-widest uppercase hidden sm:inline"
                style={{ color: '#2d3435', fontFamily: "'DM Mono', monospace" }}>
                REWRITING HISTORY
              </span>
            </a>
            {/* Desktop nav */}
            <div className="hidden md:flex gap-5 text-sm flex-1" style={{ fontFamily: "'Work Sans', sans-serif" }}>
              <a href="/cases" className="hover:opacity-70 transition-opacity" style={{ color: '#6b7374' }}>
                Case Studies
              </a>
              <a href="/live" className="hover:opacity-70 transition-opacity" style={{ color: '#6b7374' }}>
                Live Analysis
              </a>
              <a href="/challenge" className="hover:opacity-70 transition-opacity font-semibold" style={{ color: '#a23f00' }}>
                Evidence Discovery
              </a>
              <a href="/results" className="hover:opacity-70 transition-opacity" style={{ color: '#6b7374' }}>
                Results
              </a>
              <a href="/validation" className="hover:opacity-70 transition-opacity" style={{ color: '#6b7374' }}>
                Validation
              </a>
              <a href="/help" className="hover:opacity-70 transition-opacity" style={{ color: '#6b7374' }}>
                Help
              </a>
            </div>
            <div className="hidden md:block">
              <NavSettingsButton />
            </div>
            {/* Mobile nav */}
            <div className="flex-1 md:hidden" />
            <MobileNav />
          </nav>
          <ApiKeyBanner />
          <ApiKeySettings />
          <main className="flex-1">{children}</main>
        </ApiKeyProvider>
      </body>
    </html>
  );
}

function NavSettingsButton() {
  return <NavSettingsButtonClient />;
}

// Separate client component for the nav button
import { NavSettingsButtonClient } from "@/components/NavSettingsButton";
