import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  AppLanguage,
  AppStage,
  AuthMethod,
  PersistedAppState,
  SessionStats,
  StudyAction,
  StudyDocument,
  UserProfile,
} from '@/src/types';
import { getMonthKey } from '@/src/utils/month';

const STORAGE_KEY = 'tryme_state_v3';
const FREE_CALL_LIMIT = 3;

const initialSessionStats: SessionStats = {
  completed: 0,
  quizSessions: 0,
  flashcardSessions: 0,
  noteSessions: 0,
  callSessions: 0,
  streak: 0,
  weeklyGoal: 4,
  weakAreas: [],
  lastActionLabel: null,
};

const initialState: PersistedAppState = {
  onboardingComplete: false,
  accountStatus: 'guest',
  authMethod: null,
  plan: 'free',
  profile: null,
  documents: [],
  activeDocumentId: null,
  callUsage: {
    monthKey: getMonthKey(),
    used: 0,
  },
  sessionStats: initialSessionStats,
};

interface OnboardingPayload {
  firstName: string;
  ageBracket: UserProfile['ageBracket'];
  appLanguage: AppLanguage;
  notificationsEnabled: boolean;
  document: StudyDocument;
}

interface AppContextValue {
  loading: boolean;
  state: PersistedAppState;
  stage: AppStage;
  currentDocument: StudyDocument | null;
  remainingCalls: number;
  freeCallLimit: number;
  completeOnboarding: (payload: OnboardingPayload) => void;
  signInReturningUser: (method: AuthMethod) => void;
  createAccount: (method: AuthMethod) => void;
  choosePlan: (plan: PersistedAppState['plan']) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setStudyDocument: (document: StudyDocument) => void;
  selectStudyDocument: (documentId: string) => void;
  removeStudyDocument: (documentId: string) => void;
  registerCallStart: () => boolean;
  recordStudyAction: (action: StudyAction, weakAreas?: string[]) => void;
  logoutToOnboarding: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeCallUsage(state: PersistedAppState): PersistedAppState['callUsage'] {
  const activeMonth = getMonthKey();
  if (state.callUsage.monthKey !== activeMonth) {
    return {
      monthKey: activeMonth,
      used: 0,
    };
  }
  return state.callUsage;
}

function sanitizeDocument(candidate: unknown): StudyDocument | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as StudyDocument;
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.uri !== 'string' ||
    typeof value.extractedText !== 'string' ||
    typeof value.uploadedAt !== 'string' ||
    typeof value.wordCount !== 'number' ||
    typeof value.detectedLanguage !== 'string' ||
    (value.status !== 'ready' && value.status !== 'needs_attention') ||
    !value.studyPack
  ) {
    return null;
  }

  return value;
}

