/**
 * Evidence-First Discovery Engine
 *
 * Unlike the old approach (ask LLM for a contrarian view), this engine:
 * 1. Gathers RAW EVIDENCE first — documents, statistics, dates, primary sources
 * 2. Generates ALL possible hypotheses FROM the evidence
 * 3. Estimates likelihood ratios for each evidence-hypothesis pair
 * 4. Lets Bayesian math surface what the evidence actually shows
 * 5. Synthesizes the discovery — what did nobody notice?
 *
 * The LLM is used as a research assistant, not an opinion generator.
 * The math does the discovering.
 */

import { Hypothesis, EvidenceItem, CausalFactor, CausalLink } from '../../types/graph';

export interface ContrarianResult {
  belief: string;
  standardNarrative: string;
  contrarianCase: string;
  hypotheses: Hypothesis[];
  evidence: EvidenceItem[];
  causalFactors: CausalFactor[];
  causalLinks: CausalLink[];
  keyInsight: string;
  furtherReading: string[];
  confidenceNote: string;
}

// ─── STEP 1: EVIDENCE GATHERING ─────────────────────────────────────────────

export const EVIDENCE_PROMPT = `You are a research assistant compiling PRIMARY SOURCE EVIDENCE on a historical topic.

CRITICAL RULES:
- List ONLY verifiable, citable evidence. No opinions, no interpretations, no narratives.
- Each item must be a SPECIFIC fact: a document with a date, a statistic from a named source, a direct quote with attribution, a physical artifact, a declassified record, census data, a court record, an archaeological finding.
- Include evidence from ALL sides and perspectives, especially lesser-known sources.
- Prefer QUANTITATIVE evidence: numbers, dates, measurements, counts, ratios.
- Include evidence that might seem to contradict each other — contradictions are valuable.
- DO NOT filter evidence based on what you think is important. Cast a wide net.
- Include the SOURCE for each piece of evidence (author, document, archive, database).

For the given topic, return a JSON array of evidence items:
[
  {
    "id": "e1",
    "fact": "The specific verifiable fact (1-2 sentences)",
    "source": "Author/Document/Archive name, date",
    "date": "YYYY or YYYY-MM-DD",
    "type": "document|statistic|testimony|physical|archaeological|legal|declassified|census|scientific",
    "sourceReliability": 0.0-1.0,
    "wasClassified": false,
    "declassifiedDate": null,
    "quantitative": true/false,
    "dataPoint": "The specific number/measurement if quantitative, null otherwise",
    "sourceUrl": "Direct URL to the source if you are CONFIDENT it exists (e.g. a specific archive page, .gov database, JSTOR article, Wikipedia article). Use null if uncertain — do NOT guess URLs.",
    "searchQuery": "Google search query a reader could use to find and verify this evidence"
  }
]

Provide 10-20 evidence items. Prioritize:
1. Primary sources over secondary
2. Quantitative over qualitative
3. Lesser-known over well-known
4. Contradictory evidence that doesn't fit simple narratives
5. Evidence from archives, declassified materials, or recent scholarship that hasn't entered popular knowledge`;

// ─── STEP 2: HYPOTHESIS GENERATION FROM EVIDENCE ────────────────────────────

export const HYPOTHESIS_PROMPT = `You are a scientist examining evidence with fresh eyes. You have NEVER heard any popular narrative about this topic. You only have the raw evidence below.

CRITICAL RULES:
- Generate hypotheses ONLY from the evidence provided. Do not import popular beliefs.
- Think like a detective: what explanations are consistent with ALL the evidence?
- Include unexpected hypotheses — if the evidence points somewhere surprising, follow it.
- Do NOT limit yourself to "standard view vs. one alternative." Generate 3-5 distinct hypotheses.
- At least one hypothesis should be something that hasn't been widely proposed — a genuine inference from the evidence pattern.
- Assign prior probabilities based ONLY on how many evidence items each hypothesis can explain (not on how popular the hypothesis is).
- Priors must sum to 1.0.

Given this evidence, return a JSON object:
{
  "hypotheses": [
    {
      "id": "h1",
      "label": "One-sentence hypothesis",
      "description": "2-3 sentence explanation of what this hypothesis claims",
      "prior": 0.0-1.0,
      "isOfficial": true/false,
      "reasoning": "Why this hypothesis exists — which evidence items suggest it"
    }
  ],
  "likelihoodRatios": {
    "e1": { "h1": 0.0-1.0, "h2": 0.0-1.0, ... },
    "e2": { "h1": 0.0-1.0, "h2": 0.0-1.0, ... }
  },
  "causalFactors": [
    {
      "id": "cf1",
      "type": "power_change|narrative_change|evidence_action|institutional|economic|demographic|technological",
      "label": "What structural factor shaped this situation",
      "date": "YYYY"
    }
  ],
  "causalLinks": [
    {
      "from": "cf1",
      "to": "cf2",
      "mechanism": "How this factor caused the next",
      "strength": 0.0-1.0
    }
  ]
}

LIKELIHOOD RATIO GUIDELINES:
- P(E|H) = how likely would we see this evidence IF this hypothesis were true?
- Values for different hypotheses are INDEPENDENT (don't sum to 1)
- If evidence strongly supports H: 0.8-0.95
- If evidence is neutral for H: 0.4-0.6
- If evidence contradicts H: 0.05-0.2
- Be HONEST — if evidence contradicts a hypothesis, give it a low value even if the hypothesis is popular`;

