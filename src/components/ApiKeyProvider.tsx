'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LLMProvider, PROVIDER_INFO } from '@/lib/engine/live/llm-provider';

interface ApiKeyState {
  provider: LLMProvider;
  apiKey: string;
  setProvider: (p: LLMProvider) => void;
  setApiKey: (k: string) => void;
  isConfigured: boolean;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyState>({
  provider: 'claude',
  apiKey: '',
  setProvider: () => {},
  setApiKey: () => {},
  isConfigured: false,
  showSettings: false,
  setShowSettings: () => {},
});

export function useApiKey() {
  return useContext(ApiKeyContext);
}

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<LLMProvider>('claude');
  const [apiKey, setApiKeyState] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rh_provider');
    const savedKey = localStorage.getItem('rh_apikey');
    if (saved && (saved === 'claude' || saved === 'openai' || saved === 'gemini' || saved === 'grok')) {
      setProviderState(saved as LLMProvider);
    }
    if (savedKey) setApiKeyState(savedKey);
    setLoaded(true);
  }, []);

  const setProvider = (p: LLMProvider) => {
    setProviderState(p);
    localStorage.setItem('rh_provider', p);
  };

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    if (k) {
      localStorage.setItem('rh_apikey', k);
    } else {
      localStorage.removeItem('rh_apikey');
    }
  };

  if (!loaded) return null;

  return (
    <ApiKeyContext.Provider value={{
      provider,
      apiKey,
      setProvider,
      setApiKey,
      isConfigured: apiKey.length > 8,
      showSettings,
      setShowSettings,
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function ApiKeyBanner() {
  const { isConfigured, showSettings, setShowSettings } = useApiKey();

  if (isConfigured && !showSettings) return null;

  return (
    <div className="px-3 sm:px-4 pt-3">
      <div className="callout">
        <span className="tile key">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="10" r="3.2" />
            <path d="M10.2 10h6.3M14 10v2.4M16.5 10v1.8" />
          </svg>
        </span>
        <span className="text-xs flex-1 min-w-0" style={{ color: 'var(--body)' }}>
          {isConfigured ? 'API key configured' : 'Enter an API key to use Evidence Discovery and Live Analysis'}
        </span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn text-xs px-4 py-2 flex-shrink-0"
        >
          {showSettings ? 'Close' : 'Settings'}
        </button>
      </div>
    </div>
  );
}

export function ApiKeySettings() {
  const { provider, apiKey, setProvider, setApiKey, showSettings } = useApiKey();

  if (!showSettings) return null;

  const providers: LLMProvider[] = ['claude', 'openai', 'gemini', 'grok'];

  return (
    <div className="px-3 sm:px-4 pt-3">
      <div className="card p-4 sm:p-5">
        <div className="label mb-3">LLM provider</div>
        <div className="seg mb-4">
          {providers.map(p => (
            <button key={p} onClick={() => setProvider(p)} aria-pressed={provider === p}>
              {PROVIDER_INFO[p].label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={PROVIDER_INFO[provider].placeholder}
            aria-label="API key"
            className="field flex-1 px-4 py-2 text-sm"
            style={{ maxWidth: 400 }}
          />
          {apiKey && (
            <button onClick={() => setApiKey('')} className="btn text-xs px-4 py-2">
              Clear
            </button>
          )}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          Your key is stored in your browser only and sent directly to the provider API. Never stored on our server.
        </p>
      </div>
    </div>
  );
}
