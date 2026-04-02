'use client';

import { useState, useCallback } from 'react';
import { TOPIC_CATEGORIES, SUGGESTED_BELIEFS } from '@/lib/engine/live/contrarian-engine';
import { ContrarianResult } from '@/lib/engine/live/contrarian-engine';
import { BayesianVerdict } from '@/lib/types/graph';
import { useApiKey } from '@/components/ApiKeyProvider';

interface AnalysisResponse {
  result: ContrarianResult;
  bayesian: {
    posteriors: Array<{ id: string; label: string; posterior: number; isOfficial: boolean }>;
    sensitivity: Array<{ evidenceId: string; label: string; impact: number }>;
    verdict: BayesianVerdict;
  };
  discoveredBelief?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const { provider, apiKey, isConfigured, setShowSettings } = useApiKey();

  const analyzeByBelief = useCallback(async (text: string) => {
    if (text.trim().length < 10) {
      setError('Enter a historical belief (10+ characters)');
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
    setError(null);
    setResponse(null);

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
      setLoading(false);
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
    setError(null);
    setResponse(null);
    setBelief('');

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
      setLoading(false);
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
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Challenge History</h1>
      <p className="text-sm mb-8" style={{ color: '#6b6b6b' }}>
        Pick a topic and let the system auto-discover a commonly held historical belief that has
        strong contrarian evidence. Or type your own. Each click finds a new one.
      </p>

      {/* Search bar */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={belief}
          onChange={e => setBelief(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyzeByBelief(belief)}
          placeholder="Type a belief to challenge, or pick a topic below..."
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
          Challenge This
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
            Auto-discover by topic — click any category:
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

          {/* Quick picks */}
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
            Or try a specific belief:
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
                  &ldquo;{s.belief}&rdquo;
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#fdf0e6', color: '#d06a2a' }}>
                    {s.category}
                  </span>
                </div>
                <div className="text-xs italic" style={{ color: '#999999' }}>
                  {s.hint}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ borderColor: '#e5e5e5', borderTopColor: '#e87b35' }} />
          <div className="text-sm" style={{ color: '#6b6b6b' }}>
            {loadingCategory
              ? `Discovering a surprising contrarian finding in ${TOPIC_CATEGORIES.find(c => c.id === loadingCategory)?.label || loadingCategory}...`
              : `Researching contrarian evidence for: "${belief}"`
            }
          </div>
          <div className="text-xs mt-2 max-w-md mx-auto" style={{ color: '#999999' }}>
            Finding real historical evidence, building competing hypotheses,
            running Bayesian analysis...
          </div>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="space-y-8">
          {/* Header */}
          <div className="rounded-lg p-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-xs font-mono mb-2" style={{ color: '#999999' }}>POPULAR BELIEF</div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
              &ldquo;{response.result.belief}&rdquo;
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#c44536' }}>Standard Narrative</div>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                  {response.result.standardNarrative}
                </p>
              </div>
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#2a9d5c' }}>Contrarian Case</div>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                  {response.result.contrarianCase}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="rounded-lg p-5" style={{ background: '#fdf0e6', border: '1px solid rgba(232,123,53,0.2)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>KEY INSIGHT</div>
            <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>
              {response.result.keyInsight}
            </p>
          </div>

          {/* Bayesian Verdict */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>Bayesian Analysis</h3>
            <div className="space-y-4">
              {response.bayesian.posteriors.map(h => {
                const color = h.isOfficial ? '#c44536' : '#2a9d5c';
                const width = Math.max(h.posterior * 100, 2);
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#6b6b6b' }}>
                        <span className="font-mono mr-1" style={{ color: '#999999' }}>
                          [{h.isOfficial ? 'POPULAR' : 'CONTRARIAN'}]
                        </span>
                        {h.label}
                      </span>
                      <span className="font-mono font-bold" style={{ color }}>{formatProb(h.posterior)}</span>
                    </div>
                    <div className="w-full h-4 rounded-full" style={{ background: '#eeeeee' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const v = response.bayesian.verdict;
              const config = {
                official_refuted: { color: '#c44536', label: 'POPULAR BELIEF REFUTED BY EVIDENCE' },
                official_unlikely: { color: '#e87b35', label: 'POPULAR BELIEF UNLIKELY' },
                official_questionable: { color: '#d06a2a', label: 'POPULAR BELIEF QUESTIONABLE' },
                official_supported: { color: '#2a9d5c', label: 'POPULAR BELIEF SUPPORTED' },
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

          {/* Evidence */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>Evidence Examined</h3>
            <div className="space-y-3">
              {response.result.evidence.map((e, i) => {
                const sens = response.bayesian.sensitivity.find(s => s.evidenceId === e.id);
                const favorsStandard = (e.likelihoodRatios['h1-standard'] || 0.5) > (e.likelihoodRatios['h2-contrarian'] || 0.5);
                return (
                  <div key={i} className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderLeftColor: favorsStandard ? '#c44536' : '#2a9d5c', borderLeftWidth: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>{e.label}</div>
                        <div className="text-xs leading-relaxed mb-2" style={{ color: '#6b6b6b' }}>{e.description}</div>
                        <div className="flex flex-wrap gap-3 text-xs font-mono" style={{ color: '#999999' }}>
                          <span>{e.date}</span>
                          <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                          {e.wasClassified && <span style={{ color: '#c44536' }}>WAS CLASSIFIED</span>}
                          <span style={{ color: favorsStandard ? '#c44536' : '#2a9d5c' }}>
                            favors {favorsStandard ? 'popular view' : 'contrarian view'}
                          </span>
                        </div>
                      </div>
                      {sens && (
                        <div className="text-xs font-mono text-right flex-shrink-0" style={{ color: sens.impact > 0.3 ? '#e87b35' : '#999999' }}>
                          impact<br />{(sens.impact * 100).toFixed(0)}%
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
                Why the Popular Belief Persists
              </h3>
              <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {response.result.causalFactors.map((cf, i) => (
                  <div key={cf.id}>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{
                        background: cf.type === 'power_change' ? '#c44536' :
                          cf.type === 'narrative_change' ? '#e87b35' :
                          cf.type === 'evidence_action' ? '#d06a2a' : '#999999'
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
              <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>CONFIDENCE NOTE</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {response.result.confidenceNote}
              </p>
            </div>
            {response.result.furtherReading.length > 0 && (
              <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
                <div className="text-xs font-bold mb-2" style={{ color: '#999999' }}>FURTHER READING</div>
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
              Back to Topics
            </button>
            <button
              onClick={() => discoverByCategory('surprise')}
              disabled={loading}
              className="text-sm px-6 py-2.5 rounded-lg font-bold transition-opacity hover:opacity-90"
              style={{ background: '#e87b35', color: 'white' }}
            >
              Surprise Me Again
            </button>
          </div>
        </div>
      )}

      {/* History count */}
      {history.length > 0 && !loading && (
        <div className="text-center mt-8 text-xs" style={{ color: '#999999' }}>
          {history.length} belief{history.length !== 1 ? 's' : ''} challenged this session
        </div>
      )}
    </div>
  );
}
