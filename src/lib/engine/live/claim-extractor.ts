/**
 * Claim Extractor: Uses an LLM to extract structured claims from news text.
 * Produces knowledge graph nodes and edges from unstructured articles.
 *
 * This module defines the extraction schema and prompt engineering.
 * The actual LLM call is made via the API route (so API keys stay server-side).
 */

export interface ExtractedClaim {
  claim: string;
  claimant: string;
  claimantRole: string;
  evidence_cited: string[];
  date: string;
  confidence_language: 'definitive' | 'likely' | 'possible' | 'alleged' | 'uncertain';
  benefits_claimant: boolean;
  source_article: string;
}

export interface ExtractedContradiction {
  claim_a: string;
  claim_b: string;
  nature: string;
  source_a: string;
  source_b: string;
}

export interface ArticleAnalysis {
  claims: ExtractedClaim[];
  contradictions: ExtractedContradiction[];
  sources_cited: number;
  unique_independent_sources: number;
  narrative_framing: string;
  missing_perspectives: string[];
}

export const CLAIM_EXTRACTION_PROMPT = `You are a structured claim extractor for a historical analysis tool. Given a news article, extract ALL factual claims made, who makes them, what evidence is cited, and any contradictions.

For each claim, assess:
1. WHO is making the claim and their role/authority
2. WHAT evidence is cited to support it
3. Whether the claim BENEFITS the claimant (e.g., a government claiming its own policy works)
4. The CONFIDENCE LANGUAGE used (definitive, likely, possible, alleged, uncertain)
5. Any CONTRADICTIONS between claims in the article or with commonly known facts

Return your analysis as JSON matching this schema:
{
  "claims": [
    {
      "claim": "The specific factual claim being made",
      "claimant": "Who is making this claim",
      "claimantRole": "Their role/authority/affiliation",
      "evidence_cited": ["List of specific evidence referenced"],
      "date": "Date of the claim (ISO format)",
      "confidence_language": "definitive|likely|possible|alleged|uncertain",
      "benefits_claimant": true/false,
      "source_article": "Title or URL of the article"
    }
  ],
  "contradictions": [
    {
      "claim_a": "First contradicting claim",
      "claim_b": "Second contradicting claim",
      "nature": "How they contradict",
      "source_a": "Source of first claim",
      "source_b": "Source of second claim"
    }
  ],
  "sources_cited": 0,
  "unique_independent_sources": 0,
  "narrative_framing": "Brief description of the overall narrative frame the article uses",
  "missing_perspectives": ["Perspectives or viewpoints not represented in the article"]
}

Be rigorous. Flag where evidence is thin, where claims are self-serving, and where independent verification is lacking.`;

/**
 * Build the full prompt for claim extraction from an article.
 */
export function buildExtractionPrompt(articleText: string, articleUrl: string, articleDate: string): string {
  return `${CLAIM_EXTRACTION_PROMPT}

ARTICLE URL: ${articleUrl}
ARTICLE DATE: ${articleDate}

ARTICLE TEXT:
${articleText.slice(0, 8000)}

Extract all claims and contradictions as JSON:`;
}
