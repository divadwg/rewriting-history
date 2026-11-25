'use client';

import { useState, useCallback } from 'react';
import { TOPIC_CATEGORIES, SUGGESTED_BELIEFS, SynthesisResult } from '@/lib/engine/live/contrarian-engine';
import { ContrarianResult } from '@/lib/engine/live/contrarian-engine';
import { BayesianVerdict } from '@/lib/types/graph';
import { useApiKey } from '@/components/ApiKeyProvider';

interface RawEvidenceLink {
  id: string;
  sourceUrl: string | null;
  searchQuery: string | null;
}

interface AnalysisResponse {
  result: ContrarianResult;
  bayesian: {
    posteriors: Array<{ id: string; label: string; posterior: number; isOfficial: boolean }>;
    sensitivity: Array<{ evidenceId: string; label: string; impact: number }>;
    verdict: BayesianVerdict;
  };
  stability?: number;
  discoveredBelief?: string;
  synthesis?: SynthesisResult;
  rawEvidence?: RawEvidenceLink[];
  rawEvidenceCount?: number;
  hypothesisCount?: number;
  pipeline?: string;
}

function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function formatProb(v: number): string {
  if (v > 0.01) return `${(v * 100).toFixed(1)}%`;
  if (v > 0.001) return `${(v * 100).toFixed(2)}%`;
  return '~0%';
}

