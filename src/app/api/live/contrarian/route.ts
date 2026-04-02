import { NextResponse } from 'next/server';
import { buildContrarianPrompt, buildDiscoveryPrompt, ContrarianResult } from '@/lib/engine/live/contrarian-engine';
import { updatePosteriors, evidenceSensitivity, generateVerdict } from '@/lib/engine/bayesian';
import { callLLM, LLMProvider } from '@/lib/engine/live/llm-provider';

export async function POST(request: Request) {
  const body = await request.json();
  const { belief, category, alreadyDone, provider, apiKey } = body as {
    belief?: string;
    category?: string;
    alreadyDone?: string[];
    provider?: LLMProvider;
    apiKey?: string;
  };

  // Accept key from request body or fall back to env var
  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY;
  const resolvedProvider = provider || 'claude';

  if (!resolvedKey) {
    return NextResponse.json({
      error: 'No API key provided. Set one in the Settings menu.',
    }, { status: 400 });
  }

  const config = { provider: resolvedProvider, apiKey: resolvedKey };

  try {
    // Step 1: If category provided but no belief, auto-discover a belief
    let targetBelief = belief?.trim();

    if (!targetBelief && category) {
      const discoveryPrompt = buildDiscoveryPrompt(category, alreadyDone || []);
      const discovered = await callLLM(config, discoveryPrompt, 256);
      if (!discovered) {
        return NextResponse.json({ error: 'Failed to discover a belief for this category' }, { status: 500 });
      }
      targetBelief = discovered.trim().replace(/^["']|["']$/g, '');
    }

    if (!targetBelief || targetBelief.length < 10) {
      return NextResponse.json({ error: 'No belief to analyze' }, { status: 400 });
    }

    // Step 2: Run the contrarian analysis
    const prompt = buildContrarianPrompt(targetBelief);
    const text = await callLLM(config, prompt);

    if (!text) {
      return NextResponse.json({ error: 'Empty response from analysis' }, { status: 500 });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse structured response' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]) as ContrarianResult;

    // Step 3: Run Bayesian analysis
    const posteriors = updatePosteriors(result.hypotheses, result.evidence);
    const sensitivity = evidenceSensitivity(result.hypotheses, result.evidence);
    const verdict = generateVerdict(result.hypotheses, result.evidence);

    return NextResponse.json({
      result,
      bayesian: { posteriors, sensitivity, verdict },
      discoveredBelief: !belief ? targetBelief : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
