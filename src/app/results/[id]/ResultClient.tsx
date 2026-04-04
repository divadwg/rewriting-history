'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { StoredResult } from '@/lib/storage/results';

function formatProb(v: number): string {
  if (v > 0.01) return `${(v * 100).toFixed(1)}%`;
  if (v > 0.001) return `${(v * 100).toFixed(2)}%`;
  return '~0%';
}

function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const STATUS_COLORS: Record<string, string> = {
  supported: '#2a9d5c',
  partially_supported: '#e87b35',
  unsupported: '#c44536',
  contradicted: '#c44536',
  unverifiable: '#999999',
};

function ShareBar({ id, title }: { id: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/results/${id}` : `/results/${id}`;

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg p-3 mb-8"
      style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono truncate" style={{ color: '#999999' }}>{url}</div>
      </div>
      <button
        onClick={copy}
        className="text-xs font-bold px-4 py-1.5 rounded transition-colors flex-shrink-0"
        style={{
          background: copied ? '#2a9d5c' : '#e87b35',
          color: 'white',
        }}
      >
        {copied ? 'Copied' : 'Copy Link'}
      </button>
    </div>
  );
}

export default function ResultClient({ result }: { result: StoredResult }) {
  const d = result.data as Record<string, unknown>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: '#999999' }}>
            {result.type === 'live' ? 'Article Verification' : 'Evidence-First Discovery'}
            {' '}&middot;{' '}
            {new Date(result.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{result.title}</h1>
        </div>
        <Link
          href={result.type === 'live' ? '/live' : '/challenge'}
          className="text-xs px-3 py-1.5 rounded flex-shrink-0"
          style={{ border: '1px solid #e5e5e5', color: '#999999' }}
        >
          New Analysis
        </Link>
      </div>

      <ShareBar id={result.id} title={result.title} />

      {result.type === 'live' ? <LiveResultDisplay data={d} /> : <ChallengeResultDisplay data={d} />}
    </div>
  );
}

// ─── Live Article Verification Display ──────────────────────────────────────

function LiveResultDisplay({ data }: { data: Record<string, unknown> }) {
  const claims = (data.claims ?? []) as Array<{
    id: string; claim: string; claimant: string; claimantRole: string;
    benefitsClaimant: boolean; confidenceLanguage: string; evidenceCited: string;
  }>;
  const evidence = (data.evidence ?? []) as Array<{
    id: string; fact: string; source: string; date: string; type: string;
    sourceReliability: number; relevantToClaims: string[]; supports: boolean | null;
    dataPoint: string | null; sourceUrl?: string | null; searchQuery?: string | null;
  }>;
  const bayesian = data.bayesian as {
    posteriors: Array<{ id: string; label: string; posterior: number; isOfficial: boolean }>;
    sensitivity: Array<{ evidenceId: string; label: string; impact: number }>;
    verdict: { verdict: string };
  };
  const synthesis = data.synthesis as {
    overallAssessment: string;
    claimVerifications: Array<{
      claimId: string; status: string; explanation: string; keyEvidence: string[];
      verifyUrl?: string | null; verifySearchQuery?: string | null;
    }>;
    missingContext: string;
    strongestEvidence: string[];
    recommendations: string[];
  } | null;
  const contradictions = (data.contradictions ?? []) as Array<{
    id: string; actor: string; actorRole: string;
    currentStatement: string; currentDate: string;
    pastStatement: string; pastDate: string; pastSource: string;
    contradictionType: string; severity: number; explanation: string;
    sourceUrl?: string | null; searchQuery?: string | null;
  }>;
  const articleTitle = data.articleTitle as string | undefined;
  const articleUrl = data.articleUrl as string | undefined;
  const articleDate = data.articleDate as string | undefined;

  return (
    <div className="space-y-8">
      {/* Article header */}
      {articleTitle && (
        <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
          <h3 className="font-bold" style={{ color: '#1a1a1a' }}>{articleTitle}</h3>
          <div className="flex flex-wrap gap-3 text-xs font-mono mt-1" style={{ color: '#999999' }}>
            {articleUrl && (
              <a href={articleUrl} target="_blank" rel="noopener noreferrer"
                className="hover:underline" style={{ color: '#e87b35' }}>
                {(() => { try { return new URL(articleUrl).hostname; } catch { return articleUrl; } })()}
              </a>
            )}
            {articleDate && <span>{articleDate}</span>}
          </div>
        </div>
      )}

      {/* Pipeline badge */}
      <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#999999' }}>
        <span className="px-2 py-1 rounded" style={{ background: '#2a9d5c10', color: '#2a9d5c', border: '1px solid #2a9d5c30' }}>
          Evidence-first verification
        </span>
        <span>{claims.length} claims extracted</span>
        <span>{evidence.length} independent evidence items</span>
        {contradictions.length > 0 && <span>{contradictions.length} contradictions found</span>}
      </div>

      {/* Overall Assessment */}
      {synthesis?.overallAssessment && (
        <div className="rounded-lg p-5" style={{ background: '#fdf0e6', border: '1px solid rgba(232,123,53,0.2)' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>OVERALL ASSESSMENT</div>
          <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>
            {synthesis.overallAssessment}
          </p>
        </div>
      )}

      {/* Bayesian Posteriors */}
      {bayesian && (
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Article Reliability — Bayesian Posteriors</h3>
          <p className="text-xs mb-4" style={{ color: '#999999' }}>
            Computed from {evidence.length} independent evidence items.
          </p>
          <div className="space-y-4">
            {bayesian.posteriors.map(h => {
              const maxP = Math.max(...bayesian.posteriors.map(p => p.posterior));
              const isWinner = h.posterior === maxP;
              const color = isWinner ? '#2a9d5c' : '#999999';
              return (
                <div key={h.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#6b6b6b' }}>
                      {isWinner && <span className="font-mono mr-1" style={{ color: '#2a9d5c' }}>[BEST FIT]</span>}
                      {h.isOfficial && <span className="font-mono mr-1" style={{ color: '#999999' }}>[ARTICLE&apos;S FRAMING]</span>}
                      {h.label}
                    </span>
                    <span className="font-mono font-bold" style={{ color }}>{formatProb(h.posterior)}</span>
                  </div>
                  <div className="w-full h-4 rounded-full" style={{ background: '#eeeeee' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.max(h.posterior * 100, 2)}%`,
                      background: isWinner ? '#2a9d5c' : h.isOfficial ? '#c44536' : '#999999',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claim-by-Claim Verification */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>
          Claim-by-Claim Verification ({claims.length} claims)
        </h3>
        <div className="space-y-3">
          {claims.map(claim => {
            const verification = synthesis?.claimVerifications?.find(v => v.claimId === claim.id);
            const sColor = STATUS_COLORS[verification?.status || 'unverifiable'] || '#999999';
            return (
              <div key={claim.id} className="rounded-lg p-4" style={{
                background: '#ffffff', border: '1px solid #e5e5e5',
                borderLeftColor: sColor, borderLeftWidth: '3px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-sm leading-relaxed" style={{ color: '#1a1a1a' }}>
                    &ldquo;{claim.claim}&rdquo;
                  </div>
                  {verification && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${sColor}10`, color: sColor }}>
                      {verification.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs mb-2" style={{ color: '#999999' }}>
                  <span>By: {claim.claimant} ({claim.claimantRole})</span>
                  {claim.benefitsClaimant && <span className="font-mono" style={{ color: '#e87b35' }}>SELF-SERVING</span>}
                  <span>Confidence: {claim.confidenceLanguage}</span>
                </div>
                {verification?.explanation && (
                  <div className="text-xs leading-relaxed rounded p-2 mt-2" style={{ background: '#f7f7f7', color: '#6b6b6b' }}>
                    {verification.explanation}
                    {verification.verifySearchQuery && (
                      <a href={searchUrl(verification.verifySearchQuery)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono hover:underline ml-2"
                        style={{ color: '#999999' }}>
                        [verify]
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contradictions */}
      {contradictions.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: '#c44536' }}>
            Contradictions &amp; Past Statements ({contradictions.length})
          </h3>
          <div className="space-y-3 mt-4">
            {contradictions.sort((a, b) => b.severity - a.severity).map(x => {
              const sevColor = x.severity >= 4 ? '#c44536' : x.severity >= 3 ? '#e87b35' : '#d06a2a';
              return (
                <div key={x.id} className="rounded-lg p-4" style={{
                  background: '#ffffff', border: '1px solid #e5e5e5',
                  borderLeftColor: sevColor, borderLeftWidth: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                      {x.actor} <span className="font-normal" style={{ color: '#999999' }}>({x.actorRole})</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${sevColor}10`, color: sevColor }}>
                      {x.contradictionType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div className="rounded p-3" style={{ background: '#f7f7f7' }}>
                      <div className="text-xs font-mono mb-1" style={{ color: '#e87b35' }}>NOW ({x.currentDate})</div>
                      <p className="text-xs leading-relaxed" style={{ color: '#1a1a1a' }}>&ldquo;{x.currentStatement}&rdquo;</p>
                    </div>
                    <div className="rounded p-3" style={{ background: '#c4453608' }}>
                      <div className="text-xs font-mono mb-1" style={{ color: '#c44536' }}>PREVIOUSLY ({x.pastDate})</div>
                      <p className="text-xs leading-relaxed" style={{ color: '#1a1a1a' }}>&ldquo;{x.pastStatement}&rdquo;</p>
                      <div className="text-xs mt-1 font-mono" style={{ color: '#999999' }}>Source: {x.pastSource}</div>
                    </div>
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>
                    {x.explanation}
                    {x.searchQuery && (
                      <a href={searchUrl(x.searchQuery)} target="_blank" rel="noopener noreferrer"
                        className="font-mono hover:underline ml-2" style={{ color: '#999999' }}>[verify]</a>
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
        <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Independent Evidence Gathered</h3>
        <p className="text-xs mb-4" style={{ color: '#999999' }}>
          {evidence.length} items from sources outside the article, sorted by Bayesian impact.
        </p>
        <div className="space-y-3">
          {evidence
            .map(e => ({
              e,
              impact: bayesian?.sensitivity.find(s => s.evidenceId === e.id)?.impact || 0,
            }))
            .sort((a, b) => b.impact - a.impact)
            .map(({ e, impact }) => (
              <div key={e.id} className="rounded-lg p-4" style={{
                background: '#ffffff', border: '1px solid #e5e5e5',
                borderLeftColor: e.supports === true ? '#2a9d5c' : e.supports === false ? '#c44536' : '#999999',
                borderLeftWidth: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm leading-relaxed mb-1" style={{ color: '#1a1a1a' }}>{e.fact}</div>
                    <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: '#999999' }}>
                      <span>{e.source}</span>
                      <span>{e.date}</span>
                      <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                      {e.searchQuery && (
                        <a href={searchUrl(e.searchQuery)} target="_blank" rel="noopener noreferrer"
                          className="hover:underline" style={{ color: '#999999' }}>[verify]</a>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-right flex-shrink-0"
                    style={{ color: impact > 0.3 ? '#e87b35' : '#999999' }}>
                    impact<br />{(impact * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Missing Context */}
      {synthesis?.missingContext && (
        <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>CONTEXT THE ARTICLE OMITS</div>
          <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{synthesis.missingContext}</p>
        </div>
      )}

      {/* Recommendations */}
      {synthesis?.recommendations && synthesis.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>How to Verify Further</h3>
          <div className="space-y-2">
            {synthesis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-4"
                style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: '#e87b35' }}>{i + 1}.</span>
                <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Challenge / Evidence-First Discovery Display ───────────────────────────

function ChallengeResultDisplay({ data }: { data: Record<string, unknown> }) {
  const result = data.result as {
    belief: string; standardNarrative: string; contrarianCase: string;
    keyInsight: string; confidenceNote: string; furtherReading: string[];
    evidence: Array<{
      id: string; description: string; date: string; sourceReliability: number;
      wasClassified: boolean; likelihoodRatios: Record<string, number>;
    }>;
    causalFactors: Array<{ id: string; label: string; date: string; type: string }>;
    causalLinks: Array<{ mechanism: string }>;
  };
  const bayesian = data.bayesian as {
    posteriors: Array<{ id: string; label: string; posterior: number; isOfficial: boolean }>;
    sensitivity: Array<{ evidenceId: string; label: string; impact: number }>;
    verdict: { verdict: string };
  };
  const synthesis = data.synthesis as {
    novelFinding?: string;
    missingEvidence?: string;
  } | null;
  const rawEvidence = (data.rawEvidence ?? []) as Array<{
    id: string; sourceUrl: string | null; searchQuery: string | null;
  }>;
  const rawEvidenceCount = (data.rawEvidenceCount ?? result?.evidence?.length ?? 0) as number;
  const hypothesisCount = (data.hypothesisCount ?? bayesian?.posteriors?.length ?? 0) as number;

  if (!result) return <div className="text-sm" style={{ color: '#999999' }}>No result data found.</div>;

  return (
    <div className="space-y-8">
      {/* Pipeline badge */}
      <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#999999' }}>
        <span className="px-2 py-1 rounded" style={{ background: '#2a9d5c10', color: '#2a9d5c', border: '1px solid #2a9d5c30' }}>
          Evidence-first pipeline
        </span>
        <span>{rawEvidenceCount} primary sources gathered</span>
        <span>{hypothesisCount} hypotheses generated</span>
      </div>

      {/* Research Question */}
      <div className="rounded-lg p-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="text-xs font-mono mb-2" style={{ color: '#999999' }}>RESEARCH QUESTION</div>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>{result.belief}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>Popular understanding</div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{result.standardNarrative}</p>
          </div>
          <div>
            <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>What the evidence shows</div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{result.contrarianCase}</p>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="rounded-lg p-5" style={{ background: '#fdf0e6', border: '1px solid rgba(232,123,53,0.2)' }}>
        <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>KEY FINDING</div>
        <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>{result.keyInsight}</p>
      </div>

      {/* Novel Finding */}
      {synthesis?.novelFinding && (
        <div className="rounded-lg p-5" style={{ background: '#2a9d5c08', border: '1px solid #2a9d5c30' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#2a9d5c' }}>NOVEL FINDING</div>
          <p className="text-base leading-relaxed" style={{ color: '#1a1a1a' }}>{synthesis.novelFinding}</p>
        </div>
      )}

      {/* Missing Evidence */}
      {synthesis?.missingEvidence && (
        <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>WHAT WOULD RESOLVE THE UNCERTAINTY</div>
          <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{synthesis.missingEvidence}</p>
        </div>
      )}

      {/* Bayesian Results */}
      {bayesian && (
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Bayesian Posteriors</h3>
          <p className="text-xs mb-4" style={{ color: '#999999' }}>
            Computed mathematically from {rawEvidenceCount} evidence items.
          </p>
          <div className="space-y-4">
            {bayesian.posteriors.map(h => {
              const maxP = Math.max(...bayesian.posteriors.map(p => p.posterior));
              const isWinner = h.posterior === maxP;
              const color = isWinner ? '#2a9d5c' : '#999999';
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
                    <div className="h-full rounded-full" style={{
                      width: `${Math.max(h.posterior * 100, 2)}%`,
                      background: isWinner ? '#2a9d5c' : h.isOfficial ? '#c44536' : '#999999',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const v = bayesian.verdict;
            const config: Record<string, { color: string; label: string }> = {
              official_refuted: { color: '#c44536', label: 'STANDARD NARRATIVE NOT SUPPORTED BY EVIDENCE' },
              official_unlikely: { color: '#e87b35', label: 'STANDARD NARRATIVE UNLIKELY GIVEN EVIDENCE' },
              official_questionable: { color: '#d06a2a', label: 'STANDARD NARRATIVE QUESTIONABLE' },
              official_supported: { color: '#2a9d5c', label: 'STANDARD NARRATIVE SUPPORTED BY EVIDENCE' },
            };
            const c = config[v.verdict] || { color: '#999999', label: v.verdict };
            return (
              <div className="mt-4 rounded-lg p-4" style={{ background: `${c.color}08`, border: `1px solid ${c.color}30` }}>
                <span className="text-sm font-mono font-bold" style={{ color: c.color }}>{c.label}</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Evidence */}
      {result.evidence && result.evidence.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>Primary Source Evidence</h3>
          <p className="text-xs mb-4" style={{ color: '#999999' }}>
            {result.evidence.length} items gathered. Sorted by Bayesian impact.
          </p>
          <div className="space-y-3">
            {result.evidence
              .map(e => ({
                e,
                impact: bayesian?.sensitivity.find(s => s.evidenceId === e.id)?.impact || 0,
              }))
              .sort((a, b) => b.impact - a.impact)
              .map(({ e, impact }) => {
                const ratios = e.likelihoodRatios;
                const bestHypId = Object.entries(ratios).sort((a, b) => b[1] - a[1])[0]?.[0];
                const bestHyp = bayesian?.posteriors.find(h => h.id === bestHypId);
                const maxP = Math.max(...(bayesian?.posteriors.map(p => p.posterior) ?? [0]));
                const supportsWinner = bestHyp && bestHyp.posterior === maxP;
                const links = rawEvidence.find(r => r.id === e.id);

                return (
                  <div key={e.id} className="rounded-lg p-4" style={{
                    background: '#ffffff', border: '1px solid #e5e5e5',
                    borderLeftColor: supportsWinner ? '#2a9d5c' : '#e87b35',
                    borderLeftWidth: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm leading-relaxed mb-2" style={{ color: '#1a1a1a' }}>{e.description}</div>
                        <div className="flex flex-wrap gap-3 text-xs font-mono items-center" style={{ color: '#999999' }}>
                          <span>{e.date}</span>
                          <span>reliability: {(e.sourceReliability * 100).toFixed(0)}%</span>
                          {e.wasClassified && <span style={{ color: '#c44536' }}>DECLASSIFIED</span>}
                          {links?.searchQuery && (
                            <a href={searchUrl(links.searchQuery)} target="_blank" rel="noopener noreferrer"
                              className="hover:underline" style={{ color: '#999999' }}>[verify]</a>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-right flex-shrink-0"
                        style={{ color: impact > 0.3 ? '#e87b35' : '#999999' }}>
                        impact<br />{(impact * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Causal Chain */}
      {result.causalFactors && result.causalFactors.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1a1a' }}>Causal Structure</h3>
          <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {result.causalFactors.map((cf, i) => (
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
                {i < (result.causalLinks?.length ?? 0) && result.causalLinks[i] && (
                  <div className="ml-1.5 pl-3 py-2" style={{ borderLeft: '1px solid #e5e5e5' }}>
                    <div className="text-xs italic" style={{ color: '#bbbbbb' }}>{result.causalLinks[i].mechanism}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence + Further Reading */}
      <div className="grid md:grid-cols-2 gap-6">
        {result.confidenceNote && (
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>CONFIDENCE ASSESSMENT</div>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{result.confidenceNote}</p>
          </div>
        )}
        {result.furtherReading && result.furtherReading.length > 0 && (
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-bold mb-2" style={{ color: '#999999' }}>PRIMARY SOURCES / FURTHER READING</div>
            <ul className="space-y-1.5">
              {result.furtherReading.map((ref, i) => (
                <li key={i} className="text-xs pl-3 leading-relaxed" style={{ color: '#6b6b6b', borderLeft: '2px solid #e87b35' }}>
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
