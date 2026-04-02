import Link from "next/link";
import { getAllCases } from "@/lib/data";
import { generateVerdict } from "@/lib/engine/bayesian";

export default function CasesPage() {
  const cases = getAllCases();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Case Studies</h1>
      <p className="mb-8 text-sm" style={{ color: '#6b6b6b' }}>
        Each case models competing historical narratives as Bayesian hypotheses,
        with evidence items that can be toggled to see how beliefs shift.
      </p>
      <div className="grid gap-6">
        {cases.map(c => {
          const verdict = generateVerdict(c.hypotheses, c.evidence);
          return (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="block rounded-lg p-6 transition-all hover:scale-[1.005]"
              style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <h2 className="text-xl font-bold mb-1" style={{ color: '#1a1a1a' }}>{c.title}</h2>
              <div className="text-sm mb-3" style={{ color: '#999999' }}>{c.period}</div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b6b6b' }}>{c.summary}</p>
              <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#999999' }}>
                <span>{c.hypotheses.length} competing hypotheses</span>
                <span>{c.evidence.length} evidence items</span>
                <span>{c.nodes.length} graph nodes</span>
                <span>{c.edges.length} relationships</span>
                <span>{c.timeSlices.length} time periods</span>
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
