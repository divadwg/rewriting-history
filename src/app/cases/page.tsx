import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";
import { narrativeFragilityScore } from "@/lib/engine/fragility";

function fragilityColor(score: number): string {
  if (score >= 0.7) return '#c44536';
  if (score >= 0.5) return '#e87b35';
  if (score >= 0.3) return '#d06a2a';
  return '#2a9d5c';
}

function fragilityLabel(score: number): string {
  if (score >= 0.7) return 'HIGHLY FRAGILE';
  if (score >= 0.5) return 'MODERATELY FRAGILE';
  if (score >= 0.3) return 'LOW FRAGILITY';
  return 'ROBUST';
}

export default function CasesPage() {
  const cases = getAllCases();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Case Studies</h1>
      <p className="mb-8 text-sm" style={{ color: '#6b6b6b' }}>
        Each case models competing historical narratives as Bayesian hypotheses,
        with evidence items that can be toggled to see how beliefs shift.
        The fragility score measures how structurally vulnerable the official narrative
        is to revision.
      </p>
      <div className="grid gap-6">
        {cases.map(c => {
          const verdict = generateVerdict(c.hypotheses, c.evidence);
          const fragility = narrativeFragilityScore(c);
          const fColor = fragilityColor(fragility.overall);
          return (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="block rounded-lg p-6 transition-all hover:scale-[1.005]"
              style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>{c.title}</h2>
                  <div className="text-sm mb-3" style={{ color: '#999999' }}>{c.period}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-mono font-bold" style={{ color: fColor }}>
                    {(fragility.overall * 100).toFixed(0)}
                  </div>
                  <div className="text-xs font-mono" style={{ color: fColor }}>
                    {fragilityLabel(fragility.overall)}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b6b6b' }}>{c.summary}</p>
              {fragility.riskFactors.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {fragility.riskFactors.slice(0, 3).map((rf, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${fColor}10`, color: fColor }}>
                      {rf}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#999999' }}>
                <span>{c.hypotheses.length} hypotheses</span>
                <span>{c.evidence.length} evidence items</span>
                <span>{c.nodes.length} nodes</span>
                <span>{c.edges.length} edges</span>
                <span className="font-mono">
                  P(official) = {(verdict.officialPosterior * 100).toFixed(1)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
