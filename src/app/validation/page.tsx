import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { runValidation, type ValidationResult } from "@/lib/engine/fragility";

function fragilityColor(score: number): string {
  if (score >= 0.7) return '#c44536';
  if (score >= 0.5) return '#e87b35';
  if (score >= 0.3) return '#d06a2a';
  return '#2a9d5c';
}

function certaintyColor(score: number): string {
  if (score >= 0.7) return '#2a9d5c';
  if (score >= 0.4) return '#e87b35';
  return '#c44536';
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

  // Summary stats
  const overturnedDetected = overturned.filter(r => r.preRevelationDetected === true).length;
  const overturnedWithPre = overturned.filter(r => r.preRevelation !== null).length;
  const confirmedFP = confirmed.filter(r => r.postRevelation.structural >= 0.3).length;

  const avgOverturnedStructural = overturned.length > 0
    ? overturned.reduce((s, r) => s + r.postRevelation.structural, 0) / overturned.length : 0;
  const avgConfirmedStructural = confirmed.length > 0
    ? confirmed.reduce((s, r) => s + r.postRevelation.structural, 0) / confirmed.length : 0;

  // Certainty delta: how much does certainty increase post-revelation for overturned?
  const avgCertaintyDelta = overturnedWithPre > 0
    ? overturned.filter(r => r.certaintyDelta !== null)
        .reduce((s, r) => s + (r.certaintyDelta ?? 0), 0) / overturnedWithPre
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Validation Experiment</h1>
        <p className="text-sm leading-relaxed max-w-3xl" style={{ color: '#6b6b6b' }}>
          Two measurements, two predictions. <strong style={{ color: '#1a1a1a' }}>Structural fragility</strong> detects
          manipulation hallmarks (suppression, classification, benefit conflicts) — should be high for overturned cases,
          low for confirmed. <strong style={{ color: '#1a1a1a' }}>Evidential certainty</strong> measures how resolved the
          question is — should jump from low to high when revelatory evidence arrives.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <SummaryCard
          label="Structural detection"
          value={overturnedWithPre > 0 ? `${overturnedDetected}/${overturnedWithPre}` : 'N/A'}
          detail="Overturned cases with structural score >= 30 pre-revelation"
          color="#e87b35"
        />
        <SummaryCard
          label="False positives"
          value={confirmed.length > 0 ? `${confirmedFP}/${confirmed.length}` : 'N/A'}
          detail="Confirmed cases incorrectly flagged as fragile"
          color={confirmedFP === 0 ? '#2a9d5c' : '#c44536'}
        />
        <SummaryCard
          label="Structural gap"
          value={`${(avgOverturnedStructural * 100).toFixed(0)} vs ${(avgConfirmedStructural * 100).toFixed(0)}`}
          detail="Avg structural: overturned vs confirmed"
          color="#e87b35"
        />
        <SummaryCard
          label="Certainty shift"
          value={avgCertaintyDelta !== 0 ? `+${(avgCertaintyDelta * 100).toFixed(0)}` : 'N/A'}
          detail="Avg certainty increase after revelation"
          color="#2a9d5c"
        />
      </div>

      {/* Main results table */}
      <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #e5e5e5' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #e5e5e5' }}>
              <th className="text-left px-4 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Case</th>
              <th className="text-center px-2 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Status</th>
              <th className="text-center px-2 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }} colSpan={2}>Structural Fragility</th>
              <th className="text-center px-2 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }} colSpan={2}>Evidential Certainty</th>
              <th className="text-center px-2 py-3 font-bold text-xs" style={{ color: '#1a1a1a' }}>Detected?</th>
            </tr>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>
              <th></th>
              <th></th>
              <th className="text-center px-2 py-1 font-normal text-[10px]" style={{ color: '#999999' }}>Post</th>
              <th className="text-center px-2 py-1 font-normal text-[10px]" style={{ color: '#999999' }}>Pre</th>
              <th className="text-center px-2 py-1 font-normal text-[10px]" style={{ color: '#999999' }}>Post</th>
              <th className="text-center px-2 py-1 font-normal text-[10px]" style={{ color: '#999999' }}>Pre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <ResultRow key={r.caseId} result={r} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mb-10" style={{ color: '#999999' }}>
        Structural fragility = manipulation hallmarks (stable across time). Evidential certainty = how resolved the question is (should increase post-revelation).
      </p>

      {/* The actual finding */}
      <div className="rounded-lg p-6 mb-10" style={{ background: '#ffffff', border: '2px solid #e87b35' }}>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>What the experiment shows</h2>
        <div className="text-sm leading-relaxed space-y-3" style={{ color: '#6b6b6b' }}>
          <p>
            <strong style={{ color: '#e87b35' }}>Finding 1: Structural fragility discriminates categories.</strong>{' '}
            Overturned cases average {(avgOverturnedStructural * 100).toFixed(0)} structural fragility
            vs {(avgConfirmedStructural * 100).toFixed(0)} for confirmed cases. The manipulation hallmarks
            (evidence suppression, classification, benefit conflicts) are structurally different.
          </p>
          <p>
            <strong style={{ color: '#e87b35' }}>Finding 2: Structural fragility is stable across time.</strong>{' '}
            Pre-revelation structural scores are nearly identical to post-revelation scores. This is the
            point — the hallmarks of a manipulated narrative are present from day one, before the truth
            comes out. This is what makes the score potentially predictive.
          </p>
          <p>
            <strong style={{ color: '#e87b35' }}>Finding 3: Evidential certainty shifts with revelation.</strong>{' '}
            When revelatory evidence arrives, certainty increases by an average of{' '}
            {(avgCertaintyDelta * 100).toFixed(0)} points for overturned cases. This is the dimension that
            captures the "aha" moment — the structural red flags were always there, but the evidence hadn't
            arrived yet to resolve the question.
          </p>
          <p>
            <strong style={{ color: '#c44536' }}>Caveat:</strong> The case study data is hand-authored with
            knowledge of outcomes. A rigorous test would require independently coded case studies by
            researchers blinded to the framework's design.
          </p>
        </div>
      </div>

      {/* Contested cases — novel findings */}
      {contested.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Novel Findings: Contested Cases</h2>
          <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
            These cases have no definitive resolution. High structural fragility + low evidential certainty
            = narratives most likely to be revised by future evidence.
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
            <strong style={{ color: '#1a1a1a' }}>Two dimensions:</strong> The v1 fragility score mixed structural
            and evidential signals into one number, making pre/post comparison meaningless (both were ~40).
            v2 separates them: structural fragility measures manipulation hallmarks (10 components),
            evidential certainty measures how resolved the question is (4 components).
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Structural fragility</strong> (10 components): suppression density,
            benefit conflicts, source concentration, contradiction load, classification rate, reliability variance,
            dissenter suppression, evidence action density, narrative change rate, power change pressure.
            These describe <em>how the narrative was constructed</em>.
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Evidential certainty</strong> (4 components): verdict margin
            (posterior gap), evidence weight (cumulative log-odds shift), source agreement (do independent
            sources point the same way), prior independence (does the verdict hold across prior assumptions).
            These describe <em>how resolved the question is</em>.
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Pre-revelation filter:</strong> Evidence, nodes, edges, and causal
            factors dated strictly before the revelation date are used (strict &lt;, not &le;).
          </p>
          <p>
            <strong style={{ color: '#1a1a1a' }}>Detection threshold:</strong> Structural fragility &ge; 30.
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
      <div className="text-2xl font-mono font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: '#999999' }}>{detail}</div>
    </div>
  );
}

