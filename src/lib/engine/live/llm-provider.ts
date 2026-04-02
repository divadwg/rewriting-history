/**
 * Multi-provider LLM abstraction.
 * Supports Claude, OpenAI, Gemini, and Grok (xAI).
 * Each provider uses its own API format but returns plain text.
 */

export type LLMProvider = 'claude' | 'openai' | 'gemini' | 'grok';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
}

export const PROVIDER_INFO: Record<LLMProvider, { label: string; placeholder: string; prefix: string }> = {
  claude: { label: 'Claude (Anthropic)', placeholder: 'sk-ant-...', prefix: 'sk-ant-' },
  openai: { label: 'OpenAI', placeholder: 'sk-...', prefix: 'sk-' },
  gemini: { label: 'Gemini (Google)', placeholder: 'AIza...', prefix: 'AIza' },
  grok: { label: 'Grok (xAI)', placeholder: 'xai-...', prefix: 'xai-' },
};

const MODELS: Record<LLMProvider, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  grok: 'grok-3',
};

export async function callLLM(config: LLMConfig, prompt: string, maxTokens = 4096): Promise<string | null> {
  switch (config.provider) {
    case 'claude':
      return callClaude(config.apiKey, prompt, maxTokens);
    case 'openai':
      return callOpenAI(config.apiKey, prompt, maxTokens);
    case 'gemini':
      return callGemini(config.apiKey, prompt, maxTokens);
    case 'grok':
      return callGrok(config.apiKey, prompt, maxTokens);
    default:
      return null;
  }
}

async function callClaude(apiKey: string, prompt: string, maxTokens: number): Promise<string | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELS.claude,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? null;
}

async function callOpenAI(apiKey: string, prompt: string, maxTokens: number): Promise<string | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELS.openai,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

async function callGemini(apiKey: string, prompt: string, maxTokens: number): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function callGrok(apiKey: string, prompt: string, maxTokens: number): Promise<string | null> {
  // xAI Grok uses OpenAI-compatible API
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELS.grok,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}
