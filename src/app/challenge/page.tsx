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

  const reset = () => {
    setResponse(null);
    setBelief('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Evidence-First Discovery</h1>
      <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>
        This system gathers <strong>raw primary source evidence first</strong>, then generates hypotheses
        from the evidence, runs Bayesian inference, and surfaces what the data actually shows —
        including things nobody may have noticed.
      </p>
      <div className="text-xs mb-8 font-mono flex gap-4" style={{ color: '#999999' }}>
        <span>1. Evidence</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>2. Hypotheses</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>3. Bayesian Math</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>4. Discovery</span>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={belief}
          onChange={e => setBelief(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyzeByBelief(belief)}
          placeholder="Enter a specific research question, e.g. 'What do casualty records reveal about...'"
          className="flex-1 rounded-lg px-4 py-3 text-sm"
          style={{ background: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
          disabled={loading}
        />
        <button
          onClick={() => analyzeByBelief(belief)}
          disabled={loading || belief.trim().length < 10}
          className="px-6 py-3 rounded-lg font-bold text-sm transition-opacity whitespace-nowrap"
          style={{
            background: loading ? '#d06a2a' : '#e87b35',
            color: 'white',
            opacity: loading || belief.trim().length < 10 ? 0.5 : 1,
          }}
        >
          Analyze Evidence
        </button>
      </div>

      {error && (
        <div className="text-xs rounded-lg p-3 mb-6" style={{ background: 'rgba(196,69,54,0.08)', color: '#c44536' }}>
          {error}
        </div>
      )}

      {/* Topic category buttons */}
      {!response && !loading && (
        <>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
            Auto-discover by topic — the system finds an underexplored question:
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {TOPIC_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => discoverByCategory(cat.id)}
                disabled={loading}
                className="rounded-lg p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: '#ffffff',
                  border: `1px solid ${cat.id === 'surprise' ? '#e87b3540' : '#e5e5e5'}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div className="text-2xl font-mono mb-1" style={{ color: cat.id === 'surprise' ? '#e87b35' : '#d06a2a' }}>
                  {cat.icon}
                </div>
                <div className="text-sm font-bold mb-0.5" style={{ color: '#1a1a1a' }}>{cat.label}</div>
                <div className="text-xs" style={{ color: '#999999' }}>{cat.description}</div>
              </button>
            ))}
          </div>

          {/* Suggested research questions */}
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
            Or try a specific research question:
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {SUGGESTED_BELIEFS.map((s, i) => (
              <button
                key={i}
                onClick={() => analyzeByBelief(s.belief)}
                className="text-left rounded-lg p-4 transition-all hover:scale-[1.01]"
                style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
                  {s.belief}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#fdf0e6', color: '#d06a2a' }}>
                    {s.category}
                  </span>
                </div>
                <div className="text-xs italic" style={{ color: '#999999' }}>
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
            style={{ borderColor: '#e5e5e5', borderTopColor: '#e87b35' }} />
          <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
            {loadingStep}
          </div>
          {loadingCategory && (
            <div className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
              Topic: {TOPIC_CATEGORIES.find(c => c.id === loadingCategory)?.label || loadingCategory}
            </div>
          )}
          <div className="text-xs mt-3 max-w-lg mx-auto" style={{ color: '#999999' }}>
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
                    background: isActive ? '#e87b35' : isDone ? '#2a9d5c10' : '#f7f7f7',
                    color: isActive ? '#ffffff' : isDone ? '#2a9d5c' : '#999999',
                    border: `1px solid ${isActive ? '#e87b35' : isDone ? '#2a9d5c30' : '#e5e5e5'}`,
                  }}>
                    {step}
                  </div>
                  {i < 3 && <span style={{ color: '#e5e5e5' }}>→</span>}
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
            <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#999999' }}>
              <span className="px-2 py-1 rounded" style={{ background: '#2a9d5c10', color: '#2a9d5c', border: '1px solid #2a9d5c30' }}>
                Evidence-first pipeline
              </span>
              <span>{response.rawEvidenceCount} primary sources gathered</span>
              <span>{response.hypothesisCount} hypotheses generated</span>
              <span>Bayesian posteriors computed mathematically</span>
            </div>
          )}

          {/* Research Question */}
          <div className="rounded-lg p-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs font-mono mb-2" style={{ color: '#999999' }}>RESEARCH QUESTION</div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
              {response.result.belief}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>Popular understanding</div>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                  {response.result.standardNarrative}
                </p>
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>What the evidence shows</div>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                  {response.result.contrarianCase}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="rounded-lg p-5" style={{ background: '#fdf0e6', border: '1px solid rgba(232,123,53,0.2)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>KEY FINDING</div>
            <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>
              {response.result.keyInsight}
            </p>
          </div>

          {/* Novel Finding */}
          {response.synthesis?.novelFinding && (
            <div className="rounded-lg p-5" style={{ background: '#2a9d5c08', border: '1px solid #2a9d5c30' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#2a9d5c' }}>NOVEL FINDING — possibly not widely known</div>
              <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>
                {response.synthesis.novelFinding}
              </p>
            </div>
          )}

          {/* Missing Evidence */}
          {response.synthesis?.missingEvidence && (
            <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>WHAT WOULD RESOLVE THE UNCERTAINTY</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {response.synthesis.missingEvidence}
              </p>
            </div>
          )}

          {/* Bayesian Results */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Bayesian Posteriors</h3>
            <p className="text-xs mb-4" style={{ color: '#999999' }}>
              Computed mathematically from {response.rawEvidenceCount || '?'} evidence items.
              These are not opinions — they follow from P(H|E) = P(E|H)P(H)/P(E).
            </p>
            <div className="space-y-4">
              {response.bayesian.posteriors.map(h => {
                const maxPosterior = Math.max(...response.bayesian.posteriors.map(p => p.posterior));
                const isWinner = h.posterior === maxPosterior;
                const color = isWinner ? '#2a9d5c' : '#999999';
                const width = Math.max(h.posterior * 100, 2);
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#6b6b6b' }}>
                        {isWinner && <span className="font-mono mr-1" style={{ color: '#2a9d5c' }}>[BEST FIT]</span>}
                        {h.isOfficial && <span className="font-mono mr-1" style={{ color: '#999999' }}>[STANDARD]</span>}
                        {h.label}
                      </span>
                      <span className="font-mono font-bold" style={{ color }}>{formatProb(h.posterior)}</span>
                    </div>
                    <div className="w-full h-4 rounded-full" style={{ background: '#eeeeee' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${width}%`,
                        background: isWinner ? '#2a9d5c' : h.isOfficial ? '#c44536' : '#999999',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const v = response.bayesian.verdict;
              const config = {
                official_refuted: { color: '#c44536', label: 'STANDARD NARRATIVE NOT SUPPORTED BY EVIDENCE' },
                official_unlikely: { color: '#e87b35', label: 'STANDARD NARRATIVE UNLIKELY GIVEN EVIDENCE' },
                official_questionable: { color: '#d06a2a', label: 'STANDARD NARRATIVE QUESTIONABLE' },
                official_supported: { color: '#2a9d5c', label: 'STANDARD NARRATIVE SUPPORTED BY EVIDENCE' },
              }[v.verdict];
              return (
                <div className="mt-4 rounded-lg p-4" style={{ background: `${config.color}08`, border: `1px solid ${config.color}30` }}>
                  <span className="text-sm font-mono font-bold" style={{ color: config.color }}>
                    {config.label}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Evidence — now showing as primary source items */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Primary Source Evidence</h3>
            <p className="text-xs mb-4" style={{ color: '#999999' }}>
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
                    <div key={e.id} className="rounded-lg p-4" style={{
                      background: '#ffffff',
                      border: '1px solid #e5e5e5',
                      borderLeftColor: supportsWinner ? '#2a9d5c' : '#e87b35',
                      borderLeftWidth: '3px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed mb-2" style={{ color: '#1a1a1a' }}>{e.description}</div>
                          <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: '#999999' }}>
                            <span>{e.date}</span>
                            <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                            {e.wasClassified && <span style={{ color: '#c44536' }}>DECLASSIFIED</span>}
                            {bestHyp && (
                              <span style={{ color: supportsWinner ? '#2a9d5c' : '#e87b35' }}>
                                strongest for: {bestHyp.label.slice(0, 50)}
                              </span>
                            )}
                            {(() => {
                              const links = response.rawEvidence?.find(r => r.id === e.id);
                              return links ? (
                                <>
                                  {links.sourceUrl && (
                                    <a href={links.sourceUrl} target="_blank" rel="noopener noreferrer"
                                      className="hover:underline" style={{ color: '#e87b35' }}>
                                      [source]
                                    </a>
                                  )}
                                  {links.searchQuery && (
                                    <a href={searchUrl(links.searchQuery)} target="_blank" rel="noopener noreferrer"
                                      className="hover:underline" style={{ color: '#999999' }}>
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
                            color: impact > 0.3 ? '#e87b35' : '#999999'
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
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
                Causal Structure
              </h3>
              <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {response.result.causalFactors.map((cf, i) => (
                  <div key={cf.id}>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{
                        background: cf.type === 'power_change' ? '#c44536' :
                          cf.type === 'narrative_change' ? '#e87b35' :
                          cf.type === 'evidence_action' ? '#d06a2a' :
                          cf.type === 'economic' ? '#b07030' :
                          cf.type === 'demographic' ? '#4a8fa8' : '#999999'
                      }} />
                      <div>
                        <div className="text-sm" style={{ color: '#1a1a1a' }}>{cf.label}</div>
                        <div className="text-xs font-mono" style={{ color: '#999999' }}>{cf.date}</div>
                      </div>
                    </div>
                    {i < response.result.causalLinks.length && response.result.causalLinks[i] && (
                      <div className="ml-1.5 pl-3 py-2" style={{ borderLeft: '1px solid #e5e5e5' }}>
                        <div className="text-xs italic" style={{ color: '#bbbbbb' }}>
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
            <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>CONFIDENCE ASSESSMENT</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {response.result.confidenceNote}
              </p>
            </div>
            {response.result.furtherReading.length > 0 && (
              <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
                <div className="text-xs font-bold mb-2" style={{ color: '#999999' }}>PRIMARY SOURCES / FURTHER READING</div>
                <ul className="space-y-1.5">
                  {response.result.furtherReading.map((ref, i) => (
                    <li key={i} className="text-xs pl-3 leading-relaxed" style={{ color: '#6b6b6b', borderLeft: '2px solid #e87b35' }}>
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <button
              onClick={reset}
              className="text-sm px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ border: '1px solid #e5e5e5', color: '#6b6b6b' }}
            >
              New Question
            </button>
            <button
              onClick={() => discoverByCategory('surprise')}
              disabled={loading}
              className="text-sm px-6 py-2.5 rounded-lg font-bold transition-opacity hover:opacity-90"
              style={{ background: '#e87b35', color: 'white' }}
            >
              Discover Another
            </button>
          </div>
        </div>
      )}

      {/* History count */}
      {history.length > 0 && !loading && (
        <div className="text-center mt-8 text-xs" style={{ color: '#999999' }}>
          {history.length} question{history.length !== 1 ? 's' : ''} analyzed this session
        </div>
      )}
    </div>
  );
}