// ─── STEP 3: SYNTHESIS OF BAYESIAN RESULTS ──────────────────────────────────

export const SYNTHESIS_PROMPT = `You are a scientist reporting what the EVIDENCE and MATHEMATICS revealed. You ran Bayesian inference on primary source evidence and got specific results.

CRITICAL RULES:
- Report what the MATH shows, not what you think is true.
- If the posteriors support a surprising conclusion, report it honestly.
- Do not soften findings to match popular beliefs. But also do not overstate them.
- Identify what is genuinely NEW or underappreciated in these findings.
- Note which specific evidence items drove the biggest shifts.
- Be specific about what further evidence would strengthen or weaken the finding.

Given the topic, evidence, hypotheses, and Bayesian posteriors below, return a JSON object:
{
  "standardNarrative": "What most people believe about this (1-2 sentences)",
  "evidenceBasedConclusion": "What the evidence actually supports (2-3 sentences, be specific)",
  "keyInsight": "The single most important thing the evidence reveals that most people miss (1-2 sentences)",
  "novelFinding": "Something genuinely new — an inference from the evidence pattern that hasn't been widely articulated (1-2 sentences, or null if nothing novel emerged)",
  "strongestEvidence": ["List of evidence IDs that had the biggest Bayesian impact"],
  "missingEvidence": "What additional evidence would resolve remaining uncertainty (1-2 sentences)",
  "furtherReading": ["Real academic sources — books, papers, primary documents"],
  "confidenceNote": "Honest assessment: how confident should we be in this finding?"
}`;

// ─── STEP 4: TOPIC DISCOVERY ────────────────────────────────────────────────

export const DISCOVERY_PROMPT = `You are a research scientist identifying historical questions where PRIMARY SOURCE EVIDENCE may tell a different story than popular understanding.

CRITICAL RULES:
- Do NOT pick topics where the "contrarian view" is already well-known (e.g., "medieval people didn't think the earth was flat" — everyone already knows this).
- Pick topics where QUANTITATIVE EVIDENCE or RECENTLY AVAILABLE PRIMARY SOURCES haven't been properly synthesized.
- Prefer topics where there are specific numbers, documents, or data that contradict conventional wisdom.
- The topic should be specific enough to analyze with evidence (not "was X good or bad" but rather "what actually caused X" or "what were the actual consequences of Y").

Good examples:
- "What was the actual death toll comparison between Allied and Axis strategic bombing campaigns?"
- "How did Roman economic output compare to medieval European output in equivalent terms?"
- "What do ship manifests and port records reveal about the actual scale of Viking trade vs. raiding?"

BAD examples (too vague, too well-known, or opinion-based):
- "Was Columbus a hero or villain?"
- "Was Islam spread by the sword?"
- "Did medieval people think the earth was flat?"

DO NOT pick topics that have already been covered. Already done:
ALREADY_DONE_PLACEHOLDER

Return ONLY a specific research question as a single sentence. No quotes, no explanation.`;


// ─── BUILDERS ───────────────────────────────────────────────────────────────

export function buildEvidencePrompt(topic: string): string {
  return `${EVIDENCE_PROMPT}

THE TOPIC TO RESEARCH:
"${topic}"

Return ONLY the JSON array, no other text:`;
}

export function buildHypothesisPrompt(topic: string, evidenceJson: string): string {
  return `${HYPOTHESIS_PROMPT}

THE TOPIC:
"${topic}"

THE RAW EVIDENCE:
${evidenceJson}

Return ONLY the JSON object, no other text:`;
}

export function buildSynthesisPrompt(
  topic: string,
  evidenceJson: string,
  hypothesesJson: string,
  posteriorsJson: string,
  sensitivityJson: string
): string {
  return `${SYNTHESIS_PROMPT}

THE TOPIC:
"${topic}"

THE EVIDENCE:
${evidenceJson}

THE HYPOTHESES:
${hypothesesJson}

BAYESIAN POSTERIORS (computed mathematically from evidence):
${posteriorsJson}

EVIDENCE SENSITIVITY (which evidence items had the biggest mathematical impact):
${sensitivityJson}

Return ONLY the JSON object, no other text:`;
}

