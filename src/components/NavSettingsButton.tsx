'use client';

import { useApiKey } from './ApiKeyProvider';

export function NavSettingsButtonClient() {
  const { isConfigured, showSettings, setShowSettings } = useApiKey();

  return (
    <button
      onClick={() => setShowSettings(!showSettings)}
      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
      style={{
        background: isConfigured ? '#2a9d5c10' : '#fdf0e6',
        color: isConfigured ? '#2a9d5c' : '#e87b35',
        border: `1px solid ${isConfigured ? '#2a9d5c30' : '#e87b3530'}`,
      }}
    >
      {isConfigured ? 'API Key Set' : 'Set API Key'}
    </button>
  );
}
