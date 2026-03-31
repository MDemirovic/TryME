export type PlanType = 'free' | 'premium';
export type AuthMethod = 'apple' | 'google' | 'email';
export type AccountStatus = 'guest' | 'member';
export type AppStage = 'welcome' | 'workspace';
export type StudyAction = 'quiz' | 'flashcards' | 'notes' | 'call';
export type AgeBracket = 'under_16' | '16_18' | '19_22' | '23_plus';
export type AppLanguage = 'english' | 'spanish' | 'german';
export type StudyDocumentStatus = 'ready' | 'needs_attention';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  dueLabel: string;
  mastery: 'new' | 'warming' | 'solid';
}

export interface StudyPack {
  overview: string;
  keyConcepts: string[];
  oralExamQuestions: string[];
  weakTopicSuggestions: string[];
  retrievalSnippets: string[];
  flashcards: Flashcard[];
  quizTargets: string[];
  estimatedStudyMinutes: number;
  qualityLabel: 'strong' | 'okay' | 'needs_attention';
  qualityScore: number;
}

export interface StudyDocument {
  id: string;
  name: string;
  uri: string;
  extractedText: string;
  sourceType: 'file' | 'paste';
  fileType: 'docx' | 'pdf' | 'doc' | 'txt' | 'text';
  uploadedAt: string;
  wordCount: number;
  detectedLanguage: string;
  status: StudyDocumentStatus;
  studyPack: StudyPack;
}

export interface UserProfile {
  firstName: string;
  ageBracket: AgeBracket;
  appLanguage: AppLanguage;
  notificationsEnabled: boolean;
}

export interface CallUsage {
  monthKey: string;
  used: number;
}

export interface SessionStats {
  completed: number;
  quizSessions: number;
  flashcardSessions: number;
  noteSessions: number;
  callSessions: number;
  streak: number;
  weeklyGoal: number;
  weakAreas: string[];
  lastActionLabel: string | null;
}

export interface PersistedAppState {
  onboardingComplete: boolean;
  accountStatus: AccountStatus;
  authMethod: AuthMethod | null;
  plan: PlanType;
  profile: UserProfile | null;
  documents: StudyDocument[];
  activeDocumentId: string | null;
  callUsage: CallUsage;
  sessionStats: SessionStats;
}

export type ConversationRole = 'assistant' | 'user';

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
}

export interface CallSummary {
  strengths: string[];
  weakConcepts: string[];
  missedTopics: string[];
  recommendedAction: StudyAction;
  coachNote: string;
}