function sanitizeState(candidate: unknown): PersistedAppState {
  if (!candidate || typeof candidate !== 'object') {
    return initialState;
  }

  const value = candidate as Partial<PersistedAppState>;
  const documents = Array.isArray(value.documents)
    ? value.documents.map((doc) => sanitizeDocument(doc)).filter((doc): doc is StudyDocument => Boolean(doc))
    : [];

  const dedupedDocuments: StudyDocument[] = [];
  documents.forEach((doc) => {
    if (!dedupedDocuments.some((item) => item.id === doc.id)) {
      dedupedDocuments.push(doc);
    }
  });

  return {
    onboardingComplete: Boolean(value.onboardingComplete),
    accountStatus: value.accountStatus === 'member' ? 'member' : 'guest',
    authMethod:
      value.authMethod === 'apple' || value.authMethod === 'google' || value.authMethod === 'email'
        ? value.authMethod
        : null,
    plan: value.plan === 'premium' ? 'premium' : 'free',
    profile:
      value.profile &&
      typeof value.profile.firstName === 'string' &&
      (value.profile.ageBracket === 'under_16' ||
        value.profile.ageBracket === '16_18' ||
        value.profile.ageBracket === '19_22' ||
        value.profile.ageBracket === '23_plus') &&
      (value.profile.appLanguage === 'english' ||
        value.profile.appLanguage === 'spanish' ||
        value.profile.appLanguage === 'german') &&
      typeof value.profile.notificationsEnabled === 'boolean'
        ? value.profile
        : null,
    documents: dedupedDocuments,
    activeDocumentId:
      typeof value.activeDocumentId === 'string' && dedupedDocuments.some((doc) => doc.id === value.activeDocumentId)
        ? value.activeDocumentId
        : dedupedDocuments[0]?.id ?? null,
    callUsage:
      value.callUsage &&
      typeof value.callUsage.monthKey === 'string' &&
      typeof value.callUsage.used === 'number'
        ? value.callUsage
        : {
            monthKey: getMonthKey(),
            used: 0,
          },
    sessionStats:
      value.sessionStats &&
      typeof value.sessionStats.completed === 'number' &&
      typeof value.sessionStats.quizSessions === 'number' &&
      typeof value.sessionStats.flashcardSessions === 'number' &&
      typeof value.sessionStats.noteSessions === 'number' &&
      typeof value.sessionStats.callSessions === 'number' &&
      typeof value.sessionStats.streak === 'number' &&
      typeof value.sessionStats.weeklyGoal === 'number' &&
      Array.isArray(value.sessionStats.weakAreas)
        ? {
            completed: value.sessionStats.completed,
            quizSessions: value.sessionStats.quizSessions,
            flashcardSessions: value.sessionStats.flashcardSessions,
            noteSessions: value.sessionStats.noteSessions,
            callSessions: value.sessionStats.callSessions,
            streak: value.sessionStats.streak,
            weeklyGoal: value.sessionStats.weeklyGoal,
            weakAreas: value.sessionStats.weakAreas.filter((item): item is string => typeof item === 'string').slice(0, 8),
            lastActionLabel: typeof value.sessionStats.lastActionLabel === 'string' ? value.sessionStats.lastActionLabel : null,
          }
        : initialSessionStats,
  };
}

function computeStage(state: PersistedAppState): AppStage {
  return state.onboardingComplete ? 'workspace' : 'welcome';
}

function labelForAction(action: StudyAction): string {
  switch (action) {
    case 'quiz':
      return 'Completed a quiz session';
    case 'flashcards':
      return 'Reviewed flashcards';
    case 'notes':
      return 'Read the study script';
    case 'call':
      return 'Finished an AI oral exam call';
    default:
      return 'Studied';
  }
}

