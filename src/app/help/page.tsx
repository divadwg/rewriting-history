export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>How It Works</h1>
      <p className="text-lg mb-12 leading-relaxed" style={{ color: '#6b6b6b' }}>
        Rewriting History is a tool that tests claims against evidence using mathematics,
        not opinions. It collects evidence first, then lets the math tell you what the
        evidence actually supports.
      </p>

      {/* ── PLAIN ENGLISH OVERVIEW ──────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1a1a' }}>What it does</h2>

        <div className="space-y-6">
          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#e87b35' }}>Evidence Discovery</h3>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              You ask a question about history &mdash; for example, &ldquo;What do ship manifests reveal about
              Viking trade vs. raiding?&rdquo; The system goes and finds real primary source evidence: documents,
              statistics, archaeological findings, declassified records. It then figures out what explanations
              fit that evidence best, using probability math. The result might confirm the standard story,
              or it might surface something nobody talks about.
            </p>
          </div>

          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#e87b35' }}>Live Analysis</h3>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              You paste a news article. The system pulls out every verifiable claim the article makes,
              then tries to find independent evidence for or against each one. It runs the same probability
              math and gives you a claim-by-claim verdict: supported, contradicted, or unverifiable. Each
              claim gets a link so you can check the sources yourself.
            </p>
          </div>

          <div className="rounded-lg p-6" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#e87b35' }}>Case Studies</h3>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              Pre-built analyses of historical events with full knowledge graphs, causal models, and
              Bayesian inference. You can toggle individual evidence items on and off to see how each
              piece of evidence shifts the probability of different explanations. The interactive graph
              shows how claims, sources, and actors connect.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW TO USE IT ───────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1a1a' }}>How to use it</h2>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: '#e87b35', color: 'white' }}>1</div>
            <div>
              <div className="font-bold mb-1" style={{ color: '#1a1a1a' }}>Set your API key</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                Click the Settings button in the top nav. Choose your AI provider (Claude, OpenAI, Gemini, or Grok)
                and enter your API key. The key is stored in your browser only &mdash; it never touches our servers.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: '#e87b35', color: 'white' }}>2</div>
            <div>
              <div className="font-bold mb-1" style={{ color: '#1a1a1a' }}>Ask a question or paste an article</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                On <strong>Evidence Discovery</strong>, type a specific research question or click a topic
                category to auto-discover one. On <strong>Live Analysis</strong>, paste the text of a news article.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: '#e87b35', color: 'white' }}>3</div>
            <div>
              <div className="font-bold mb-1" style={{ color: '#1a1a1a' }}>Wait for the pipeline (30&ndash;60 seconds)</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                The system runs a multi-step pipeline: gather evidence, generate hypotheses, run Bayesian
                inference, then synthesize the results. You&apos;ll see the progress as it works.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: '#e87b35', color: 'white' }}>4</div>
            <div>
              <div className="font-bold mb-1" style={{ color: '#1a1a1a' }}>Read the results and check the sources</div>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>
                Every evidence item has a <span className="font-mono" style={{ color: '#e87b35' }}>[source]</span> link
                (when a direct URL is known) and a <span className="font-mono" style={{ color: '#999999' }}>[verify]</span> link
                (a Google search you can run yourself). The percentages are computed mathematically &mdash; they&apos;re
                not the AI&apos;s opinion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL DETAILS ───────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Under the hood</h2>
        <p className="text-sm mb-8" style={{ color: '#6b6b6b' }}>
          Three systems work together. The AI gathers evidence and estimates relationships. The math
          computes what the evidence means. The graph shows how everything connects.
        </p>

        {/* ── BAYESIAN INFERENCE ─────────────────────────────────────────── */}
        <div className="rounded-lg p-6 mb-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xl font-mono" style={{ color: '#e87b35' }}>P(H|E)</span>
            <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Bayesian Inference</h3>
          </div>

          <div className="rounded p-4 mb-4" style={{ background: '#f7f7f7' }}>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              <strong style={{ color: '#1a1a1a' }}>In plain English:</strong> You start with a set of possible
              explanations, each with an initial probability. Then you feed in evidence, one piece at a time.
              Each piece of evidence makes some explanations more likely and others less likely. After all the
              evidence is processed, the explanation with the highest probability is the one best supported
              by the data. This is how scientists and doctors reason &mdash; updating beliefs as new information
              arrives.
            </p>
          </div>

          <div className="space-y-4 text-sm" style={{ color: '#6b6b6b' }}>
            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Bayes&apos; Theorem</div>
              <div className="font-mono text-xs p-3 rounded mb-2" style={{ background: '#f7f7f7', color: '#e87b35' }}>
                P(H|E) = P(E|H) &times; P(H) / P(E)
              </div>
              <ul className="space-y-1 text-xs" style={{ color: '#6b6b6b' }}>
                <li><strong>P(H|E)</strong> &mdash; the <em>posterior</em>: how likely is this explanation after seeing the evidence?</li>
                <li><strong>P(E|H)</strong> &mdash; the <em>likelihood</em>: if this explanation were true, how likely would we see this evidence?</li>
                <li><strong>P(H)</strong> &mdash; the <em>prior</em>: how likely was this explanation before seeing the evidence?</li>
                <li><strong>P(E)</strong> &mdash; the <em>marginal likelihood</em>: how likely is this evidence across all explanations?</li>
              </ul>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Source reliability weighting</div>
              <p className="text-xs leading-relaxed">
                Not all evidence is equally trustworthy. Each source gets a reliability score (0&ndash;100%).
                Less reliable sources have their likelihood values pulled toward 0.5 (neutral), so they
                have less influence on the final result. A government census record at 95% reliability shifts
                the probabilities much more than an anonymous claim at 30%.
              </p>
              <div className="font-mono text-xs p-3 rounded mt-2" style={{ background: '#f7f7f7', color: '#e87b35' }}>
                adjusted = reliability &times; raw_likelihood + (1 - reliability) &times; 0.5
              </div>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Evidence sensitivity (impact scores)</div>
              <p className="text-xs leading-relaxed">
                Each evidence item gets an &ldquo;impact&rdquo; score showing how much it shifts the result on its own.
                This uses log-odds: at extreme probabilities (like 0.1% vs 0.3%), raw percentage differences
                look tiny but actually represent a 3x shift. Log-odds captures this correctly. Items are
                sorted by impact so you can see which evidence matters most.
              </p>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Verdict thresholds</div>
              <div className="text-xs grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded" style={{ background: '#2a9d5c10', border: '1px solid #2a9d5c30' }}>
                  <span className="font-mono font-bold" style={{ color: '#2a9d5c' }}>SUPPORTED</span>
                  <span className="ml-2">posterior &ge; 70%</span>
                </div>
                <div className="p-2 rounded" style={{ background: '#d06a2a10', border: '1px solid #d06a2a30' }}>
                  <span className="font-mono font-bold" style={{ color: '#d06a2a' }}>QUESTIONABLE</span>
                  <span className="ml-2">40&ndash;70%</span>
                </div>
                <div className="p-2 rounded" style={{ background: '#e87b3510', border: '1px solid #e87b3530' }}>
                  <span className="font-mono font-bold" style={{ color: '#e87b35' }}>UNLIKELY</span>
                  <span className="ml-2">20&ndash;40%</span>
                </div>
                <div className="p-2 rounded" style={{ background: '#c4453610', border: '1px solid #c4453630' }}>
                  <span className="font-mono font-bold" style={{ color: '#c44536' }}>REFUTED</span>
                  <span className="ml-2">posterior &lt; 20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KNOWLEDGE GRAPH ────────────────────────────────────────────── */}
        <div className="rounded-lg p-6 mb-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xl font-mono" style={{ color: '#e87b35' }}>G</span>
            <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Knowledge Graph</h3>
          </div>

          <div className="rounded p-4 mb-4" style={{ background: '#f7f7f7' }}>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              <strong style={{ color: '#1a1a1a' }}>In plain English:</strong> A map of who said what, what
              evidence exists, and how things connect. People, documents, events, and claims are dots (nodes).
              Lines between them (edges) show relationships: &ldquo;this person made this claim,&rdquo; &ldquo;this document
              contradicts that claim,&rdquo; &ldquo;this event preceded that event.&rdquo; When you see the interactive
              graph in a case study, you&apos;re looking at this map. Clusters of connected nodes reveal which
              claims depend on the same sources, or which actors benefit from the same narrative.
            </p>
          </div>

          <div className="space-y-4 text-sm" style={{ color: '#6b6b6b' }}>
            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Node types</div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                {[
                  { type: 'claim', desc: 'A specific assertion someone made' },
                  { type: 'source', desc: 'A document, database, or record' },
                  { type: 'actor', desc: 'A person, organisation, or government' },
                  { type: 'event', desc: 'Something that happened at a specific time' },
                  { type: 'evidence', desc: 'A verifiable fact with a source' },
                  { type: 'narrative', desc: 'A broader story or explanation' },
                ].map(n => (
                  <div key={n.type} className="p-2 rounded" style={{ background: '#f7f7f7' }}>
                    <span className="font-mono font-bold" style={{ color: '#e87b35' }}>{n.type}</span>
                    <div className="mt-1" style={{ color: '#999999' }}>{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Edge types (relationships)</div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                {[
                  { type: 'claims', desc: 'Actor makes a claim' },
                  { type: 'cites', desc: 'Claim references a source' },
                  { type: 'contradicts', desc: 'Two things conflict' },
                  { type: 'suppresses', desc: 'Actor hides evidence' },
                  { type: 'benefits', desc: 'Actor gains from a claim' },
                  { type: 'causes', desc: 'One event leads to another' },
                  { type: 'precedes', desc: 'Temporal ordering' },
                  { type: 'derived_from', desc: 'Claim built on another' },
                  { type: 'fabricates', desc: 'Actor creates false evidence' },
                ].map(e => (
                  <div key={e.type} className="p-2 rounded" style={{ background: '#f7f7f7' }}>
                    <span className="font-mono font-bold" style={{ color: '#e87b35' }}>{e.type}</span>
                    <div className="mt-1" style={{ color: '#999999' }}>{e.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>What the graph reveals</div>
              <p className="text-xs leading-relaxed">
                The graph makes structural patterns visible. If many claims trace back to a single source, that&apos;s
                a <strong>source clustering</strong> risk &mdash; one bad source could invalidate multiple claims. If an actor
                benefits from a claim and also suppresses contradicting evidence, that&apos;s an <strong>evidence
                suppression</strong> pattern. The graph is rendered using D3.js force simulation, where connected
                nodes pull together and unconnected nodes push apart, naturally revealing clusters.
              </p>
            </div>
          </div>
        </div>

        {/* ── CAUSAL MODEL ───────────────────────────────────────────────── */}
        <div className="rounded-lg p-6 mb-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xl font-mono" style={{ color: '#e87b35' }}>C</span>
            <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>Causal Model</h3>
          </div>

          <div className="rounded p-4 mb-4" style={{ background: '#f7f7f7' }}>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              <strong style={{ color: '#1a1a1a' }}>In plain English:</strong> The causal model answers
              &ldquo;why&rdquo; &mdash; why did the story change, why was evidence hidden, why did one version
              of events win out? It traces chains of cause and effect: a change in political power leads
              to a change in the official narrative, which leads to certain evidence being suppressed or
              certain claims being promoted. This is what makes the system more than just fact-checking &mdash;
              it shows the structural forces that shape what we believe about the past.
            </p>
          </div>

          <div className="space-y-4 text-sm" style={{ color: '#6b6b6b' }}>
            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Causal factor types</div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                {[
                  { type: 'power_change', color: '#c44536', desc: 'A shift in who holds power (election, coup, conquest)' },
                  { type: 'narrative_change', color: '#e87b35', desc: 'The official story about an event changes' },
                  { type: 'evidence_action', color: '#d06a2a', desc: 'Evidence is created, destroyed, classified, or released' },
                  { type: 'institutional', color: '#999999', desc: 'An organisation changes rules or structure' },
                  { type: 'economic', color: '#b07030', desc: 'Economic forces that shape incentives' },
                  { type: 'demographic', color: '#4a8fa8', desc: 'Population changes that shift the context' },
                  { type: 'technological', color: '#999999', desc: 'New technology changes what is possible or detectable' },
                ].map(f => (
                  <div key={f.type} className="p-2 rounded flex gap-2 items-start" style={{ background: '#f7f7f7' }}>
                    <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: f.color }} />
                    <div>
                      <span className="font-mono font-bold" style={{ color: '#1a1a1a' }}>{f.type}</span>
                      <div className="mt-0.5" style={{ color: '#999999' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold font-mono mb-1" style={{ color: '#1a1a1a' }}>Causal links</div>
              <p className="text-xs leading-relaxed">
                Each link connects two causal factors with a <strong>mechanism</strong> (how one caused the other)
                and a <strong>strength</strong> (0&ndash;1, how strong the causal relationship is). For example:
                &ldquo;Military defeat (power_change) &rarr; Declassification of wartime records (evidence_action),
                mechanism: new government opens archives of predecessor, strength: 0.8.&rdquo; These chains
                show the structural reasons <em>why</em> histories get rewritten.
              </p>
            </div>
          </div>
        </div>

        {/* ── THE PIPELINE ───────────────────────────────────────────────── */}
        <div className="rounded-lg p-6" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-xl font-mono" style={{ color: '#e87b35' }}>1 &rarr; 4</span>
            <h3 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>The Evidence-First Pipeline</h3>
          </div>

          <div className="rounded p-4 mb-4" style={{ background: '#f7f7f7' }}>
            <p className="leading-relaxed" style={{ color: '#6b6b6b' }}>
              <strong style={{ color: '#1a1a1a' }}>In plain English:</strong> The key design decision is that
              evidence comes <em>before</em> hypotheses. Most fact-checking asks &ldquo;is this claim true?&rdquo; and then
              looks for confirmation. This system gathers raw evidence first, with no conclusion in mind,
              then generates every possible explanation that fits the evidence, then uses mathematics to
              determine which explanation the evidence best supports. The AI does the research; the math
              does the reasoning.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex gap-3 items-start">
              <div className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                style={{ background: '#e87b35', color: 'white' }}>Step 1</div>
              <div>
                <div className="font-bold" style={{ color: '#1a1a1a' }}>Gather evidence</div>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  An AI research assistant finds primary sources: documents, statistics, archaeological
                  findings, declassified records. It is instructed to cast a wide net and include
                  contradictory evidence. It does not interpret or draw conclusions.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                style={{ background: '#e87b35', color: 'white' }}>Step 2</div>
              <div>
                <div className="font-bold" style={{ color: '#1a1a1a' }}>Generate hypotheses</div>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  A separate AI call examines only the evidence (not popular beliefs) and generates 3&ndash;5
                  possible explanations. For each hypothesis, it estimates likelihood ratios: &ldquo;if this
                  explanation were true, how likely is each piece of evidence?&rdquo;
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                style={{ background: '#e87b35', color: 'white' }}>Step 3</div>
              <div>
                <div className="font-bold" style={{ color: '#1a1a1a' }}>Bayesian inference (pure math)</div>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  No AI involved in this step. The system applies Bayes&apos; theorem to compute posterior
                  probabilities for each hypothesis. It also computes evidence sensitivity (which evidence
                  items had the biggest impact) and a verdict. This is deterministic mathematics.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="font-mono text-xs px-2 py-1 rounded flex-shrink-0"
                style={{ background: '#e87b35', color: 'white' }}>Step 4</div>
              <div>
                <div className="font-bold" style={{ color: '#1a1a1a' }}>Synthesis</div>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  A final AI call reports what the <em>math</em> revealed, not what the AI thinks. It
                  identifies the key finding, any novel discoveries, and what further evidence would
                  resolve remaining uncertainty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIMITATIONS ─────────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1a1a1a' }}>Limitations</h2>
        <div className="space-y-3 text-sm" style={{ color: '#6b6b6b' }}>
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <strong style={{ color: '#1a1a1a' }}>The AI can only access its training data.</strong> It
            cannot browse the web in real time. For recent events (past its knowledge cutoff), it may
            not have independent evidence. In these cases, evidence is marked &ldquo;unverifiable&rdquo; rather
            than falsely confirming or denying claims.
          </div>
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <strong style={{ color: '#1a1a1a' }}>Likelihood ratios are estimated by the AI.</strong> The
            Bayesian math is exact, but the inputs (how likely is this evidence under each hypothesis)
            are estimated by the AI, not measured experimentally. Different AI models may produce
            different estimates. Always check the <span className="font-mono" style={{ color: '#999999' }}>[verify]</span> links.
          </div>
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <strong style={{ color: '#1a1a1a' }}>Source URLs may not always be accurate.</strong> Direct
            source links are only provided when the AI is confident the URL exists. The Google search
            <span className="font-mono" style={{ color: '#999999' }}> [verify]</span> links are always reliable
            as a fallback.
          </div>
          <div className="rounded-lg p-4" style={{ background: '#f7f7f7', border: '1px solid #e5e5e5' }}>
            <strong style={{ color: '#1a1a1a' }}>This is a reasoning tool, not an oracle.</strong> The
            system shows what the available evidence supports. It can be wrong. Use it as a starting
            point for your own research, not as a final answer.
          </div>
        </div>
      </section>
    </div>
  );
}
