import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";
import { narrativeFragilityScore, preRevelationFragility } from "@/lib/engine/fragility";

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

function statusColor(status: string): string {
  switch (status) {
    case 'overturned': return '#c44536';
    case 'confirmed': return '#2a9d5c';
    case 'contested': return '#e87b35';
    default: return '#999999';
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Case Studies</h1>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>
            {cases.length} cases across 3 categories. The fragility score measures how structurally
            vulnerable the official narrative is to revision.
          </p>
        </div>
        <Link
          href="/validation"
          className="text-xs font-mono px-4 py-2 rounded-lg flex-shrink-0"
          style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#e87b35' }}
        >
          Validation Experiment
        </Link>
      </div>

      {groups.map(group => (
        <div key={group.label} className="mb-10">
          <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1a1a' }}>{group.label}</h2>
          <p className="text-xs mb-4" style={{ color: '#999999' }}>{group.desc}</p>
          <div className="grid gap-4">
            {group.cases.map(c => {
              const verdict = generateVerdict(c.hypotheses, c.evidence);
              const fragility = narrativeFragilityScore(c);
              const pre = preRevelationFragility(c);
              const fColor = fragilityColor(fragility.structural);
              const sColor = statusColor(c.status ?? '');
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block rounded-lg p-5 transition-all hover:scale-[1.003]"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{c.title}</h2>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{ color: sColor, border: `1px solid ${sColor}` }}>
                          {statusLabel(c.status ?? '')}
                        </span>
                      </div>
                      <div className="text-xs mb-2" style={{ color: '#999999' }}>{c.period}</div>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold" style={{ color: fColor }}>
                          {(fragility.structural * 100).toFixed(0)}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: fColor }}>
                          {fragilityLabel(fragility.structural)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold" style={{
                          color: fragility.evidentialCertainty >= 0.7 ? '#2a9d5c' :
                            fragility.evidentialCertainty >= 0.4 ? '#e87b35' : '#c44536'
                        }}>
                          {(fragility.evidentialCertainty * 100).toFixed(0)}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: '#999999' }}>
                          CERTAINTY
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b6b6b' }}>{c.summary.slice(0, 180)}...</p>
                  {fragility.riskFactors.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {fragility.riskFactors.slice(0, 3).map((rf, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${fColor}10`, color: fColor }}>
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#999999' }}>
                    <span>{c.hypotheses.length} hypotheses</span>
                    <span>{c.evidence.length} evidence</span>
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
      ))}
    </div>
  );
}
