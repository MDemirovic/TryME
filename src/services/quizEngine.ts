import type { StudyDocument } from '@/src/types';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizQuestionType = 'multiple' | 'fill_blank' | 'definition';

interface BaseQuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  reference: string;
}

export interface MultipleChoiceQuestion extends BaseQuizQuestion {
  type: 'multiple';
  options: string[];
  correctOptionIndex: number;
}

export interface FillBlankQuestion extends BaseQuizQuestion {
  type: 'fill_blank';
  expectedAnswer: string;
}

export interface DefinitionQuestion extends BaseQuizQuestion {
  type: 'definition';
  expectedKeywords: string[];
}

export type QuizQuestion = MultipleChoiceQuestion | FillBlankQuestion | DefinitionQuestion;

interface KnowledgeItem {
  term: string;
  definition: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function titleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

function getKeywords(text: string, maxCount = 6): string[] {
  const stopWords = new Set([
    'that',
    'this',
    'from',
    'with',
    'into',
    'have',
    'your',
    'their',
    'there',
    'about',
    'which',
    'where',
    'while',
    'when',
    'were',
    'what',
    'will',
    'should',
    'would',
    'could',
    'been',
    'being',
    'also',
    'than',
    'then',
    'them',
    'those',
    'these',
    'only',
    'notes',
    'exam',
    'study',
    'based',
    'because',
    'under',
    'between',
    'during',
    'each',
    'very',
    'such',
    'through',
    'into',
    'onto',
    'over',
    'some',
    'most',
    'much',
    'many',
    'more',
    'less',
    'than',
    'that',
    'they',
    'used',
    'using',
    'have',
    'has',
    'had',
    'are',
    'was',
    'were',
    'the',
    'and',
    'for',
    'to',
    'of',
    'in',
    'on',
    'as',
    'is',
    'an',
    'a',
  ]);

  const words = normalize(text)
    .split(' ')
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return unique(words).slice(0, maxCount);
}

function parseKnowledgeItems(notes: string): KnowledgeItem[] {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 12);

  const byDelimiter = lines
    .map((line) => {
      const delimiter = line.includes(':') ? ':' : line.includes(' - ') ? ' - ' : line.includes(' – ') ? ' – ' : null;
      if (!delimiter) {
        return null;
      }

      const [left, ...rest] = line.split(delimiter);
      const right = rest.join(delimiter).trim();
      if (left.trim().length < 3 || right.length < 8) {
        return null;
      }

      return {
        term: titleCase(left.trim().slice(0, 90)),
        definition: right.slice(0, 280),
      } satisfies KnowledgeItem;
    })
    .filter((item): item is KnowledgeItem => Boolean(item));

  if (byDelimiter.length >= 3) {
    return byDelimiter;
  }

  const sentences = notes
    .replace(/\n/g, ' ')
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 22);

  const fromSentences = sentences.map((sentence, index) => {
    const keywords = getKeywords(sentence, 2);
    const term = keywords.length > 0 ? titleCase(keywords.join(' ')) : `Concept ${index + 1}`;
    return {
      term,
      definition: sentence.slice(0, 280),
    } satisfies KnowledgeItem;
  });

  return fromSentences.slice(0, 32);
}

