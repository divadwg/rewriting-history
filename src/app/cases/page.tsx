import React from "react";
import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";
import { narrativeFragilityScore } from "@/lib/engine/fragility";

function fragilityColor(score: number): string {
  if (score >= 0.7) return '#a23f00';
  if (score >= 0.5) return '#c47a20';
  if (score >= 0.3) return '#8f3600';
  return '#2a7d4c';
}

function fragilityLabel(score: number): string {
  if (score >= 0.7) return 'HIGHLY FRAGILE';
  if (score >= 0.5) return 'MODERATELY FRAGILE';
  if (score >= 0.3) return 'LOW FRAGILITY';
  return 'ROBUST';
}

function statusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'overturned':
      return { background: 'rgba(162,63,0,0.08)', color: '#a23f00' };
    case 'confirmed':
      return { background: 'rgba(42,125,76,0.08)', color: '#2a7d4c' };
    case 'contested':
      return { background: 'rgba(196,122,32,0.08)', color: '#c47a20' };
    default:
      return { background: 'rgba(155,162,163,0.12)', color: '#6b7374' };
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'overturned': return 'OVERTURNED';
    case 'confirmed': return 'CONFIRMED';
    case 'contested': return 'CONTESTED';
    default: return 'UNKNOWN';
  }
}

function certaintyColor(score: number): string {
  if (score >= 0.7) return '#2a7d4c';
  if (score >= 0.4) return '#c47a20';
  return '#a23f00';
}

export default function CasesPage() {
  const cases = getAllCases();

  // Group by status
  const overturned = cases.filter(c => c.status === 'overturned');
  const confirmed = cases.filter(c => c.status === 'confirmed');
  const contested = cases.filter(c => c.status === 'contested');
  const other = cases.filter(c => !c.status);

  const groups = [
    { label: 'Overturned Narratives', desc: 'Official narratives that were later proven false', cases: overturned },
    { label: 'Confirmed Narratives', desc: 'Control cases where the official narrative held up', cases: confirmed },
    { label: 'Contested Narratives', desc: 'Genuinely unresolved cases where the framework produces novel analysis', cases: contested },
    ...(other.length > 0 ? [{ label: 'Other', desc: '', cases: other }] : []),
  ].filter(g => g.cases.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ background: '#f9f9f9', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: "'Newsreader', serif", color: '#2d3435', letterSpacing: '-0.02em' }}
          >
            Case Studies
          </h1>
          <p className="text-sm" style={{ fontFamily: "'Work Sans', sans-serif", color: '#6b7374', lineHeight: 1.6 }}>
            {cases.length} cases across 3 categories. The fragility score measures how structurally
            vulnerable the official narrative is to revision.
          </p>
        </div>
        <Link
          href="/validation"
          className="self-start sm:flex-shrink-0 text-xs px-4 py-2 rounded-lg transition-colors"
          style={{
            fontFamily: "'DM Mono', monospace",
            background: 'linear-gradient(45deg, #a23f00, #8f3600)',
            color: '#ffffff',
            borderRadius: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          Validation Experiment
        </Link>
      </div>

      {/* Groups */}
      {groups.map(group => (
        <div key={group.label} className="mb-10">
          <h2
            className="text-base font-semibold mb-0.5"
            style={{ fontFamily: "'Work Sans', sans-serif", color: '#2d3435' }}
          >
            {group.label}
          </h2>
          {group.desc && (
            <p className="text-xs mb-4" style={{ fontFamily: "'Work Sans', sans-serif", color: '#9ba2a3' }}>
              {group.desc}
            </p>
          )}
          <div className="grid gap-3">
            {group.cases.map(c => {
              const verdict = generateVerdict(c.hypotheses, c.evidence);
              const fragility = narrativeFragilityScore(c);
              const fColor = fragilityColor(fragility.structural);
              const badgeStyle = statusBadgeStyle(c.status ?? '');
              const certColor = certaintyColor(fragility.evidentialCertainty);
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block p-4 sm:p-5 transition-colors hover:bg-[#f2f4f4]"
                  style={{
                    background: '#ffffff',
                    borderRadius: '0.75rem',
                    outline: '1px solid rgba(196,203,204,0.15)',
                  }}
                >
                  {/* Top row: title + badge + scores */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3
                          className="text-base sm:text-lg font-semibold leading-snug"
                          style={{ fontFamily: "'Newsreader', serif", color: '#2d3435', letterSpacing: '-0.01em' }}
                        >
                          {c.title}
                        </h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ fontFamily: "'Work Sans', sans-serif", letterSpacing: '0.04em', ...badgeStyle }}
                        >
                          {statusLabel(c.status ?? '')}
                        </span>
                      </div>
                      <div
                        className="text-xs"
                        style={{ fontFamily: "'Work Sans', sans-serif", color: '#9ba2a3' }}
                      >
                        {c.period}
                      </div>
                    </div>

                    {/* Score pair */}
                    <div className="flex gap-4 sm:gap-5 flex-shrink-0">
                      <div>
                        <div
                          className="text-2xl sm:text-3xl font-bold leading-none"
                          style={{ fontFamily: "'DM Mono', monospace", color: fColor }}
                        >
                          {(fragility.structural * 100).toFixed(0)}
                        </div>
                        <div
                          className="text-[9px] mt-0.5 uppercase tracking-wide"
                          style={{ fontFamily: "'Work Sans', sans-serif", color: fColor }}
                        >
                          {fragilityLabel(fragility.structural)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-2xl sm:text-3xl font-bold leading-none"
                          style={{ fontFamily: "'DM Mono', monospace", color: certColor }}
                        >
                          {(fragility.evidentialCertainty * 100).toFixed(0)}
                        </div>
                        <div
                          className="text-[9px] mt-0.5 uppercase tracking-wide"
                          style={{ fontFamily: "'Work Sans', sans-serif", color: '#9ba2a3' }}
                        >
                          CERTAINTY
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ fontFamily: "'Work Sans', sans-serif", color: '#6b7374' }}
                  >
                    {c.summary.slice(0, 180)}...
                  </p>

                  {/* Risk factor tags */}
                  {fragility.riskFactors.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {fragility.riskFactors.slice(0, 3).map((rf, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            fontFamily: "'Work Sans', sans-serif",
                            background: `${fColor}12`,
                            color: fColor,
                          }}
                        >
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div
                    className="flex flex-wrap gap-3 sm:gap-4 text-xs"
                    style={{ fontFamily: "'Work Sans', sans-serif", color: '#9ba2a3' }}
                  >
                    <span>{c.hypotheses.length} hypotheses</span>
                    <span>{c.evidence.length} evidence</span>
                    <span>{c.nodes.length} nodes</span>
                    <span>{c.edges.length} edges</span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>
                      P(official) = {(verdict.officialPosterior * 100).toFixed(1)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
