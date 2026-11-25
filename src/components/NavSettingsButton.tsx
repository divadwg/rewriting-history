'use client';

import { useApiKey } from './ApiKeyProvider';

export function NavSettingsButtonClient() {
  const { isConfigured, showSettings, setShowSettings } = useApiKey();

  return (
    <button
      onClick={() => setShowSettings(!showSettings)}
      className={`status ${isConfigured ? 'ok' : ''}`}
      aria-expanded={showSettings}
    >
      {isConfigured ? 'API key set' : 'Set API key'}
    </button>
  );
}
