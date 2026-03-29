import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AppStage, AuthMethod, PersistedAppState, PlanType, StudyDocument, StudyGoal } from '@/src/types';
import { getMonthKey } from '@/src/utils/month';

const STORAGE_KEY = 'tryme_state_v2';
const FREE_CALL_LIMIT = 3;

const initialState: PersistedAppState = {
  isAuthenticated: false,
  didSignup: false,
  paywallSeen: false,
  authMethod: null,
  plan: 'free',
  studyGoal: null,
  document: null,
  documents: [],
  callUsage: {
    monthKey: getMonthKey(),
    used: 0,
  },
};

interface AppContextValue {
  loading: boolean;
  state: PersistedAppState;
  stage: AppStage;
  remainingCalls: number;
  freeCallLimit: number;
  startSignup: (method: Exclude<AuthMethod, 'login'>) => void;
  completeLogin: () => void;
  choosePlan: (plan: PlanType) => void;
  skipPaywall: () => void;
  setStudyGoal: (goal: StudyGoal) => void;
  setStudyDocument: (document: StudyDocument) => void;
  selectStudyDocument: (documentId: string) => void;
  removeStudyDocument: (documentId: string) => void;
  clearStudyDocument: () => void;
  registerCallStart: () => boolean;
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

function computeStage(state: PersistedAppState): AppStage {
  if (!state.isAuthenticated) {
    return 'auth';
  }

  if (state.didSignup && !state.paywallSeen) {
    return 'paywall';
  }

  if (!state.studyGoal) {
    return 'goal';
  }

  return 'home';
}

function sanitizeDocument(candidate: unknown): StudyDocument | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<StudyDocument>;
  if (
    typeof value.name !== 'string' ||
    typeof value.uri !== 'string' ||
    typeof value.extractedText !== 'string' ||
    typeof value.uploadedAt !== 'string'
  ) {
    return null;
  }

  const fileType =
    value.fileType === 'docx' ||
    value.fileType === 'pdf' ||
    value.fileType === 'doc' ||
    value.fileType === 'txt' ||
    value.fileType === 'text'
      ? value.fileType
      : 'text';

  const sourceType = value.sourceType === 'file' || value.sourceType === 'paste' ? value.sourceType : 'file';
  const id = typeof value.id === 'string' && value.id.trim().length > 0 ? value.id : `${value.uploadedAt}-${value.name}`;

  return {
    id,
    name: value.name,
    uri: value.uri,
    extractedText: value.extractedText,
    uploadedAt: value.uploadedAt,
    sourceType,
    fileType,
  };
}

function sanitizeState(candidate: unknown): PersistedAppState {
  if (!candidate || typeof candidate !== 'object') {
    return initialState;
  }

  const value = candidate as Partial<PersistedAppState>;
  const currentDocument = sanitizeDocument(value.document);
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
    isAuthenticated: Boolean(value.isAuthenticated),
    didSignup: Boolean(value.didSignup),
    paywallSeen: Boolean(value.paywallSeen),
    authMethod:
      value.authMethod === 'google' || value.authMethod === 'email' || value.authMethod === 'login'
        ? value.authMethod
        : null,
    plan: value.plan === 'premium' ? 'premium' : 'free',
    studyGoal:
      value.studyGoal === 'exam' || value.studyGoal === 'flashcards' || value.studyGoal === 'other'
        ? value.studyGoal
        : null,
    document: currentDocument,
    documents: dedupedDocuments,
    callUsage:
      value.callUsage &&
      typeof value.callUsage.monthKey === 'string' &&
      typeof value.callUsage.used === 'number'
        ? value.callUsage
        : {
            monthKey: getMonthKey(),
            used: 0,
          },
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

  const remainingCalls = useMemo(() => {
    if (state.plan === 'premium') {
      return Number.MAX_SAFE_INTEGER;
    }

    const normalized = normalizeCallUsage(state);
    return Math.max(0, FREE_CALL_LIMIT - normalized.used);
  }, [state]);

  const startSignup = useCallback((method: Exclude<AuthMethod, 'login'>) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      didSignup: true,
      paywallSeen: false,
      authMethod: method,
    }));
  }, []);

  const completeLogin = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      didSignup: false,
      paywallSeen: true,
      authMethod: 'login',
    }));
  }, []);

  const choosePlan = useCallback((plan: PlanType) => {
    setState((prev) => ({
      ...prev,
      paywallSeen: true,
      plan,
    }));
  }, []);

  const skipPaywall = useCallback(() => {
    setState((prev) => ({
      ...prev,
      paywallSeen: true,
      plan: prev.plan ?? 'free',
    }));
  }, []);

  const setStudyGoal = useCallback((goal: StudyGoal) => {
    setState((prev) => ({
      ...prev,
      studyGoal: goal,
    }));
  }, []);

  const setStudyDocument = useCallback((document: StudyDocument) => {
    setState((prev) => ({
      ...prev,
      document,
      documents: [document, ...prev.documents.filter((item) => item.id !== document.id)].slice(0, 80),
    }));
  }, []);

  const selectStudyDocument = useCallback((documentId: string) => {
    setState((prev) => {
      const found = prev.documents.find((item) => item.id === documentId);
      if (!found) {
        return prev;
      }
      return {
        ...prev,
        document: found,
      };
    });
  }, []);

  const removeStudyDocument = useCallback((documentId: string) => {
    setState((prev) => {
      const nextDocuments = prev.documents.filter((item) => item.id !== documentId);
      const nextCurrent = prev.document?.id === documentId ? nextDocuments[0] ?? null : prev.document;
      return {
        ...prev,
        documents: nextDocuments,
        document: nextCurrent,
      };
    });
  }, []);

  const clearStudyDocument = useCallback(() => {
    setState((prev) => ({
      ...prev,
      document: null,
    }));
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

  const stage = useMemo(() => computeStage(state), [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      state,
      stage,
      remainingCalls,
      freeCallLimit: FREE_CALL_LIMIT,
      startSignup,
      completeLogin,
      choosePlan,
      skipPaywall,
      setStudyGoal,
      setStudyDocument,
      selectStudyDocument,
      removeStudyDocument,
      clearStudyDocument,
      registerCallStart,
    }),
    [
      loading,
      state,
      stage,
      remainingCalls,
      startSignup,
      completeLogin,
      choosePlan,
      skipPaywall,
      setStudyGoal,
      setStudyDocument,
      selectStudyDocument,
      removeStudyDocument,
      clearStudyDocument,
      registerCallStart,
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