export default function ChallengePage() {
  const [belief, setBelief] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const { provider, apiKey, isConfigured, setShowSettings } = useApiKey();

  const analyzeByBelief = useCallback(async (text: string) => {
    if (text.trim().length < 10) {
      setError('Enter a research question (10+ characters)');
      return;
    }
    if (!isConfigured) {
      setError('Set an API key first (click Settings in the top nav)');
      setShowSettings(true);
      return;
    }

    setBelief(text);
    setLoading(true);
    setLoadingCategory(null);
    setLoadingStep('Gathering primary source evidence...');
    setError(null);
    setResponse(null);

    // Simulate step progression (actual steps happen server-side)
    const stepTimer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev.includes('Gathering')) return 'Generating hypotheses from evidence...';
        if (prev.includes('Generating')) return 'Running Bayesian inference...';
        if (prev.includes('Running')) return 'Synthesizing discovery...';
        return prev;
      });
    }, 8000);

    try {
      const res = await fetch('/api/live/contrarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ belief: text, provider, apiKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setResponse(data);
      setHistory(prev => [...prev, text]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setLoadingStep('');
    }
  }, [isConfigured, provider, apiKey, setShowSettings]);

  const discoverByCategory = useCallback(async (categoryId: string) => {
    if (!isConfigured) {
      setError('Set an API key first (click Settings in the top nav)');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setLoadingCategory(categoryId);
    setLoadingStep('Finding an underexplored research question...');
    setError(null);
    setResponse(null);
    setBelief('');

    const stepTimer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev.includes('Finding')) return 'Gathering primary source evidence...';
        if (prev.includes('Gathering')) return 'Generating hypotheses from evidence...';
        if (prev.includes('Generating')) return 'Running Bayesian inference...';
        if (prev.includes('Running')) return 'Synthesizing discovery...';
        return prev;
      });
    }, 8000);

    try {
      const res = await fetch('/api/live/contrarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, alreadyDone: history, provider, apiKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Discovery failed');

      if (data.discoveredBelief) {
        setBelief(data.discoveredBelief);
      }
      setResponse(data);
      if (data.result?.belief) {
        setHistory(prev => [...prev, data.result.belief]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setLoadingStep('');
      setLoadingCategory(null);
    }
  }, [history, isConfigured, provider, apiKey, setShowSettings]);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveAndShare = useCallback(async () => {
    if (!response) return;
    setSaving(true);
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'challenge',
          title: response.result?.belief || belief || 'Evidence-First Discovery',
          data: response,
        }),
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = `${window.location.origin}${data.url}`;
        setShareUrl(fullUrl);
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [response, belief]);

  const reset = () => {
    setResponse(null);
    setBelief('');
    setError(null);
    setShareUrl(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>Evidence-First Discovery</h1>
      <p className="text-sm mb-2" style={{ color: 'var(--body)' }}>
        This system gathers <strong>raw primary source evidence first</strong>, then generates hypotheses
        from the evidence, runs Bayesian inference, and surfaces what the data actually shows —
        including things nobody may have noticed.
      </p>
      <div className="text-xs mb-8 font-mono flex flex-wrap gap-4" style={{ color: 'var(--muted)' }}>
        <span>1. Evidence</span>
        <span style={{ color: 'var(--faint)' }}>→</span>
        <span>2. Hypotheses</span>
        <span style={{ color: 'var(--faint)' }}>→</span>
        <span>3. Bayesian Math</span>
        <span style={{ color: 'var(--faint)' }}>→</span>
        <span>4. Discovery</span>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-8">
        <input
          type="text"
          value={belief}
          onChange={e => setBelief(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyzeByBelief(belief)}
          placeholder="Enter a specific research question, e.g. 'What do casualty records reveal about...'"
          className="field flex-1 rounded-lg px-4 py-3 text-sm"
          style={{ color: 'var(--ink)' }}
          disabled={loading}
        />
        <button
          onClick={() => analyzeByBelief(belief)}
          disabled={loading || belief.trim().length < 10}
          className="btn-primary px-6 py-3 rounded-lg font-semibold text-sm transition-opacity"
          style={{
            color: 'var(--on-key)',
            opacity: loading || belief.trim().length < 10 ? 0.5 : 1
          }}
        >
          Analyze Evidence
        </button>
      </div>

      {error && (
        <div className="well text-xs rounded-lg p-3 mb-6" style={{ color: 'var(--ink)' }}>
          {error}
        </div>
      )}

      {/* Topic category buttons */}
      {!response && !loading && (
        <>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
            Auto-discover by topic — the system finds an underexplored question:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {TOPIC_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => discoverByCategory(cat.id)}
                disabled={loading}
                className="card rounded-lg p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.98]">
                <div className="text-2xl font-mono mb-1" style={{ color: cat.id === 'surprise' ? 'var(--ink)' : 'var(--body)' }}>
                  {cat.icon}
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{cat.label}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{cat.description}</div>
              </button>
            ))}
          </div>

          {/* Suggested research questions */}
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
            Or try a specific research question:
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {SUGGESTED_BELIEFS.map((s, i) => (
              <button
                key={i}
                onClick={() => analyzeByBelief(s.belief)}
                className="card text-left rounded-lg p-4 transition-all hover:scale-[1.01]">
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  {s.belief}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="tag text-xs px-2 py-0.5 rounded" style={{ color: 'var(--body)' }}>
                    {s.category}
                  </span>
                </div>
                <div className="text-xs italic" style={{ color: 'var(--muted)' }}>
                  Evidence: {s.hint}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Loading with pipeline steps */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ borderColor: 'var(--line)', borderTopColor: 'var(--ink)' }} />
          <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {loadingStep}
          </div>
          {loadingCategory && (
            <div className="text-xs mt-1" style={{ color: 'var(--body)' }}>
              Topic: {TOPIC_CATEGORIES.find(c => c.id === loadingCategory)?.label || loadingCategory}
            </div>
          )}
          <div className="text-xs mt-3 max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            The system gathers primary sources first, then builds hypotheses from the evidence,
            runs Bayesian inference, and synthesizes what the math reveals. This takes 30-60 seconds.
          </div>

          {/* Pipeline steps */}
          <div className="mt-6 flex justify-center gap-2">
            {['Evidence', 'Hypotheses', 'Bayesian Math', 'Synthesis'].map((step, i) => {
              const isActive = loadingStep.toLowerCase().includes(step.toLowerCase().split(' ')[0]);
              const isDone = ['Evidence', 'Hypotheses', 'Bayesian Math', 'Synthesis'].indexOf(step) <
                ['gathering', 'generating', 'running', 'synthesizing'].findIndex(s => loadingStep.toLowerCase().includes(s));
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className="text-xs px-2 py-1 rounded font-mono" style={{
                    background: isActive ? 'var(--key)' : isDone ? 'var(--white)' : 'var(--well)',
                    color: isActive ? 'var(--on-key)' : isDone ? 'var(--lime-deep)' : 'var(--muted)'
                  }}>
                    {step}
                  </div>
                  {i < 3 && <span style={{ color: 'var(--faint)' }}>→</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="space-y-8">
          {/* Pipeline badge */}
          {response.pipeline === 'evidence-first' && (
            <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>
              <span className="tag px-2 py-1 rounded" style={{ color: 'var(--lime-deep)' }}>
                Evidence-first pipeline
              </span>
              <span>{response.rawEvidenceCount} primary sources gathered</span>
              <span>{response.hypothesisCount} hypotheses generated</span>
              <span>Bayesian posteriors computed mathematically</span>
            </div>
          )}

          {/* Research Question */}
          <div className="card rounded-lg p-6">
            <div className="text-xs font-mono mb-2" style={{ color: 'var(--muted)' }}>RESEARCH QUESTION</div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--ink)' }}>
              {response.result.belief}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Popular understanding</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
                  {response.result.standardNarrative}
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>What the evidence shows</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
                  {response.result.contrarianCase}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="well rounded-lg p-5">
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--ink)' }}>KEY FINDING</div>
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
              {response.result.keyInsight}
            </p>
          </div>

          {/* Novel Finding */}
          {response.synthesis?.novelFinding && (
            <div className="well rounded-lg p-5">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--lime-deep)' }}>NOVEL FINDING — possibly not widely known</div>
              <p className="text-base leading-relaxed" style={{ color: 'var(--ink)' }}>
                {response.synthesis.novelFinding}
              </p>
            </div>
          )}

          {/* Missing Evidence */}
          {response.synthesis?.missingEvidence && (
            <div className="well rounded-lg p-4">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>WHAT WOULD RESOLVE THE UNCERTAINTY</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
                {response.synthesis.missingEvidence}
              </p>
            </div>
          )}

          {/* Bayesian Results */}
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Bayesian Posteriors</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Computed mathematically from {response.rawEvidenceCount || '?'} evidence items.
              These are not opinions — they follow from P(H|E) = P(E|H)P(H)/P(E).
            </p>
            <div className="space-y-4">
              {response.bayesian.posteriors.map(h => {
                const maxPosterior = Math.max(...response.bayesian.posteriors.map(p => p.posterior));
                const isWinner = h.posterior === maxPosterior;
                const color = isWinner ? 'var(--lime-deep)' : 'var(--muted)';
                const width = Math.max(h.posterior * 100, 2);
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--body)' }}>
                        {isWinner && <span className="font-mono mr-1" style={{ color: 'var(--lime-deep)' }}>[BEST FIT]</span>}
                        {h.isOfficial && <span className="font-mono mr-1" style={{ color: 'var(--muted)' }}>[STANDARD]</span>}
                        {h.label}
                      </span>
                      <span className="font-mono font-semibold" style={{ color }}>{formatProb(h.posterior)}</span>
                    </div>
                    <div className="track w-full h-4">
                      <div className="ticks h-full transition-all duration-700" style={{
                        width: `${width}%`,
                        background: isWinner ? 'var(--ink)' : h.isOfficial ? 'var(--alert)' : 'var(--muted)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const v = response.bayesian.verdict;
              const config = {
                official_refuted: { color: 'var(--ink)', label: 'STANDARD NARRATIVE NOT SUPPORTED BY EVIDENCE' },
                official_unlikely: { color: 'var(--ink)', label: 'STANDARD NARRATIVE UNLIKELY GIVEN EVIDENCE' },
                official_questionable: { color: 'var(--body)', label: 'STANDARD NARRATIVE QUESTIONABLE' },
                official_supported: { color: 'var(--lime-deep)', label: 'STANDARD NARRATIVE SUPPORTED BY EVIDENCE' },
              }[v.verdict];
              const stability = response.stability;
              const stabLabel = stability !== undefined
                ? stability >= 0.9 ? 'HIGH STABILITY' : stability >= 0.7 ? 'MODERATE STABILITY' : 'LOW STABILITY'
                : null;
              const stabColor = stability !== undefined
                ? stability >= 0.9 ? 'var(--lime-deep)' : stability >= 0.7 ? 'var(--body)' : 'var(--alert-deep)'
                : 'var(--muted)';
              return (
                <div className="well mt-4 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-sm font-mono font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  {stabLabel && (
                    <span className="tag text-xs font-mono px-2 py-0.5 rounded" style={{ color: stabColor }}>
                      {stabLabel} — verdict held in {((stability ?? 0) * 100).toFixed(0)}% of perturbation tests
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Evidence — now showing as primary source items */}
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--ink)' }}>Primary Source Evidence</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              {response.result.evidence.length} items gathered. Sorted by Bayesian impact.
            </p>
            <div className="space-y-3">
              {response.result.evidence
                .map((e, origIndex) => ({
                  e,
                  origIndex,
                  impact: response.bayesian.sensitivity.find(s => s.evidenceId === e.id)?.impact || 0,
                }))
                .sort((a, b) => b.impact - a.impact)
                .map(({ e, impact }) => {
                  const sens = response.bayesian.sensitivity.find(s => s.evidenceId === e.id);
                  // Find which hypothesis this evidence most supports
                  const ratios = e.likelihoodRatios;
                  const bestHypId = Object.entries(ratios).sort((a, b) => b[1] - a[1])[0]?.[0];
                  const bestHyp = response.bayesian.posteriors.find(h => h.id === bestHypId);
                  const maxPosterior = Math.max(...response.bayesian.posteriors.map(p => p.posterior));
                  const supportsWinner = bestHyp && bestHyp.posterior === maxPosterior;

                  return (
                    <div key={e.id} className="card rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed mb-2" style={{ color: 'var(--ink)' }}>{e.description}</div>
                          <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: 'var(--muted)' }}>
                            <span>{e.date}</span>
                            <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                            {e.wasClassified && <span style={{ color: 'var(--ink)' }}>DECLASSIFIED</span>}
                            {bestHyp && (
                              <span style={{ color: supportsWinner ? 'var(--lime-deep)' : 'var(--alert-deep)' }}>
                                strongest for: {bestHyp.label.slice(0, 50)}
                              </span>
                            )}
                            {(() => {
                              const links = response.rawEvidence?.find(r => r.id === e.id);
                              return links ? (
                                <>
                                  {links.sourceUrl && (
                                    <a href={links.sourceUrl} target="_blank" rel="noopener noreferrer"
                                      className="hover:underline" style={{ color: 'var(--ink)' }}>
                                      [source]
                                    </a>
                                  )}
                                  {links.searchQuery && (
                                    <a href={searchUrl(links.searchQuery)} target="_blank" rel="noopener noreferrer"
                                      className="hover:underline" style={{ color: 'var(--muted)' }}>
                                      [verify]
                                    </a>
                                  )}
                                </>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        {sens && (
                          <div className="text-xs font-mono text-right flex-shrink-0" style={{
                            color: impact > 0.3 ? 'var(--ink)' : 'var(--muted)'
                          }}>
                            impact<br />{(impact * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Causal Chain */}
          {response.result.causalFactors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                Causal Structure
              </h3>
              <div className="card rounded-lg p-5">
                {response.result.causalFactors.map((cf, i) => (
                  <div key={cf.id}>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{
                        background: cf.type === 'power_change' ? 'var(--alert)' :
                          cf.type === 'narrative_change' ? 'var(--ink)' :
                          cf.type === 'evidence_action' ? 'var(--body)' :
                          cf.type === 'economic' ? 'var(--body)' :
                          cf.type === 'demographic' ? 'var(--body)' : 'var(--muted)'
                      }} />
                      <div>
                        <div className="text-sm" style={{ color: 'var(--ink)' }}>{cf.label}</div>
                        <div className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{cf.date}</div>
                      </div>
                    </div>
                    {i < response.result.causalLinks.length && response.result.causalLinks[i] && (
                      <div className="ml-1.5 pl-3 py-2" style={{ borderLeft: '1px solid var(--line)' }}>
                        <div className="text-xs italic" style={{ color: 'var(--muted)' }}>
                          {response.result.causalLinks[i].mechanism}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence + Further Reading */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="well rounded-lg p-4">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>CONFIDENCE ASSESSMENT</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
                {response.result.confidenceNote}
              </p>
            </div>
            {response.result.furtherReading.length > 0 && (
              <div className="well rounded-lg p-4">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>PRIMARY SOURCES / FURTHER READING</div>
                <ul className="space-y-1.5">
                  {response.result.furtherReading.map((ref, i) => (
                    <li key={i} className="text-xs pl-3 leading-relaxed" style={{ color: 'var(--body)', borderLeft: '2px solid var(--line)' }}>
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Share bar */}
          {shareUrl && (
            <div className="well rounded-lg p-3 flex items-center gap-3">
              <div className="text-xs font-mono truncate flex-1" style={{ color: 'var(--muted)' }}>{shareUrl}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="btn-primary text-xs font-semibold px-3 py-1 rounded flex-shrink-0"
                style={{color: 'var(--on-key)' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={saveAndShare}
              disabled={saving || !!shareUrl}
              className="btn-primary text-sm px-6 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
              style={{
                color: 'var(--on-key)',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? 'Saving...' : shareUrl ? 'Saved' : 'Save & Share'}
            </button>
            <button
              onClick={reset}
              className="btn text-sm px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ color: 'var(--body)' }}
            >
              New Question
            </button>
            <button
              onClick={() => discoverByCategory('surprise')}
              disabled={loading}
              className="btn text-sm px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ color: 'var(--body)' }}
            >
              Discover Another
            </button>
          </div>
        </div>
      )}

      {/* History count */}
      {history.length > 0 && !loading && (
        <div className="text-center mt-8 text-xs" style={{ color: 'var(--muted)' }}>
          {history.length} question{history.length !== 1 ? 's' : ''} analyzed this session
        </div>
      )}
    </div>
  );
}
