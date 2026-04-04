import type { Metadata } from "next";
import "./globals.css";
import { ApiKeyProvider, ApiKeyBanner, ApiKeySettings } from "@/components/ApiKeyProvider";
import { ScribbleLogo } from "@/components/ScribbleLogo";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: '#ffffff', color: '#1a1a1a' }}>
        <ApiKeyProvider>
          <nav className="border-b px-6 py-3 flex items-center gap-8" style={{ borderColor: '#e5e5e5', background: '#ffffff' }}>
            <a href="/" className="flex items-center gap-2">
              <ScribbleLogo size={30} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: '#1a1a1a', fontFamily: "'DM Mono', monospace" }}>
                REWRITING HISTORY
              </span>
            </a>
            <div className="flex gap-6 text-sm flex-1">
              <a href="/cases" className="hover:opacity-80 transition-opacity" style={{ color: '#6b6b6b' }}>
                Case Studies
              </a>
              <a href="/live" className="hover:opacity-80 transition-opacity" style={{ color: '#6b6b6b' }}>
                Live Analysis
              </a>
              <a href="/challenge" className="hover:opacity-80 transition-opacity font-bold" style={{ color: '#e87b35' }}>
                Evidence Discovery
              </a>
              <a href="/validation" className="hover:opacity-80 transition-opacity" style={{ color: '#6b6b6b' }}>
                Validation
              </a>
              <a href="/help" className="hover:opacity-80 transition-opacity" style={{ color: '#6b6b6b' }}>
                Help
              </a>
            </div>
            <NavSettingsButton />
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
