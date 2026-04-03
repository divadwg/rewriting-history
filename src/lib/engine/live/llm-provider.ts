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

export interface CallOptions {
  webSearch?: boolean;
}

export async function callLLM(config: LLMConfig, prompt: string, maxTokens = 4096, options?: CallOptions): Promise<string | null> {
  switch (config.provider) {
    case 'claude':
      return callClaude(config.apiKey, prompt, maxTokens);
    case 'openai':
      return callOpenAI(config.apiKey, prompt, maxTokens, options?.webSearch);
    case 'gemini':
      return callGemini(config.apiKey, prompt, maxTokens, options?.webSearch);
    case 'grok':
      return callGrok(config.apiKey, prompt, maxTokens, options?.webSearch);
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

async function callOpenAI(apiKey: string, prompt: string, maxTokens: number, webSearch?: boolean): Promise<string | null> {
  // Use Responses API with web search when requested
  if (webSearch) {
    try {
      return await callOpenAIWithSearch(apiKey, prompt, maxTokens);
    } catch {
      // Fall back to standard chat completions if Responses API fails
    }
  }

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

async function callOpenAIWithSearch(apiKey: string, prompt: string, maxTokens: number): Promise<string | null> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELS.openai,
      max_output_tokens: maxTokens,
      tools: [{ type: 'web_search_preview' }],
      input: prompt,
    }),
  });

  if (!response.ok) throw new Error('Responses API failed');

  const data = await response.json();
  // Extract text from the response output
  const textOutput = data.output?.find((o: { type: string }) => o.type === 'message');
  return textOutput?.content?.[0]?.text ?? null;
}

async function callGemini(apiKey: string, prompt: string, maxTokens: number, webSearch?: boolean): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };

  // Enable Google Search grounding when web search is requested
  if (webSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

async function callGrok(apiKey: string, prompt: string, maxTokens: number, webSearch?: boolean): Promise<string | null> {
  // xAI Grok uses OpenAI-compatible API with optional live search
  const body: Record<string, unknown> = {
    model: MODELS.grok,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };

  // Enable Grok's live web search
  if (webSearch) {
    body.search_parameters = { mode: 'auto' };
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}
