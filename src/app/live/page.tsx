'use client';

import { useState } from 'react';
import { useApiKey } from '@/components/ApiKeyProvider';
import { BayesianVerdict } from '@/lib/types/graph';

interface Claim {
  id: string;
  claim: string;
  claimant: string;
  claimantRole: string;
  benefitsClaimant: boolean;
  confidenceLanguage: string;
  evidenceCited: string;
}

interface IndependentEvidence {
  id: string;
  fact: string;
  source: string;
  date: string;
  type: string;
  sourceReliability: number;
  relevantToClaims: string[];
  supports: boolean | null;
  dataPoint: string | null;
  sourceUrl?: string | null;
  searchQuery?: string | null;
}

interface ClaimVerification {
  claimId: string;
  status: string;
  explanation: string;
  keyEvidence: string[];
  verifyUrl?: string | null;
  verifySearchQuery?: string | null;
}

function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

interface Synthesis {
  overallAssessment: string;
  claimVerifications: ClaimVerification[];
  missingContext: string;
  strongestEvidence: string[];
  recommendations: string[];
}

interface AnalysisResult {
  claims: Claim[];
  evidence: IndependentEvidence[];
  missingData: string;
  bayesian: {
    posteriors: Array<{ id: string; label: string; posterior: number; isOfficial: boolean }>;
    sensitivity: Array<{ evidenceId: string; label: string; impact: number }>;
    verdict: BayesianVerdict;
  };
  synthesis: Synthesis | null;
  pipeline: string;
}

function formatProb(v: number): string {
  if (v > 0.01) return `${(v * 100).toFixed(1)}%`;
  if (v > 0.001) return `${(v * 100).toFixed(2)}%`;
  return '~0%';
}

const STATUS_COLORS: Record<string, string> = {
  supported: '#2a9d5c',
  partially_supported: '#e87b35',
  unsupported: '#c44536',
  contradicted: '#c44536',
  unverifiable: '#999999',
};

