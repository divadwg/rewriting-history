'use client';

import { useState, useMemo } from 'react';
import { Hypothesis, EvidenceItem, BayesianVerdict } from '@/lib/types/graph';
import { updatePosteriors, evidenceSensitivity, generateVerdict } from '@/lib/engine/bayesian';
import { IntegrationAdjustment } from '@/lib/engine/integration';

interface BayesianDashboardProps {
  hypotheses: Hypothesis[];
  evidence: EvidenceItem[];
  adjustments?: IntegrationAdjustment[];
}

function formatProb(value: number): string {
  if (value > 0.01) return `${(value * 100).toFixed(1)}%`;
  if (value > 0.001) return `${(value * 100).toFixed(2)}%`;
  if (value > 0.0001) return `${(value * 100).toFixed(3)}%`;
  if (value > 0) return `~0%`;
  return '0%';
}

function ProbabilityBar({ label, value, color, isOfficial }: { label: string; value: number; color: string; isOfficial?: boolean }) {
  const displayWidth = value > 0.01 ? value * 100 : value > 0 ? Math.max(Math.log10(value * 10000) * 8, 1) : 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#6b6b6b' }}>
          {isOfficial && <span className="font-mono mr-1" style={{ color: '#999999' }}>[OFFICIAL]</span>}
          {label.length > 60 ? label.slice(0, 60) + '...' : label}
        </span>
        <span className="font-mono font-bold" style={{ color }}>{formatProb(value)}</span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: '#eeeeee' }}>
        <div
          className="h-full rounded-full prob-bar-fill"
          style={{ width: `${Math.min(displayWidth, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: BayesianVerdict }) {
  const config = {
    official_refuted: { color: '#c44536', label: 'OFFICIAL NARRATIVE REFUTED', bg: 'rgba(196,69,54,0.08)' },
    official_unlikely: { color: '#e87b35', label: 'OFFICIAL NARRATIVE UNLIKELY', bg: 'rgba(232,123,53,0.08)' },
    official_questionable: { color: '#d06a2a', label: 'QUESTIONABLE', bg: 'rgba(208,106,42,0.08)' },
    official_supported: { color: '#2a9d5c', label: 'OFFICIAL SUPPORTED', bg: 'rgba(42,157,92,0.08)' },
  }[verdict.verdict];

  return (
    <div className="rounded-lg p-4 mb-4" style={{ background: config.bg, border: `1px solid ${config.color}30` }}>
      <div className="text-sm font-bold font-mono" style={{ color: config.color }}>{config.label}</div>
      <div className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
        Official posterior: {formatProb(verdict.officialPosterior)} |
        Best alternative: {formatProb(verdict.bestAlternativePosterior)}
      </div>
    </div>
  );
}

export default function BayesianDashboard({ hypotheses, evidence, adjustments = [] }: BayesianDashboardProps) {
  const [activeEvidence, setActiveEvidence] = useState<Set<string>>(
    new Set(evidence.map(e => e.id))
  );

  const toggleEvidence = (id: string) => {
    setActiveEvidence(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const posteriors = useMemo(
    () => updatePosteriors(hypotheses, evidence, activeEvidence),
    [hypotheses, evidence, activeEvidence]
  );

  const verdict = useMemo(
    () => generateVerdict(
      hypotheses.map(h => ({ ...h, posterior: h.prior })),
      evidence.filter(e => activeEvidence.has(e.id))
    ),
    [hypotheses, evidence, activeEvidence]
  );

  const sensitivity = useMemo(
    () => evidenceSensitivity(hypotheses, evidence),
    [hypotheses, evidence]
  );

  return (
    <div className="space-y-6">
      <VerdictBadge verdict={verdict} />

      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1a1a' }}>Hypothesis Probabilities</h3>
        {posteriors.map(h => (
          <ProbabilityBar
            key={h.id}
            label={h.label}
            value={h.posterior}
            color={h.isOfficial ? '#c44536' : '#2a9d5c'}
            isOfficial={h.isOfficial}
          />
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1a1a' }}>
          Evidence ({activeEvidence.size}/{evidence.length} active)
        </h3>
        <p className="text-xs mb-3" style={{ color: '#999999' }}>
          Toggle evidence items to see how posteriors shift
        </p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {evidence.map(e => {
            const isActive = activeEvidence.has(e.id);
            const sens = sensitivity.find(s => s.evidenceId === e.id);
            const adj = adjustments.find(a => a.evidenceId === e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggleEvidence(e.id)}
                className="w-full text-left rounded-lg p-3 transition-all text-xs"
                style={{
                  background: isActive ? '#ffffff' : '#f0f0f0',
                  border: `1px solid ${isActive ? (adj ? '#e87b3540' : '#e5e5e5') : '#eeeeee'}`,
                  opacity: isActive ? 1 : 0.5,
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium mb-1" style={{ color: isActive ? '#1a1a1a' : '#999999' }}>
                      {e.label}
                    </div>
                    <div className="text-xs" style={{ color: '#999999' }}>
                      {e.date}
                      {e.wasClassified && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{ background: 'rgba(196,69,54,0.1)', color: '#c44536' }}>
                          CLASSIFIED{e.declassifiedDate ? ` until ${e.declassifiedDate}` : ''}
                        </span>
                      )}
                      <span className="ml-2 font-mono" style={{ color: '#999999' }}>
                        reliability: {(e.sourceReliability * 100).toFixed(0)}%
                      </span>
                      {adj && (
                        <span className="ml-1 font-mono" style={{ color: adj.adjustedReliability < adj.originalReliability ? '#c44536' : '#2a9d5c' }}>
                          ({adj.adjustedReliability < adj.originalReliability ? '' : '+'}{((adj.adjustedReliability - adj.originalReliability) * 100).toFixed(0)}% from graph)
                        </span>
                      )}
                    </div>
                    {adj && isActive && (
                      <div className="mt-1 space-y-0.5">
                        {adj.reasons.map((r, i) => (
                          <div key={i} className="text-xs italic" style={{ color: '#d06a2a' }}>
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {sens && (
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-xs" style={{ color: sens.impact > 0.1 ? '#e87b35' : '#999999' }}>
                        impact: {(sens.impact * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Most Impactful Evidence</h3>
        <div className="space-y-1">
          {sensitivity.slice(0, 5).map((s, i) => (
            <div key={s.evidenceId} className="flex items-center gap-2 text-xs">
              <span className="font-mono w-4" style={{ color: '#999999' }}>{i + 1}.</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: '#eeeeee' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(s.impact * 200, 100)}%`, background: '#e87b35' }}
                />
              </div>
              <span className="flex-1 truncate" style={{ color: '#6b6b6b' }}>{s.label}</span>
              <span className="font-mono" style={{ color: '#e87b35' }}>{(s.impact * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
