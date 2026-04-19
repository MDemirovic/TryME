import { AppState } from "react-native";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getCurrentUserProfile } from "@/src/lib/auth";
import { supabase } from "@/src/lib/supabase";
import type { AuthState, Profile } from "@/src/types/app";

interface AuthContextValue extends AuthState {
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!user) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getCurrentUserProfile();
    startTransition(() => {
      setProfile(nextProfile);
    });

    return nextProfile;
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        startTransition(() => {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        });

        if (currentSession?.user) {
          const nextProfile = await getCurrentUserProfile();
          if (!mounted) {
            return;
          }
          startTransition(() => {
            setProfile(nextProfile);
          });
        } else {
          startTransition(() => {
            setProfile(null);
          });
        }
      } catch {
        if (!mounted) {
          return;
        }
        startTransition(() => {
          setSession(null);
          setUser(null);
          setProfile(null);
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      });

      if (!nextSession?.user) {
        startTransition(() => {
          setProfile(null);
          setLoading(false);
        });
        return;
      }

      setLoading(true);
      void getCurrentUserProfile()
        .then((nextProfile) => {
          startTransition(() => {
            setProfile(nextProfile);
          });
        })
        .catch(() => {
          startTransition(() => {
            setProfile(null);
          });
        })
        .finally(() => {
          setLoading(false);
        });
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          supabase.auth.startAutoRefresh();
          return;
        }

        supabase.auth.stopAutoRefresh();
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
