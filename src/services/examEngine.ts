import type { ConversationTurn } from '@/src/types';

export const SCOPE_GUARD_REPLY =
  'I am only here to help you prepare for your exam based on your notes.';

const MODEL_NAME = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4.1-mini';
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

interface GenerateExamTurnParams {
  mode: 'start' | 'followup';
  notes: string;
  history: ConversationTurn[];
  userAnswer?: string;
}

function isOutOfScopeRequest(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const patterns = [
    /\bsearch\b/,
    /\binternet\b/,
    /\bgoogle\b/,
    /\bnews\b/,
    /\bfix\b.*\bdocument\b/,
    /\bedit\b.*\bnotes\b/,
    /\btell me something else\b/,
    /\boutside\b.*\bexam\b/,
    /\bwho is\b/,
    /\bwhat is happening\b/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

function compactNotes(notes: string): string {
  const trimmed = notes.replace(/\s{2,}/g, ' ').trim();
  const limit = 12000;
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return trimmed.slice(0, limit);
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) {
    return '';
  }

  const chunks: string[] = [];
  payload.output.forEach((item: any) => {
    if (!Array.isArray(item?.content)) {
      return;
    }

    item.content.forEach((content: any) => {
      if (typeof content?.text === 'string') {
        chunks.push(content.text);
      } else if (typeof content?.output_text === 'string') {
        chunks.push(content.output_text);
      }
    });
  });

  return chunks.join(' ').trim();
}

function buildSystemPrompt(notes: string): string {
  return [
    'You are an oral exam simulator for mobile app students.',
    'You can ONLY use the provided notes.',
    'Never use external knowledge, internet, or assumptions outside the notes.',
    `If the user asks anything unrelated, respond exactly with: "${SCOPE_GUARD_REPLY}"`,
    'Ask one examiner-style question at a time and wait for the student response.',
    'After each response, give one brief implicit evaluation sentence, then ask exactly one next question.',
    'Tone: calm, friendly, examiner-like, concise.',
    '',
    'STUDENT NOTES:',
    notes,
  ].join('\n');
}

function extractCandidateSnippets(notes: string): string[] {
  const lines = notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 24);

  const sentences = notes
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 24);

  const merged = [...lines, ...sentences];
  const unique = [...new Set(merged)];

  if (unique.length > 0) {
    return unique.slice(0, 80);
  }

  return ['Explain the main idea from your notes in a structured way.'];
}

function toQuestion(snippet: string): string {
  const short = snippet.length > 130 ? `${snippet.slice(0, 130)}...` : snippet;
  const definitionMatch = short.match(/^([^:]{4,50})\s+is\s+/i);

  if (definitionMatch) {
    return `In your own words, what is ${definitionMatch[1].trim()}, and why does it matter?`;
  }

  return `Can you explain this part of your notes and connect it to the overall topic: "${short}"?`;
}

function evaluateAnswerLocally(answer: string, sourceSnippet: string): string {
  const answerLower = answer.toLowerCase();
  const keywords = sourceSnippet
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 5)
    .slice(0, 8);

  const hits = keywords.filter((word) => answerLower.includes(word)).length;

  if (hits >= 3) {
    return 'Strong answer, you captured key terms from your notes.';
  }

  if (hits >= 1) {
    return 'Good direction, but include more detail from your notes next time.';
  }

  return 'Try to anchor your answer more directly to your written notes.';
}

function localExamTurn({ mode, notes, history, userAnswer }: GenerateExamTurnParams): string {
  const snippets = extractCandidateSnippets(notes);
  const assistantTurns = history.filter((turn) => turn.role === 'assistant').length;

  if (mode === 'start') {
    return `Hello, I am your oral exam coach. Let's begin. ${toQuestion(snippets[0] ?? snippets[snippets.length - 1])}`;
  }

  if (isOutOfScopeRequest(userAnswer ?? '')) {
    return SCOPE_GUARD_REPLY;
  }

  const previousSnippet = snippets[Math.max(assistantTurns - 1, 0)] ?? snippets[0];
  const nextSnippet = snippets[assistantTurns % snippets.length] ?? snippets[0];

  const feedback = evaluateAnswerLocally(userAnswer ?? '', previousSnippet);
  const question = toQuestion(nextSnippet);
  return `${feedback} ${question}`;
}

function normalizedOutput(output: string): string {
  const cleaned = output.replace(/\s{2,}/g, ' ').trim();

  if (!cleaned) {
    return SCOPE_GUARD_REPLY;
  }

  if (cleaned.toLowerCase().includes('only here to help you prepare')) {
    return SCOPE_GUARD_REPLY;
  }

  return cleaned;
}

async function openAiExamTurn(params: GenerateExamTurnParams): Promise<string> {
  const systemPrompt = buildSystemPrompt(compactNotes(params.notes));
  const recentHistory = params.history.slice(-8);

  const userInstruction =
    params.mode === 'start'
      ? 'Start the oral exam now: greet briefly and ask the first exam question using only the notes.'
      : `Student answer:\n${params.userAnswer ?? ''}\n\nRespond with one short implicit evaluation sentence and one new question based only on the notes.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      temperature: 0.3,
      max_output_tokens: 180,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        ...recentHistory.map((turn) => ({
          role: turn.role,
          content: [{ type: 'input_text', text: turn.content }],
        })),
        {
          role: 'user',
          content: [{ type: 'input_text', text: userInstruction }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${details}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) {
    throw new Error('Model returned an empty response.');
  }

  return normalizedOutput(text);
}

export function hasRemoteAiConfig(): boolean {
  return API_KEY.length > 0;
}

export async function generateExamTurn(params: GenerateExamTurnParams): Promise<string> {
  if (params.mode === 'followup' && isOutOfScopeRequest(params.userAnswer ?? '')) {
    return SCOPE_GUARD_REPLY;
  }

  if (hasRemoteAiConfig()) {
    try {
      return await openAiExamTurn(params);
    } catch {
      return localExamTurn(params);
    }
  }

  return localExamTurn(params);
}
