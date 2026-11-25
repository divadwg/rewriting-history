import Link from 'next/link';
import { listResults } from '@/lib/storage/results';

export const dynamic = 'force-dynamic';

export default function ResultsListPage() {
  const results = listResults();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>Saved Results</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--body)' }}>
        All saved analyses. Each result has a shareable link.
      </p>

      {results.length === 0 ? (
        <div className="well rounded-lg p-8 text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>No saved results yet.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/live" className="btn-primary text-sm px-4 py-2 rounded-lg"
              style={{ color: 'var(--on-key)' }}>
              Verify an Article
            </Link>
            <Link href="/challenge" className="btn text-sm px-4 py-2 rounded-lg"
              style={{ color: 'var(--body)' }}>
              Discover Evidence
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <Link key={r.id} href={`/results/${r.id}`}
              className="card block rounded-lg p-4 transition-all hover:scale-[1.003]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{r.title}</h2>
                  <div className="flex gap-3 text-xs font-mono mt-1" style={{ color: 'var(--muted)' }}>
                    <span className="tag px-2 py-0.5" style={{ color: 'var(--body)' }}>
                      {r.type === 'live' ? 'Article Verification' : 'Evidence Discovery'}
                    </span>
                    <span>
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>{r.id}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
