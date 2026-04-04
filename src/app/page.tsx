import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'official_refuted': return '#c44536';
    case 'official_unlikely': return '#e87b35';
    case 'official_questionable': return '#d06a2a';
    case 'official_supported': return '#2a9d5c';
    default: return '#999999';
  }
}

function getVerdictLabel(verdict: string) {
  switch (verdict) {
    case 'official_refuted': return 'OFFICIAL NARRATIVE REFUTED';
    case 'official_unlikely': return 'OFFICIAL NARRATIVE UNLIKELY';
    case 'official_questionable': return 'OFFICIAL NARRATIVE QUESTIONABLE';
    case 'official_supported': return 'OFFICIAL NARRATIVE SUPPORTED';
    default: return 'INCONCLUSIVE';
  }
}

export default function Home() {
  const cases = getAllCases();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight" style={{ color: '#1a1a1a' }}>
          Rewriting History
        </h1>
        <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#6b6b6b' }}>
          A scientific approach to historical claims. We model competing narratives as hypotheses,
          weigh evidence using Bayesian inference, and surface where official histories diverge
          from the evidence.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/cases"
            className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ background: '#e87b35', color: 'white' }}
          >
            Explore Case Studies
          </Link>
          <Link
            href="/challenge"
            className="px-6 py-3 rounded-lg font-medium border transition-opacity hover:opacity-90"
            style={{ borderColor: '#e87b35', color: '#e87b35' }}
          >
            Evidence Discovery
          </Link>
          <Link
            href="/validation"
            className="px-6 py-3 rounded-lg font-medium border transition-opacity hover:opacity-90"
            style={{ borderColor: '#e5e5e5', color: '#6b6b6b' }}
          >
            Validation Experiment
          </Link>
        </div>
      </div>

      <div className="grid gap-8 mb-16">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>The Method</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-2xl font-mono mb-3" style={{ color: '#e87b35' }}>G</div>
            <h3 className="font-bold mb-2" style={{ color: '#e87b35' }}>Knowledge Graph</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
              Claims, sources, actors, and events as nodes. Edges show who claims what,
              what contradicts what, and how evidence flows.
            </p>
          </div>
          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-2xl font-mono mb-3" style={{ color: '#e87b35' }}>C</div>
            <h3 className="font-bold mb-2" style={{ color: '#e87b35' }}>Causal Model</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
              Power changes drive narrative changes drive evidence suppression.
              The causal layer shows <em>why</em> histories get rewritten.
            </p>
          </div>
          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="text-lg font-mono mb-3" style={{ color: '#e87b35' }}>P(H|E)</div>
            <h3 className="font-bold mb-2" style={{ color: '#e87b35' }}>Bayesian Inference</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>
              Each historical claim gets a probability that updates as evidence
              is added. Toggle evidence on/off and watch beliefs shift.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Discovery */}
      <div className="mb-16 rounded-lg p-8" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#1a1a1a' }}>Evidence-First Discovery</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b6b6b' }}>
              Pick any historical topic. The system gathers <strong>raw primary source evidence</strong> — documents,
              statistics, dates — then generates hypotheses from the data, runs Bayesian inference, and surfaces
              what the evidence actually shows. Including things nobody may have noticed.
            </p>
            <div className="text-xs font-mono flex gap-3 mb-5" style={{ color: '#999999' }}>
              <span>1. Evidence</span>
              <span style={{ color: '#e5e5e5' }}>→</span>
              <span>2. Hypotheses</span>
              <span style={{ color: '#e5e5e5' }}>→</span>
              <span>3. Bayesian Math</span>
              <span style={{ color: '#e5e5e5' }}>→</span>
              <span>4. Discovery</span>
            </div>
            <Link
              href="/challenge"
              className="inline-block px-6 py-3 rounded-lg font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#e87b35', color: 'white' }}
            >
              Start Discovering
            </Link>
          </div>
          <div className="hidden md:block text-right flex-shrink-0" style={{ minWidth: 180 }}>
            <div className="text-xs font-mono mb-2" style={{ color: '#999999' }}>SAMPLE QUESTIONS</div>
            <div className="space-y-2 text-xs" style={{ color: '#6b6b6b' }}>
              <div className="rounded p-2" style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}>
                What do casualty records reveal about the atomic bombings?
              </div>
              <div className="rounded p-2" style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}>
                What do ship manifests show about Viking trade vs. raiding?
              </div>
              <div className="rounded p-2" style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}>
                What do parish records reveal about post-Black Death living standards?
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Case Studies</h2>
        {cases.map(c => {
          const verdict = generateVerdict(c.hypotheses, c.evidence);
          const color = getVerdictColor(verdict.verdict);
          return (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="block rounded-lg p-6 transition-all hover:scale-[1.01]"
              style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>{c.title}</h3>
                  <span className="text-sm" style={{ color: '#999999' }}>{c.period}</span>
                </div>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                  style={{ color, border: `1px solid ${color}` }}
                >
                  {getVerdictLabel(verdict.verdict)}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b6b6b' }}>{c.summary.slice(0, 200)}...</p>
              <div className="flex gap-6 text-xs" style={{ color: '#999999' }}>
                <span>{c.hypotheses.length} hypotheses</span>
                <span>{c.evidence.length} evidence items</span>
                <span>{c.nodes.length} graph nodes</span>
                <span>Official posterior: {verdict.officialPosterior < 0.01 ? '<1' : (verdict.officialPosterior * 100).toFixed(1)}%</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
