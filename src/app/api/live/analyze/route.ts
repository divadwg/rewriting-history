import { NextResponse } from 'next/server';
import { buildExtractionPrompt, ArticleAnalysis } from '@/lib/engine/live/claim-extractor';
import { detectRewritingSignals, NarrativeAssessment } from '@/lib/engine/live/rewriting-detector';
import { callLLM, LLMProvider } from '@/lib/engine/live/llm-provider';

export async function POST(request: Request) {
  const body = await request.json();
  const { topic, articles, provider, apiKey } = body as {
    topic: string;
    articles: Array<{ text: string; url: string; date: string }>;
    provider?: LLMProvider;
    apiKey?: string;
  };

  if (!articles || articles.length === 0) {
    return NextResponse.json({ error: 'No articles provided' }, { status: 400 });
  }

  // Accept key from request body or fall back to env var
  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  const resolvedProvider = provider || 'claude';

  // If no API key, run in demo mode with mock extraction
  if (!resolvedKey) {
    const demoAssessment = runDemoAnalysis(topic, articles);
    return NextResponse.json({ assessment: demoAssessment, mode: 'demo' });
  }

  const config = { provider: resolvedProvider, apiKey: resolvedKey };

  try {
    // Extract claims from each article using the selected LLM
    const analyses: ArticleAnalysis[] = [];

    for (const article of articles.slice(0, 5)) {
      const prompt = buildExtractionPrompt(article.text, article.url, article.date);
      const text = await callLLM(config, prompt);
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analyses.push(JSON.parse(jsonMatch[0]) as ArticleAnalysis);
          } catch {
            // skip unparseable
          }
        }
      }
    }

    if (analyses.length === 0) {
      return NextResponse.json({ error: 'Failed to extract claims from any article' }, { status: 500 });
    }

    // Run pattern detection
    const assessment = detectRewritingSignals(analyses, topic);

    return NextResponse.json({ assessment, analyses, mode: 'live' });
  } catch (error) {
    return NextResponse.json(
      { error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * Demo mode: generates a realistic-looking analysis without an API key.
 * Uses heuristic text analysis instead of LLM extraction.
 */
function runDemoAnalysis(topic: string, articles: Array<{ text: string; url: string; date: string }>): NarrativeAssessment {
  const demoAnalyses: ArticleAnalysis[] = articles.map(article => {
    const text = article.text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    const claimPatterns = /said|stated|claimed|announced|declared|according to|reported/i;
    const claimSentences = sentences.filter(s => claimPatterns.test(s));

    const contradictionPatterns = /however|but|despite|contrary|disputed|challenged|denied|rejected/i;
    const contradictionSentences = sentences.filter(s => contradictionPatterns.test(s));

    const definitivePatterns = /confirmed|proven|established|definitively|certainly|undeniably/i;
    const uncertainPatterns = /alleged|reportedly|sources say|unconfirmed|may have|could be/i;

    return {
      claims: claimSentences.slice(0, 8).map(s => ({
        claim: s.trim().slice(0, 150),
        claimant: 'Unknown (demo mode)',
        claimantRole: 'Unknown',
        evidence_cited: [],
        date: article.date,
        confidence_language: definitivePatterns.test(s) ? 'definitive' as const :
          uncertainPatterns.test(s) ? 'uncertain' as const : 'likely' as const,
        benefits_claimant: false,
        source_article: article.url,
      })),
      contradictions: contradictionSentences.slice(0, 3).map(s => ({
        claim_a: s.trim().slice(0, 100),
        claim_b: 'Implied contradiction (demo mode)',
        nature: 'Detected contradiction language',
        source_a: article.url,
        source_b: article.url,
      })),
      sources_cited: Math.floor(Math.random() * 5) + 1,
      unique_independent_sources: Math.floor(Math.random() * 3) + 1,
      narrative_framing: 'Demo mode — connect API key for full LLM-powered analysis',
      missing_perspectives: ['Independent expert assessment', 'Opposing viewpoint'],
    };
  });

  return detectRewritingSignals(demoAnalyses, topic);
}
