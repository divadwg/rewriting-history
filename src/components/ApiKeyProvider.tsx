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
    <div style={{ background: '#fdf0e6', borderBottom: '1px solid #e5e5e5' }} className="px-6 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-xs" style={{ color: '#d06a2a' }}>
          {isConfigured ? 'API key configured' : 'Enter an API key to use Challenge History and Live Analysis'}
        </span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs font-bold px-3 py-1 rounded"
          style={{ color: '#e87b35' }}
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
    <div style={{ background: '#f7f7f7', borderBottom: '1px solid #e5e5e5' }} className="px-6 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold mb-3" style={{ color: '#1a1a1a' }}>LLM Provider</div>
        <div className="flex gap-2 mb-4">
          {providers.map(p => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: provider === p ? '#e87b35' : '#ffffff',
                color: provider === p ? '#ffffff' : '#6b6b6b',
                border: `1px solid ${provider === p ? '#e87b35' : '#e5e5e5'}`,
              }}
            >
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
            className="flex-1 rounded-lg px-4 py-2 text-sm"
            style={{ background: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a', maxWidth: 400 }}
          />
          {apiKey && (
            <button
              onClick={() => setApiKey('')}
              className="text-xs px-3 py-1.5 rounded"
              style={{ color: '#c44536', border: '1px solid #e5e5e5' }}
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs mt-2" style={{ color: '#999999' }}>
          Your key is stored in your browser only and sent directly to the provider API. Never stored on our server.
        </p>
      </div>
    </div>
  );
}
