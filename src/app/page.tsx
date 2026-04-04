import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'official_refuted': return '#a23f00';
    case 'official_unlikely': return '#c47a20';
    case 'official_questionable': return '#c47a20';
    case 'official_supported': return '#2a7d4c';
    default: return '#9ba2a3';
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
            style={{ color: '#9ba2a3' }}
          >
            Bayesian Historical Analysis
          </span>
        </div>
        <h1
          className="font-editorial text-4xl sm:text-5xl md:text-6xl leading-tight mb-6"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 600,
            color: '#2d3435',
            letterSpacing: '-0.02em',
          }}
        >
          Rewriting History
        </h1>
        <p
          className="text-base sm:text-lg max-w-2xl leading-relaxed mb-10"
          style={{ color: '#6b7374' }}
        >
          A scientific approach to historical claims. We model competing narratives as hypotheses,
          weigh evidence using Bayesian inference, and surface where official histories diverge
          from the evidence.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/cases"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(45deg, #a23f00, #8f3600)',
              color: '#ffffff',
            }}
          >
            Explore Case Studies
          </Link>
          <Link
            href="/challenge"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-colors"
            style={{
              background: '#ffffff',
              color: '#a23f00',
              outline: '1px solid rgba(196,203,204,0.15)',
            }}
          >
            Evidence Discovery
          </Link>
          <Link
            href="/validation"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-medium text-sm transition-colors"
            style={{
              background: '#f2f4f4',
              color: '#6b7374',
            }}
          >
            Validation Experiment
          </Link>
        </div>
      </div>

      {/* The Method */}
      <div className="mb-20 md:mb-28">
        <div className="mb-2">
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#9ba2a3' }}>
            The Method
          </span>
        </div>
        <h2
          className="font-editorial text-2xl sm:text-3xl mb-10"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 600,
            color: '#2d3435',
            letterSpacing: '-0.01em',
          }}
        >
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1 */}
          <div
            className="rounded-xl p-6 md:p-8 transition-colors"
            style={{ background: '#ffffff' }}
          >
            <div
              className="text-xl font-mono mb-4"
              style={{ color: '#a23f00', fontFamily: "'DM Mono', monospace" }}
            >
              G
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: '#2d3435' }}
            >
              Knowledge Graph
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>
              Claims, sources, actors, and events as nodes. Edges show who claims what,
              what contradicts what, and how evidence flows.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="rounded-xl p-6 md:p-8 transition-colors"
            style={{ background: '#ffffff' }}
          >
            <div
              className="text-xl font-mono mb-4"
              style={{ color: '#a23f00', fontFamily: "'DM Mono', monospace" }}
            >
              C
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: '#2d3435' }}
            >
              Causal Model
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>
              Power changes drive narrative changes drive evidence suppression.
              The causal layer shows <em>why</em> histories get rewritten.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="rounded-xl p-6 md:p-8 transition-colors"
            style={{ background: '#ffffff' }}
          >
            <div
              className="text-xl font-mono mb-4"
              style={{ color: '#a23f00', fontFamily: "'DM Mono', monospace" }}
            >
              P(H|E)
            </div>
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: '#2d3435' }}
            >
              Bayesian Inference
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7374' }}>
              Each historical claim gets a probability that updates as evidence
              is added. Toggle evidence on/off and watch beliefs shift.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence-First Discovery */}
      <div
        className="mb-20 md:mb-28 rounded-xl p-8 md:p-12"
        style={{ background: '#ffffff' }}
      >
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#9ba2a3' }}>
                Evidence-First Discovery
              </span>
            </div>
            <h2
              className="font-editorial text-2xl sm:text-3xl mb-4"
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: 600,
                color: '#2d3435',
                letterSpacing: '-0.01em',
              }}
            >
              Start from the evidence, not the story
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7374' }}>
              Pick any historical topic. The system gathers <strong style={{ color: '#2d3435' }}>raw primary source evidence</strong> — documents,
              statistics, dates — then generates hypotheses from the data, runs Bayesian inference, and surfaces
              what the evidence actually shows. Including things nobody may have noticed.
            </p>
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono mb-8"
              style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
            >
              <span>1. Evidence</span>
              <span style={{ color: '#e4e9ea' }}>→</span>
              <span>2. Hypotheses</span>
              <span style={{ color: '#e4e9ea' }}>→</span>
              <span>3. Bayesian Math</span>
              <span style={{ color: '#e4e9ea' }}>→</span>
              <span>4. Discovery</span>
            </div>
            <Link
              href="/challenge"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold text-sm transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(45deg, #a23f00, #8f3600)',
                color: '#ffffff',
              }}
            >
              Start Discovering
            </Link>
          </div>

          <div className="hidden md:block flex-shrink-0" style={{ width: 200 }}>
            <div
              className="text-xs font-mono mb-3 tracking-widest uppercase"
              style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
            >
              Sample Questions
            </div>
            <div className="space-y-2">
              <div
                className="rounded-lg p-3 text-xs leading-snug"
                style={{ background: '#f2f4f4', color: '#6b7374' }}
              >
                What do casualty records reveal about the atomic bombings?
              </div>
              <div
                className="rounded-lg p-3 text-xs leading-snug"
                style={{ background: '#f2f4f4', color: '#6b7374' }}
              >
                What do ship manifests show about Viking trade vs. raiding?
              </div>
              <div
                className="rounded-lg p-3 text-xs leading-snug"
                style={{ background: '#f2f4f4', color: '#6b7374' }}
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
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#9ba2a3' }}>
            Case Studies
          </span>
        </div>
        <h2
          className="font-editorial text-2xl sm:text-3xl mb-8"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 600,
            color: '#2d3435',
            letterSpacing: '-0.01em',
          }}
        >
          Cases under analysis
        </h2>

        <div className="grid gap-3">
          {cases.map(c => {
            const verdict = generateVerdict(c.hypotheses, c.evidence);
            const color = getVerdictColor(verdict.verdict);
            return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="block rounded-xl p-6 md:p-8 transition-colors group hover:bg-[#f2f4f4]"
                style={{ background: '#ffffff' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3
                      className="text-base sm:text-lg font-semibold mb-1 leading-snug"
                      style={{ color: '#2d3435' }}
                    >
                      {c.title}
                    </h3>
                    <span className="text-xs" style={{ color: '#9ba2a3' }}>{c.period}</span>
                  </div>
                  <span
                    className="flex-shrink-0 self-start text-xs font-mono font-semibold px-3 py-1 rounded-md tracking-wide"
                    style={{
                      color,
                      background: color === '#2a7d4c'
                        ? 'rgba(42,125,76,0.08)'
                        : color === '#9ba2a3'
                        ? 'rgba(155,162,163,0.1)'
                        : 'rgba(162,63,0,0.08)',
                    }}
                  >
                    {getVerdictLabel(verdict.verdict)}
                  </span>
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: '#6b7374' }}>
                  {c.summary.slice(0, 200)}...
                </p>

                <div
                  className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono"
                  style={{ color: '#9ba2a3', fontFamily: "'DM Mono', monospace" }}
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
