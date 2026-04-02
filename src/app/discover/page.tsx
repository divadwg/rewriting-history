'use client';

import { useState } from 'react';
import { getAllCases } from '@/lib/data';
import { runDiscovery } from '@/lib/engine/discovery';
import { CaseStudy, DiscoveryResult } from '@/lib/types/graph';
import Link from 'next/link';

const cases = getAllCases();

function InconsistencyCard({ inconsistency }: { inconsistency: DiscoveryResult['inconsistencies'][0] }) {
  const typeConfig = {
    contradiction: { color: '#c44536', label: 'CONTRADICTION' },
    temporal_impossibility: { color: '#e87b35', label: 'TEMPORAL ISSUE' },
    source_clustering: { color: '#b07030', label: 'SOURCE CLUSTERING' },
    evidence_suppression: { color: '#d06a2a', label: 'EVIDENCE SUPPRESSION' },
  }[inconsistency.type];

  return (
    <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: `${typeConfig.color}10`, color: typeConfig.color }}>
          {typeConfig.label}
        </span>
        <span className="text-xs font-mono" style={{ color: '#999999' }}>
          severity: {(inconsistency.severity * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
        {inconsistency.description}
      </p>
      <div className="mt-2 w-full h-1.5 rounded-full" style={{ background: '#eeeeee' }}>
        <div className="h-full rounded-full" style={{
          width: `${inconsistency.severity * 100}%`,
          background: typeConfig.color,
        }} />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const handleAnalyze = (c: CaseStudy) => {
    setSelectedCase(c);
    const discovery = runDiscovery(c);
    setResult(discovery);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Discovery Mode</h1>
      <p className="text-sm mb-8" style={{ color: '#6b6b6b' }}>
        Run the discovery engine on any case study. It finds contradictions, source clustering,
        evidence suppression patterns, and computes Bayesian verdicts automatically.
      </p>

      {/* Case selector */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {cases.map(c => (
          <button
            key={c.id}
            onClick={() => handleAnalyze(c)}
            className="text-left rounded-lg p-4 transition-all hover:scale-[1.02]"
            style={{
              background: selectedCase?.id === c.id ? '#fdf0e6' : '#ffffff',
              border: `1px solid ${selectedCase?.id === c.id ? '#e87b35' : '#e5e5e5'}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <h3 className="font-bold text-sm mb-1" style={{ color: '#1a1a1a' }}>{c.title}</h3>
            <p className="text-xs" style={{ color: '#999999' }}>{c.period}</p>
          </button>
        ))}
      </div>

      {/* Results */}
      {result && selectedCase && (
        <div className="space-y-8">
          {/* Verdict */}
          <div className="rounded-lg p-6" style={{
            background: result.bayesianVerdict.verdict === 'official_refuted'
              ? 'rgba(196,69,54,0.06)'
              : result.bayesianVerdict.verdict === 'official_unlikely'
              ? 'rgba(232,123,53,0.06)'
              : 'rgba(42,157,92,0.06)',
            border: `1px solid ${
              result.bayesianVerdict.verdict === 'official_refuted' ? '#c4453630'
              : result.bayesianVerdict.verdict === 'official_unlikely' ? '#e87b3530'
              : '#2a9d5c30'
            }`,
          }}>
            <div className="text-lg font-bold font-mono mb-2" style={{
              color: result.bayesianVerdict.verdict === 'official_refuted' ? '#c44536'
                : result.bayesianVerdict.verdict === 'official_unlikely' ? '#e87b35' : '#2a9d5c',
            }}>
              {result.bayesianVerdict.verdict.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs mb-1" style={{ color: '#999999' }}>Official Hypothesis</div>
                <div className="text-sm" style={{ color: '#6b6b6b' }}>{result.bayesianVerdict.officialHypothesis.label}</div>
                <div className="text-2xl font-mono font-bold mt-1" style={{ color: '#c44536' }}>
                  {(result.bayesianVerdict.officialPosterior * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#999999' }}>Best Alternative</div>
                <div className="text-sm" style={{ color: '#6b6b6b' }}>
                  {result.bayesianVerdict.alternativeHypotheses[0]?.label}
                </div>
                <div className="text-2xl font-mono font-bold mt-1" style={{ color: '#2a9d5c' }}>
                  {(result.bayesianVerdict.bestAlternativePosterior * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <Link
              href={`/cases/${selectedCase.id}`}
              className="text-xs px-4 py-2 rounded-lg inline-block transition-opacity hover:opacity-90"
              style={{ background: '#e87b35', color: 'white' }}
            >
              Explore Full Interactive Analysis
            </Link>
          </div>

          {/* Inconsistencies */}
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
              Inconsistencies Found ({result.inconsistencies.length})
            </h2>
            <div className="grid gap-4">
              {result.inconsistencies.map((inc, i) => (
                <InconsistencyCard key={i} inconsistency={inc} />
              ))}
            </div>
          </div>

          {/* Narrative Shifts */}
          {result.narrativeShifts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                Narrative Shifts ({result.narrativeShifts.length})
              </h2>
              <div className="space-y-4">
                {result.narrativeShifts.map((shift, i) => (
                  <div key={i} className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono" style={{ color: '#e87b35' }}>{shift.fromDate}</span>
                      <span style={{ color: '#999999' }}>→</span>
                      <span className="text-xs font-mono" style={{ color: '#e87b35' }}>{shift.toDate}</span>
                      {shift.trigger && (
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: '#fdf0e6', color: '#d06a2a' }}>
                          {shift.trigger}
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>{shift.description}</p>
                    <div className="mt-2 flex gap-4 text-xs font-mono" style={{ color: '#999999' }}>
                      <span>Before: {shift.claimsBefore.length} active claims</span>
                      <span>After: {shift.claimsAfter.length} active claims</span>
                    </div>
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