function shuffle<T>(array: T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function clampQuestionCount(input: number): number {
  if (input <= 5) {
    return 5;
  }
  if (input <= 10) {
    return 10;
  }
  return 20;
}

function createMultipleChoice(
  item: KnowledgeItem,
  all: KnowledgeItem[],
  index: number,
  difficulty: QuizDifficulty,
): MultipleChoiceQuestion {
  const distractors = shuffle(
    all
      .filter((candidate) => candidate.term !== item.term)
      .map((candidate) => candidate.definition),
  ).slice(0, 3);

  while (distractors.length < 3) {
    distractors.push(`${item.definition.slice(0, 24)} but with a different outcome.`);
  }

  const options = shuffle([item.definition, ...distractors]);
  const correctOptionIndex = options.findIndex((option) => option === item.definition);

  const promptPrefix =
    difficulty === 'hard'
      ? 'Choose the most precise statement from your notes:'
      : difficulty === 'medium'
      ? 'Which option best matches your notes:'
      : 'Pick the correct answer from your notes:';

  return {
    id: `q-${index + 1}`,
    type: 'multiple',
    prompt: `${promptPrefix} ${item.term}`,
    options,
    correctOptionIndex,
    reference: item.definition,
  };
}

function createFillBlank(item: KnowledgeItem, index: number): FillBlankQuestion {
  const keywords = getKeywords(item.definition, 4);
  const blankTarget = keywords.find((keyword) => keyword.length >= 5) ?? normalize(item.term).split(' ')[0] ?? item.term;

  const sentence = item.definition;
  const regex = new RegExp(`\\b${blankTarget}\\b`, 'i');
  const hasTarget = regex.test(sentence);
  const prompt = hasTarget
    ? sentence.replace(regex, '_____')
    : `${item.term} is related to _____ based on your notes.`;

  return {
    id: `q-${index + 1}`,
    type: 'fill_blank',
    prompt: `Fill in the blank:\n${prompt}`,
    expectedAnswer: blankTarget,
    reference: item.definition,
  };
}

function createDefinition(item: KnowledgeItem, index: number, difficulty: QuizDifficulty): DefinitionQuestion {
  const keywordCount = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;
  const expectedKeywords = getKeywords(item.definition, keywordCount);

  return {
    id: `q-${index + 1}`,
    type: 'definition',
    prompt: `Define this concept in your own words: ${item.term}`,
    expectedKeywords,
    reference: item.definition,
  };
}

export interface QuizGenerationParams {
  document: StudyDocument;
  questionCount: number;
  difficulty: QuizDifficulty;
}

export function generateQuizQuestions({
  document,
  questionCount,
  difficulty,
}: QuizGenerationParams): QuizQuestion[] {
  const knowledge = parseKnowledgeItems(document.extractedText);
  if (knowledge.length === 0) {
    throw new Error('No enough knowledge found in this note. Please add more text.');
  }

  const total = clampQuestionCount(questionCount);
  const questions: QuizQuestion[] = [];
  const pool = [...knowledge];

  for (let i = 0; i < total; i += 1) {
    const item = pool[i % pool.length];
    const pattern = i % 3;

    if (pattern === 0) {
      questions.push(createMultipleChoice(item, knowledge, i, difficulty));
    } else if (pattern === 1) {
      questions.push(createFillBlank(item, i));
    } else {
      questions.push(createDefinition(item, i, difficulty));
    }
  }

  return questions;
}

export interface QuizEvaluationResult {
  correct: boolean;
  scoreDelta: number;
  feedback: string;
}

export function evaluateQuizAnswer(question: QuizQuestion, answer: string | number): QuizEvaluationResult {
  if (question.type === 'multiple') {
    const picked = typeof answer === 'number' ? answer : Number(answer);
    const correct = picked === question.correctOptionIndex;
    return {
      correct,
      scoreDelta: correct ? 10 : 0,
      feedback: correct ? 'Correct answer.' : 'Incorrect answer.',
    };
  }

  const text = typeof answer === 'string' ? normalize(answer) : '';
  if (!text) {
    return {
      correct: false,
      scoreDelta: 0,
      feedback: 'No answer submitted.',
    };
  }

  if (question.type === 'fill_blank') {
    const expected = normalize(question.expectedAnswer);
    const correct = text === expected || text.includes(expected) || expected.includes(text);
    return {
      correct,
      scoreDelta: correct ? 12 : 0,
      feedback: correct ? 'Good fill-in answer.' : `Expected key term: ${question.expectedAnswer}`,
    };
  }

  const hits = question.expectedKeywords.filter((keyword) => text.includes(normalize(keyword))).length;
  const needed = Math.max(2, Math.ceil(question.expectedKeywords.length / 2));
  const correct = hits >= needed;

  return {
    correct,
    scoreDelta: correct ? 15 : 0,
    feedback: correct
      ? 'Strong definition.'
      : `Include more of these ideas: ${question.expectedKeywords.join(', ')}`,
  };
}
