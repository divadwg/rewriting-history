import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";

function getVerdictTone(verdict: string) {
  switch (verdict) {
    case 'official_refuted': return 'bad';
    case 'official_supported': return 'ok';
    default: return '';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

      {/* Hero */}
      <div className="mb-20 md:mb-28">
        <div className="mb-6 inline-block">
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: 'var(--muted)' }}
          >
            Bayesian Historical Analysis
          </span>
        </div>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl leading-tight mb-6"
          style={{
            color: 'var(--ink)',
            letterSpacing: '-0.02em'
          }}
        >
          Rewriting History
        </h1>
        <p
          className="text-base sm:text-lg max-w-2xl leading-relaxed mb-10"
          style={{ color: 'var(--body)' }}
        >
          A scientific approach to historical claims. We model competing narratives as hypotheses,
          weigh evidence using Bayesian inference, and surface where official histories diverge
          from the evidence.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/cases"
            className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-opacity hover:opacity-90"
            style={{
              color: 'var(--on-key)'
            }}
          >
            Explore Case Studies
          </Link>
          <Link
            href="/challenge"
            className="btn inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-colors"
            style={{
              color: 'var(--ink)'
            }}
          >
            Evidence Discovery
          </Link>
          <Link
            href="/validation"
            className="tag inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-colors"
            style={{
              color: 'var(--body)'
            }}
          >
            Validation Experiment
          </Link>
        </div>
      </div>

      {/* The Method */}
      <div className="mb-20 md:mb-28">
        <div className="mb-2">
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            The Method
          </span>
        </div>
        <h2
          className="text-2xl sm:text-3xl mb-10"
          style={{
            color: 'var(--ink)',
            letterSpacing: '-0.01em'
          }}
        >
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1 */}
          <div
            className="card rounded-xl p-6 md:p-8 transition-colors">
            <div
              className="text-xl font-mono mb-4"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
            >
              G
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: 'var(--ink)' }}
            >
              Knowledge Graph
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
              Claims, sources, actors, and events as nodes. Edges show who claims what,
              what contradicts what, and how evidence flows.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="card rounded-xl p-6 md:p-8 transition-colors">
            <div
              className="text-xl font-mono mb-4"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
            >
              C
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: 'var(--ink)' }}
            >
              Causal Model
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
              Power changes drive narrative changes drive evidence suppression.
              The causal layer shows <em>why</em> histories get rewritten.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="card rounded-xl p-6 md:p-8 transition-colors">
            <div
              className="text-xl font-mono mb-4"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
            >
              P(H|E)
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: 'var(--ink)' }}
            >
              Bayesian Inference
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
              Each historical claim gets a probability that updates as evidence
              is added. Toggle evidence on/off and watch beliefs shift.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence-First Discovery */}
      <div
        className="card mb-20 md:mb-28 rounded-xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
                Evidence-First Discovery
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl mb-4"
              style={{
                color: 'var(--ink)',
                letterSpacing: '-0.01em'
              }}
            >
              Start from the evidence, not the story
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--body)' }}>
              Pick any historical topic. The system gathers <strong style={{ color: 'var(--ink)' }}>raw primary source evidence</strong> — documents,
              statistics, dates — then generates hypotheses from the data, runs Bayesian inference, and surfaces
              what the evidence actually shows. Including things nobody may have noticed.
            </p>
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono mb-8"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
            >
              <span>1. Evidence</span>
              <span style={{ color: 'var(--faint)' }}>→</span>
              <span>2. Hypotheses</span>
              <span style={{ color: 'var(--faint)' }}>→</span>
              <span>3. Bayesian Math</span>
              <span style={{ color: 'var(--faint)' }}>→</span>
              <span>4. Discovery</span>
            </div>
            <Link
              href="/challenge"
              className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-sm transition-opacity hover:opacity-90"
              style={{
                color: 'var(--on-key)'
              }}
            >
              Start Discovering
            </Link>
          </div>

          <div className="hidden md:block flex-shrink-0" style={{ width: 200 }}>
            <div
              className="text-xs font-mono mb-3 tracking-widest uppercase"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
            >
              Sample Questions
            </div>
            <div className="space-y-2">
              <div
                className="well rounded-lg p-3 text-xs leading-snug"
                style={{ color: 'var(--body)' }}
              >
                What do casualty records reveal about the atomic bombings?
              </div>
              <div
                className="well rounded-lg p-3 text-xs leading-snug"
                style={{ color: 'var(--body)' }}
              >
                What do ship manifests show about Viking trade vs. raiding?
              </div>
              <div
                className="well rounded-lg p-3 text-xs leading-snug"
                style={{ color: 'var(--body)' }}
              >
                What do parish records reveal about post-Black Death living standards?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div>
        <div className="mb-2">
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            Case Studies
          </span>
        </div>
        <h2
          className="text-2xl sm:text-3xl mb-8"
          style={{
            color: 'var(--ink)',
            letterSpacing: '-0.01em'
          }}
        >
          Cases under analysis
        </h2>

        <div className="grid gap-3">
          {cases.map(c => {
            const verdict = generateVerdict(c.hypotheses, c.evidence);
            const tone = getVerdictTone(verdict.verdict);
            return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card block rounded-xl p-6 md:p-8 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3
                      className="text-base sm:text-lg font-semibold mb-1 leading-snug"
                      style={{ color: 'var(--ink)' }}
                    >
                      {c.title}
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{c.period}</span>
                  </div>
                  <span
                    className={`status ${tone} flex-shrink-0 self-start`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}
                  >
                    {getVerdictLabel(verdict.verdict)}
                  </span>
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--body)' }}>
                  {c.summary.slice(0, 200)}...
                </p>

                <div
                  className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono"
                  style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
                >
                  <span>{c.hypotheses.length} hypotheses</span>
                  <span>{c.evidence.length} evidence items</span>
                  <span>{c.nodes.length} graph nodes</span>
                  <span>
                    Official posterior:{' '}
                    {verdict.officialPosterior < 0.01
                      ? '<1'
                      : (verdict.officialPosterior * 100).toFixed(1)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
