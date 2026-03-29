export type PlanType = 'free' | 'premium';
export type AuthMethod = 'google' | 'email' | 'login';
export type StudyGoal = 'exam' | 'flashcards' | 'other';
export type AppStage = 'auth' | 'paywall' | 'goal' | 'home';

export interface StudyDocument {
  id: string;
  name: string;
  uri: string;
  extractedText: string;
  sourceType: 'file' | 'paste';
  fileType: 'docx' | 'pdf' | 'doc' | 'txt' | 'text';
  uploadedAt: string;
}

export interface CallUsage {
  monthKey: string;
  used: number;
}

export interface PersistedAppState {
  isAuthenticated: boolean;
  didSignup: boolean;
  paywallSeen: boolean;
  authMethod: AuthMethod | null;
  plan: PlanType;
  studyGoal: StudyGoal | null;
  document: StudyDocument | null;
  documents: StudyDocument[];
  callUsage: CallUsage;
}

export type ConversationRole = 'assistant' | 'user';

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
}
