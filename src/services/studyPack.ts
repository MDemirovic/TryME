import type { Flashcard, StudyDocument, StudyPack } from '@/src/types';

interface ConceptItem {
  title: string;
  detail: string;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .split(/[.!?]\s+|\n+/)
    .map((entry) => normalizeWhitespace(entry))
    .filter((entry) => entry.length >= 18);
}

function titleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function extractKeywords(text: string, maxCount = 4): string[] {
  const stopWords = new Set([
    'about',
    'after',
    'also',
    'because',
    'between',
    'could',
    'during',
    'first',
    'from',
    'have',
    'into',
    'more',
    'most',
    'notes',
    'only',
    'other',
    'should',
    'study',
    'their',
    'there',
    'these',
    'they',
    'this',
    'through',
    'under',
    'were',
    'what',
    'when',
    'where',
    'which',
    'while',
    'with',
    'your',
    'that',
    'than',
    'them',
    'used',
    'using',
    'will',
    'would',
    'been',
    'being',
    'into',
    'onto',
    'over',
    'each',
    'such',
    'very',
    'many',
    'much',
    'less',
    'same',
    'then',
    'the',
    'and',
    'for',
    'you',
    'are',
    'was',
    'were',
    'has',
    'had',
    'not',
    'but',
    'can',
    'may',
    'our',
    'its',
    'their',
    'they',
    'she',
    'him',
    'her',
    'his',
    'all',
    'any',
    'out',
    'off',
    'too',
    'the',
    'and',
    'for',
    'with',
    'from',
    'into',
    'then',
    'than',
    'have',
    'were',
    'this',
    'that',
  ]);

  return unique(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !stopWords.has(word)),
  ).slice(0, maxCount);
}

function extractConcepts(text: string): ConceptItem[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 12);

  const explicit = lines
    .map((line) => {
      const delimiter = line.includes(':') ? ':' : line.includes(' - ') ? ' - ' : null;
      if (!delimiter) {
        return null;
      }

      const [left, ...rest] = line.split(delimiter);
      const detail = normalizeWhitespace(rest.join(delimiter));
      if (left.trim().length < 3 || detail.length < 15) {
        return null;
      }

      return {
        title: titleCase(left.trim().slice(0, 70)),
        detail: detail.slice(0, 220),
      } satisfies ConceptItem;
    })
    .filter((item): item is ConceptItem => Boolean(item));

  if (explicit.length >= 4) {
    return explicit.slice(0, 10);
  }

  return splitSentences(text)
    .slice(0, 10)
    .map((sentence, index) => {
      const keywords = extractKeywords(sentence, 2);
      return {
        title: keywords.length > 0 ? titleCase(keywords.join(' ')) : `Concept ${index + 1}`,
        detail: sentence.slice(0, 220),
      } satisfies ConceptItem;
    });
}

function detectLanguage(text: string): string {
  const sample = text.toLowerCase();

  const checks = [
    {
      label: 'Spanish',
      hits: [' el ', ' la ', ' los ', ' las ', ' que ', ' para ', ' una ', ' del ', 'cion '],
    },
    {
      label: 'German',
      hits: [' der ', ' die ', ' das ', ' und ', ' nicht ', ' ist ', ' mit ', ' ein '],
    },
    {
      label: 'English',
      hits: [' the ', ' and ', ' with ', ' from ', ' that ', ' this ', ' into ', ' are '],
    },
  ];

  let best = { label: 'Mixed / Unknown', score: 0 };

  checks.forEach((check) => {
    const score = check.hits.reduce((total, token) => total + (sample.includes(token) ? 1 : 0), 0);
    if (score > best.score) {
      best = { label: check.label, score };
    }
  });

  return best.label;
}

function buildOverview(concepts: ConceptItem[], sentences: string[]): string {
  if (sentences.length === 0) {
    return 'Upload more complete notes to generate a stronger study pack.';
  }

  const first = sentences[0];
  const second = sentences[1];
  const conceptLead = concepts[0]?.title;

  return normalizeWhitespace(
    [
      conceptLead ? `Your notes focus on ${conceptLead}.` : 'Your notes are ready for practice.',
      first,
      second,
    ]
      .filter(Boolean)
      .join(' '),
  ).slice(0, 280);
}

function buildFlashcards(concepts: ConceptItem[]): Flashcard[] {
  return concepts.slice(0, 6).map((concept, index) => ({
    id: `flashcard-${index + 1}`,
    front: concept.title,
    back: concept.detail,
    dueLabel: index < 2 ? 'Review now' : index < 4 ? 'Review tomorrow' : 'Review in 2 days',
    mastery: index < 2 ? 'new' : index < 4 ? 'warming' : 'solid',
  }));
}

function getQualityScore(wordCount: number, conceptCount: number): number {
  const base = Math.min(100, Math.round(wordCount / 8));
  const conceptBonus = Math.min(18, conceptCount * 3);
  return Math.max(18, Math.min(98, base + conceptBonus));
}

function qualityLabelFromScore(score: number): StudyPack['qualityLabel'] {
  if (score >= 78) {
    return 'strong';
  }
  if (score >= 52) {
    return 'okay';
  }
  return 'needs_attention';
}

export function createStudyPack(text: string): StudyPack {
  const normalized = text.replace(/[^\S\r\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const sentences = splitSentences(normalized);
  const concepts = extractConcepts(normalized);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const qualityScore = getQualityScore(wordCount, concepts.length);
  const qualityLabel = qualityLabelFromScore(qualityScore);

  const keyConcepts = unique(concepts.map((concept) => concept.title)).slice(0, 6);
  const oralExamQuestions = concepts.slice(0, 5).map((concept) => `Explain ${concept.title} in your own words and connect it to the wider topic.`);
  const weakTopicSuggestions = concepts
    .slice(-3)
    .map((concept) => `Revisit ${concept.title} and add one concrete example you could say out loud.`);
  const retrievalSnippets = unique([
    ...concepts.slice(0, 4).map((concept) => concept.detail),
    ...sentences.slice(0, 4),
  ]).slice(0, 6);

  return {
    overview: buildOverview(concepts, sentences),
    keyConcepts,
    oralExamQuestions,
    weakTopicSuggestions,
    retrievalSnippets,
    flashcards: buildFlashcards(concepts),
    quizTargets: concepts.slice(0, 6).map((concept) => concept.title),
    estimatedStudyMinutes: Math.max(8, Math.min(45, Math.round(wordCount / 110))),
    qualityLabel,
    qualityScore,
  };
}

export function enrichStudyDocument(base: Omit<StudyDocument, 'wordCount' | 'detectedLanguage' | 'status' | 'studyPack'>): StudyDocument {
  const wordCount = base.extractedText.split(/\s+/).filter(Boolean).length;
  const studyPack = createStudyPack(base.extractedText);
  const status = studyPack.qualityLabel === 'needs_attention' ? 'needs_attention' : 'ready';

  return {
    ...base,
    wordCount,
    detectedLanguage: detectLanguage(base.extractedText),
    status,
    studyPack,
  };
}
