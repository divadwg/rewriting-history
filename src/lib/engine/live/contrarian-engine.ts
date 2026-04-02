/**
 * Contrarian Engine: Given a popular historical belief, generates
 * a scientifically-grounded contrarian analysis.
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

export const CONTRARIAN_PROMPT = `You are a rigorous historical analyst. Given a commonly held belief about a historical event, provide a scientifically-grounded contrarian analysis.

IMPORTANT RULES:
- Only cite REAL, verifiable historical evidence (declassified documents, academic studies, primary sources)
- Do NOT fabricate sources or evidence
- Present the contrarian case fairly but note its limitations
- Assign honest likelihood ratios — if the standard narrative is actually well-supported, say so
- This is about scientific rigor, not conspiracy theories

For the given belief, return a JSON object with this exact structure:
{
  "belief": "The popular belief being examined",
  "standardNarrative": "2-3 sentence description of the standard/popular version",
  "contrarianCase": "2-3 sentence description of the strongest evidence-based alternative",
  "hypotheses": [
    {
      "id": "h1-standard",
      "caseStudyId": "on-demand",
      "label": "The standard narrative (1 sentence)",
      "description": "Fuller description",
      "prior": 0.6,
      "posterior": 0.6,
      "isOfficial": true
    },
    {
      "id": "h2-contrarian",
      "caseStudyId": "on-demand",
      "label": "The contrarian hypothesis (1 sentence)",
      "description": "Fuller description",
      "prior": 0.4,
      "posterior": 0.4,
      "isOfficial": false
    }
  ],
  "evidence": [
    {
      "id": "e1",
      "label": "Short evidence label",
      "description": "What this evidence is and why it matters",
      "date": "YYYY-MM-DD or YYYY",
      "likelihoodRatios": { "h1-standard": 0.0-1.0, "h2-contrarian": 0.0-1.0 },
      "sourceReliability": 0.0-1.0,
      "wasClassified": false,
      "declassifiedDate": null
    }
  ],
  "causalFactors": [
    {
      "id": "cf1",
      "type": "power_change|narrative_change|evidence_action|institutional",
      "label": "What factor shaped this narrative",
      "date": "YYYY"
    }
  ],
  "causalLinks": [
    {
      "from": "cf1",
      "to": "cf2",
      "mechanism": "How this causal factor led to the next",
      "strength": 0.0-1.0
    }
  ],
  "keyInsight": "The single most important thing people get wrong about this, in 1-2 sentences",
  "furtherReading": ["Real book/paper titles with real authors"],
  "confidenceNote": "Honest assessment of how strong the contrarian case actually is"
}

GUIDELINES FOR LIKELIHOOD RATIOS:
- P(E|H) represents: how likely would we see this evidence IF this hypothesis were true?
- Both values for a piece of evidence should NOT sum to 1 (they're independent likelihoods)
- If evidence strongly favors the contrarian view: h1-standard low (0.1-0.3), h2-contrarian high (0.7-0.9)
- If evidence is neutral: both around 0.5
- If evidence actually supports the standard view: h1-standard high, h2-contrarian low
- BE HONEST: include evidence that supports BOTH sides

Provide 4-8 evidence items, including at least one that supports the standard narrative.
Provide 2-4 causal factors explaining why the dominant narrative took hold.
Provide 2-4 real academic sources for further reading.`;

export const DISCOVERY_PROMPT = `You are a rigorous historical analyst. For the given topic category, identify ONE specific, commonly held popular belief about history that has a strong, evidence-based contrarian argument.

Pick something genuinely surprising — not obvious, not a conspiracy theory, but a case where mainstream historical scholarship has moved past the popular understanding.

Prefer beliefs where:
- There is real primary source evidence contradicting the popular view
- Academic historians have published contrarian arguments
- The popular belief persists despite evidence because it serves a narrative purpose
- The truth is more interesting and nuanced than the myth

DO NOT pick beliefs that have already been covered. Here are the ones already done (skip these):
ALREADY_DONE_PLACEHOLDER

Return ONLY the belief as a single sentence string, nothing else. No quotes, no explanation, just the belief.`;

export function buildContrarianPrompt(belief: string): string {
  return `${CONTRARIAN_PROMPT}

THE POPULAR BELIEF TO EXAMINE:
"${belief}"

Return ONLY the JSON object, no other text:`;
}

export function buildDiscoveryPrompt(category: string, alreadyDone: string[]): string {
  const already = alreadyDone.length > 0
    ? alreadyDone.map(b => `- "${b}"`).join('\n')
    : '(none yet)';

  return DISCOVERY_PROMPT.replace('ALREADY_DONE_PLACEHOLDER', already) +
    `\n\nTOPIC CATEGORY: ${category}\n\nReturn ONLY the belief as a single sentence:`;
}

export interface TopicCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  { id: 'medieval', label: 'Medieval History', icon: 'M', description: 'Dark ages, crusades, feudalism, the church' },
  { id: 'ancient', label: 'Ancient World', icon: 'A', description: 'Egypt, Rome, Greece, Persia, China' },
  { id: 'wwii', label: 'World War II', icon: 'W', description: 'Battles, strategy, the home front, aftermath' },
  { id: 'cold-war', label: 'Cold War', icon: 'C', description: 'Espionage, proxy wars, space race, propaganda' },
  { id: 'revolution', label: 'Revolutions', icon: 'R', description: 'French, American, Russian, Chinese, industrial' },
  { id: 'colonial', label: 'Colonial Era', icon: 'E', description: 'Exploration, conquest, imperialism, resistance' },
  { id: 'science', label: 'History of Science', icon: 'S', description: 'Discoveries, inventions, who really did what' },
  { id: 'economics', label: 'Economic History', icon: '$', description: 'Crashes, booms, trade, inequality, money' },
  { id: 'military', label: 'Military History', icon: 'B', description: 'Battles, tactics, generals, logistics' },
  { id: 'social', label: 'Social Movements', icon: 'P', description: 'Civil rights, labor, feminism, abolition' },
  { id: 'surprise', label: 'Surprise Me', icon: '?', description: 'A random topic from any era' },
];

export const SUGGESTED_BELIEFS = [
  {
    belief: "The atomic bombs on Hiroshima and Nagasaki were necessary to end World War II",
    category: "Military History",
    hint: "Eisenhower, Leahy, and multiple top US commanders disagreed at the time",
  },
  {
    belief: "The Treaty of Versailles caused World War II by being too harsh on Germany",
    category: "Diplomatic History",
    hint: "Many historians argue it was actually too lenient to restrain Germany and too harsh to conciliate it",
  },
  {
    belief: "Columbus discovered America",
    category: "Exploration",
    hint: "Norse settlements, indigenous civilizations, and the meaning of 'discovery' itself",
  },
  {
    belief: "The French Revolution was a spontaneous popular uprising against tyranny",
    category: "Political History",
    hint: "Recent scholarship emphasizes elite manipulation, financial crisis, and the role of pamphlet propaganda",
  },
  {
    belief: "Medieval people thought the Earth was flat",
    category: "History of Science",
    hint: "Educated Europeans knew the Earth was round since antiquity; the flat-earth myth was invented in the 19th century",
  },
  {
    belief: "The Allies won World War II primarily because of D-Day and the Western Front",
    category: "Military History",
    hint: "80% of German military casualties occurred on the Eastern Front against the Soviet Union",
  },
];
