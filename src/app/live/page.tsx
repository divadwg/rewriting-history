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

interface Contradiction {
  id: string;
  actor: string;
  actorRole: string;
  currentStatement: string;
  currentDate: string;
  pastStatement: string;
  pastDate: string;
  pastSource: string;
  contradictionType: string;
  severity: number;
  explanation: string;
  sourceUrl?: string | null;
  searchQuery?: string | null;
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
  contradictions: Contradiction[];
  webSearchUsed?: boolean;
  pipeline: string;
}

function formatProb(v: number): string {
  if (v > 0.01) return `${(v * 100).toFixed(1)}%`;
  if (v > 0.001) return `${(v * 100).toFixed(2)}%`;
  return '~0%';
}

const STATUS_COLORS: Record<string, string> = {
  supported: '#2a7d4c',
  partially_supported: '#a23f00',
  unsupported: '#a23f00',
  contradicted: '#a23f00',
  unverifiable: '#9ba2a3',
};

export default function LivePage() {
  const [urlInput, setUrlInput] = useState('');
  const [topic, setTopic] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [articleText, setArticleText] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [articleDate, setArticleDate] = useState(new Date().toISOString().split('T')[0]);
  const [articleTitle, setArticleTitle] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { provider, apiKey, isConfigured, setShowSettings } = useApiKey();

  const saveAndShare = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'live',
          title: articleTitle || topic || 'Article Verification',
          data: { ...result, articleTitle, articleUrl, articleDate },
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
  };

  const fetchArticle = async () => {
    const url = urlInput.trim();
    if (!url || !url.startsWith('http')) {
      setError('Enter a valid URL starting with http:// or https://');
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const res = await fetch('/api/live/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch article');

      setArticleText(data.text);
      setArticleUrl(data.url || url);
      setArticleDate(data.date || new Date().toISOString().split('T')[0]);
      setArticleTitle(data.title || '');
      setTopic(data.title || '');
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch article');
    } finally {
      setFetching(false);
    }
  };

  const analyze = async () => {
    const text = articleText.trim();
    if (text.length < 50) {
      setError('Article text must be at least 50 characters');
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
      const articles = [{ text, url: articleUrl, date: articleDate }];
      const res = await fetch('/api/live/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || articleTitle || 'Unnamed topic', articles, provider, apiKey }),
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

  const reset = () => {
    setUrlInput('');
    setTopic('');
    setArticleText('');
    setArticleUrl('');
    setArticleDate(new Date().toISOString().split('T')[0]);
    setArticleTitle('');
    setFetched(false);
    setShowManual(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}>Live Article Verification</h1>
      <p className="text-sm mb-2" style={{ color: '#6b7374' }}>
        Enter an article URL or paste text. The system extracts every verifiable claim, gathers <strong>independent
        evidence</strong> from outside the article, runs Bayesian inference, and tells you which claims
        the evidence actually supports.
      </p>
      <div className="text-xs mb-8 font-mono flex flex-wrap gap-4" style={{ color: '#9ba2a3' }}>
        <span>1. Extract Claims</span>
        <span style={{ color: 'rgba(196,203,204,0.15)' }}>&rarr;</span>
        <span>2. Independent Evidence</span>
        <span style={{ color: 'rgba(196,203,204,0.15)' }}>&rarr;</span>
        <span>3. Bayesian Math</span>
        <span style={{ color: 'rgba(196,203,204,0.15)' }}>&rarr;</span>
        <span>4. Claim-by-Claim Verdict</span>
      </div>

      {/* Input - only show when no result */}
      {!result && !loading && (
        <div className="mb-8 space-y-4">
          {/* URL input - primary */}
          {!fetched && !showManual && (
            <>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#6b7374' }}>Article URL</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchArticle()}
                    placeholder="https://www.example.com/article..."
                    className="flex-1 rounded-lg px-4 py-3 text-sm"
                    style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                    disabled={fetching}
                  />
                  <button
                    onClick={fetchArticle}
                    disabled={fetching || !urlInput.trim()}
                    className="px-6 py-3 rounded-lg font-bold text-sm transition-opacity"
                    style={{
                      background: fetching ? '#8f3600' : '#a23f00',
                      color: 'white',
                      opacity: fetching || !urlInput.trim() ? 0.5 : 1,
                    }}
                  >
                    {fetching ? 'Fetching...' : 'Fetch Article'}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => setShowManual(true)}
                  className="text-xs hover:underline"
                  style={{ color: '#9ba2a3' }}
                >
                  Or paste article text manually
                </button>
              </div>
            </>
          )}

          {/* Manual text input */}
          {showManual && !fetched && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold" style={{ color: '#6b7374' }}>Paste Article Text</label>
                <button
                  onClick={() => setShowManual(false)}
                  className="text-xs hover:underline"
                  style={{ color: '#9ba2a3' }}
                >
                  Back to URL input
                </button>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#6b7374' }}>Topic / Context</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., 'Government claims about defense spending'"
                  className="w-full rounded-lg px-4 py-2 text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                />
              </div>
              <div className="rounded-lg p-4 space-y-3" style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)' }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={articleUrl}
                    onChange={e => setArticleUrl(e.target.value)}
                    placeholder="Source URL (optional)"
                    className="rounded px-2 py-1 text-xs flex-1"
                    style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                  />
                  <input
                    type="date"
                    value={articleDate}
                    onChange={e => setArticleDate(e.target.value)}
                    className="rounded px-2 py-1 text-xs"
                    style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                  />
                </div>
                <textarea
                  value={articleText}
                  onChange={e => setArticleText(e.target.value)}
                  placeholder="Paste the article text here..."
                  rows={8}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-y"
                  style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                />
              </div>
              <button
                onClick={analyze}
                disabled={loading || articleText.trim().length < 50}
                className="px-6 py-3 rounded-lg font-bold text-sm transition-opacity"
                style={{
                  background: '#a23f00',
                  color: 'white',
                  opacity: articleText.trim().length < 50 ? 0.5 : 1,
                }}
              >
                Verify Claims
              </button>
            </>
          )}

          {/* Fetched article preview */}
          {fetched && (
            <>
              <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)' }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    {articleTitle && (
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#2d3435' }}>{articleTitle}</h3>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs font-mono" style={{ color: '#9ba2a3' }}>
                      {articleUrl && (
                        <a href={articleUrl} target="_blank" rel="noopener noreferrer"
                          className="hover:underline" style={{ color: '#a23f00' }}>
                          {new URL(articleUrl).hostname}
                        </a>
                      )}
                      <span>{articleDate}</span>
                      <span>{articleText.length.toLocaleString()} characters</span>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="text-xs px-3 py-1 rounded"
                    style={{ border: '1px solid rgba(196,203,204,0.15)', color: '#9ba2a3' }}
                  >
                    Change
                  </button>
                </div>

                {/* Expandable preview */}
                <details className="mt-3">
                  <summary className="text-xs cursor-pointer select-none" style={{ color: '#9ba2a3' }}>
                    Show article text
                  </summary>
                  <div className="mt-2 rounded p-3 text-xs leading-relaxed max-h-48 overflow-y-auto"
                    style={{ background: '#f2f4f4', color: '#6b7374' }}>
                    {articleText.slice(0, 3000)}
                    {articleText.length > 3000 && '...'}
                  </div>
                </details>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: '#6b7374' }}>Topic / Context (auto-filled from title)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g., 'Government claims about defense spending'"
                  className="w-full rounded-lg px-4 py-2 text-sm"
                  style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)', color: '#2d3435' }}
                />
              </div>

              <button
                onClick={analyze}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-bold text-sm transition-opacity"
                style={{ background: '#a23f00', color: 'white' }}
              >
                Verify Claims
              </button>
            </>
          )}

          {error && (
            <div className="text-xs rounded-lg p-3" style={{ background: 'rgba(162,63,0,0.06)', color: '#a23f00' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          {articleTitle && (
            <div className="text-sm font-medium mb-4" style={{ color: '#6b7374' }}>
              Analyzing: {articleTitle}
            </div>
          )}
          <div className="inline-block w-10 h-10 rounded-full border-2 animate-spin mb-4"
            style={{ borderColor: 'rgba(196,203,204,0.15)', borderTopColor: '#a23f00' }} />
          <div className="text-sm font-medium" style={{ color: '#2d3435' }}>{loadingStep}</div>
          <div className="text-xs mt-3 max-w-lg mx-auto" style={{ color: '#9ba2a3' }}>
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
                    background: isActive ? '#a23f00' : isDone ? 'rgba(42,125,76,0.06)' : '#f2f4f4',
                    color: isActive ? '#ffffff' : isDone ? '#2a7d4c' : '#9ba2a3',
                    border: `1px solid ${isActive ? '#a23f00' : isDone ? 'rgba(42,125,76,0.18)' : 'rgba(196,203,204,0.15)'}`,
                  }}>
                    {step}
                  </div>
                  {i < 3 && <span style={{ color: 'rgba(196,203,204,0.15)' }}>&rarr;</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Article header in results */}
          {articleTitle && (
            <div className="rounded-lg p-4" style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold" style={{ color: '#2d3435' }}>{articleTitle}</h3>
                  <div className="flex flex-wrap gap-3 text-xs font-mono mt-1" style={{ color: '#9ba2a3' }}>
                    {articleUrl && (
                      <a href={articleUrl} target="_blank" rel="noopener noreferrer"
                        className="hover:underline" style={{ color: '#a23f00' }}>
                        {(() => { try { return new URL(articleUrl).hostname; } catch { return articleUrl; } })()}
                      </a>
                    )}
                    <span>{articleDate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveAndShare}
                    disabled={saving || !!shareUrl}
                    className="text-xs px-3 py-1 rounded font-bold transition-colors"
                    style={{
                      background: shareUrl ? '#2a7d4c' : '#a23f00',
                      color: 'white',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : shareUrl ? (copied ? 'Link Copied' : 'Saved') : 'Save & Share'}
                  </button>
                  {shareUrl && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-xs px-3 py-1 rounded"
                      style={{ border: '1px solid rgba(196,203,204,0.15)', color: '#9ba2a3' }}
                    >
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  )}
                  <button
                    onClick={reset}
                    className="text-xs px-3 py-1 rounded"
                    style={{ border: '1px solid rgba(196,203,204,0.15)', color: '#9ba2a3' }}
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share URL bar */}
          {shareUrl && (
            <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)' }}>
              <div className="text-xs font-mono truncate flex-1" style={{ color: '#9ba2a3' }}>{shareUrl}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-xs font-bold px-3 py-1 rounded flex-shrink-0"
                style={{ background: copied ? '#2a7d4c' : '#a23f00', color: 'white' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Pipeline badge */}
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#9ba2a3' }}>
            <span className="px-2 py-1 rounded" style={{ background: 'rgba(42,125,76,0.06)', color: '#2a7d4c', border: '1px solid rgba(42,125,76,0.18)' }}>
              Evidence-first verification
            </span>
            <span>{result.claims.length} claims extracted</span>
            <span>{result.evidence.length} independent evidence items</span>
            {result.contradictions?.length > 0 && (
              <span>{result.contradictions.length} contradictions found</span>
            )}
            {result.webSearchUsed && (
              <span className="px-2 py-0.5 rounded" style={{ background: '#4a8fa810', color: '#4a8fa8', border: '1px solid #4a8fa830' }}>
                web search
              </span>
            )}
          </div>

          {/* Overall Assessment */}
          {result.synthesis?.overallAssessment && (
            <div className="rounded-lg p-5" style={{ background: 'rgba(162,63,0,0.06)', border: '1px solid rgba(162,63,0,0.15)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#a23f00' }}>OVERALL ASSESSMENT</div>
              <p className="text-base leading-relaxed" style={{ color: '#2d3435' }}>
                {result.synthesis.overallAssessment}
              </p>
            </div>
          )}

          {/* Bayesian Posteriors */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}>Article Reliability — Bayesian Posteriors</h3>
            <p className="text-xs mb-4" style={{ color: '#9ba2a3' }}>
              Computed from {result.evidence.length} independent evidence items.
            </p>
            <div className="space-y-4">
              {result.bayesian.posteriors.map(h => {
                const maxP = Math.max(...result.bayesian.posteriors.map(p => p.posterior));
                const isWinner = h.posterior === maxP;
                const color = isWinner ? '#2a7d4c' : '#9ba2a3';
                return (
                  <div key={h.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#6b7374' }}>
                        {isWinner && <span className="font-mono mr-1" style={{ color: '#2a7d4c' }}>[BEST FIT]</span>}
                        {h.isOfficial && <span className="font-mono mr-1" style={{ color: '#9ba2a3' }}>[ARTICLE&apos;S FRAMING]</span>}
                        {h.label}
                      </span>
                      <span className="font-mono font-bold" style={{ color }}>{formatProb(h.posterior)}</span>
                    </div>
                    <div className="w-full h-4 rounded-full" style={{ background: '#eeeeee' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.max(h.posterior * 100, 2)}%`,
                        background: isWinner ? '#2a7d4c' : h.isOfficial ? '#a23f00' : '#9ba2a3',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claim-by-Claim Verification */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}>
              Claim-by-Claim Verification ({result.claims.length} claims)
            </h3>
            <div className="space-y-3">
              {result.claims.map(claim => {
                const verification = result.synthesis?.claimVerifications?.find(v => v.claimId === claim.id);
                const statusColor = STATUS_COLORS[verification?.status || 'unverifiable'] || '#9ba2a3';
                return (
                  <div key={claim.id} className="rounded-lg p-4" style={{
                    background: '#ffffff',
                    border: '1px solid rgba(196,203,204,0.15)',
                    borderLeftColor: statusColor,
                    borderLeftWidth: '3px',
                  }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-sm leading-relaxed" style={{ color: '#2d3435' }}>
                        &ldquo;{claim.claim}&rdquo;
                      </div>
                      {verification && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                          style={{ background: `${statusColor}10`, color: statusColor }}>
                          {verification.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-2" style={{ color: '#9ba2a3' }}>
                      <span>By: {claim.claimant} ({claim.claimantRole})</span>
                      {claim.benefitsClaimant && (
                        <span className="font-mono" style={{ color: '#a23f00' }}>SELF-SERVING</span>
                      )}
                      <span>Confidence: {claim.confidenceLanguage}</span>
                      <span>Article cites: {claim.evidenceCited}</span>
                    </div>
                    {verification?.explanation && (
                      <div className="text-xs leading-relaxed rounded p-2 mt-2" style={{ background: '#f2f4f4', color: '#6b7374' }}>
                        {verification.explanation}
                        {(verification.verifyUrl || verification.verifySearchQuery) && (
                          <span className="ml-2">
                            {verification.verifyUrl && (
                              <a href={verification.verifyUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono hover:underline"
                                style={{ color: '#a23f00' }}>
                                [source]
                              </a>
                            )}
                            {verification.verifySearchQuery && (
                              <a href={searchUrl(verification.verifySearchQuery)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono hover:underline ml-1"
                                style={{ color: '#9ba2a3' }}>
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

          {/* Contradictions / Hypocrisy */}
          {result.contradictions && result.contradictions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#a23f00', fontFamily: "'Newsreader', serif" }}>
                Contradictions &amp; Past Statements ({result.contradictions.length})
              </h3>
              <p className="text-xs mb-4" style={{ color: '#9ba2a3' }}>
                Cases where people in this article have previously said or done things that
                contradict their current statements or actions.
              </p>
              <div className="space-y-3">
                {result.contradictions
                  .sort((a, b) => b.severity - a.severity)
                  .map(x => {
                    const severityColor = x.severity >= 4 ? '#a23f00' : x.severity >= 3 ? '#a23f00' : '#8f3600';
                    const typeLabel: Record<string, string> = {
                      direct_reversal: 'DIRECT REVERSAL',
                      selective_memory: 'SELECTIVE MEMORY',
                      double_standard: 'DOUBLE STANDARD',
                      changed_position: 'CHANGED POSITION',
                      hypocrisy: 'HYPOCRISY',
                    };
                    return (
                      <div key={x.id} className="rounded-lg p-4" style={{
                        background: '#ffffff',
                        border: '1px solid rgba(196,203,204,0.15)',
                        borderLeftColor: severityColor,
                        borderLeftWidth: '3px',
                      }}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="font-bold text-sm" style={{ color: '#2d3435' }}>
                            {x.actor}
                            <span className="font-normal ml-1" style={{ color: '#9ba2a3' }}>({x.actorRole})</span>
                          </div>
                          <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${severityColor}10`, color: severityColor }}>
                            {typeLabel[x.contradictionType] || x.contradictionType.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div className="rounded p-3" style={{ background: '#f2f4f4' }}>
                            <div className="text-xs font-mono mb-1" style={{ color: '#a23f00' }}>
                              NOW ({x.currentDate})
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: '#2d3435' }}>
                              &ldquo;{x.currentStatement}&rdquo;
                            </p>
                          </div>
                          <div className="rounded p-3" style={{ background: 'rgba(162,63,0,0.06)' }}>
                            <div className="text-xs font-mono mb-1" style={{ color: '#a23f00' }}>
                              PREVIOUSLY ({x.pastDate})
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: '#2d3435' }}>
                              &ldquo;{x.pastStatement}&rdquo;
                            </p>
                            <div className="text-xs mt-1 font-mono" style={{ color: '#9ba2a3' }}>
                              Source: {x.pastSource}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs leading-relaxed" style={{ color: '#6b7374' }}>
                          {x.explanation}
                          {(x.sourceUrl || x.searchQuery) && (
                            <span className="ml-2">
                              {x.sourceUrl && (
                                <a href={x.sourceUrl} target="_blank" rel="noopener noreferrer"
                                  className="font-mono hover:underline" style={{ color: '#a23f00' }}>
                                  [source]
                                </a>
                              )}
                              {x.searchQuery && (
                                <a href={searchUrl(x.searchQuery)} target="_blank" rel="noopener noreferrer"
                                  className="font-mono hover:underline ml-1" style={{ color: '#9ba2a3' }}>
                                  [verify]
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Independent Evidence */}
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}>Independent Evidence Gathered</h3>
            <p className="text-xs mb-4" style={{ color: '#9ba2a3' }}>
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
                    border: '1px solid rgba(196,203,204,0.15)',
                    borderLeftColor: e.supports === true ? '#2a7d4c' : e.supports === false ? '#a23f00' : '#9ba2a3',
                    borderLeftWidth: '3px',
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm leading-relaxed mb-1" style={{ color: '#2d3435' }}>{e.fact}</div>
                        <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: '#9ba2a3' }}>
                          <span>{e.source}</span>
                          <span>{e.date}</span>
                          <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                          <span className="px-1 rounded" style={{
                            background: e.type === 'statistic' ? 'rgba(162,63,0,0.06)' : e.type === 'unverifiable_recent' ? 'rgba(162,63,0,0.06)' : '#f2f4f4',
                            color: e.type === 'statistic' ? '#8f3600' : e.type === 'unverifiable_recent' ? '#a23f00' : '#9ba2a3',
                          }}>
                            {e.type.replace(/_/g, ' ')}
                          </span>
                          {e.dataPoint && <span style={{ color: '#a23f00' }}>Data: {e.dataPoint}</span>}
                          {e.sourceUrl && (
                            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="hover:underline" style={{ color: '#a23f00' }}>
                              [source]
                            </a>
                          )}
                          {e.searchQuery && (
                            <a href={searchUrl(e.searchQuery)} target="_blank" rel="noopener noreferrer"
                              className="hover:underline" style={{ color: '#9ba2a3' }}>
                              [verify]
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-right flex-shrink-0" style={{
                        color: impact > 0.3 ? '#a23f00' : '#9ba2a3',
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
            <div className="rounded-lg p-4" style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#a23f00' }}>CONTEXT THE ARTICLE OMITS</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>
                {result.synthesis.missingContext}
              </p>
            </div>
          )}

          {/* Missing Data */}
          {result.missingData && (
            <div className="rounded-lg p-4" style={{ background: '#f2f4f4', border: '1px solid rgba(196,203,204,0.15)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: '#9ba2a3' }}>DATA NOT PUBLICLY AVAILABLE</div>
              <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>
                {result.missingData}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {result.synthesis?.recommendations && result.synthesis.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#2d3435', fontFamily: "'Newsreader', serif" }}>How to Verify Further</h3>
              <div className="space-y-2">
                {result.synthesis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid rgba(196,203,204,0.15)' }}>
                    <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: '#a23f00' }}>{i + 1}.</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>{rec}</p>
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
