'use client';

import { useState } from 'react';
import { NarrativeAssessment } from '@/lib/engine/live/rewriting-detector';
import { useApiKey } from '@/components/ApiKeyProvider';

interface AnalysisResult {
  assessment: NarrativeAssessment;
  mode: 'live' | 'demo';
}

function RiskMeter({ value }: { value: number }) {
  const color = value > 0.6 ? '#c44536' : value > 0.35 ? '#e87b35' : '#2a9d5c';
  const label = value > 0.6 ? 'HIGH RISK' : value > 0.35 ? 'MODERATE RISK' : 'LOW RISK';

  return (
    <div className="rounded-lg p-6 text-center" style={{ background: `${color}08`, border: `1px solid ${color}30` }}>
      <div className="text-4xl font-mono font-bold mb-2" style={{ color }}>
        {(value * 100).toFixed(0)}%
      </div>
      <div className="text-sm font-mono font-bold" style={{ color }}>{label}</div>
      <div className="text-xs mt-1" style={{ color: '#999999' }}>Narrative manipulation risk</div>
      <div className="mt-3 w-full h-2 rounded-full" style={{ background: '#eeeeee' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LivePage() {
  const [topic, setTopic] = useState('');
  const [articleInputs, setArticleInputs] = useState([{ text: '', url: '', date: new Date().toISOString().split('T')[0] }]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { provider, apiKey } = useApiKey();

  const addArticle = () => {
    setArticleInputs(prev => [...prev, { text: '', url: '', date: new Date().toISOString().split('T')[0] }]);
  };

  const updateArticle = (index: number, field: string, value: string) => {
    setArticleInputs(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const analyze = async () => {
    const articles = articleInputs.filter(a => a.text.trim().length > 50);
    if (articles.length === 0) {
      setError('Paste at least one article (50+ characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/live/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || 'Unnamed topic', articles, provider, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Live Narrative Analysis</h1>
      <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>
        Paste news articles about a political topic. The system extracts claims, applies the same
        structural pattern detectors used on historical cases, and flags when current narratives
        match known rewriting signatures.
      </p>
      <p className="text-xs mb-8 font-mono" style={{ color: '#999999' }}>
        Patterns detected: source concentration (Curveball), self-serving claims (Tonkin),
        confidence without evidence (Powell at UN), suppressed dissent (DOE), rapid consensus,
        contradiction suppression (Sykes-Picot)
      </p>

      {/* Input */}
      <div className="mb-8 space-y-4">
        <div>
          <label className="text-xs font-bold mb-1 block" style={{ color: '#6b6b6b' }}>Topic / Narrative</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., 'Government claims about X policy', 'Official account of Y event'"
            className="w-full rounded-lg px-4 py-2 text-sm"
            style={{ background: '#ffffff', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
          />
        </div>

        {articleInputs.map((article, i) => (
          <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: '#999999' }}>Article {i + 1}</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={article.url}
                  onChange={e => updateArticle(i, 'url', e.target.value)}
                  placeholder="Source URL (optional)"
                  className="rounded px-2 py-1 text-xs w-48"
                  style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
                />
                <input
                  type="date"
                  value={article.date}
                  onChange={e => updateArticle(i, 'date', e.target.value)}
                  className="rounded px-2 py-1 text-xs"
                  style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
                />
              </div>
            </div>
            <textarea
              value={article.text}
              onChange={e => updateArticle(i, 'text', e.target.value)}
              placeholder="Paste the article text here..."
              rows={6}
              className="w-full rounded-lg px-4 py-3 text-sm resize-y"
              style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', color: '#1a1a1a' }}
            />
          </div>
        ))}

        <div className="flex gap-3">
          <button
            onClick={addArticle}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ border: '1px solid #e5e5e5', color: '#6b6b6b' }}
          >
            + Add Another Article
          </button>
          <button
            onClick={analyze}
            disabled={loading}
            className="text-xs px-6 py-2 rounded-lg font-bold transition-opacity"
            style={{
              background: loading ? '#d06a2a' : '#e87b35',
              color: 'white',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Analyzing...' : 'Run Rewriting Detection'}
          </button>
        </div>

        {error && (
          <div className="text-xs rounded-lg p-3" style={{ background: 'rgba(196,69,54,0.08)', color: '#c44536' }}>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {result.mode === 'demo' && (
            <div className="rounded-lg p-3 text-xs" style={{ background: '#fdf0e6', color: '#d06a2a', border: '1px solid rgba(232,123,53,0.2)' }}>
              Running in demo mode (heuristic analysis). Set ANTHROPIC_API_KEY for full LLM-powered claim extraction.
            </div>
          )}

          {/* Risk Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <RiskMeter value={result.assessment.overallRisk} />
            <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-mono font-bold" style={{ color: '#1a1a1a' }}>{result.assessment.claimCount}</div>
              <div className="text-xs" style={{ color: '#999999' }}>Claims extracted</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-mono font-bold" style={{ color: result.assessment.sourceConcentration > 0.5 ? '#e87b35' : '#2a9d5c' }}>
                {(result.assessment.sourceConcentration * 100).toFixed(0)}%
              </div>
              <div className="text-xs" style={{ color: '#999999' }}>Source concentration</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl font-mono font-bold" style={{ color: result.assessment.selfServingRatio > 0.5 ? '#e87b35' : '#2a9d5c' }}>
                {(result.assessment.selfServingRatio * 100).toFixed(0)}%
              </div>
              <div className="text-xs" style={{ color: '#999999' }}>Self-serving claim ratio</div>
            </div>
          </div>

          {/* Signals */}
          {result.assessment.signals.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                Rewriting Signals Detected ({result.assessment.signals.length})
              </h2>
              <div className="space-y-4">
                {result.assessment.signals.map((signal, i) => {
                  const color = signal.severity > 0.6 ? '#c44536' : signal.severity > 0.35 ? '#e87b35' : '#2a9d5c';
                  return (
                    <div key={i} className="rounded-lg p-5" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ background: `${color}10`, color }}>
                          {signal.pattern.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-mono" style={{ color: '#999999' }}>
                          severity: {(signal.severity * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed mb-3" style={{ color: '#1a1a1a' }}>
                        {signal.description}
                      </p>

                      <div className="rounded p-3 mb-3" style={{ background: '#f7f7f7', border: '1px solid #f0f0f0' }}>
                        <div className="text-xs font-bold mb-1" style={{ color: '#e87b35' }}>Historical Parallel</div>
                        <p className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>
                          {signal.historicalParallel}
                        </p>
                      </div>

                      {signal.claims_involved.length > 0 && (
                        <div>
                          <div className="text-xs font-bold mb-1" style={{ color: '#999999' }}>Involved claims:</div>
                          <ul className="space-y-1">
                            {signal.claims_involved.slice(0, 5).map((claim, j) => (
                              <li key={j} className="text-xs pl-3" style={{ color: '#6b6b6b', borderLeft: `2px solid ${color}` }}>
                                {claim}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 w-full h-1.5 rounded-full" style={{ background: '#eeeeee' }}>
                        <div className="h-full rounded-full" style={{ width: `${signal.severity * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>Recommendations</h2>
            <div className="space-y-2">
              {result.assessment.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: '#e87b35' }}>{i + 1}.</span>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b6b6b' }}>{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
