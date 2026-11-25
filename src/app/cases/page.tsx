import React from "react";
import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";
import { narrativeFragilityScore } from "@/lib/engine/fragility";

function fragilityColor(score: number): string {
  if (score >= 0.7) return 'var(--alert-deep)';
  if (score >= 0.5) return 'var(--body)';
  if (score >= 0.3) return 'var(--body)';
  return 'var(--lime-deep)';
}

function fragilityLabel(score: number): string {
  if (score >= 0.7) return 'HIGHLY FRAGILE';
  if (score >= 0.5) return 'MODERATELY FRAGILE';
  if (score >= 0.3) return 'LOW FRAGILITY';
  return 'ROBUST';
}

function statusTone(status: string): string {
  switch (status) {
    case 'overturned': return 'bad';
    case 'confirmed': return 'ok';
    default: return '';
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
  if (score >= 0.7) return 'var(--lime-deep)';
  if (score >= 0.4) return 'var(--body)';
  return 'var(--alert-deep)';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            Case Studies
          </h1>
          <p className="text-sm" style={{ color: 'var(--body)', lineHeight: 1.6 }}>
            {cases.length} cases across 3 categories. The fragility score measures how structurally
            vulnerable the official narrative is to revision.
          </p>
        </div>
        <Link
          href="/validation"
          className="btn-primary self-start sm:flex-shrink-0 text-xs px-4 py-2 rounded-lg transition-colors"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--on-key)',
            whiteSpace: 'nowrap'
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
            style={{ color: 'var(--ink)' }}
          >
            {group.label}
          </h2>
          {group.desc && (
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              {group.desc}
            </p>
          )}
          <div className="grid gap-3">
            {group.cases.map(c => {
              const verdict = generateVerdict(c.hypotheses, c.evidence);
              const fragility = narrativeFragilityScore(c);
              const fColor = fragilityColor(fragility.structural);
              const tone = statusTone(c.status ?? '');
              const certColor = certaintyColor(fragility.evidentialCertainty);
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="card block p-4 sm:p-5 transition-colors">
                  {/* Top row: title + badge + scores */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3
                          className="text-base sm:text-lg font-semibold leading-snug"
                          style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                        >
                          {c.title}
                        </h3>
                        <span
                          className={`status ${tone} flex-shrink-0`}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}
                        >
                          {statusLabel(c.status ?? '')}
                        </span>
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--muted)' }}
                      >
                        {c.period}
                      </div>
                    </div>

                    {/* Score pair */}
                    <div className="flex gap-4 sm:gap-5 flex-shrink-0">
                      <div>
                        <div
                          className="stat text-3xl sm:text-4xl leading-none"
                          style={{ color: fColor }}
                        >
                          {(fragility.structural * 100).toFixed(0)}
                        </div>
                        <div
                          className="text-[9px] mt-0.5 uppercase tracking-wide"
                          style={{ color: fColor }}
                        >
                          {fragilityLabel(fragility.structural)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="stat text-3xl sm:text-4xl leading-none"
                          style={{ color: certColor }}
                        >
                          {(fragility.evidentialCertainty * 100).toFixed(0)}
                        </div>
                        <div
                          className="text-[9px] mt-0.5 uppercase tracking-wide"
                          style={{ color: 'var(--muted)' }}
                        >
                          CERTAINTY
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: 'var(--body)' }}
                  >
                    {c.summary.slice(0, 180)}...
                  </p>

                  {/* Risk factor tags */}
                  {fragility.riskFactors.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {fragility.riskFactors.slice(0, 3).map((rf, i) => (
                        <span
                          key={i}
                          className="tag text-[10px] px-2 py-0.5"
                          style={{ color: 'var(--body)' }}
                        >
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div
                    className="flex flex-wrap gap-3 sm:gap-4 text-xs"
                    style={{ color: 'var(--muted)' }}
                  >
                    <span>{c.hypotheses.length} hypotheses</span>
                    <span>{c.evidence.length} evidence</span>
                    <span>{c.nodes.length} nodes</span>
                    <span>{c.edges.length} edges</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
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
