import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url } = await request.json() as { url: string };

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RewritingHistory/1.0; +https://rewritinghistory.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';

    // Extract date
    const datePatterns = [
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
      /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']publish[_-]?date["'][^>]+content=["']([^"']+)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i,
    ];
    let date = '';
    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString().split('T')[0];
          break;
        }
      }
    }
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    // Extract article text - try multiple strategies
    let text = '';

    // Strategy 1: Look for <article> tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      text = stripHtml(articleMatch[1]);
    }

    // Strategy 2: Look for common article body classes
    if (text.length < 200) {
      const bodyPatterns = [
        /<div[^>]+class=["'][^"']*(?:article[_-]?body|story[_-]?body|post[_-]?content|entry[_-]?content|article[_-]?content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]+class=["'][^"']*(?:content[_-]?body|text[_-]?body|main[_-]?content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      ];
      for (const pattern of bodyPatterns) {
        const match = html.match(pattern);
        if (match && stripHtml(match[1]).length > text.length) {
          text = stripHtml(match[1]);
        }
      }
    }

    // Strategy 3: Grab all <p> tags from the main content area
    if (text.length < 200) {
      const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
      const pTexts = paragraphs
        .map(p => stripHtml(p))
        .filter(t => t.length > 40 && !t.includes('cookie') && !t.includes('subscribe'));
      if (pTexts.length > 0) {
        text = pTexts.join('\n\n');
      }
    }

    // Strategy 4: Fall back to stripping all HTML from body
    if (text.length < 200) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        text = stripHtml(bodyMatch[1]);
      }
    }

    text = text.trim().slice(0, 15000);

    if (text.length < 50) {
      return NextResponse.json({
        error: 'Could not extract article text. The site may block automated access. Try pasting the text manually.',
      }, { status: 422 });
    }

    return NextResponse.json({ title: title.trim(), text, date, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ error: 'Request timed out. The site may be slow or blocking automated access.' }, { status: 504 });
    }
    return NextResponse.json({ error: `Failed to fetch article: ${message}` }, { status: 502 });
  }
}

function stripHtml(html: string): string {
  return html
    // Remove script and style tags entirely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
