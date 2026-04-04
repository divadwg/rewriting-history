import Link from 'next/link';
import { listResults } from '@/lib/storage/results';

export const dynamic = 'force-dynamic';

export default function ResultsListPage() {
  const results = listResults();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Saved Results</h1>
      <p className="text-sm mb-8" style={{ color: '#6b6b6b' }}>
        All saved analyses. Each result has a shareable link.
      </p>

      {results.length === 0 ? (
        <div className="rounded-lg p-8 text-center" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
          <p className="text-sm mb-4" style={{ color: '#999999' }}>No saved results yet.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/live" className="text-sm px-4 py-2 rounded-lg"
              style={{ background: '#e87b35', color: 'white' }}>
              Verify an Article
            </Link>
            <Link href="/challenge" className="text-sm px-4 py-2 rounded-lg"
              style={{ border: '1px solid #e5e5e5', color: '#6b6b6b' }}>
              Discover Evidence
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <Link key={r.id} href={`/results/${r.id}`}
              className="block rounded-lg p-4 transition-all hover:scale-[1.003]"
              style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold truncate" style={{ color: '#1a1a1a' }}>{r.title}</h2>
                  <div className="flex gap-3 text-xs font-mono mt-1" style={{ color: '#999999' }}>
                    <span className="px-1.5 py-0.5 rounded"
                      style={{
                        background: r.type === 'live' ? '#e87b3510' : '#2a9d5c10',
                        color: r.type === 'live' ? '#e87b35' : '#2a9d5c',
                      }}>
                      {r.type === 'live' ? 'Article Verification' : 'Evidence Discovery'}
                    </span>
                    <span>
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: '#d4d4d4' }}>{r.id}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
