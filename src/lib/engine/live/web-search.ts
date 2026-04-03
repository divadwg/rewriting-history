/**
 * Web search utility for grounding LLM evidence in real web data.
 * Uses DuckDuckGo for searches (no API key required).
 */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Search the web using DuckDuckGo's HTML endpoint.
 * Returns a list of search results with titles, snippets, and URLs.
 */
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; RewritingHistory/1.0)',
      },
      body: `q=${encodeURIComponent(query)}&kl=us-en`,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    return parseDuckDuckGoResults(html, maxResults);
  } catch {
    // Fallback to DuckDuckGo instant answer API
    return duckDuckGoInstant(query, maxResults);
  }
}

function parseDuckDuckGoResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks - DuckDuckGo lite HTML has a specific structure
  const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = resultPattern.exec(html)) !== null && results.length < maxResults) {
    const url = decodeURIComponent(match[1].replace(/.*uddg=([^&]+).*/, '$1') || match[1]);
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const snippet = match[3].replace(/<[^>]+>/g, '').trim();

    if (title && snippet && url.startsWith('http')) {
      results.push({ title, snippet, url });
    }
  }

  // Fallback: try simpler pattern
  if (results.length === 0) {
    const simplePattern = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = simplePattern.exec(html)) !== null && results.length < maxResults) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      if (title && url) {
        results.push({ title, snippet: '', url });
      }
    }
  }

  return results;
}

async function duckDuckGoInstant(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const results: SearchResult[] = [];

    // Abstract
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        snippet: data.Abstract,
        url: data.AbstractURL,
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults) break;
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 80),
            snippet: topic.Text,
            url: topic.FirstURL,
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Run multiple searches in parallel and deduplicate results.
 */
export async function multiSearch(queries: string[], maxResultsPerQuery = 3): Promise<SearchResult[]> {
  const allResults = await Promise.all(
    queries.map(q => webSearch(q, maxResultsPerQuery))
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  for (const results of allResults) {
    for (const r of results) {
      const domain = extractDomain(r.url);
      if (!seen.has(domain + r.title.slice(0, 30))) {
        seen.add(domain + r.title.slice(0, 30));
        unique.push(r);
      }
    }
  }

  return unique;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Format search results as context for an LLM prompt.
 */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  return `\n\nWEB SEARCH RESULTS (use these as real sources — cite the URLs):\n` +
    results.map((r, i) =>
      `[${i + 1}] "${r.title}"\n    ${r.snippet}\n    URL: ${r.url}`
    ).join('\n\n');
}