export default function LivePage() {
  const [topic, setTopic] = useState('');
  const [articleInputs, setArticleInputs] = useState([{ text: '', url: '', date: new Date().toISOString().split('T')[0] }]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { provider, apiKey, isConfigured, setShowSettings } = useApiKey();

  const addArticle = () => {
    setArticleInputs(prev => [...prev, { text: '', url: '', date: new Date().toISOString().split('T')[0] }]);
  };

  const updateArticle = (index: number, field: string, value: string) => {
    setArticleInputs(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const analyze = async () => {
    const articles = articleInputs.filter(a => a.text.trim().length > 50);
    if (articles.length === 0) {
      setError('Paste at least one article (50+ characters)');
      return;
    }
    if (!isConfigured) {
      setError('Set an API key first (click Settings in the top nav)');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setLoadingStep('Extracting verifiable claims...');
    setError(null);
    setResult(null);

    const stepTimer = setInterval(() => {
      setLoadingStep(prev => {
        if (prev.includes('Extracting')) return 'Gathering independent evidence...';
        if (prev.includes('Gathering')) return 'Generating hypotheses...';
        if (prev.includes('Generating')) return 'Running Bayesian inference...';
        if (prev.includes('Running')) return 'Synthesizing verdict...';
        return prev;
      });
    }, 10000);

    try {
      const res = await fetch('/api/live/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || 'Unnamed topic', articles, provider, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Live Article Verification</h1>
      <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>
        Paste a news article. The system extracts every verifiable claim, gathers <strong>independent
        evidence</strong> from outside the article, runs Bayesian inference, and tells you which claims
        the evidence actually supports.
      </p>
      <div className="text-xs mb-8 font-mono flex gap-4" style={{ color: '#999999' }}>
        <span>1. Extract Claims</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>2. Independent Evidence</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>3. Bayesian Math</span>
        <span style={{ color: '#e5e5e5' }}>→</span>
        <span>4. Claim-by-Claim Verdict</span>
      </div>

      {/* Input */}
      <div className="mb-8 space-y-4">
        <div>
          <label className="text-xs font-bold mb-1 block" style={{ color: '#6b6b6b' }}>Topic / Context</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., 'Government claims about defense spending', 'Coverage of the housing crisis'"
            className="w-full rounded-lg px-4 py-2 text-sm"
            style={{ background: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
          />
        </div>

        {articleInputs.map((article, i) => (
          <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: '#999999' }}>Article {i + 1}</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={article.url}
                  onChange={e => updateArticle(i, 'url', e.target.value)}
                  placeholder="Source URL (optional)"
                  className="rounded px-2 py-1 text-xs w-48"
                  style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
                />
                <input
                  type="date"
                  value={article.date}
                  onChange={e => updateArticle(i, 'date', e.target.value)}
                  className="rounded px-2 py-1 text-xs"
                  style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
                />
              </div>
            </div>
            <textarea
              value={article.text}
              onChange={e => updateArticle(i, 'text', e.target.value)}
              placeholder="Paste the article text here..."
              rows={6}
              className="w-full rounded-lg px-4 py-3 text-sm resize-y"
              style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
            />
          </div>
        ))}

        <div className="flex gap-3">
          <button
            onClick={addArticle}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ border: '1px solid #e5e5e5', color: '#6b6b6b' }}
          >
            + Add Another Article
          </button>
          <button
            onClick={analyze}
            disabled={loading}
            className="text-xs px-6 py-2 rounded-lg font-bold transition-opacity"
            style={{
              background: loading ? '#d06a2a' : '#e87b35',
              color: 'white',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Analyzing...' : 'Verify Claims'}
          </button>
        </div>

        {error && (
          <div className="text-xs rounded-lg p-3" style={{ background: 'rgba(196,69,54,0.08)', color: '#c44536' }}>
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ borderColor: '#e5e5e5', borderTopColor: '#e87b35' }} />
          <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{loadingStep}</div>
          <div className="text-xs mt-3 max-w-lg mx-auto" style={{ color: '#999999' }}>
            The system extracts claims, gathers independent evidence, runs Bayesian inference,
            and produces a claim-by-claim verdict. This takes 30-60 seconds.
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {['Claims', 'Evidence', 'Bayesian Math', 'Verdict'].map((step, i) => {
              const keywords = ['extracting', 'gathering', 'running', 'synthesizing'];
              const isActive = loadingStep.toLowerCase().includes(keywords[i]);
              const isDone = keywords.findIndex(k => loadingStep.toLowerCase().includes(k)) > i;
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
      {result && (
        <div className="space-y-8">
          {/* Pipeline badge */}
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#999999' }}>
            <span className="px-2 py-1 rounded" style={{ background: '#2a9d5c10', color: '#2a9d5c', border: '1px solid #2a9d5c30' }}>
              Evidence-first verification
            </span>
            <span>{result.claims.length} claims extracted</span>
            <span>{result.evidence.length} independent evidence items</span>
          </div>

          {/* Overall Assessment */}
          {result.synthesis?.overallAssessment && (
            <div className="rounded-lg p-5" style={{ background: '#fdf0e6', border: '1px solid rgba(232,123,53,0.2)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>OVERALL ASSESSMENT</div>
              <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>
                {result.synthesis.overallAssessment}
              </p>
            </div>
          )}

          {/* Bayesian Posteriors */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Article Reliability — Bayesian Posteriors</h3>
            <p className="text-xs mb-4" style={{ color: '#999999' }}>
              Computed from {result.evidence.length} independent evidence items.
            </p>
            <div className="space-y-4">
              {result.bayesian.posteriors.map(h => {
                const maxP = Math.max(...result.bayesian.posteriors.map(p => p.posterior));
                const isWinner = h.posterior === maxP;
                const color = isWinner ? '#2a9d5c' : '#999999';
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#6b6b6b' }}>
                        {isWinner && <span className="font-mono mr-1" style={{ color: '#2a9d5c' }}>[BEST FIT]</span>}
                        {h.isOfficial && <span className="font-mono mr-1" style={{ color: '#999999' }}>[ARTICLE'S FRAMING]</span>}
                        {h.label}
                      </span>
                      <span className="font-mono font-bold" style={{ color }}>{formatProb(h.posterior)}</span>
                    </div>
                    <div className="w-full h-4 rounded-full" style={{ background: '#eeeeee' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.max(h.posterior * 100, 2)}%`,
                        background: isWinner ? '#2a9d5c' : h.isOfficial ? '#c44536' : '#999999',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claim-by-Claim Verification */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
              Claim-by-Claim Verification ({result.claims.length} claims)
            </h3>
            <div className="space-y-3">
              {result.claims.map(claim => {
                const verification = result.synthesis?.claimVerifications?.find(v => v.claimId === claim.id);
                const statusColor = STATUS_COLORS[verification?.status || 'unverifiable'] || '#999999';
                return (
                  <div key={claim.id} className="rounded-lg p-4" style={{
                    background: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderLeftColor: statusColor,
                    borderLeftWidth: '3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-sm leading-relaxed" style={{ color: '#1a1a1a' }}>
                        &ldquo;{claim.claim}&rdquo;
                      </div>
                      {verification && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${statusColor}10`, color: statusColor }}>
                          {verification.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-2" style={{ color: '#999999' }}>
                      <span>By: {claim.claimant} ({claim.claimantRole})</span>
                      {claim.benefitsClaimant && (
                        <span className="font-mono" style={{ color: '#e87b35' }}>SELF-SERVING</span>
                      )}
                      <span>Confidence: {claim.confidenceLanguage}</span>
                      <span>Article cites: {claim.evidenceCited}</span>
                    </div>
                    {verification?.explanation && (
                      <div className="text-xs leading-relaxed rounded p-2 mt-2" style={{ background: '#f7f7f7', color: '#6b6b6b' }}>
                        {verification.explanation}
                        {(verification.verifyUrl || verification.verifySearchQuery) && (
                          <span className="ml-2">
                            {verification.verifyUrl && (
                              <a href={verification.verifyUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono hover:underline"
                                style={{ color: '#e87b35' }}>
                                [source]
                              </a>
                            )}
                            {verification.verifySearchQuery && (
                              <a href={searchUrl(verification.verifySearchQuery)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono hover:underline ml-1"
                                style={{ color: '#999999' }}>
                                [verify]
                              </a>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Independent Evidence */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Independent Evidence Gathered</h3>
            <p className="text-xs mb-4" style={{ color: '#999999' }}>
              {result.evidence.length} items from sources outside the article, sorted by Bayesian impact.
            </p>
            <div className="space-y-3">
              {result.evidence
                .map(e => ({
                  e,
                  impact: result.bayesian.sensitivity.find(s => s.evidenceId === e.id)?.impact || 0,
                }))
                .sort((a, b) => b.impact - a.impact)
                .map(({ e, impact }) => (
                  <div key={e.id} className="rounded-lg p-4" style={{
                    background: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderLeftColor: e.supports === true ? '#2a9d5c' : e.supports === false ? '#c44536' : '#999999',
                    borderLeftWidth: '3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm leading-relaxed mb-1" style={{ color: '#1a1a1a' }}>{e.fact}</div>
                        <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: '#999999' }}>
                          <span>{e.source}</span>
                          <span>{e.date}</span>
                          <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                          <span className="px-1 rounded" style={{
                            background: e.type === 'statistic' ? '#fdf0e6' : e.type === 'unverifiable_recent' ? '#e87b3510' : '#f7f7f7',
                            color: e.type === 'statistic' ? '#d06a2a' : e.type === 'unverifiable_recent' ? '#e87b35' : '#999999',
                          }}>
                            {e.type.replace(/_/g, ' ')}
                          </span>
                          {e.dataPoint && <span style={{ color: '#e87b35' }}>Data: {e.dataPoint}</span>}
                          {e.sourceUrl && (
                            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="hover:underline" style={{ color: '#e87b35' }}>
                              [source]
                            </a>
                          )}
                          {e.searchQuery && (
                            <a href={searchUrl(e.searchQuery)} target="_blank" rel="noopener noreferrer"
                              className="hover:underline" style={{ color: '#999999' }}>
                              [verify]
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-right flex-shrink-0" style={{
                        color: impact > 0.3 ? '#e87b35' : '#999999',
                      }}>
                        impact<br />{(impact * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Missing Context */}
          {result.synthesis?.missingContext && (
            <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>CONTEXT THE ARTICLE OMITS</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {result.synthesis.missingContext}
              </p>
            </div>
          )}

          {/* Missing Data */}
          {result.missingData && (
            <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>DATA NOT PUBLICLY AVAILABLE</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
                {result.missingData}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {result.synthesis?.recommendations && result.synthesis.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>How to Verify Further</h3>
              <div className="space-y-2">
                {result.synthesis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: '#e87b35' }}>{i + 1}.</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