function incrementSessionStats(stats: SessionStats, action: StudyAction, weakAreas: string[]): SessionStats {
  return {
    ...stats,
    completed: stats.completed + 1,
    quizSessions: stats.quizSessions + (action === 'quiz' ? 1 : 0),
    flashcardSessions: stats.flashcardSessions + (action === 'flashcards' ? 1 : 0),
    noteSessions: stats.noteSessions + (action === 'notes' ? 1 : 0),
    callSessions: stats.callSessions + (action === 'call' ? 1 : 0),
    streak: Math.max(1, Math.min(30, stats.streak + 1)),
    weakAreas: [...new Set([...weakAreas, ...stats.weakAreas])].slice(0, 6),
    lastActionLabel: labelForAction(action),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw);
        const sanitized = sanitizeState(parsed);
        if (mounted) {
          setState({
            ...sanitized,
            callUsage: normalizeCallUsage(sanitized),
          });
        }
      } catch {
        if (mounted) {
          setState(initialState);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [loading, state]);

  useEffect(() => {
    const normalized = normalizeCallUsage(state);
    if (
      normalized.monthKey !== state.callUsage.monthKey ||
      normalized.used !== state.callUsage.used
    ) {
      setState((prev) => ({
        ...prev,
        callUsage: normalized,
      }));
    }
  }, [state]);

  const currentDocument = useMemo(
    () => state.documents.find((document) => document.id === state.activeDocumentId) ?? null,
    [state.activeDocumentId, state.documents],
  );

  const remainingCalls = useMemo(() => {
    if (state.plan === 'premium') {
      return Number.MAX_SAFE_INTEGER;
    }

    const normalized = normalizeCallUsage(state);
    return Math.max(0, FREE_CALL_LIMIT - normalized.used);
  }, [state]);

  const completeOnboarding = useCallback((payload: OnboardingPayload) => {
    setState((prev) => ({
      ...prev,
      onboardingComplete: true,
      accountStatus: 'guest',
      authMethod: null,
      profile: {
        firstName: payload.firstName.trim() || 'Scholar',
        ageBracket: payload.ageBracket,
        appLanguage: payload.appLanguage,
        notificationsEnabled: payload.notificationsEnabled,
      },
      documents: [payload.document, ...prev.documents.filter((item) => item.id !== payload.document.id)].slice(0, 80),
      activeDocumentId: payload.document.id,
      sessionStats: {
        ...prev.sessionStats,
        lastActionLabel: 'Imported first study document',
      },
    }));
  }, []);

  const signInReturningUser = useCallback((method: AuthMethod) => {
    setState((prev) => ({
      ...prev,
      onboardingComplete: true,
      accountStatus: 'member',
      authMethod: method,
      profile:
        prev.profile ??
        {
          firstName: 'Scholar',
          ageBracket: '19_22',
          appLanguage: 'english',
          notificationsEnabled: true,
        },
    }));
  }, []);

  const createAccount = useCallback((method: AuthMethod) => {
    setState((prev) => ({
      ...prev,
      accountStatus: 'member',
      authMethod: method,
    }));
  }, []);

  const choosePlan = useCallback((plan: PersistedAppState['plan']) => {
    setState((prev) => ({
      ...prev,
      plan,
    }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      profile: prev.profile
        ? {
            ...prev.profile,
            notificationsEnabled: enabled,
          }
        : prev.profile,
    }));
  }, []);

  const setStudyDocument = useCallback((document: StudyDocument) => {
    setState((prev) => ({
      ...prev,
      onboardingComplete: true,
      documents: [document, ...prev.documents.filter((item) => item.id !== document.id)].slice(0, 80),
      activeDocumentId: document.id,
      sessionStats: {
        ...prev.sessionStats,
        lastActionLabel: `Imported ${document.name}`,
      },
    }));
  }, []);

  const selectStudyDocument = useCallback((documentId: string) => {
    setState((prev) => {
      if (!prev.documents.some((item) => item.id === documentId)) {
        return prev;
      }

      return {
        ...prev,
        activeDocumentId: documentId,
      };
    });
  }, []);

  const removeStudyDocument = useCallback((documentId: string) => {
    setState((prev) => {
      const nextDocuments = prev.documents.filter((item) => item.id !== documentId);
      return {
        ...prev,
        documents: nextDocuments,
        activeDocumentId: prev.activeDocumentId === documentId ? nextDocuments[0]?.id ?? null : prev.activeDocumentId,
      };
    });
  }, []);

  const registerCallStart = useCallback(() => {
    if (state.plan === 'premium') {
      return true;
    }

    const normalized = normalizeCallUsage(state);
    if (normalized.used >= FREE_CALL_LIMIT) {
      if (
        normalized.monthKey !== state.callUsage.monthKey ||
        normalized.used !== state.callUsage.used
      ) {
        setState((prev) => ({
          ...prev,
          callUsage: normalized,
        }));
      }
      return false;
    }

    setState((prev) => {
      const base = normalizeCallUsage(prev);
      return {
        ...prev,
        callUsage: {
          monthKey: base.monthKey,
          used: base.used + 1,
        },
      };
    });

    return true;
  }, [state]);

  const recordStudyAction = useCallback((action: StudyAction, weakAreas: string[] = []) => {
    setState((prev) => ({
      ...prev,
      sessionStats: incrementSessionStats(prev.sessionStats, action, weakAreas),
    }));
  }, []);

  const resetToInitialState = useCallback(async () => {
    setState(initialState);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const stage = useMemo(() => computeStage(state), [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      state,
      stage,
      currentDocument,
      remainingCalls,
      freeCallLimit: FREE_CALL_LIMIT,
      completeOnboarding,
      signInReturningUser,
      createAccount,
      choosePlan,
      setNotificationsEnabled,
      setStudyDocument,
      selectStudyDocument,
      removeStudyDocument,
      registerCallStart,
      recordStudyAction,
      logoutToOnboarding: resetToInitialState,
      deleteAccount: resetToInitialState,
    }),
    [
      loading,
      state,
      stage,
      currentDocument,
      remainingCalls,
      completeOnboarding,
      signInReturningUser,
      createAccount,
      choosePlan,
      setNotificationsEnabled,
      setStudyDocument,
      selectStudyDocument,
      removeStudyDocument,
      registerCallStart,
      recordStudyAction,
      resetToInitialState,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider.');
  }
  return context;
}