export function buildDiscoveryPrompt(category: string, alreadyDone: string[]): string {
  const already = alreadyDone.length > 0
    ? alreadyDone.map(b => `- "${b}"`).join('\n')
    : '(none yet)';

  return DISCOVERY_PROMPT.replace('ALREADY_DONE_PLACEHOLDER', already) +
    `\n\nTOPIC CATEGORY: ${category}\n\nReturn ONLY the research question as a single sentence:`;
}

// Keep old builder name for backward compat with API route
export function buildContrarianPrompt(belief: string): string {
  return buildEvidencePrompt(belief);
}


// ─── TYPES AND DATA ─────────────────────────────────────────────────────────

export interface RawEvidence {
  id: string;
  fact: string;
  source: string;
  date: string;
  type: string;
  sourceReliability: number;
  wasClassified: boolean;
  declassifiedDate: string | null;
  quantitative: boolean;
  dataPoint: string | null;
  sourceUrl?: string | null;
  searchQuery?: string | null;
}

export interface HypothesisGeneration {
  hypotheses: Array<{
    id: string;
    label: string;
    description: string;
    prior: number;
    isOfficial: boolean;
    reasoning: string;
  }>;
  likelihoodRatios: Record<string, Record<string, number>>;
  causalFactors: CausalFactor[];
  causalLinks: CausalLink[];
}

export interface SynthesisResult {
  standardNarrative: string;
  evidenceBasedConclusion: string;
  keyInsight: string;
  novelFinding: string | null;
  strongestEvidence: string[];
  missingEvidence: string;
  furtherReading: string[];
  confidenceNote: string;
}

export interface TopicCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: 'medieval', label: 'Medieval History', icon: 'M', description: 'Economics, demographics, technology, disease, trade' },
  { id: 'ancient', label: 'Ancient World', icon: 'A', description: 'Egypt, Rome, Greece, Persia, China — what the data shows' },
  { id: 'wwii', label: 'World War II', icon: 'W', description: 'Casualty data, production stats, logistics, intelligence' },
  { id: 'cold-war', label: 'Cold War', icon: 'C', description: 'Declassified records, economic data, espionage archives' },
  { id: 'revolution', label: 'Revolutions', icon: 'R', description: 'Demographics, economics, and power structures behind upheavals' },
  { id: 'colonial', label: 'Colonial Era', icon: 'E', description: 'Trade records, demographic data, economic extraction figures' },
  { id: 'science', label: 'History of Science', icon: 'S', description: 'Priority disputes, lab notebooks, patent records, correspondence' },
  { id: 'economics', label: 'Economic History', icon: '$', description: 'GDP reconstructions, price series, trade volumes, inequality data' },
  { id: 'military', label: 'Military History', icon: 'B', description: 'Casualty records, logistics data, after-action reports' },
  { id: 'social', label: 'Social Movements', icon: 'P', description: 'Census data, legislative records, economic indicators' },
  { id: 'surprise', label: 'Surprise Me', icon: '?', description: 'An underexplored question from any era' },
];

export const SUGGESTED_BELIEFS = [
  {
    belief: "What do casualty records and commander communications actually reveal about the military necessity of the atomic bombings of Japan?",
    category: "Military History",
    hint: "Japanese surrender cables, Potsdam intercepts, and post-war strategic bombing survey data",
  },
  {
    belief: "What do economic production statistics reveal about the actual causes of Rome's decline?",
    category: "Economic History",
    hint: "Ice core pollution data, shipwreck counts, and Greenland lead deposits as proxies for economic output",
  },
  {
    belief: "What do ship manifests, coin hoards, and archaeological digs reveal about Viking activity — was it primarily trading or raiding?",
    category: "Medieval History",
    hint: "Birka excavations, Hedeby trade records, and Arabic silver dirham distribution maps",
  },
  {
    belief: "What do declassified Soviet archives reveal about the actual decision-making behind the Cuban Missile Crisis?",
    category: "Cold War",
    hint: "Khrushchev's personal notes, Presidium transcripts released in 1997, and tactical nuclear warhead deployment records",
  },
  {
    belief: "What do parish records, tax rolls, and archaeological evidence reveal about actual living standards before and after the Black Death?",
    category: "Economic History",
    hint: "English manor court rolls, Florentine catasto data, and skeletal evidence of nutrition changes",
  },
  {
    belief: "What do port records and trade manifests reveal about who actually profited most from the Atlantic slave trade?",
    category: "Colonial Era",
    hint: "Liverpool customs records, Royal African Company ledgers, insurance underwriting data, and plantation account books",
  },
];
