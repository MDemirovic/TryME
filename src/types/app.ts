import type { Session, User } from "@supabase/supabase-js";

export type SupportedLanguage = "english" | "croatian" | "spanish" | "german";
export type SupportedAge =
  | "under_16"
  | "16_18"
  | "19_22"
  | "23_plus";

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  age: string | null;
  app_language: string | null;
  onboarding_completed: boolean;
  notifications_recommended_seen: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SourceDocument {
  id: string;
  user_id: string | null;
  title: string;
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  status: string | null;
  created_at: string | null;
}

export interface StudyPack {
  id: string;
  document_id: string | null;
  overview: string | null;
  status: string | null;
  created_at: string | null;
}

export interface DocumentWorkspace {
  document: SourceDocument;
  studyPack: StudyPack | null;
  flashcardsCount: number;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export interface OnboardingProfileInput {
  first_name: string;
  age: SupportedAge;
  app_language: SupportedLanguage;
  notifications_recommended_seen: boolean;
  onboarding_completed: boolean;
}
