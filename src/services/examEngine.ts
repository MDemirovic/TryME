import type { CallSummary, ConversationTurn, StudyAction } from '@/src/types';

export const SCOPE_GUARD_REPLY =
  'I can only examine you using the ideas that appear in your uploaded material.';

interface GenerateExamTurnParams {
  mode: 'start' | 'followup';
  notes: string;
  history: ConversationTurn[];
  userAnswer?: string;
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isOutOfScopeRequest(input: string): boolean {
  const normalized = normalize(input);
  if (!normalized) {
    return false;
  }

  return [
    'internet',
    'google',
    'wikipedia',
    'news',
    'outside',
    'different topic',
    'another subject',
  ].some((phrase) => normalized.includes(phrase));
}

function extractSnippets(notes: string): string[] {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 24);

  const sentences = notes
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 24);

  const unique = [...new Set([...lines, ...sentences])];
  if (unique.length > 0) {
    return unique.slice(0, 12);
  }

  return ['Explain the main idea from your notes clearly and in your own words.'];
}

function snippetQuestion(snippet: string): string {
  const compact = snippet.length > 150 ? `${snippet.slice(0, 150)}...` : snippet;
  return `Explain this part of your document in exam style: "${compact}"`;
}

function evaluateAnswer(answer: string, reference: string): { feedback: string; confidence: number } {
  const answerWords = normalize(answer).split(' ').filter((word) => word.length > 3);
  const referenceWords = [...new Set(normalize(reference).split(' ').filter((word) => word.length > 4))];
  const hits = referenceWords.filter((word) => answerWords.includes(word)).length;

  if (hits >= 4) {
    return {
      feedback: 'Strong answer. You stayed close to the source material and used the right concepts.',
      confidence: 0.8,
    };
  }

  if (hits >= 2) {
    return {
      feedback: 'Good structure. Next time, anchor your answer with one more detail from the document.',
      confidence: 0.55,
    };
  }

  return {
    feedback: 'You answered with confidence, but bring in more wording and evidence from the document itself.',
    confidence: 0.25,
  };
}

export async function generateExamTurn(params: GenerateExamTurnParams): Promise<string> {
  const snippets = extractSnippets(params.notes);
  const assistantTurns = params.history.filter((turn) => turn.role === 'assistant').length;

  if (params.mode === 'start') {
    return `Welcome in. We will stay strictly inside your uploaded material today. ${snippetQuestion(snippets[0])}`;
  }

  if (isOutOfScopeRequest(params.userAnswer ?? '')) {
    return SCOPE_GUARD_REPLY;
  }

  const previousSnippet = snippets[Math.max(assistantTurns - 1, 0)] ?? snippets[0];
  const nextSnippet = snippets[assistantTurns % snippets.length] ?? snippets[0];
  const evaluation = evaluateAnswer(params.userAnswer ?? '', previousSnippet);

  return `${evaluation.feedback} Next question: ${snippetQuestion(nextSnippet)}`;
}

function rankWeakConcepts(notes: string, history: ConversationTurn[]): string[] {
  const snippets = extractSnippets(notes);
  const userAnswers = history.filter((turn) => turn.role === 'user').map((turn) => turn.content);

  return snippets
    .map((snippet) => {
      const keywords = [...new Set(normalize(snippet).split(' ').filter((word) => word.length > 5))].slice(0, 5);
      const hits = userAnswers.reduce(
        (total, answer) => total + keywords.filter((word) => normalize(answer).includes(word)).length,
        0,
      );

      return {
        label: snippet.length > 72 ? `${snippet.slice(0, 72)}...` : snippet,
        score: hits,
      };
    })
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((entry) => entry.label);
}

export function generateCallSummary(notes: string, history: ConversationTurn[]): CallSummary {
  const userAnswers = history.filter((turn) => turn.role === 'user');
  const strongAnswers = userAnswers.slice(0, 2).map((answer) => {
    const shortened = answer.content.length > 70 ? `${answer.content.slice(0, 70)}...` : answer.content;
    return `You responded clearly when discussing "${shortened}"`;
  });

  const weakConcepts = rankWeakConcepts(notes, history);
  const recommendedAction: StudyAction = weakConcepts.length > 1 ? 'flashcards' : 'quiz';

  return {
    strengths:
      strongAnswers.length > 0
        ? strongAnswers
        : ['You stayed engaged through the session and kept your answers tied to the material.'],
    weakConcepts,
    missedTopics: weakConcepts,
    recommendedAction,
    coachNote:
      weakConcepts.length > 0
        ? 'Focus your next session on the weaker concepts before starting another oral exam call.'
        : 'You covered the material well. A short quiz would be a good next step to confirm retention.',
  };
}
