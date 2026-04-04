import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { runValidation, type ValidationResult } from "@/lib/engine/fragility";

function fragilityColor(score: number): string {
  if (score >= 0.7) return '#c44536';
  if (score >= 0.5) return '#e87b35';
  if (score >= 0.3) return '#d06a2a';
  return '#2a9d5c';
}

function statusColor(status: string): string {
  switch (status) {
    case 'overturned': return '#c44536';
    case 'confirmed': return '#2a9d5c';
    case 'contested': return '#e87b35';
    default: return '#999999';
  }
}

export default function ValidationPage() {
  const cases = getAllCases();
  const results = runValidation(cases);

  const overturned = results.filter(r => r.status === 'overturned');
  const confirmed = results.filter(r => r.status === 'confirmed');
  const contested = results.filter(r => r.status === 'contested');

  // Compute summary stats
  const overturnedDetected = overturned.filter(r => r.preRevelationDetected === true).length;
  const overturnedWithPre = overturned.filter(r => r.preRevelation !== null).length;
  const confirmedFalsePositives = confirmed.filter(r => r.postRevelation.overall >= 0.3).length;
  const avgOverturnedPre = overturnedWithPre > 0
    ? overturned.filter(r => r.preRevelation).reduce((s, r) => s + (r.preRevelation?.overall ?? 0), 0) / overturnedWithPre
    : 0;
  const avgConfirmedPost = confirmed.length > 0
    ? confirmed.reduce((s, r) => s + r.postRevelation.overall, 0) / confirmed.length
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Validation Experiment</h1>
        <p className="text-sm leading-relaxed max-w-3xl" style={{ color: '#6b6b6b' }}>
          Can the Narrative Fragility Score predict which historical narratives will be overturned?
          We test the framework against {cases.length} case studies across three categories:
          overturned (should score high), confirmed (should score low), and contested (novel analysis).
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <SummaryCard
          label="Pre-revelation detection"
          value={overturnedWithPre > 0 ? `${overturnedDetected}/${overturnedWithPre}` : 'N/A'}
          detail="Overturned cases flagged as fragile using only pre-revelation evidence"
          color="#e87b35"
        />
        <SummaryCard
          label="False positive rate"
          value={confirmed.length > 0 ? `${confirmedFalsePositives}/${confirmed.length}` : 'N/A'}
          detail="Confirmed cases incorrectly flagged as fragile"
          color={confirmedFalsePositives === 0 ? '#2a9d5c' : '#c44536'}
        />
        <SummaryCard
          label="Avg overturned (pre)"
          value={avgOverturnedPre > 0 ? (avgOverturnedPre * 100).toFixed(0) : 'N/A'}
          detail="Mean pre-revelation fragility for overturned cases"
          color="#e87b35"
        />
        <SummaryCard
          label="Avg confirmed (post)"
          value={avgConfirmedPost > 0 ? (avgConfirmedPost * 100).toFixed(0) : 'N/A'}
          detail="Mean fragility for confirmed cases (should be low)"
          color="#2a9d5c"
        />
      </div>

      {/* Main results table */}
      <div className="rounded-lg overflow-hidden mb-10" style={{ border: '1px solid #e5e5e5' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #e5e5e5' }}>
              <th className="text-left px-4 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Case</th>
              <th className="text-center px-3 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Status</th>
              <th className="text-center px-3 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Post-revelation</th>
              <th className="text-center px-3 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Pre-revelation</th>
              <th className="text-center px-3 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Delta</th>
              <th className="text-center px-3 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Detected?</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <ResultRow key={r.caseId} result={r} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Contested cases — novel findings */}
      {contested.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Novel Findings: Contested Cases</h2>
          <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
            These cases have no definitive resolution. The fragility score and its components
            offer a structural analysis of narrative vulnerability that may inform the debate.
          </p>
          <div className="grid gap-4">
            {contested.map(r => (
              <ContestedCard key={r.caseId} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Methodology */}
      <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>Methodology</h2>
        <div className="text-sm leading-relaxed space-y-2" style={{ color: '#6b6b6b' }}>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Hypothesis:</strong> If the Narrative Fragility Score captures genuine structural
            indicators of narrative manipulation, then cases where the official narrative was later overturned should score high
            even when analyzed using only evidence available before the revelation.
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Pre-revelation analysis:</strong> For each case with a known revelation date,
            we filter all evidence, graph nodes, edges, and causal factors to only include items dated before the revelation.
            The fragility score is then computed on this reduced dataset.
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Detection threshold:</strong> A case is "detected" as fragile if its
            pre-revelation fragility score is &ge; 30 (on a 0-100 scale).
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Controls:</strong> Confirmed cases (where the official narrative was validated)
            serve as negative controls. Their fragility scores should be low. High scores on confirmed cases are false positives.
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Contested cases:</strong> Cases with no definitive resolution. The framework's
            analysis here constitutes genuinely novel findings — structural indicators that may predict future revelations.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="text-xs font-mono mb-1" style={{ color: '#999999' }}>{label}</div>
      <div className="text-3xl font-mono font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: '#999999' }}>{detail}</div>
    </div>
  );
}

function ResultRow({ result: r }: { result: ValidationResult }) {
  const sColor = statusColor(r.status);
  const postColor = fragilityColor(r.postRevelation.overall);
  const preColor = r.preRevelation ? fragilityColor(r.preRevelation.overall) : '#999999';

  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td className="px-4 py-3">
        <Link href={`/cases/${r.caseId}`} className="hover:underline font-medium" style={{ color: '#1a1a1a' }}>
          {r.title}
        </Link>
      </td>
      <td className="text-center px-3 py-3">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
          style={{ color: sColor, border: `1px solid ${sColor}` }}>
          {r.status.toUpperCase()}
        </span>
      </td>
      <td className="text-center px-3 py-3">
        <span className="font-mono font-bold" style={{ color: postColor }}>
          {(r.postRevelation.overall * 100).toFixed(0)}
        </span>
      </td>
      <td className="text-center px-3 py-3">
        {r.preRevelation ? (
          <span className="font-mono font-bold" style={{ color: preColor }}>
            {(r.preRevelation.overall * 100).toFixed(0)}
          </span>
        ) : (
          <span className="font-mono text-xs" style={{ color: '#d4d4d4' }}>--</span>
        )}
      </td>
      <td className="text-center px-3 py-3">
        {r.delta !== null ? (
          <span className="font-mono text-xs" style={{ color: r.delta > 0 ? '#c44536' : r.delta < 0 ? '#2a9d5c' : '#999999' }}>
            {r.delta > 0 ? '+' : ''}{(r.delta * 100).toFixed(0)}
          </span>
        ) : (
          <span className="font-mono text-xs" style={{ color: '#d4d4d4' }}>--</span>
        )}
      </td>
      <td className="text-center px-3 py-3">
        {r.preRevelationDetected === true && (
          <span className="text-xs font-mono font-bold" style={{ color: '#2a9d5c' }}>YES</span>
        )}
        {r.preRevelationDetected === false && (
          <span className="text-xs font-mono font-bold" style={{ color: '#c44536' }}>NO</span>
        )}
        {r.preRevelationDetected === null && (
          <span className="font-mono text-xs" style={{ color: '#d4d4d4' }}>--</span>
        )}
      </td>
    </tr>
  );
}

function ContestedCard({ result: r }: { result: ValidationResult }) {
  const fColor = fragilityColor(r.postRevelation.overall);
  const components = r.postRevelation.components;
  const topComponents = Object.entries(components)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <Link href={`/cases/${r.caseId}`} className="text-lg font-bold hover:underline" style={{ color: '#1a1a1a' }}>
            {r.title}
          </Link>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-mono font-bold" style={{ color: fColor }}>
            {(r.postRevelation.overall * 100).toFixed(0)}
          </div>
          <div className="text-[10px] font-mono" style={{ color: fColor }}>FRAGILITY</div>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: '#6b6b6b' }}>{r.postRevelation.interpretation}</p>
      <div className="space-y-1">
        {topComponents.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-40 flex-shrink-0 font-mono" style={{ color: '#6b6b6b' }}>
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: '#eeeeee' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min(value * 100, 100)}%`,
                background: value >= 0.7 ? '#c44536' : value >= 0.4 ? '#e87b35' : '#999999',
              }} />
            </div>
            <span className="font-mono w-8 text-right" style={{ color: '#999999' }}>
              {(value * 100).toFixed(0)}
            </span>
          </div>
        ))}
      </div>
      {r.postRevelation.riskFactors.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          {r.postRevelation.riskFactors.map((rf, i) => (
            <div key={i} className="text-xs mt-1" style={{ color: '#c44536' }}>{rf}</div>
          ))}
        </div>
      )}
    </div>
  );
}