function ResultRow({ result: r }: { result: ValidationResult }) {
  const sColor = statusColor(r.status);
  const postStructColor = fragilityColor(r.postRevelation.structural);
  const preStructColor = r.preRevelation ? fragilityColor(r.preRevelation.structural) : '#999999';
  const postCertColor = certaintyColor(r.postRevelation.evidentialCertainty);
  const preCertColor = r.preRevelation ? certaintyColor(r.preRevelation.evidentialCertainty) : '#999999';

  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td className="px-4 py-3">
        <Link href={`/cases/${r.caseId}`} className="hover:underline font-medium text-xs" style={{ color: '#1a1a1a' }}>
          {r.title}
        </Link>
      </td>
      <td className="text-center px-2 py-3">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: sColor, border: `1px solid ${sColor}` }}>
          {r.status.toUpperCase()}
        </span>
      </td>
      <td className="text-center px-2 py-3">
        <span className="font-mono font-bold text-sm" style={{ color: postStructColor }}>
          {(r.postRevelation.structural * 100).toFixed(0)}
        </span>
      </td>
      <td className="text-center px-2 py-3">
        {r.preRevelation ? (
          <span className="font-mono font-bold text-sm" style={{ color: preStructColor }}>
            {(r.preRevelation.structural * 100).toFixed(0)}
          </span>
        ) : (
          <span className="font-mono text-xs" style={{ color: '#d4d4d4' }}>--</span>
        )}
      </td>
      <td className="text-center px-2 py-3">
        <span className="font-mono font-bold text-sm" style={{ color: postCertColor }}>
          {(r.postRevelation.evidentialCertainty * 100).toFixed(0)}
        </span>
      </td>
      <td className="text-center px-2 py-3">
        {r.preRevelation ? (
          <span className="font-mono font-bold text-sm" style={{ color: preCertColor }}>
            {(r.preRevelation.evidentialCertainty * 100).toFixed(0)}
          </span>
        ) : (
          <span className="font-mono text-xs" style={{ color: '#d4d4d4' }}>--</span>
        )}
      </td>
      <td className="text-center px-2 py-3">
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
  const sColor = fragilityColor(r.postRevelation.structural);
  const cColor = certaintyColor(r.postRevelation.evidentialCertainty);

  // Show structural components
  const structuralComponents = [
    ['Suppression density', r.postRevelation.components.suppressionDensity],
    ['Benefit conflict', r.postRevelation.components.benefitConflict],
    ['Source concentration', r.postRevelation.components.sourceConcentration],
    ['Classification rate', r.postRevelation.components.classificationRate],
    ['Dissenter suppression', r.postRevelation.components.dissenterSuppression],
    ['Evidence action density', r.postRevelation.components.evidenceActionDensity],
    ['Power change pressure', r.postRevelation.components.powerChangePressure],
  ] as [string, number][];

  return (
    <div className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <Link href={`/cases/${r.caseId}`} className="text-lg font-bold hover:underline" style={{ color: '#1a1a1a' }}>
          {r.title}
        </Link>
        <div className="flex gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-xl font-mono font-bold" style={{ color: sColor }}>
              {(r.postRevelation.structural * 100).toFixed(0)}
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#999999' }}>STRUCTURAL</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono font-bold" style={{ color: cColor }}>
              {(r.postRevelation.evidentialCertainty * 100).toFixed(0)}
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#999999' }}>CERTAINTY</div>
          </div>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: '#6b6b6b' }}>{r.postRevelation.interpretation}</p>
      <div className="space-y-1">
        {structuralComponents.filter(([, v]) => v > 0).map(([label, value]) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-40 flex-shrink-0" style={{ color: '#6b6b6b' }}>{label}</span>
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
